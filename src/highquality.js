import { assertRenderReady, readinessSnapshot, recordRenderHealth } from './render-health.js';
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

const SUBJECT_STYLING = {
  game:"original action-adventure protagonist styling: a clearly visible custom costume or heroic pet harness, distinctive accessories and an active pose integrated into the cinematic world",
  halloween:"an unmistakable playful original Halloween costume fitted to the subject, with characterful accessories and theatrical moonlit lighting",
  retro:"a recognizable 1980s inspired wardrobe or pet accessory, period styling and a new expressive editorial pose",
  fantasy:"original ornate fantasy armor or pet barding shaped naturally around the body, a heroic pose and enchanted light on the subject",
  royal:"rich ceremonial clothing or a fitted regal pet cape and collar, a poised royal portrait stance and painterly light on the subject",
  future:"sleek original futuristic clothing or fitted pet gear, futuristic details on the subject and neon light reflecting across them",
  comic:"an original graphic-novel hero costume or fitted pet hero gear, expressive dynamic pose and inked color treatment on the subject",
  space:"an original space-explorer suit or pet-safe fitted space harness, clear astronaut details and cinematic planet light on the subject"
};

function subjectTransformation(styleId,subjectType){
  const subject=String(subjectType||"person").toLowerCase();
  const isPet=subject.includes("pet")||subject.includes("dog")||subject.includes("cat")||subject.includes("puppy")||subject.includes("kitten");
  const isCar=subject.includes("car");
  const isPerson=subject.includes("person")||subject.includes("couple")||subject.includes("family");
  const theme=SUBJECT_STYLING[styleId]||"an original costume, role and visual styling drawn directly from the customer's custom world";
  return [
    `VISIBLE SUBJECT TRANSFORMATION REQUIRED: ${theme}.`,
    isPet?"PET IDENTITY IS NON-NEGOTIABLE: costume and environment may change, but the animal itself must not be redesigned. Preserve the exact head and muzzle shape, ear size/shape/angle, eye size/spacing/color, nose, expression character, breed/body proportions, leg length, fur length/texture, and the exact boundaries and placement of every coat-color patch and facial marking from the reference. Do not widen or shorten the muzzle, enlarge the eyes, round the skull, change ear proportions, invent spots, or turn the pet into a generic/cuter/cartoon version. Fit costume around the real anatomy without hiding the defining face or markings. The finished pet should be identifiable from the face and coat even if the costume/background are removed. The pet must be visibly transformed by costume, pose and world lighting, but never appear as an unchanged photo cutout pasted onto new scenery.":"",
    isCar?"For the car, visibly restyle its paint, lighting and original unbranded trim to fit the world, while retaining its recognizable silhouette and defining features.":"",
    isPerson?"For each person, visibly change their wardrobe, character role, pose and the lighting on their face while preserving their recognizable face, natural age and proportions.":"",
    "Show the costume or themed details on the subject clearly in the finished image. Integrate subject and environment with consistent shadows, perspective, color and light."
  ].filter(Boolean).join(" ");
}

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
function isTimeout(error){const m=errorText(error);return error?.reason==="timeout"||error?.name==="TimeoutError"||m.includes("timeout")||m.includes("timed out")}
function isTemporaryUnavailable(error){const m=errorText(error);return m.includes("503")||m.includes("502")||m.includes("504")||m.includes("service unavailable")||m.includes("upstream unavailable")}
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
    "PRIORITY 1: preserve the exact identity of every real person and pet in the reference images. Identity accuracy outranks costume, pose, style, drama, cuteness, and customer world details.",
    "PRIORITY 2: faithfully execute the customer's written direction without changing who the subject is.",
    userDirection?`CUSTOMER DIRECTION: ${userDirection}.`:"",
    refs,
    `Subject type: ${subjectType||"person"}.`,
    "This is a transformation, not a retouch. Create a clearly new scene rather than recreating the source photograph.",
    "IDENTITY LOCK: preserve facial geometry, eye shape and spacing, eyebrows, nose, mouth, jawline, skin tone, natural age, hair color and hairline, body proportions, pet breed, exact pet head/muzzle/ear proportions and exact coat-marking boundaries, and vehicle silhouette/details. Never use a generic breed template in place of the referenced animal.",
    "The result must immediately read as the same real subject. Do not make the subject younger, older, thinner, heavier, more muscular, more glamorous, or generically attractive unless the customer explicitly requests it.",
    style?`SELECTED WORLD: ${style.name}. ${style.prompt}.`:"SELECTED WORLD: an original world designed from the customer's description.",
    customWorld?`CUSTOM WORLD SETTING (customer's priority): ${safeNotes(customWorld)}.`:"",
    subjectTransformation(styleId,subjectType),
    "Change the scene, camera composition, atmosphere and storytelling substantially. A new background alone is not a completed transformation.",
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
    hasBranch?"Use the last image as the previous artwork, and earlier images for the real subject's identity.":inputCount>1?`Preserve all ${inputCount} reference subjects as separate recognizable subjects.`:"Preserve the reference subject exactly and recognizably; for pets lock head/muzzle/ear proportions, eye placement and exact coat markings before applying any style.",
    userDirection?`Customer direction, simplified but still important: ${userDirection}.`:"",
    `Subject type: ${subjectType||"person"}.`,
    style?`Create an original ${style.name} transformation: ${style.prompt}.`:"Create an original custom-world transformation.",
    customWorld?`Customer's custom setting: ${safeNotes(customWorld)}.`:"",
    subjectTransformation(styleId,subjectType),
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
  // Reject a request before inference when the model is currently saturated.
  // Cloudflare documents 3040 as a temporary capacity rejection. Do not
  // automatically resubmit it: preserve the user's last result and let a
  // deliberate later action create the next attempt.
  const result=await env.AI.run(model,{multipart:{body:serialized.body,contentType:serialized.headers.get("content-type")}}, {rejectIfBusy:true});
  if(!result?.image)throw new Error("Image model returned no image.");
  return result.image
}

async function tryGeneration(env,model,prompt,inputFiles,kind,settings){
  // Do not race AI.run against a local timer. Promise.race does not cancel the
  // provider call, so the old 125s/60s timers could discard a late successful
  // result while the inference continued. Capacity is handled by rejectIfBusy;
  // genuine provider timeouts are classified from the provider error itself.
  const image=await runModel(makeForm(prompt,inputFiles,settings),env,model);
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
    return await tryGeneration(env,model,main,inputFiles,"high-primary",settings)
  }catch(firstError){
    if(isQuota(firstError))throw Object.assign(new Error("quota"),{reason:"quota",code:3036,cause:firstError});
    if(isModeration(firstError)){
      try{
        return await tryGeneration(env,model,safe,inputFiles,"high-safe",settings)
      }catch(last){
        if(isQuota(last))throw Object.assign(new Error("quota"),{reason:"quota",code:3036,cause:last});
        if(isModeration(last))throw Object.assign(new Error("moderation"),{reason:"moderation",code:3030,cause:last});
        if(isTimeout(last))throw Object.assign(new Error("timeout"),{reason:"timeout",cause:last});
        if(isCapacity(last))throw Object.assign(new Error("capacity"),{reason:"capacity",cause:last});
        if(isTemporaryUnavailable(last))throw Object.assign(new Error("unavailable"),{reason:"unavailable",cause:last});
        throw Object.assign(new Error("provider"),{reason:"provider",cause:last});
      }
    }
    if(isTimeout(firstError))throw Object.assign(new Error("timeout"),{reason:"timeout",cause:firstError});
    if(isCapacity(firstError)){
      // Capacity is not a quality failure and should not trigger a second
      // automatic provider submission. The UI can invite a deliberate retry.
      throw Object.assign(new Error("capacity"),{reason:"capacity",cause:firstError});
    }
    if(isTemporaryUnavailable(firstError))throw Object.assign(new Error("unavailable"),{reason:"unavailable",cause:firstError});
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
    return await tryGeneration(env,model,main,inputFiles,"quick-primary",settings)
  }catch(error){firstError=error}

  if(isQuota(firstError))throw Object.assign(new Error("quota"),{reason:"quota",code:3036,cause:firstError});

  // A moderated prompt can be simplified once. Never substitute the low-fidelity 4B model.
  if(isModeration(firstError)){
    try{
      return await tryGeneration(env,model,safe,inputFiles,"quick-safe",settings)
    }catch(last){
      if(isQuota(last))throw Object.assign(new Error("quota"),{reason:"quota",code:3036,cause:last});
      if(isModeration(last))throw Object.assign(new Error("moderation"),{reason:"moderation",code:3030,cause:last});
      if(isTimeout(last))throw Object.assign(new Error("timeout"),{reason:"timeout",cause:last});
      if(isCapacity(last))throw Object.assign(new Error("capacity"),{reason:"capacity",cause:last});
      if(isTemporaryUnavailable(last))throw Object.assign(new Error("unavailable"),{reason:"unavailable",cause:last});
      throw Object.assign(new Error("provider"),{reason:"provider",cause:last});
    }
  }

  if(isTimeout(firstError))throw Object.assign(new Error("timeout"),{reason:"timeout",cause:firstError});
  if(isCapacity(firstError))throw Object.assign(new Error("capacity"),{reason:"capacity",cause:firstError});
  if(isTemporaryUnavailable(firstError))throw Object.assign(new Error("unavailable"),{reason:"unavailable",cause:firstError});
  throw Object.assign(new Error("provider"),{reason:"provider",cause:firstError});
}

async function store(env,{requestId,accessToken,styleId,subjectType,notes,customWorld,parentRequestId,source,sourceTweet,qualityMode,inputs,image,previewMime,safety,modelUsed,attemptKind}){
  if(!env.ARTWORK)return{persisted:false,storageError:"ARTWORK binding is missing."};
  const now=new Date().toISOString();
  const metadata={requestId,accessToken,styleId,styleName:STYLES[styleId]?.name||"Custom World",subjectType,notes,customWorld,parentRequestId:parentRequestId||null,previewMime,source:source||"site",sourceTweet:sourceTweet||null,safety,status:"preview_ready",createdAt:now,updatedAt:now,inputCount:inputs.length,paid:false,fulfillment:"not_started",modelUsed,attemptKind,qualityMode,promptVersion:"v1.4"};
  try{
    for(let i=0;i<inputs.length;i++)await env.ARTWORK.put(requestKey(requestId,`input-${i}.jpg`),await inputs[i].arrayBuffer());
    await env.ARTWORK.put(requestKey(requestId,"preview.b64"),image);
    await env.ARTWORK.put(requestKey(requestId,"request.json"),JSON.stringify(metadata));
    return{persisted:true,storageError:null}
  }catch(error){return{persisted:false,storageError:error?.message||String(error)}}
}

export async function highQualityTransform(request,env,{trustedSocialJob=false}={}){
  let stage="start";
  let clientAttemptId="";
  let qualityMode="high";
  let attemptStartedAt=Date.now();
  try{
    if(!env.AI)return json({error:"ai_unavailable",userMessage:"The image engine is temporarily unavailable. Please try again shortly.",reason:"binding"},503);
    const incoming=await request.formData();stage="parse-form";
    if(env.TURNSTILE_SECRET_KEY&&!trustedSocialJob){
      stage="human-check";
      const verification=await verifyTurnstile(env,String(incoming.get("turnstileToken")||""),request.headers.get("CF-Connecting-IP")||"");
      if(!verification.success)return json({error:"human_check_failed",userMessage:"Please complete the security check and try again.",reason:"turnstile"},403);
    }
    const styleId=String(incoming.get("style")||"game");
    const subjectType=String(incoming.get("subject")||"person").slice(0,80);
    const notes=String(incoming.get("notes")||"").trim().slice(0,1200);
    const customWorld=styleId==="custom"?String(incoming.get("customWorld")||"").trim().slice(0,800):"";
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

    stage="readiness-preflight";
    try{await assertRenderReady(env,qualityMode)}
    catch(gate){
      await writeAttemptReceipt(env,clientAttemptId,{status:'blocked',blockedAt:new Date().toISOString(),reason:gate.reason,stage,qualityMode,retryAt:gate.retryAt||null});
      const quota=gate.reason==='quota';
      const label=qualityMode==='quick'?'Quick Preview':'High-Quality Preview';
      const userMessage=gate.reason==='configuration'
        ?'Image creation is unavailable while Recast Me checks its required services. Your photo and settings are safe.'
        :quota
        ?'Recast Me has reached its shared AI capacity. Your settings are safe; try again after the cooldown.'
        :gate.reason==='timeout'
        ?`${label} is cooling down after a timeout. Your settings are safe; wait for Ready before trying again.`
        :gate.reason==='unavailable'
        ?`${label} is cooling down after a temporary provider error. Your settings are safe; wait for Ready before trying again.`
        :`${label} is cooling down after a confirmed busy response. Your settings are safe; wait for Ready before trying again.`;
      return json({error:quota?'shared_ai_capacity_used':'render_not_ready',reason:gate.reason,retryable:false,retryAt:gate.retryAt||null,qualityMode,userMessage},gate.status||503);
    }
    const highQualityModel=String(env.IMAGE_MODEL_HIGH_QUALITY||DEFAULT_HIGH_QUALITY);
    const quickModel=String(env.IMAGE_MODEL_QUICK||DEFAULT_QUICK);
    stage="ai-generation";
    const generated=qualityMode==="quick"
      ? await generateQuick({env,model:quickModel,styleId,subjectType,notes,customWorld,inputFiles,hasBranch:Boolean(parentRequestId)})
      : await generateHighQuality({env,model:highQualityModel,styleId,subjectType,notes,customWorld,inputFiles,hasBranch:Boolean(parentRequestId)});
    const image=normalizeBase64(generated.image);
    if(!image||image.length<100)throw Object.assign(new Error("malformed"),{reason:"provider"});
    const previewMime=imageMime(image);

    await recordRenderHealth(env,qualityMode,'success');
    stage="storage";
    const requestId=`RC-${Date.now().toString(36).toUpperCase()}-${randomHex(3).toUpperCase()}`;
    const accessToken=randomHex(32);
    const stored=await store(env,{requestId,accessToken,styleId,subjectType,notes,customWorld,parentRequestId,source,sourceTweet,qualityMode,inputs:inputFiles,image,previewMime,safety,modelUsed:generated.modelUsed,attemptKind:generated.attemptKind});

    await writeAttemptReceipt(env,clientAttemptId,{status:"success",completedAt:new Date().toISOString(),durationMs:Date.now()-attemptStartedAt,requestId,qualityMode,modelUsed:generated.modelUsed,attemptKind:generated.attemptKind,persisted:stored.persisted});
    return json({ok:true,requestId,accessToken,style:STYLES[styleId]?.name||"Custom World",image:`data:${previewMime};base64,${image}`,persisted:stored.persisted,storageError:stored.storageError,qualityMode,qualityLabel:qualityMode==="quick"?"Quick Preview":"High-Quality Preview",modelUsed:generated.modelUsed,usedSafeRetry:generated.usedSafeRetry,usedFastFallback:false,promptVersion:"v1.4",clientAttemptId});
  }catch(error){
    const reason=error?.reason||"provider";
    if(['capacity','quota','timeout','unavailable'].includes(reason))await recordRenderHealth(env,qualityMode,'failed',reason);
    const internal=error?.cause||error;
    const diagnosticId=await writeGenerationDiagnostic(env,{stage,reason,providerCode:providerCode(internal),providerMessage:String(internal?.message||internal||"").slice(0,500),highQuality:String(env.IMAGE_MODEL_HIGH_QUALITY||DEFAULT_HIGH_QUALITY),quick:String(env.IMAGE_MODEL_QUICK||DEFAULT_QUICK)});
    await writeAttemptReceipt(env,clientAttemptId,{status:"failed",failedAt:new Date().toISOString(),durationMs:Date.now()-attemptStartedAt,stage,reason,providerCode:providerCode(internal),diagnosticId,qualityMode});
    if(reason==="quota")return json({error:"shared_ai_capacity_used",code:3036,reason:"quota",retryable:false,diagnosticId,qualityMode,userMessage:"Recast Me has reached its shared AI capacity for today. This is a site-wide limit, not your personal render count. Your photo is safe, and nothing was charged."},429);
    if(reason==="moderation")return json({error:"generation_declined",code:3030,reason:"moderation",retryable:true,diagnosticId,qualityMode,userMessage:"The image engine would not complete that exact photo and wording combination. We already retried with a safer version. Try the same idea with simpler wording or another reference photo."},422);
    if(reason==="capacity")return json({error:"engine_busy",reason:"capacity",retryable:true,diagnosticId,qualityMode,userMessage:"The image engine returned a confirmed busy response. Your photo and settings are safe; wait for Ready before trying again."},503);
    if(reason==="timeout")return json({error:"engine_timeout",reason:"timeout",retryable:true,diagnosticId,qualityMode,userMessage:"The image provider timed out before returning the artwork. Your photo and settings are safe; wait for Ready before trying again."},504);
    if(reason==="unavailable")return json({error:"engine_unavailable",reason:"unavailable",retryable:true,diagnosticId,qualityMode,userMessage:"The image provider is temporarily unavailable. Your photo and settings are safe; wait for Ready before trying again."},503);
    return json({error:"generation_failed",reason,retryable:true,diagnosticId,qualityMode,userMessage:"We could not finish this preview. Your uploaded photo was not changed."},500)
  }
}

export async function modelStatus(env){
  const highQuality=String(env.IMAGE_MODEL_HIGH_QUALITY||DEFAULT_HIGH_QUALITY);
  const quick=String(env.IMAGE_MODEL_QUICK||DEFAULT_QUICK);
  return json({
    ok:true,
    modes:{
      high:{label:"High-Quality Preview",model:highQuality,steps:Number(env.IMAGE_HIGH_QUALITY_STEPS||18),guidance:Number(env.IMAGE_HIGH_QUALITY_GUIDANCE||5)},
      quick:{label:"Quick Preview",model:quick,guidance:Number(env.IMAGE_QUICK_GUIDANCE||4)}
    },
    defaultMode:"high",
    version:"v1.6",
    promptVersion:"v1.4",
    availability:await readinessSnapshot(env)
  })
}
