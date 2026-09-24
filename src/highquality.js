const DEFAULT_PRIMARY = "@cf/black-forest-labs/flux-2-dev";
const DEFAULT_FALLBACK = "@cf/black-forest-labs/flux-2-klein-4b";

const STYLES = {
  game:{name:"Game World",prompt:"original premium open-world action-game inspired key art without copying any franchise, dramatic fictional city, sophisticated illustrated realism, cinematic sunset and neon accents, editorial composition, no logos, no weapons"},
  halloween:{name:"Halloween",prompt:"premium playful Halloween portrait, original stylish costumes, cinematic moonlight, atmospheric fog, elegant pumpkins, sophisticated seasonal editorial image, fun rather than frightening"},
  retro:{name:"Retro Time Machine",prompt:"authentic 1980s-inspired editorial portrait, vintage flash photography, period wardrobe and styling, natural film grain, nostalgic architecture, sophisticated analog color"},
  fantasy:{name:"Fantasy Warrior",prompt:"original premium fantasy portrait, detailed non-branded armor and fabrics, ancient ruins and mountains, heroic cinematic light, elegant epic atmosphere, nonviolent pose"},
  royal:{name:"Royal",prompt:"regal museum-quality portrait, ornate palace-inspired environment, rich fabrics, ceremonial accessories, elegant painterly light, refined luxury editorial styling"},
  future:{name:"Future City",prompt:"original futuristic city portrait, sophisticated neon reflections, architectural high-tech skyline, rain haze, premium cinematic sci-fi editorial light, no logos"},
  comic:{name:"Comic Hero",prompt:"original upbeat comic-book adventure portrait, friendly nonviolent heroic styling, sophisticated ink linework, halftone texture, graphic shadows, original costume design, no weapons, no copied characters"},
  space:{name:"Space Explorer",prompt:"original premium cinematic space explorer portrait, distant planets, spacecraft-inspired environment, dramatic rim light, epic scale, elegant original suit and insignia, no logos"}
};

const AUTO_REJECT=["war","invasion","airstrike","bombing","missile strike","battlefield","casualties","ceasefire","mass shooting","school shooting","murder","kidnapping","hostage","terrorism","suicide","self-harm","earthquake","wildfire","flood disaster","plane crash","funeral","obituary","genocide","hate crime"];
const REVIEW_TERMS=["election","campaign","president","senate","congress","governor","protest","riot","boycott","pandemic","outbreak","public health emergency"];
const IP_MARKERS=["gta","grand theft auto","rockstar games","disney","pixar","marvel","dc comics","pokemon","naruto","studio ghibli","star wars","harry potter","fortnite","minecraft"];

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}})}
function randomHex(byteCount=16){const bytes=new Uint8Array(byteCount);crypto.getRandomValues(bytes);return[...bytes].map(b=>b.toString(16).padStart(2,"0")).join("")}
function requestKey(id,suffix){return `requests/${id}/${suffix}`}
function normalizeBase64(value){return String(value||"").replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/,"").replace(/\s+/g,"")}

function assess(text=""){
  const value=String(text).toLowerCase();
  const reject=AUTO_REJECT.filter(t=>value.includes(t));if(reject.length)return{status:"rejected",reasons:reject};
  const review=REVIEW_TERMS.filter(t=>value.includes(t)),ip=IP_MARKERS.filter(t=>value.includes(t));
  if(review.length||ip.length)return{status:"review",reasons:[...review,...ip]};
  return{status:"approved",reasons:[]}
}
function safeNotes(text=""){
  let result=String(text);
  for(const marker of IP_MARKERS)result=result.replace(new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"ig"),"an original unbranded aesthetic");
  return result
}
function makePrompt(styleId,subjectType,notes,inputCount){
  const style=STYLES[styleId]||STYLES.game;
  const userDirection=safeNotes(notes||"").trim();
  const refs=inputCount>1
    ? `There are ${inputCount} reference images. Treat every image only as a strict identity/appearance reference. Keep every subject distinct; never merge faces, bodies, pet markings, or vehicle details.`
    : "Use reference image 0 only as the strict identity and appearance reference.";

  return [
    "IMPORTANT: Follow the customer's written direction as the primary creative instruction.",
    userDirection ? `CUSTOMER DIRECTION — execute this faithfully: ${userDirection}` : "",
    refs,
    "This is a transformation/editing task. Do NOT merely beautify, retouch, or recreate the original photograph.",
    "Do NOT preserve the original background, wardrobe, pose, camera angle, or composition unless the customer explicitly asks to keep them.",
    "Preserve the subject's identity while creating a visibly new scene that clearly belongs to the selected world.",
    "Identity lock: preserve facial geometry, eye shape and spacing, eyebrows, nose, mouth, jawline, skin tone, hair color/hairline, age range, body proportions, pet breed, coat pattern and markings, and vehicle silhouette/details.",
    "The person or pet must remain immediately recognizable as the same real subject from the references. Do not make them younger, older, thinner, heavier, more muscular, more glamorous, or generically attractive unless the customer explicitly asks for that.",
    `Subject type: ${subjectType||"person"}.`,
    `SELECTED WORLD: ${style.name}. ${style.prompt}.`,
    "Transform the environment, wardrobe/costume, lighting, color palette, props, atmosphere, and storytelling strongly enough that the result is obviously different from the source photo.",
    "If the customer's direction conflicts with a generic style detail, honor the customer's direction first while keeping the broad selected-world aesthetic.",
    "Do not add third-party logos, trademarks, famous characters, copied franchise costumes, branded typography, or recognizable title treatments.",
    "No text inside the artwork unless the customer explicitly asks for text. Natural anatomy, believable hands, no duplicated features, premium commercial/editorial finish.",
    "Final quality target: polished, professional campaign artwork suitable for a premium personalized-art brand."
  ].filter(Boolean).join(" ")
}
function safePrompt(styleId,subjectType,inputCount,notes=""){
  const style=STYLES[styleId]||STYLES.game;
  const userDirection=safeNotes(notes||"").trim();
  return [
    inputCount>1?`Preserve all ${inputCount} reference subjects distinctly.`:"Preserve the reference subject closely.",
    userDirection?`Customer direction: ${userDirection}`:"",
    `Subject type: ${subjectType||"person"}.`,
    style.prompt+".",
    "Create a clearly transformed scene, not a near-copy of the source photograph.",
    "Keep identity recognizable; change environment, wardrobe, lighting, props, palette, and composition.",
    "Family-safe, friendly, nonviolent, no weapons, no injuries, no threatening gestures, no logos, no trademarks, no famous characters, no text.",
    "Premium editorial image with natural identity and anatomy."
  ].filter(Boolean).join(" ")
}

async function runModel(form,env,model,steps){
  if(model.includes("flux-2-dev") && !form.has("steps")) form.append("steps",String(steps));
  const serialized=new Response(form);
  const result=await env.AI.run(model,{multipart:{body:serialized.body,contentType:serialized.headers.get("content-type")}});
  if(!result?.image)throw new Error("Image model returned no image.");
  return result.image
}
function isModeration(error){const m=(error?.message||String(error)).toLowerCase();return m.includes("3030")||m.includes("flagged")}
function isTransient(error){const m=(error?.message||String(error)).toLowerCase();return m.includes("timeout")||m.includes("busy")||m.includes("overload")||m.includes("429")||m.includes("503")}

async function store(env,{requestId,accessToken,styleId,subjectType,notes,inputs,image,safety,modelUsed}){
  if(!env.ARTWORK)return{persisted:false,storageError:"ARTWORK binding is missing."};
  const now=new Date().toISOString();
  const metadata={requestId,accessToken,styleId,styleName:STYLES[styleId]?.name||STYLES.game.name,subjectType,notes,safety,status:"preview_ready",createdAt:now,updatedAt:now,inputCount:inputs.length,paid:false,fulfillment:"not_started",modelUsed};
  try{
    for(let i=0;i<inputs.length;i++)await env.ARTWORK.put(requestKey(requestId,`input-${i}.jpg`),await inputs[i].arrayBuffer());
    await env.ARTWORK.put(requestKey(requestId,"preview.b64"),image);
    await env.ARTWORK.put(requestKey(requestId,"request.json"),JSON.stringify(metadata));
    return{persisted:true,storageError:null}
  }catch(error){return{persisted:false,storageError:error?.message||String(error)}}
}

export async function highQualityTransform(request,env){
  let stage="start";
  try{
    if(!env.AI)return json({error:"Workers AI binding is not connected.",stage:"binding"},503);
    const incoming=await request.formData();stage="parse-form";
    const styleId=String(incoming.get("style")||"game"),subjectType=String(incoming.get("subject")||"person"),notes=String(incoming.get("notes")||"");
    const safety=assess(`${styleId} ${subjectType} ${notes}`);
    if(safety.status==="rejected")return json({error:"This request is not a fit for Recast Me's good-will content policy.",safety,stage:"safety"},422);
    if(safety.status==="review")return json({reviewRequired:true,safety,message:"This request needs human approval before generation.",stage:"safety"},202);

    const inputFiles=[];
    for(let i=0;i<4;i++){
      const file=incoming.get(`image_${i}`);
      if(file instanceof File&&file.size>0){
        if(!file.type.startsWith("image/"))return json({error:"Uploads must be images.",stage:"validate-input"},400);
        if(file.size>2_000_000)return json({error:"Each prepared image must be under 2 MB.",stage:"validate-input"},400);
        inputFiles.push(file)
      }
    }
    if(!inputFiles.length)return json({error:"Upload at least one photo.",stage:"validate-input"},400);

    const makeForm=(prompt)=>{
      const form=new FormData();
      form.append("prompt",prompt);form.append("width","512");form.append("height","512");
      inputFiles.forEach((file,i)=>form.append(`input_image_${i}`,file,file.name||`reference-${i}.jpg`));
      return form
    };

    const primary=String(env.IMAGE_MODEL_PRIMARY||DEFAULT_PRIMARY);
    const fallback=String(env.IMAGE_MODEL_FALLBACK||DEFAULT_FALLBACK);
    const steps=Math.max(8,Math.min(32,Number(env.IMAGE_PREVIEW_STEPS||20)));

    stage="ai-generation";
    let raw,modelUsed=primary,usedSafeRetry=false,usedFastFallback=false;
    try{
      raw=await runModel(makeForm(makePrompt(styleId,subjectType,notes,inputFiles.length)),env,primary,steps)
    }catch(error){
      if(isModeration(error)){
        stage="ai-safe-retry";usedSafeRetry=true;
        try{raw=await runModel(makeForm(safePrompt(styleId,subjectType,inputFiles.length,notes)),env,primary,steps)}
        catch(retry){
          if(isModeration(retry))return json({error:"The image provider declined this photo/request combination. Try another photo or a simpler original direction.",stage:"ai-moderation",code:3030},422);
          throw retry
        }
      }else if(isTransient(error)&&fallback&&fallback!==primary){
        stage="ai-fast-fallback";usedFastFallback=true;modelUsed=fallback;
        raw=await runModel(makeForm(makePrompt(styleId,subjectType,notes,inputFiles.length)),env,fallback,4)
      }else throw error
    }

    const image=normalizeBase64(raw);
    if(!image||image.length<100)throw new Error("Image model returned malformed image data.");

    stage="storage";
    const requestId=`RC-${Date.now().toString(36).toUpperCase()}-${randomHex(3).toUpperCase()}`;
    const accessToken=randomHex(32);
    const stored=await store(env,{requestId,accessToken,styleId,subjectType,notes,inputs:inputFiles,image,safety,modelUsed});

    return json({ok:true,requestId,accessToken,style:STYLES[styleId]?.name||STYLES.game.name,image:`data:image/jpeg;base64,${image}`,persisted:stored.persisted,storageError:stored.storageError,modelUsed,usedSafeRetry,usedFastFallback});
  }catch(error){
    return json({error:error?.message||String(error)||"Unexpected image error.",stage},500)
  }
}

export function modelStatus(env){
  const primary=String(env.IMAGE_MODEL_PRIMARY||DEFAULT_PRIMARY);
  const fallback=String(env.IMAGE_MODEL_FALLBACK||DEFAULT_FALLBACK);
  return json({ok:true,primary,fallback,steps:Number(env.IMAGE_PREVIEW_STEPS||20),label:primary.includes("flux-2-dev")?"FLUX.2 Dev":primary})
}
