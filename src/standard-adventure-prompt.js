// Short, front-loaded prompt tailored to Cloudflare FLUX.2 Klein (Standard).
// The former Standard path reused a 5k+ character High Quality prompt, pushing
// the actual adventure/world instruction too far back for a smaller editor.
// This module ONLY changes prompt text; models, settings, credits, and retries are untouched.
import {ADVENTURE_GUIDES,adventureMode} from '../public/adventure-guides.js';

const short=(x,max=800)=>String(x||'').trim().slice(0,max);
function roles(subject){
 const type=short(subject,100).toLowerCase();
 return {
  pet:/pet|dog|cat|puppy|kitten|horse|animal/.test(type),
  person:/person|couple|family|friend|group|child|teen|baby|memorial|me\b/.test(type),
  car:/car|vehicle|truck|motorcycle|bike/.test(type)
 };
}
export function makeStandardAdventurePrompt({styleId,subjectType='person',notes='',referenceGuide='',customWorld='',inputCount=1,hasBranch=false}={}){
 const guide=ADVENTURE_GUIDES[styleId]||null;
 const role=roles(subjectType),kind=guide?adventureMode(styleId):'photograph';
 const setting=guide?.scene||short(customWorld,700);
 if(!setting)throw Object.assign(new Error('A location or world is required for Standard rendering.'),{reason:'input'});
 const look=guide?.look||(kind==='illustration'?'original hand-painted illustration':'photoreal commercial/editorial portrait');
 const outfit=guide?[
   role.pet?'PETS: '+guide.pet+'.':'',
   role.person?'PEOPLE: '+guide.person+'.':'',
   role.car?'VEHICLE: Preserve its exact defining silhouette; reinterpret paint and reflections for the scene, no human clothing.':'',
   !role.pet&&!role.person&&!role.car?'Dress each actual subject for the selected world; keep any animal’s natural body.':''
 ].filter(Boolean).join(' '):'Adapt costumes, accessories and lighting visibly to the custom world.';
 const original=hasBranch
  ?'Original reference photos define identities. The last image is a previous Recast for continuity, NOT a reason to keep its old background.'
  :inputCount>1?'Use all reference photos to identify requested subjects without duplicating the same person or animal.'
  :'Photo 0 is the identity reference, NOT a background template.';
 // An image *edit*, not a license to invent a replacement pet. Give identity
 // priority BEFORE the scene, while keeping the new environment early enough
 // for the lighter Standard Klein model to visibly change the adventure.
 const opening=kind==='illustration'
   ?'EDIT THE UPLOADED PHOTO(S) into one ORIGINAL ILLUSTRATION of the EXACT SAME real subjects. Stylize the artwork, not the subjects’ unique facial anatomy.'
   :'EDIT THE UPLOADED PHOTO(S) into one PHOTOREALISTIC ADVENTURE PORTRAIT of the EXACT SAME real subjects. Do NOT invent a different pet, generic lookalike, or redesigned face.';
 const identityFirst=role.pet&&role.person
   ?'IDENTITY FIRST: Keep EACH person’s actual face and EACH pet’s actual head, eyes, ear proportions, muzzle shape, nose, coat patches and natural body. Do not substitute new people or animals. Keep the original head angles and expressions as closely as possible.'
   :role.pet
   ?'IDENTITY FIRST: This is the SAME pet from the reference. Preserve its recognizable face and head almost unchanged: original eye shape and spacing, ear length and tilt, muzzle width and nose, expression, coat-patch placement and head direction. Do not redesign the skull, switch breed, enlarge the ears, or substitute a lookalike.'
   :role.person
   ?'IDENTITY FIRST: These are the SAME people from the reference, not replacements. Keep each person’s real facial geometry, eyes, nose, mouth, hairline, skin tone, expression, age and head orientation as close to the photo as possible.'
   :role.car
   ?'IDENTITY FIRST: Keep the SAME actual vehicle from the reference, with its recognizable body silhouette, grille, lights, wheels, trim, paint details and camera angle.'
   :'IDENTITY FIRST: Keep the same actual reference subject, distinctive shapes, colors and natural proportions; never substitute a generic lookalike.';
 const identity='ALL-WORLD LIKENESS: Keep the same real subjects. Animals must retain EXACT original muzzle, eye spacing, ear size and angles, fur length, leg proportions and every coat color patch. Preserve their observed head view on the same anatomical side; do not invent a different face or stock anime face. Even in a drawn style, reduce the exaggeration of eyes, ears and muzzle and keep relative light/dark contrast of markings. Real pets stay four-legged with real paws, never human hands or human bodies. People keep the actual face, age, build and natural expression.';
 const direction=short(notes,850);
 const references=short(referenceGuide,520);
 const prompt=[
  opening,
  identityFirst,
  'REPLACE THE WHOLE ORIGINAL BACKGROUND. The camera is NOW '+setting+'. Never show the original garden, driveway, yard, furniture or room unless explicitly requested by the customer.',
  'WORLD-SPECIFIC COSTUME AND DETAILS: '+outfit,
  'FINAL VISUAL FINISH: '+look+'.',
  direction?'CUSTOMER DIRECTION: '+direction+'.':'',
  identity,
  original,
  references?'REFERENCE ROLES: '+references+'.':'',
  'Keep the reference subject’s facial structure and natural pose; change the world AROUND them. Fit adventure clothes around the neck/body without covering recognizable face, eyes or ears. Use coherent shadows, perspective and scene lighting. Do not leave the original background or paste an unchanged yard cutout.',
  'No recognizable franchise designs, famous characters, team/brand logos, illegible text, duplicate limbs or inappropriate content.'
 ].filter(Boolean).join(' ');
 return prompt;
}
