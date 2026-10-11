// RM116 — Shared concise identity-first prompt for EVERY 48-world render route.
// A prompt cannot guarantee a pixel-identical face; the reference image is the
// identity anchor. No extra visitor questions, external model calls or retries.
import {ADVENTURE_GUIDES,adventureMode} from '../public/adventure-guides.js';

const clean=(x,limit=1200)=>String(x||'').trim().slice(0,limit);
const roles=subject=>{
 const s=clean(subject,80).toLowerCase();
 return {
  auto:s==='auto'||s==='unknown'||s==='photo',
  pet:/pet|dog|cat|puppy|kitten|horse|animal/.test(s),
  person:/person|couple|family|friend|group|child|teen|baby|memorial|me\b/.test(s),
  vehicle:/car|vehicle|truck|motorcycle|bike/.test(s)
 };
};
export function compactIdentity(subjectType='person'){
 const role=roles(subjectType);
 const pet='Same actual pet: keep exact eyes, nose, muzzle, ear shape/angle, head view, expression, coat colors and marking positions. Retain natural anatomy and appearance; do not invent masculine/feminine traits.';
 const person='Same actual person or people: preserve EACH face, eyes, nose, mouth, jaw, hairline, skin tone, natural age and expression. No generic beauty face or invented gender changes.';
 const vehicle='Same real vehicle: keep its silhouette, grille, lights, wheels, trim, color and proportions.';
 if(role.auto)return 'IDENTITY FIRST: The ONLY main subjects are those actually photographed; do not invent a new person, pet, vehicle or companion. Keep the same recognizable eyes, nose/muzzle, ears, face shape, natural age, expression, fur markings or other unique features. A cropped hand or arm holding a pet is not a request to create a whole person. Use the uploaded photo as the identity anchor.';
 const parts=[role.pet&&pet,role.person&&person,role.vehicle&&vehicle].filter(Boolean);
 return 'IDENTITY FIRST: '+(parts.join(' ')||'Keep the exact real subject, its unique features, colors and proportions.');
}
export function makeIdentityFirstAdventurePrompt({
 styleId,subjectType='person',style=null,notes='',referenceGuide='',customWorld='',inputCount=1,hasBranch=false
}={}){
 const guide=ADVENTURE_GUIDES[styleId]||null;
 const illustrated=guide&&adventureMode(styleId)==='illustration';
 const setting=guide?.scene||clean(customWorld,800)||(style?.prompt?clean(style.prompt,500):'');
 if(!setting)throw Object.assign(new Error('Choose an adventure or describe your own world.'),{reason:'input'});
 const role=roles(subjectType);
 const costume=guide?[
  role.auto?'OUTFIT ALTERNATIVES for existing subjects ONLY: if the photographed subject is an animal, '+guide.pet+'; if a person, '+guide.person+'. Pick only the option fitting a real primary subject already in the photo, not a new character.':'',
  role.pet?'Pet outfit: '+guide.pet+'.':'',
  role.person?'People outfit: '+guide.person+'.':'',
  role.vehicle?'Vehicle: same recognizable body, scene-appropriate lighting and reflections.':'',
  !role.auto&&!role.pet&&!role.person&&!role.vehicle?'Dress the real subject for this world.':''
 ].filter(Boolean).join(' '):'Costume and styling fit the chosen world.';
 const refs=hasBranch
  ?'Original photos define identity; the last image is a previous Recast for continuity, not a new face.'
  :Number(inputCount)>1?'Multiple reference photos clarify identity; do not duplicate subjects.':'Use the original photo as the identity reference.';
 const all=[
  illustrated?'EDIT THE UPLOADED PHOTO(S) into one ORIGINAL ILLUSTRATION of the same real subjects.':'EDIT THE UPLOADED PHOTO(S) into one PHOTOREALISTIC ADVENTURE PORTRAIT of the same real subjects.',
  compactIdentity(subjectType),
  'WORLD: '+setting+'. '+costume,
  guide?.look?'FINISH: '+guide.look+'.':'',
  'CHANGE ONLY outfit, background, props and scene lighting; for illustration, change drawing style, NOT facial identity. Keep faces visible and original head angles. The original subject must be the clear, close foreground focus, not a tiny sidekick to an invented hero. REPLACE THE ORIGINAL BACKGROUND and match light and shadow; no obvious cutout.',
  role.pet||role.auto?'Real pets keep animal bodies and paws, never human hands or human torsos.':'',
  refs,
  referenceGuide?'PHOTO ROLES: '+clean(referenceGuide,520)+'.':'',
  notes?'CUSTOMER DETAILS: '+clean(notes,1200)+'.':'',
  'No copied characters, brand logos, extra limbs or unwanted lettering.'
 ].filter(Boolean).join(' ');
 if(all.length>3300)throw Object.assign(new Error('Please shorten extra instructions.'),{reason:'input'});
 return all;
}
