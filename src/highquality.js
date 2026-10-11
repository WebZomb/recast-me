import {moderateContent,screenText,CONTENT_MESSAGE} from './content-safety.js';
import {makeFalCompactPrompt} from './fal-prompt.js';
import {makeStandardAdventurePrompt} from './standard-adventure-prompt.js';
import {referenceDirections} from './reference-labels.js';
import { assertRenderReady, readinessSnapshot, recordRenderHealth } from './render-health.js';
const PROMPT_VERSION = "identity-first-48-worlds-v1";
const DEFAULT_HIGH_QUALITY = "@cf/black-forest-labs/flux-2-dev";
const DEFAULT_QUICK = "@cf/black-forest-labs/flux-2-dev";

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
Object.assign(STYLES,{
 "animated-sitcom":{name:"Animated Sitcom",prompt:"original prime-time animated sitcom portrait, clean graphic shapes, expressive features, bright comedy environment, no copied characters or franchise references"},
 "cutout-comedy":{name:"Cutout Comedy",prompt:"original paper-cut animation comedy portrait, handmade layered-paper texture, simple expressive shapes, no copied character designs"},
 anime:{name:"Anime Adventure",prompt:"original cinematic anime-inspired portrait, expressive linework, detailed painted background and dynamic light, no copied characters or franchise references"},
 storybook:{name:"Storybook",prompt:"warm original illustrated storybook portrait, painterly texture, whimsical scenery and gentle cinematic light"},
 football:{name:"Football Gameday",prompt:"original football gameday portrait, stadium lights, custom unbranded uniform and colors, no real team logos or trademarks"},
 basketball:{name:"Basketball Arena",prompt:"original basketball arena portrait, courtside energy, custom unbranded jersey and colors, no real team logos or trademarks"},
 baseball:{name:"Baseball Ballpark",prompt:"original baseball portrait, classic ballpark atmosphere, custom unbranded uniform and colors, no real team logos or trademarks"},
 soccer:{name:"Soccer Stadium",prompt:"original soccer match-night portrait, stadium atmosphere, custom unbranded kit and colors, no real club logos or trademarks"},
 seventies:{name:"1970s",prompt:"authentic 1970s editorial portrait, warm film color, period fashion, vintage interiors and cinematic period detail"},
 nineties:{name:"1990s",prompt:"authentic 1990s editorial portrait, bold period fashion, flash photography, colorful graphic energy and nostalgic detail"},
 y2k:{name:"Y2K / 2000s",prompt:"early-2000s pop editorial portrait, chrome details, flash photography and playful futuristic nostalgia"},
 "space-opera":{name:"Space Opera",prompt:"original galaxy-spanning cinematic adventure, spacecraft, alien skies and heroic unbranded sci-fi wardrobe, no franchise references"},
 "wizard-academy":{name:"Wizard Academy",prompt:"original magical academy world, elegant robes, ancient halls, floating lights and enchanted atmosphere, no franchise references"},
 "dinosaur-adventure":{name:"Dinosaur Adventure",prompt:"original cinematic prehistoric expedition, lush jungle, distant dinosaurs and adventurous wardrobe"},
 "spy-thriller":{name:"Spy Thriller",prompt:"original elegant secret-agent cinema, tailored wardrobe, dramatic city night and sleek intrigue, no franchise references"},
 western:{name:"Wild West",prompt:"original cinematic western portrait, frontier-town atmosphere, period wardrobe and golden-hour dust"},
 pirate:{name:"Pirate Adventure",prompt:"original high-seas adventure portrait, period pirate styling, dramatic ship deck and storm-lit horizon"},
 noir:{name:"Film Noir",prompt:"classic black-and-white detective cinema, rain-slick streets, dramatic shadows and timeless wardrobe"},
 christmas:{name:"Holiday Magic",prompt:"warm original holiday portrait, elegant seasonal decor, twinkle lights and cozy cinematic glow"},
 valentine:{name:"Valentine",prompt:"romantic original portrait, refined pink-red light, flowers and premium editorial styling"},
 birthday:{name:"Birthday Celebration",prompt:"colorful premium birthday portrait, tasteful balloons, confetti and celebratory studio lighting"},
 rockstar:{name:"Rock Star",prompt:"original premium rock-concert portrait, dramatic stage lights, expressive performance styling, no real artist likenesses or logos"},
 popstar:{name:"Pop Star",prompt:"original polished pop-editorial portrait, colorful stage lighting, album-cover composition, no real artist likenesses or logos"},
 dj:{name:"DJ Night",prompt:"original premium club portrait, DJ decks, lasers and sophisticated nightlife atmosphere, no brand logos"},
 "red-carpet":{name:"Red Carpet",prompt:"luxury premiere-night portrait, refined fashion, flash photography and cinematic arrival atmosphere"},
 beach:{name:"Beach Escape",prompt:"premium golden-hour coastal portrait, tasteful resort styling, natural ocean light and relaxed travel-editorial atmosphere"},
 paris:{name:"Paris Getaway",prompt:"elegant European travel portrait, café streets and classic architecture, cinematic editorial light without copied film references"},
 tropical:{name:"Tropical Paradise",prompt:"premium tropical travel portrait, lush palms, turquoise water, vibrant natural light and refined resort styling"},
 luxury:{name:"Luxury Life",prompt:"high-end editorial portrait, modern architecture, refined wardrobe and premium dramatic lighting"},
 astronaut:{name:"Astronaut Mission",prompt:"original realistic astronaut mission portrait, unbranded space gear, spacecraft details and planetary cinematic light"},
 firefighter:{name:"Firefighter Hero",prompt:"respectful original firefighter portrait, professional protective gear, station atmosphere and cinematic light, nonviolent scene"},
 chef:{name:"Master Chef",prompt:"premium culinary portrait, professional chef styling, elegant kitchen and warm editorial lighting"},
 pilot:{name:"Pilot",prompt:"original aviation portrait, professional flight styling, aircraft atmosphere and cinematic sky light, no airline logos"},
 "ancient-egypt":{name:"Ancient Egypt",prompt:"original historical-inspired portrait, monumental ancient Egyptian architecture, rich period-inspired textiles and desert light"},
 roman:{name:"Ancient Rome",prompt:"original ancient-Rome-inspired portrait, classical architecture, period-inspired wardrobe and cinematic Mediterranean light"},
 medieval:{name:"Medieval Kingdom",prompt:"original medieval kingdom portrait, castle environment, period-inspired clothing, banners and dramatic torchlight"},
 renaissance:{name:"Renaissance Portrait",prompt:"museum-inspired Renaissance portrait, period fashion, rich painterly texture and old-master lighting"},
 "tiny-world":{name:"Tiny World",prompt:"playful original miniature-world illusion, subject appears tiny inside an oversized everyday environment, photoreal cinematic scale"},
 "giant-world":{name:"Giant World",prompt:"playful original cinematic scale illusion, subject towers over an invented miniature city, non-destructive whimsical scene"},
 "food-world":{name:"Food Fantasy",prompt:"whimsical original fantasy environment built from colorful food, candy or dessert-inspired scenery, polished storybook realism"}
});

const SUBJECT_STYLING = {
  game:"original action-adventure protagonist styling: a clearly visible custom costume or heroic pet harness, distinctive accessories and an active pose integrated into the cinematic world",
  halloween:"an unmistakable playful original Halloween costume fitted to the subject, with characterful accessories and theatrical moonlit lighting",
  retro:"a recognizable 1980s inspired wardrobe or pet accessory, period styling and a new expressive editorial pose",
  fantasy:"original ornate fantasy armor or pet barding shaped naturally around the body, a heroic pose and enchanted light on the subject",
  luxury:"a refined pet-safe bow tie or tailored accessory on the unchanged animal, an elegant modern interior and soft editorial lighting; luxury describes the surroundings and fabric, never a different breed or face",
  royal:"rich ceremonial clothing or a fitted regal pet cape and collar, a poised royal portrait stance and painterly light on the subject",
  future:"sleek original futuristic clothing or fitted pet gear, futuristic details on the subject and neon light reflecting across them",
  comic:"an original graphic-novel hero costume or fitted pet hero gear, expressive dynamic pose and inked color treatment on the subject",
  space:"an original space-explorer suit or pet-safe fitted space harness, clear astronaut details and cinematic planet light on the subject"
};

function subjectTransformation(styleId,subjectType){
  const subject=String(subjectType||"person").toLowerCase();
  const isPet=["pet","dog","cat","puppy","kitten","horse","animal"].some(value=>subject.includes(value));
  const isCar=["car","truck","vehicle","motorcycle","bike"].some(value=>subject.includes(value));
  const isPerson=["person","couple","family","friends","group","child","teen","baby","memorial"].some(value=>subject.includes(value));
  const theme=SUBJECT_STYLING[styleId]||"an original costume, role and visual styling drawn directly from the customer's custom world";
  return [
    `VISIBLE SUBJECT TRANSFORMATION REQUIRED: ${theme}.`,
    isPet?"PET IDENTITY IS NON-NEGOTIABLE: costume and environment may change, but the animal itself must not be redesigned. Preserve the exact head and muzzle shape, ear size/shape/angle, eye size/spacing/color, nose, expression character, breed/body proportions, leg length, fur length/texture, and the exact boundaries and placement of every coat-color patch and facial marking from the reference. Do not widen or shorten the muzzle, enlarge the eyes, round the skull, change ear proportions, invent spots, or turn the pet into a generic/cuter/cartoon version. Fit costume around the real anatomy without hiding the defining face or markings. The finished pet should be identifiable from the face and coat even if the costume/background are removed. Transform the costume, setting and lighting around the same animal. Preserve the observed head angle and muzzle profile when only one view is supplied; do not invent an unseen front-facing face. Do not add a dark eye mask, white blaze, wrinkles, jowls or a flat muzzle unless present in the original. Ignore toys, prints on clothing and background animals as identity references. Natural likeness takes precedence over a dramatic pose. Match scene lighting and shadows so the result should never appear as an unchanged photo cutout.":"",
    "ANATOMY RULE: for every animal visible in any reference, retain its species anatomy: natural animal torso, legs and paws. Never give a pet human hands, fingers, arms, shoulders or an upright human body unless explicitly requested. Royal pets wear fitted capes, collars or crowns on their real animal bodies; royal styling is not a dog head on a human monarch.",
    isCar?"For the car, visibly restyle its paint, lighting and original unbranded trim to fit the world, while retaining its recognizable silhouette and defining features.":"",
    isPerson?"For each person, visibly change their wardrobe, character role, pose only where supported by the reference views and the lighting on their face while preserving their recognizable face, natural age and proportions.":"",
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
function isTemporaryUnavailable(error){const m=errorText(error);return /\b3043\b/.test(m)||m.includes("503")||m.includes("502")||m.includes("504")||m.includes("service unavailable")||m.includes("upstream unavailable")}
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

export async function verifyTurnstile(env,token,ip,{action,hostname}={}){
  const configured=Boolean(env.TURNSTILE_SECRET_KEY||env.TURNSTILE_SITE_KEY||String(env.TURNSTILE_REQUIRED)==="true");
  if(!configured)return {success:true,disabled:true};
  if(!env.TURNSTILE_SECRET_KEY||!env.TURNSTILE_SITE_KEY)return {success:false,error:"not-configured"};
  if(typeof token!=="string"||!token||token.length>2048)return {success:false,error:"invalid-token"};
  if(!action||!hostname)return {success:false,error:"missing-context"};
  const body=new URLSearchParams({secret:String(env.TURNSTILE_SECRET_KEY),response:token});
  if(ip)body.set("remoteip",ip);
  try{
    const response=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body,signal:AbortSignal.timeout(10000)});
    if(!response.ok)return {success:false,error:"provider-unavailable"};
    const data=await response.json();
    if(data?.success!==true)return {success:false,error:"invalid-token"};
    if(data.action!==action||data.hostname!==hostname)return {success:false,error:"context-mismatch"};
    return {success:true};
  }catch{return {success:false,error:"provider-unavailable"};}
}

function assess(text=""){
  if(screenText(text).status==="rejected")return {status:"rejected",reasons:["content_policy"]};
  const value=String(text).toLowerCase();
  const reject=AUTO_REJECT.filter(t=>new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,"i").test(value));
  if(reject.length)return{status:"rejected",reasons:reject};
  const review=REVIEW_TERMS.filter(t=>new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,"i").test(value));
  const ip=IP_MARKERS.filter(t=>new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,"i").test(value));
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

// Shared by both quality modes and the simplified prompt path; applies even
// when a mixed group or custom subject label does not contain "pet"/"person".
const IDENTITY_STYLE_RULES = [
  "ALL-WORLD LIKENESS: use the original photographs as the authority for identity, never a generic character, breed template, or previous render's altered features. Preserve distinguishing asymmetries and visible identifying details for every person and animal, including mixed groups.",
  "PEOPLE: keep the reference eye shape, eyelids and spacing, brows, nose bridge and tip, mouth and lip shape, cheekbones, jaw and chin, skin tone, natural age, hairline, hair texture and facial hair. Retain visible freckles and distinguishing marks. Do not beautify, smooth away identity, enlarge eyes, narrow the nose or jaw, or substitute a stock anime face.",
  "PETS: retain the reference skull and muzzle profile, ear shape and angle, eye spacing, nose, whisker area, fur texture and length, and body proportions. Keep each coat patch, blaze, spot and color boundary on the same anatomical side; do not mirror, simplify away, or invent markings.",
  "STYLIZED WORLDS: anime, comic, animation, cutout and painted styles change linework, shading, texture, costume and scenery, not the subject's defining facial geometry or marking layout. If exaggerated style would weaken likeness, reduce the exaggeration. For monochrome styles, retain marking boundaries and relative light/dark contrast. Colored scene light must not obscure identifying details.",
  "FACE VISIBILITY: keep the defining face, eyes, muzzle and ears unobstructed. Adapt helmets, crowns, hair and accessories around them. Preserve the observed head angle when no other view is supplied; do not invent unseen facial features. Likeness takes priority over a new pose or dramatic costume."
].join(" ");

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
    IDENTITY_STYLE_RULES,
    "PRIORITY 2: faithfully execute the customer's written direction without changing who the subject is.",
    userDirection?`CUSTOMER DIRECTION: ${userDirection}.`:"",
    refs,
    `Subject type: ${subjectType||"person"}.`,
    "REFERENCE RECONCILIATION: multiple photos can show the same individual. Use additional views to clarify identity, not to duplicate subjects. A pet shown alone and with a person is the same pet when its features match. Include only the requested subjects. Preserve each person’s face, natural age, hair and beard, body build and each animal’s markings; never blend identities.",
    "This is a transformation, not a retouch. Create a clearly new scene rather than recreating the source photograph.",
    "IDENTITY LOCK: preserve facial geometry, eye shape and spacing, eyebrows, nose, mouth, jawline, skin tone, natural age, hair color and hairline, body proportions, pet breed, exact pet head/muzzle/ear proportions and exact coat-marking boundaries, and vehicle silhouette/details. Never use a generic breed template in place of the referenced animal.",
    "The result must immediately read as the same real subject. Do not make the subject younger, older, thinner, heavier, more muscular, more glamorous, or generically attractive unless the customer explicitly requests it.",
    style?`SELECTED WORLD: ${style.name}. ${style.prompt}.`:"SELECTED WORLD: an original world designed from the customer's description.",
    customWorld?`CUSTOM WORLD SETTING (customer's priority): ${safeNotes(customWorld)}.`:"",
    subjectTransformation(styleId,subjectType),
    "Build the requested world around the recognizable subjects. Keep faces large enough to recognize, with complete heads and ears inside the frame. Keep the reference head angle when another view is unavailable, including a side profile. A polished profile portrait is preferable to an invented frontal face. Do not invent a new face to force a dramatic pose. Costume and setting provide the transformation; identity and body build stay faithful.",
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
    IDENTITY_STYLE_RULES,
    hasBranch?"Use the last image as the previous artwork, and earlier images for the real subject's identity.":inputCount>1?`Use all ${inputCount} reference photos as identity evidence; photo count is not subject count.`:"Preserve the reference subject exactly and recognizably; for pets lock head/muzzle/ear proportions, eye placement and exact coat markings before applying any style.",
    userDirection?`Customer direction, simplified but still important: ${userDirection}.`:"",
    `Subject type: ${subjectType||"person"}.`,
    "REFERENCE RECONCILIATION: multiple photos can show the same individual. Use additional views to clarify identity, not to duplicate subjects. A pet shown alone and with a person is the same pet when its features match. Include only the requested subjects. Preserve each person’s face, natural age, hair and beard, body build and each animal’s markings; never blend identities.",
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
  return {image:result.image,providerUsed:result.providerUsed||'cloudflare',providerRequestId:result.providerRequestId||null}
}

async function tryGeneration(env,model,prompt,inputFiles,kind,settings){
  // Do not race AI.run against a local timer. Promise.race does not cancel the
  // provider call, so the old 125s/60s timers could discard a late successful
  // result while the inference continued. Capacity is handled by rejectIfBusy;
  // genuine provider timeouts are classified from the provider error itself.
  const output=await runModel(makeForm(prompt,inputFiles,settings),env,model);
  return{
    image:output.image,
    providerUsed:output.providerUsed,
    providerRequestId:output.providerRequestId,
    modelUsed:model,
    attemptKind:kind,
    usedSafeRetry:kind.includes("safe"),
    usedFallback:kind.includes("fallback")
  }
}

async function generateHighQuality({env,model,styleId,subjectType,notes,customWorld,inputFiles,hasBranch}){
  // Both fal HQ and Cloudflare HQ fallback receive the SAME concise
  // identity-first prompt as Standard. Model settings and call count are fixed.
  const main=makeFalCompactPrompt({styleId,subjectType,style:STYLES[styleId],
    notes:safeNotes(notes),customWorld:safeNotes(customWorld),inputCount:inputFiles.length,hasBranch});
  const steps=Math.max(8,Math.min(30,Number(env.IMAGE_HIGH_QUALITY_STEPS||18)));
  const guidance=Math.max(1,Math.min(10,Number(env.IMAGE_HIGH_QUALITY_GUIDANCE||5)));
  const settings={width:1024,height:1280,guidance,steps};

  try{
    return await tryGeneration(env,model,main,inputFiles,"high-primary",settings)
  }catch(firstError){
    if(firstError?.reason==='pending')throw firstError;
    if(isQuota(firstError))throw Object.assign(new Error("quota"),{reason:"quota",code:3036,cause:firstError});
    if(isModeration(firstError))throw Object.assign(new Error("moderation"),{reason:"moderation",code:3030,cause:firstError});
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

async function generateQuick({env,model,styleId,subjectType,notes,referenceGuide='',customWorld,inputFiles,hasBranch}){
  const main=makeStandardAdventurePrompt({styleId,subjectType,notes,referenceGuide,inputCount:inputFiles.length,customWorld,hasBranch});
  const guidance=Math.max(1,Math.min(10,Number(env.IMAGE_QUICK_GUIDANCE||5)));
  const steps=Math.max(8,Math.min(30,Number(env.IMAGE_QUICK_STEPS||12)));
  const settings={width:768,height:960,guidance,steps:model.includes('flux-2-klein')?null:steps};

  let firstError;
  try{
    return await tryGeneration(env,model,main,inputFiles,"quick-primary",settings)
  }catch(error){firstError=error}

  if(isQuota(firstError))throw Object.assign(new Error("quota"),{reason:"quota",code:3036,cause:firstError});

  if(isModeration(firstError))throw Object.assign(new Error("moderation"),{reason:"moderation",code:3030,cause:firstError});
  if(isTimeout(firstError))throw Object.assign(new Error("timeout"),{reason:"timeout",cause:firstError});
  if(isCapacity(firstError))throw Object.assign(new Error("capacity"),{reason:"capacity",cause:firstError});
  if(isTemporaryUnavailable(firstError))throw Object.assign(new Error("unavailable"),{reason:"unavailable",cause:firstError});
  throw Object.assign(new Error("provider"),{reason:"provider",cause:firstError});
}

async function store(env,{requestId,accessToken,styleId,subjectType,notes,customWorld,parentRequestId,source,sourceTweet,qualityMode,inputs,image,previewMime,safety,modelUsed,attemptKind,providerUsed,promptVersion}){
  if(!env.ARTWORK)return{persisted:false,storageError:"ARTWORK binding is missing."};
  const now=new Date().toISOString();
  const metadata={creditWalletId:env.RECAST_CREDIT_WALLET?.id||null,requestId,accessToken,styleId,styleName:STYLES[styleId]?.name||"Custom World",subjectType,notes,customWorld,parentRequestId:parentRequestId||null,previewMime,source:source||"site",sourceTweet:sourceTweet||null,safety,status:"preview_ready",createdAt:now,updatedAt:now,inputCount:inputs.length,paid:false,fulfillment:"not_started",modelUsed,providerUsed:providerUsed||'cloudflare',attemptKind,qualityMode,promptVersion:promptVersion||PROMPT_VERSION};
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
    if(env.RENDER_RATE_LIMITER&&!trustedSocialJob){
      stage="rate-limit";
      const actor=env.RECAST_CREDIT_WALLET?.id||"uninitialized";
      const limited=await env.RENDER_RATE_LIMITER.limit({key:`render:${actor}`});
      if(!limited.success)return json({error:"render_rate_limited",userMessage:"Too many preview requests were sent at once. Wait a moment and try again.",reason:"rate_limit",retryable:true},429);
    }
    const incoming=await request.formData();stage="parse-form";
    if(!trustedSocialJob){
      stage="human-check";
      const verification=await verifyTurnstile(env,String(incoming.get("turnstileToken")||""),request.headers.get("CF-Connecting-IP")||"",{action:"recast",hostname:new URL(request.url).hostname});
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
    if(safety.status==="rejected")return json({error:"not_supported",userMessage:CONTENT_MESSAGE,reason:"policy"},422);
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
    let referenceGuide='';
    try{referenceGuide=referenceDirections(incoming.get('referenceLabels'),inputFiles.length,subjectType==='family'?incoming.get('subjectCount'):'');}
    catch(e){return json({error:'bad_reference_labels',userMessage:e.message,reason:'input'},400);}
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

    stage="content-screening";
    const inputSafety=await moderateContent(env,{text:`${notes} ${customWorld}`,images:inputFiles,required:env.RECAST_RENDER_SCOPE==='social'});
    safety.inputScreening=inputSafety;
    stage="readiness-preflight";
    try{await assertRenderReady(env,env.RECAST_RENDER_SCOPE==='social'?'social':qualityMode)}
    catch(gate){
      await writeAttemptReceipt(env,clientAttemptId,{status:'blocked',blockedAt:new Date().toISOString(),reason:gate.reason,stage,qualityMode,retryAt:gate.retryAt||null});
      const quota=gate.reason==='quota';
      const label=qualityMode==='quick'?'Standard Preview':'High-Quality Preview';
      const userMessage=gate.reason==='configuration'
        ?'Image creation is unavailable while Recast Me checks its required services. Your photo and settings are safe.'
        :quota
        ?'Recast Me has reached its shared AI capacity. Your settings are safe; try again after the cooldown.'
        :gate.reason==='timeout'
        ?`${label} is cooling down after a timeout. Your settings are safe; wait for the retry button to become available before trying again.`
        :gate.reason==='unavailable'
        ?`${label} is cooling down after a temporary provider error. Your settings are safe; wait for the retry button to become available before trying again.`
        :`${label} is cooling down after a confirmed busy response. Your settings are safe; wait for the retry button to become available before trying again.`;
      return json({error:quota?'shared_ai_capacity_used':'render_not_ready',reason:gate.reason,retryable:false,retryAt:gate.retryAt||null,qualityMode,userMessage},gate.status||503);
    }
    const highQualityModel=String(env.IMAGE_MODEL_HIGH_QUALITY||DEFAULT_HIGH_QUALITY);
    const quickModel=String(env.IMAGE_MODEL_QUICK||DEFAULT_QUICK);
    stage="ai-generation";
    const generated=qualityMode==="quick"
      ? await generateQuick({env,model:quickModel,styleId,subjectType,notes,referenceGuide,customWorld,inputFiles,hasBranch:Boolean(parentRequestId)})
      : await generateHighQuality({env,model:highQualityModel,styleId,subjectType,notes:[referenceGuide,notes].filter(Boolean).join(" "),customWorld,inputFiles,hasBranch:Boolean(parentRequestId)});
    const image=normalizeBase64(generated.image);
    if(!image||image.length<100)throw Object.assign(new Error("malformed"),{reason:"provider"});
    const previewMime=imageMime(image);

    await recordRenderHealth(env,env.RECAST_RENDER_SCOPE==='social'?'social':qualityMode,'success');
    stage="storage";
    const requestId=`RC-${Date.now().toString(36).toUpperCase()}-${randomHex(3).toUpperCase()}`;
    const accessToken=randomHex(32);
    safety.outputScreening=await moderateContent(env,{images:[new File([Uint8Array.from(atob(image),c=>c.charCodeAt(0))],"output",{type:previewMime})]});
    const stored=await store(env,{requestId,accessToken,styleId,subjectType,notes,customWorld,parentRequestId,source,sourceTweet,qualityMode,inputs:inputFiles,image,previewMime,safety,modelUsed:generated.modelUsed,providerUsed:generated.providerUsed,promptVersion:PROMPT_VERSION,attemptKind:generated.attemptKind});

    await writeAttemptReceipt(env,clientAttemptId,{status:"success",completedAt:new Date().toISOString(),durationMs:Date.now()-attemptStartedAt,requestId,qualityMode,modelUsed:generated.modelUsed,providerUsed:generated.providerUsed,providerRequestId:generated.providerRequestId,attemptKind:generated.attemptKind,persisted:stored.persisted});
    return json({ok:true,requestId,accessToken,style:STYLES[styleId]?.name||"Custom World",image:`data:${previewMime};base64,${image}`,persisted:stored.persisted,storageError:stored.storageError,qualityMode,qualityLabel:qualityMode==="quick"?"Standard Preview":"High-Quality Preview",modelUsed:generated.modelUsed,providerUsed:generated.providerUsed,usedSafeRetry:generated.usedSafeRetry,usedFastFallback:false,promptVersion:PROMPT_VERSION,clientAttemptId});
  }catch(error){
    const reason=error?.reason||"provider";
    if(['capacity','quota','timeout','unavailable'].includes(reason))await recordRenderHealth(env,env.RECAST_RENDER_SCOPE==='social'?'social':qualityMode,'failed',reason);
    const internal=error?.cause||error;
    const diagnosticId=await writeGenerationDiagnostic(env,{stage,reason,qualityMode,providerCode:providerCode(internal),providerMessage:String(internal?.message||internal||"").slice(0,500),highQuality:String(env.IMAGE_MODEL_HIGH_QUALITY||DEFAULT_HIGH_QUALITY),quick:String(env.IMAGE_MODEL_QUICK||DEFAULT_QUICK)});
    await writeAttemptReceipt(env,clientAttemptId,{status:"failed",failedAt:new Date().toISOString(),durationMs:Date.now()-attemptStartedAt,stage,reason,providerCode:providerCode(internal),diagnosticId,qualityMode});
    if(reason==="quota")return json({error:"shared_ai_capacity_used",code:3036,reason:"quota",retryable:false,diagnosticId,qualityMode,userMessage:"Recast Me has reached its shared AI capacity for today. This is a site-wide limit, not your personal render count. Your photo is safe, and nothing was charged."},429);
    if(reason==="content_policy"||reason==="content_screening_unavailable")return json({error:reason,reason,retryable:reason!=="content_policy",userMessage:error.message},error.status||503);
    if(reason==="moderation")return json({error:"generation_declined",code:3030,reason:"moderation",retryable:false,diagnosticId,qualityMode,userMessage:"This photo or request was declined by the image safety check. Choose a different, family-friendly photo or idea. Nothing was charged."},422);
    if(reason==="pending")return json({error:"generation_under_review",reason:"pending",retryable:false,diagnosticId,qualityMode,userMessage:"The image service accepted this request, but its result has not been confirmed. To avoid duplicate costs, please do not retry the same image while we review its status. Your previous saved previews are safe."},503);
    if(reason==="capacity")return json({error:"engine_busy",reason:"capacity",retryable:true,diagnosticId,qualityMode,userMessage:"The image engine returned a confirmed busy response. Your photo and settings are safe; wait for the retry button to become available before trying again."},503);
    if(reason==="timeout")return json({error:"engine_timeout",reason:"timeout",retryable:true,diagnosticId,qualityMode,userMessage:"The image provider timed out before returning the artwork. Your photo and settings are safe; wait for the retry button to become available before trying again."},504);
    if(reason==="unavailable")return json({error:"engine_unavailable",reason:"unavailable",retryable:true,diagnosticId,qualityMode,userMessage:"The image provider is temporarily unavailable. Your photo and settings are safe; wait for the retry button to become available before trying again."},503);
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
      quick:{label:"Standard Preview",model:quick,steps:quick.includes("flux-2-klein")?null:Number(env.IMAGE_QUICK_STEPS||12),guidance:Number(env.IMAGE_QUICK_GUIDANCE||5)}
    },
    defaultMode:"high",
    version:"v1.6",
    promptVersion:PROMPT_VERSION,
    availability:await readinessSnapshot(env)
  })
}
