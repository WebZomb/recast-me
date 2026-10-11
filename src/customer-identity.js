import {ADVENTURE_GUIDES,adventureMode} from '../public/adventure-guides.js';
export const CUSTOMER_IDENTITY_VERSION='nano-identity-adventures-v5';
export function customerNano(env){return env.FAL_CUSTOMER_MODEL==='nano-banana'&&env.RECAST_OWNER_PILOT_REQUEST!=='true'&&env.RECAST_HQ_SELECTED_PROVIDER==='fal';}
export function customerIdentityPrompt({styleId,subjectType='auto',notes='',customWorld='',hasBranch=false}){
 const guide=ADVENTURE_GUIDES[styleId];
 const subject={pet:'Include only the main pets; omit incidental people and supporting hands.',person:'Include only the main person; omit incidental people and animals.',group:'Include the main group of people; omit incidental background figures.',couple:'Include the two main people.',family:'Include the main family members.','person and pet':'Include the main people and pets together.'}[subjectType]||'For people and animals, include only those with a face visible in the original photos. Never invent a face for a cropped torso, arm or hand; keep faceless supporting figures out of the portrait.';
 const outfit=guide?(subjectType==='pet'?guide.pet:['person','group','couple','family'].includes(subjectType)?guide.person:`For included animals: ${guide.pet}. For included people with visible reference faces: ${guide.person}. Apply only to included subjects.`):'Follow the requested transformation.';
 const background=guide?.scene||String(customWorld).trim().slice(0,800);
 if(!background)throw Object.assign(Error('Choose a style or describe your world.'),{reason:'input'});
 return ['Edit the original photograph. Preserve each retained face, eyes, nose or muzzle, mouth, ears, markings, age, expression and head angle. Do not beautify or mature the face.',subject,
 'Change outfits and background; remove only excluded figures completely, including their torsos, clothing, arms and hands. Preserve included subjects and their limbs. Reconstruct only newly exposed areas with clothing or the chosen scene. Preserve original pose, camera angle and close framing; do not zoom out or invent a standing pose. Animals retain natural anatomy and paws.',
 'When removing a supporting figure, frame a close head-and-upper-body portrait with the original head tilt, gaze and expression. Crop the lower body out instead of inventing legs or a seated pose. Keep every included face in frame.',
 'Outfit: '+outfit,'Background: '+background,
 guide?.look?'Finish: '+guide.look:'',guide&&adventureMode(styleId)==='illustration'?'Use the chosen illustration style while keeping distinctive facial proportions.':'',
 hasBranch?'Original photos define identity; the last image is previous artwork for continuity, not a new face.':'Use original photos as identity references; do not duplicate subjects.',
 notes?'Details: '+String(notes).trim().slice(0,1200):'',
 'Keep faces prominent and unobstructed; show the setting behind them. Use plain unbranded clothing without badges or symbols. No added people, pets, lettering or logos.'].filter(Boolean).join(' ');
}
