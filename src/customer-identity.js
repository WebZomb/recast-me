import {ADVENTURE_GUIDES,adventureMode} from '../public/adventure-guides.js';
export const CUSTOMER_IDENTITY_VERSION='nano-identity-adventures-v1';
export function customerNano(env){return env.FAL_CUSTOMER_MODEL==='nano-banana'&&env.RECAST_OWNER_PILOT_REQUEST!=='true'&&env.RECAST_HQ_SELECTED_PROVIDER==='fal';}
export function customerIdentityPrompt({styleId,subjectType='auto',notes='',customWorld='',hasBranch=false}){
 const guide=ADVENTURE_GUIDES[styleId];
 const subject={pet:'Include only the main pets; omit incidental people and supporting hands.',person:'Include only the main person; omit incidental people and animals.',group:'Include the main group of people; omit incidental background figures.',couple:'Include the two main people.',family:'Include the main family members.','person and pet':'Include the main people and pets together.'}[subjectType]||'Keep the main photographed subjects; a cropped supporting hand is not an additional portrait subject.';
 const outfit=guide?(subjectType==='pet'?guide.pet:['person','group','couple','family'].includes(subjectType)?guide.person:`For existing animals: ${guide.pet}. For existing people: ${guide.person}. Apply only to subjects present.`):'Follow the requested transformation.';
 const background=guide?.scene||String(customWorld).trim().slice(0,800);
 if(!background)throw Object.assign(Error('Choose a style or describe your world.'),{reason:'input'});
 return ['Edit the original photograph. Preserve each retained face, eyes, nose or muzzle, mouth, ears, markings, age, expression and head angle. Do not beautify or mature the face.',subject,
 'Change outfit and background. Keep the original pose and natural anatomy; animals retain animal bodies and paws.',
 'Outfit: '+outfit,'Background: '+background,
 guide?.look?'Finish: '+guide.look:'',guide&&adventureMode(styleId)==='illustration'?'Use the chosen illustration style while keeping distinctive facial proportions.':'',
 hasBranch?'Original photos define identity; the last image is previous artwork for continuity, not a new face.':'Use original photos as identity references; do not duplicate subjects.',
 notes?'Details: '+String(notes).trim().slice(0,1200):'',
 'Keep faces prominent and unobstructed. No added people, pets, lettering or logos.'].filter(Boolean).join(' ');
}
