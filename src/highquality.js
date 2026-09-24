const DEFAULT_HIGH_QUALITY = "@cf/black-forest-labs/flux-2-dev";
const DEFAULT_QUICK = "@cf/black-forest-labs/flux-2-klein-9b";

const STYLES = {
  game:{name:"Game World",prompt:"premium original cinematic action-world key art, modern city scale, dramatic sunset and neon light, sophisticated realistic illustration, strong dynamic composition, no franchise references, no weapons"},
  halloween:{name:"Halloween",prompt:"premium stylish Halloween portrait, elegant original costumes, cinematic moonlight, atmospheric fog, warm lantern glow and pumpkins, playful and confident rather than frightening or campy"},
  retro:{name:"Retro Time Machine",prompt:"authentic premium 1980s editorial world, vintage wardrobe, neon sunset, analog color, tasteful film grain, period architecture and vehicle styling, confident cinematic attitude"},
  fantasy:{name:"Fantasy Warrior",prompt:"original premium fantasy portrait, intricate unbranded armor and fabrics, ancient ruins and mountain kingdom, heroic cinematic lighting, elegant epic scale, nonviolent pose"},
  royal:{name:"Royal",prompt:"regal museum-quality portrait, ornate palace environment, rich fabrics and ceremonial details, refined luxury styling, dramatic painterly light, contemporary premium finish"},
  future:{name:"Future City",prompt:"original premium futuristic city portrait, sophisticated neon reflections, rain haze, architectural high-tech skyline, sleek wardrobe, cinematic science-fiction editorial light, no logos"},
  comic:{name:"Comic Hero",prompt:"original heroic graphic-novel portrait, custom unbranded suit design, confident nonviolent heroic pose, sophisticated ink and painted detail, premium halftone texture, dramatic graphic lighting, no copied character designs"},
  space:{name:"Space Explorer",prompt:"original premium cinematic space explorer portrait, elegant unbranded suit, planets and spacecraft environment, dramatic rim light, vast epic scale, sophisticated science-fiction realism, no logos"}
};

const AUTO_REJECT=["war","invasion","airstrike","bombing","missile strike","battlefield","casualties","mass shooting","school shooting","murder","kidnapping","hostage","terrorism","suicide","self-harm","earthquake","wildfire","flood disaster","plane crash","funeral","obituary","genocide","hate crime"];
const REVIEW_TERMS=["election","campaign","president","senate","congress","governor","protest","riot","boycott","pandemic","outbreak","public health emergency"];
const IP_MARKERS=["gta","grand theft auto","rockstar games","disney","pixar","marvel","dc comics","pokemon","naruto","studio ghibli","star wars","harry potter","fortnite","minecraft","batman","superman","spider-man","spiderman","avengers"];

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}})}
function randomHex(byteCount=16){const bytes=new Uint8Array(byteCount);crypto.getRandomValues(bytes);return[...bytes].map(b=>b.toString(16).padStart(2,"0")).join("")}
function requestKey(id,suffix){return `requests/${id}/${suffix}`}
const ACCEPTED_REFERENCE_TYPES=new Set(["image/jpeg","image/png","image/webp"]);
function normalizeBase64(value){return String(value||"").replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/,"").replace(/\s+/g,"")}
function imageMime(base64){
  const prefix=atob(base64.slice(0,32));
  if(prefix.startsWith("\xFF\xD8\xFF"))return "image/jpeg";
  if(prefix.startsWith("\x89PNG\r\n\x1A\n"))return "image/png";
  if(prefix.startsWith("RIFF")&&prefix.slice(8,12)==="WEBP")return "image/webp";
  throw Object.assign(new Error("Image model returned an unsupported image."),{reason:"provider"});
}
function errorText(error){return (error?.message||String(error)||"").toLowerCase()}
function isModeration(error){const m=errorText(error);return m.includes("3030")||m.includes("flagged")||m.includes("moderation")}
function isQuota(error){const m=errorText(error);return m.includes("3036")||m.includes("daily free allocation")||m.includes("free allocation")||m.includes("used up your daily")||m.includes("quota exceeded")}
function isCapacity(error){const m=errorText(error);return m.includes("3040")||m.includes("out of capacity")||m.includes("capacity temporarily exceeded")||m.includes("busy")||m.includes("overload")}
function isTransient(error){const m=errorText(error);return isCapacity(error)||m.includes("timeout")||m.includes("timed out")||m.includes("503")||m.includes("502")||m.includes("504")}
function providerCode(error){const m=String(error?.message||error||"").match(/\b(3\d{3}|5\d{3})\b/);return m?Number(m[1]):null}
async function writeGenerationDiagnostic(env,payload){
  const diagnosticId=`GEN-${Date.now().toString(36).toUpperCase()}-${randomHex(2).toUpperCase()}`;
  try{if(env.ARTWORK)await env.ARTWORK.put(`diagnostics/generation/${diagnosticId}.json`,JSON.stringify({diagnosticId,createdAt:new Date().toISOString(),...payload}),{httpMetadata:{contentType:"application/json"}})}catch{}
  return diagnosticId
}

async function writeAttemptReceipt(env,attemptId,payload){
  if(!env.ARTWORK||!attemptId)return;
  try{
    await env.ARTWORK.put(`diagnostics/attempts/${attemptId}.json`,JSON.stringify({
      attemptId,
      updatedAt:new Date().toISOString(),
      ...payload
    }),{httpMetadata:{contentType:"application/json"}});
  }catch{}
}

async function verifyTurnstile(env,token,ip){
  if(!env.TURNSTILE_SECRET_KEY)return{success:true,disabled:true};
  if(!token)return{success:false,error:"missing-token"};
  const body=new URLSearchParams({secret:String(env.TURNSTILE_SECRET_KEY),response:String(token)});
  if(ip)body.set("remoteip",ip);
  const response=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body});
  const data=await response.json().catch(()=>({success:false}));
  return data;
}

function assess(text=""){
  const value=String(text).toLowerCase();
  const reject=AUTO_REJECT.filter(t=>value.includes(t));
  if(reject.length)return{status:"rejected",reasons:reject};
  const review=REVIEW_TERMS.filter(t=>value.includes(t));
  const ip=IP_MARKERS.filter(t=>value.includes(t));
  if(review.length||ip.length)return{status:"review",reasons:[...review,...ip]};
  return{status:"approved",reasons:[]}
}

function safeNotes(text=""){
  let result=String(text||"");
  const rewrites=[
    [/\bsuper\s*heroes?\b/ig,"original heroic guardians in custom unbranded suits and capes"],
    [/\bsuperheros?\b/ig,"original heroic guardians in custom unbranded suits and capes"],
    [/\bsuperheroes?\b/ig,"original heroic guardians in custom unbranded suits and capes"],
    [/\bcomic[- ]book\b/ig,"graphic-novel"],
  ];
  for(const [pattern,replacement] of rewrites) result=result.replace(pattern,replacement);
  for(const marker of IP_MARKERS){
    const safe=marker.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    result=result.replace(new RegExp(safe,"ig"),"an original unbranded version of that general mood");
  }
  return result.trim()
}

function makePrompt(styleId,subjectType,notes,inputCount,customWorld="",hasBranch=false){
  const style=styleId==="custom"?null:(STYLES[styleId]||STYLES.game);
  const userDirection=safeNotes(notes);
  const refs=hasBranch
    ? `The last reference image is the previous successful Recast. Use it for continuity and requested refinements. The earlier ${inputCount-1} reference image(s) are the original subject identity anchors; preserve their faces and markings first. Make a meaningful new variation.`
    : inputCount>1
    ? `There are ${inputCount} reference images. Treat each input image as an identity/appearance reference. Keep every person, pet, and vehicle distinct; never merge subjects or markings.`
    : "Use input image 0 as the strict identity and appearance reference.";

  return [
    "PRIORITY 1: faithfully execute the customer's written direction.",
    userDirection?`CUSTOMER DIRECTION: ${userDirection}.`:"",
    refs,
    `Subject type: ${subjectType||"person"}.`,
    "This is a transformation, not a retouch. Create a clearly new scene rather than recreating the source photograph.",
    "IDENTITY LOCK: preserve facial geometry, eye shape and spacing, eyebrows, nose, mouth, jawline, skin tone, natural age, hair color and hairline, body proportions, pet breed and coat markings, and vehicle silhouette/details.",
    "The result must immediately read as the same real subject. Do not make the subject younger, older, thinner, heavier, more muscular, more glamorous, or generically attractive unless the customer explicitly requests it.",
    style?`SELECTED WORLD: ${style.name}. ${style.prompt}.`:"SELECTED WORLD: an original world designed from the customer's description.",
    customWorld?`CUSTOM WORLD SETTING (customer's priority): ${safeNotes(customWorld)}.`:"",
    "Change the background, wardrobe or costume, camera composition, lighting, props, atmosphere, palette, and storytelling substantially so the transformation is obvious.",
    "If the customer direction conflicts with a generic style detail, honor the customer's direction first while keeping the broad selected-world mood.",
    "No third-party logos, trademarks, copied famous characters, franchise costumes, branded typography, or recognizable title treatments.",
    "Natural anatomy, believable hands and paws, no duplicated limbs or facial features, no text unless explicitly requested, premium commercial/editorial finish.",
    "Final target: polished personalized campaign artwork that looks intentional, expensive, contemporary, and suitable for print."
  ].filter(Boolean).join(" ")
}

function safePrompt(styleId,subjectType,inputCount,notes="",customWorld="",hasBranch=false){
  const style=styleId==="custom"?null:(STYLES[styleId]||STYLES.game);
  const userDirection=safeNotes(notes);
  return [
    hasBranch?"Use the last image as the previous artwork, and earlier images for the real subject's identity.":inputCount>1?`Preserve all ${inputCount} reference subjects as separate recognizable subjects.`:"Preserve the reference subject closely and recognizably.",
    userDirection?`Customer direction, simplified but still important: ${userDirection}.`:"",
    `Subject type: ${subjectType||"person"}.`,
    style?`Create an original ${style.name} transformation: ${style.prompt}.`:"Create an original custom-world transformation.",
    customWorld?`Customer's custom setting: ${safeNotes(customWorld)}.`:"",
    "Create a visibly new scene instead of copying the source photo. Preserve identity while changing wardrobe, environment, lighting, composition, props, palette, and atmosphere.",
    "Friendly, nonviolent, unbranded, no weapons, no injuries, no threatening gestures, no logos, no trademarks, no famous characters, no copied costumes, no text.",
    "Premium editorial image with natural identity, anatomy, hands and paws."
  ].filter(Boolean).join(" ")
}

function makeForm(prompt,inputFiles,{width=768,height=960,guidance=4,steps=null}={}){
  const form=new FormData();
  form.append("prompt",prompt);
  form.append("width",String(width));
  form.append("height",String(height));
  form.append("guidance",String(guidance));
  if(steps!==null&&steps!==undefined)form.append("steps",String(steps));
  inputFiles.forEach((file,i)=>form.append(`input_image_${i}`,file,file.name||`reference-${i}.jpg`));
  return form
}

async function runModel(form,env,model){
  const serialized=new Response(form);
  const result=await env.AI.run(model,{multipart:{body:serialized.body,contentType:serialized.headers.get("content-type")}});
  if(!result?.image)throw new Error("Image model returned no image.");
  return result.image
}

async function withAttemptTimeout(promise,ms){
  let timer;
  try{
    return await Promise.race([
      promise,
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error("attempt timeout"),{reason:"capacity"})),ms)})
    ])
  }finally{clearTimeout(timer)}
}

async function tryGeneration(env,model,prompt,inputFiles,kind,settings,timeoutMs){
  const image=await withAttemptTimeout(
    runModel(makeForm(prompt,inputFiles,settings),env,model),
    timeoutMs
  );
  return{
    image,
    modelUsed:model,
    attemptKind:kind,
    usedSafeRetry:kind.includes("safe"),
    usedFallback:kind.includes("fallback")
  }
}

async function generateHighQuality({env,model,styleId,subjectType,notes,customWorld,inputFiles,hasBranch}){
  const main=makePrompt(styleId,subjectType,notes,inputFiles.length,customWorld,hasBranch);
  const safe=safePrompt(styleId,subjectType,inputFiles.length,notes,customWorld,hasBranch);
  const steps=Math.max(8,Math.min(30,Number(env.IMAGE_HIGH_QUALITY_STEPS||18)));
  const guidance=Math.max(1,Math.min(10,Number(env.IMAGE_HIGH_QUALITY_GUIDANCE||5)));
  const settings={width:1024,height:1280,guidance,steps};

  try{
    return await tryGeneration(env,model,main,inputFiles,"high-primary",settings,125000)
  }catch(firstError){
    if(isQuota(firstError))throw Object.assign(new Error("quota"),{reason:"quota",code:3036,cause:firstError});
    if(isModeration(firstError)){
      try{
        return await tryGeneration(env,model,safe,inputFiles,"high-safe",settings,125000)
      }catch(last){
        if(isQuota(last))throw Object.assign(new Error("quota"),{reason:"quota",code:3036,cause:last});
        if(isModeration(last))throw Object.assign(new Error("moderation"),{reason:"moderation",code:3030,cause:last});
        if(isTransient(last)||isCapacity(last))throw Object.assign(new Error("capacity"),{reason:"capacity",cause:last});
        throw Object.assign(new Error("provider"),{reason:"provider",cause:last});
      }
    }
    if(isTransient(firstError)||isCapacity(firstError))throw Object.assign(new Error("capacity"),{reason:"capacity",cause:firstError});
    throw Object.assign(new Error("provider"),{reason:"provider",cause:firstError});
  }
}

async function generateQuick({env,model,styleId,subjectType,notes,customWorld,inputFiles,hasBranch}){
  const main=makePrompt(styleId,subjectType,notes,inputFiles.length,customWorld,hasBranch);
  const safe=safePrompt(styleId,subjectType,inputFiles.length,notes,customWorld,hasBranch);
  const guidance=Math.max(1,Math.min(10,Number(env.IMAGE_QUICK_GUIDANCE||4)));
  const settings={width:768,height:960,guidance,steps:null};

  let firstError;
  try{
    return await tryGeneration(env,model,main,inputFiles,"quick-primary",settings,60000)
  }catch(error){firstError=error}

  if(isQuota(firstError))throw Object.assign(new Error("quota"),{reason:"quota",code:3036,cause:firstError});

  // A moderated prompt can be simplified once. Never substitute the low-fidelity 4B model.
  if(isModeration(firstError)){
    try{
      return await tryGeneration(env,model,safe,inputFiles,"quick-safe",settings,60000)
    }catch(last){
      if(isQuota(last))throw Object.assign(new Error("quota"),{reason:"quota",code:3036,cause:last});
      if(isModeration(last))throw Object.assign(new Error("moderation"),{reason:"moderation",code:3030,cause:last});
      if(isTransient(last)||isCapacity(last))throw Object.assign(new Error("capacity"),{reason:"capacity",cause:last});
      throw Object.assign(new Error("provider"),{reason:"provider",cause:last});
    }
  }

  if(isTransient(firstError)||isCapacity(firstError))throw Object.assign(new Error("capacity"),{reason:"capacity",cause:firstError});
  throw Object.assign(new Error("provider"),{reason:"provider",cause:firstError});
}

async function store(env,{requestId,accessToken,styleId,subjectType,notes,customWorld,parentRequestId,source,sourceTweet,qualityMode,inputs,image,previewMime,safety,modelUsed,attemptKind}){
  if(!env.ARTWORK)return{persisted:false,storageError:"ARTWORK binding is missing."};
  const now=new Date().toISOString();
  const metadata={requestId,accessToken,styleId,styleName:STYLES[styleId]?.name||"Custom World",subjectType,notes,customWorld,parentRequestId:parentRequestId||null,previewMime,source:source||"site",sourceTweet:sourceTweet||null,safety,status:"preview_ready",createdAt:now,updatedAt:now,inputCount:inputs.length,paid:false,fulfillment:"not_started",modelUsed,attemptKind,qualityMode,promptVersion:"v1.3"};
  try{
    for(let i=0;i<inputs.length;i++)await env.ARTWORK.put(requestKey(requestId,`input-${i}.jpg`),await inputs[i].arrayBuffer());
    await env.ARTWORK.put(requestKey(requestId,"preview.b64"),image);
    await env.ARTWORK.put(requestKey(requestId,"request.json"),JSON.stringify(metadata));
    return{persisted:true,storageError:null}
  }catch(error){return{persisted:false,storageError:error?.message||String(error)}}
}

export async function highQualityTransform(request,env){
  let stage="start";
  let clientAttemptId="";
  let qualityMode="high";
  let attemptStartedAt=Date.now();
  try{
    if(!env.AI)return json({error:"ai_unavailable",userMessage:"The image engine is temporarily unavailable. Please try again shortly.",reason:"binding"},503);
    const incoming=await request.formData();stage="parse-form";
    if(env.TURNSTILE_SECRET_KEY){
      stage="human-check";
      const verification=await verifyTurnstile(env,String(incoming.get("turnstileToken")||""),request.headers.get("CF-Connecting-IP")||"");
      if(!verification.success)return json({error:"human_check_failed",userMessage:"Please complete the security check and try again.",reason:"turnstile"},403);
    }
    const styleId=String(incoming.get("style")||"game");
    const subjectType=String(incoming.get("subject")||"person").slice(0,80);
    const notes=String(incoming.get("notes")||"").trim().slice(0,1200);
    const customWorld=String(incoming.get("customWorld")||"").trim().slice(0,800);
    if(styleId!=="custom"&&!STYLES[styleId])return json({error:"bad_style",userMessage:"Choose a valid World.",reason:"input"},400);
    if(styleId==="custom"&&!customWorld)return json({error:"missing_world",userMessage:"Describe your custom world first.",reason:"input"},400);
    const source=String(incoming.get("source")||"site");
    const sourceTweet=String(incoming.get("sourceTweet")||"");
    qualityMode=String(incoming.get("qualityMode")||"high")==="quick"?"quick":"high";
    clientAttemptId=String(incoming.get("clientAttemptId")||`SRV-${Date.now().toString(36).toUpperCase()}-${randomHex(2).toUpperCase()}`).replace(/[^a-zA-Z0-9._-]/g,"").slice(0,96);
    attemptStartedAt=Date.now();
    await writeAttemptReceipt(env,clientAttemptId,{status:"started",startedAt:new Date(attemptStartedAt).toISOString(),styleId,subjectType,qualityMode,source:source||"site"});
    const safety=assess(`${styleId} ${subjectType} ${notes} ${customWorld}`);
    if(safety.status==="rejected")return json({error:"not_supported",userMessage:"That request is outside Recast Me's good-will image policy.",reason:"policy"},422);
    if(safety.status==="review")return json({reviewRequired:true,userMessage:"This request needs a quick human review before generation.",reason:"review"},202);

    const inputFiles=[];
    for(let i=0;i<4;i++){
      const file=incoming.get(`image_${i}`);
      if(file instanceof File&&file.size>0){
        if(!ACCEPTED_REFERENCE_TYPES.has(file.type))return json({error:"bad_upload",userMessage:"Use a JPEG, PNG, or WebP photo.",reason:"input"},400);
        if(file.size>2_000_000)return json({error:"large_upload",userMessage:"One prepared reference image is too large. Please choose a smaller photo.",reason:"input"},400);
        inputFiles.push(file)
      }
    }
    let parentRequestId=null;
    const branchRequestId=String(incoming.get("branchRequestId")||"");
    if(branchRequestId){
      stage="verify-branch";
      if(!/^RC-[A-Z0-9-]{8,60}$/.test(branchRequestId))return json({error:"invalid_branch",userMessage:"That saved version cannot be opened.",reason:"input"},400);
      const branchToken=String(incoming.get("branchAccessToken")||"");
      const meta=await env.ARTWORK?.get(requestKey(branchRequestId,"request.json"));
      const saved=meta?await meta.json():null;
      if(!saved||!branchToken||saved.accessToken!==branchToken)return json({error:"invalid_branch",userMessage:"That previous Recast is unavailable. Choose another saved version or upload a photo.",reason:"input"},403);
      const branchPreview=incoming.get("branchPreview");
      if(!(branchPreview instanceof File)||!ACCEPTED_REFERENCE_TYPES.has(branchPreview.type)||branchPreview.size>2_000_000)return json({error:"missing_branch_preview",userMessage:"The previous Recast could not be prepared. Try selecting it again.",reason:"input"},400);
      if(inputFiles.length>3)return json({error:"too_many_references",userMessage:"For refinements, choose up to 3 original photos alongside the saved Recast.",reason:"input"},400);
      if(!inputFiles.length){
        for(let i=0;i<Math.min(3,Number(saved.inputCount)||0);i++){
          const original=await env.ARTWORK.get(requestKey(branchRequestId,`input-${i}.jpg`));
          if(original)inputFiles.push(new File([await original.arrayBuffer()],`original-${i}.jpg`,{type:"image/jpeg"}));
        }
      }
      inputFiles.push(branchPreview);
      parentRequestId=branchRequestId;
    }
    if(!inputFiles.length)return json({error:"missing_upload",userMessage:"Add at least one photo first.",reason:"input"},400);

    const highQualityModel=String(env.IMAGE_MODEL_HIGH_QUALITY||DEFAULT_HIGH_QUALITY);
    const quickModel=String(env.IMAGE_MODEL_QUICK||DEFAULT_QUICK);
    stage="ai-generation";
    const generated=qualityMode==="quick"
      ? await generateQuick({env,model:quickModel,styleId,subjectType,notes,customWorld,inputFiles,hasBranch:Boolean(parentRequestId)})
      : await generateHighQuality({env,model:highQualityModel,styleId,subjectType,notes,customWorld,inputFiles,hasBranch:Boolean(parentRequestId)});
    const image=normalizeBase64(generated.image);
    if(!image||image.length<100)throw Object.assign(new Error("malformed"),{reason:"provider"});
    const previewMime=imageMime(image);

    stage="storage";
    const requestId=`RC-${Date.now().toString(36).toUpperCase()}-${randomHex(3).toUpperCase()}`;
    const accessToken=randomHex(32);
    const stored=await store(env,{requestId,accessToken,styleId,subjectType,notes,customWorld,parentRequestId,source,sourceTweet,qualityMode,inputs:inputFiles,image,previewMime,safety,modelUsed:generated.modelUsed,attemptKind:generated.attemptKind});

    await writeAttemptReceipt(env,clientAttemptId,{status:"success",completedAt:new Date().toISOString(),durationMs:Date.now()-attemptStartedAt,requestId,qualityMode,modelUsed:generated.modelUsed,attemptKind:generated.attemptKind,persisted:stored.persisted});
    return json({ok:true,requestId,accessToken,style:STYLES[styleId]?.name||"Custom World",image:`data:${previewMime};base64,${image}`,persisted:stored.persisted,storageError:stored.storageError,qualityMode,qualityLabel:qualityMode==="quick"?"Quick Preview":"High-Quality Preview",modelUsed:generated.modelUsed,usedSafeRetry:generated.usedSafeRetry,usedFastFallback:false,promptVersion:"v1.3",clientAttemptId});
  }catch(error){
    const reason=error?.reason||"provider";
    const internal=error?.cause||error;
    const diagnosticId=await writeGenerationDiagnostic(env,{stage,reason,providerCode:providerCode(internal),providerMessage:String(internal?.message||internal||"").slice(0,500),highQuality:String(env.IMAGE_MODEL_HIGH_QUALITY||DEFAULT_HIGH_QUALITY),quick:String(env.IMAGE_MODEL_QUICK||DEFAULT_QUICK)});
    await writeAttemptReceipt(env,clientAttemptId,{status:"failed",failedAt:new Date().toISOString(),durationMs:Date.now()-attemptStartedAt,stage,reason,providerCode:providerCode(internal),diagnosticId,qualityMode});
    if(reason==="quota")return json({error:"daily_allowance_used",code:3036,reason:"quota",retryable:false,diagnosticId,qualityMode,userMessage:"Today’s free AI preview allowance has been used. The allowance resets daily. Your photo is safe, and nothing was charged."},429);
    if(reason==="moderation")return json({error:"generation_declined",code:3030,reason:"moderation",retryable:true,diagnosticId,qualityMode,userMessage:"The image engine would not complete that exact photo and wording combination. We already retried with a safer version. Try the same idea with simpler wording or another reference photo."},422);
    if(reason==="capacity")return json({error:"engine_busy",reason:"capacity",retryable:true,diagnosticId,qualityMode,userMessage:"The image engine is temporarily busy. Your photo is safe — tap Try again in a moment."},503);
    return json({error:"generation_failed",reason,retryable:true,diagnosticId,qualityMode,userMessage:"We could not finish this preview. Your uploaded photo was not changed."},500)
  }
}

export function modelStatus(env){
  const highQuality=String(env.IMAGE_MODEL_HIGH_QUALITY||DEFAULT_HIGH_QUALITY);
  const quick=String(env.IMAGE_MODEL_QUICK||DEFAULT_QUICK);
  return json({
    ok:true,
    modes:{
      high:{label:"High-Quality Preview",model:highQuality,steps:Number(env.IMAGE_HIGH_QUALITY_STEPS||18),guidance:Number(env.IMAGE_HIGH_QUALITY_GUIDANCE||5)},
      quick:{label:"Quick Preview",model:quick,guidance:Number(env.IMAGE_QUICK_GUIDANCE||4)}
    },
    defaultMode:"high",
    promptVersion:"v1.3"
  })
}
