import {ADVENTURE_GUIDES,adventureMode} from '../public/adventure-guides.js';
export const CUSTOMER_IDENTITY_VERSION='nano-identity-adventures-v6';
export function customerNano(env){return env.RECAST_HQ_SELECTED_MODEL!=='flux-2-dev'&&env.FAL_CUSTOMER_MODEL==='nano-banana'&&env.RECAST_OWNER_PILOT_REQUEST!=='true'&&env.RECAST_HQ_SELECTED_PROVIDER==='fal';}
export function customerIdentityPrompt({styleId,subjectType='auto',notes='',customWorld='',hasBranch=false}){
 const guide=ADVENTURE_GUIDES[styleId];
 const subject={pet:'Include only the main pets; omit incidental people and supporting hands.',person:'Include only the main person; omit incidental people and animals.',group:'Include the main group of people; omit incidental background figures.',couple:'Include the two main people.',family:'Include the main family members.','person and pet':'Include the main people and pets together.'}[subjectType]||'Include the main people and pets with visible reference faces. Exclude faceless supporting figures; never invent their faces.';
 const outfit=guide?(subjectType==='pet'?guide.pet:['person','group','couple','family'].includes(subjectType)?guide.person:`Animals: ${guide.pet}. People: ${guide.person}.`):'Follow the requested transformation.';
 const background=guide?.scene||String(customWorld).trim().slice(0,800);
 if(!background)throw Object.assign(Error('Choose a style or describe your world.'),{reason:'input'});
 return [
 'Edit the uploaded photograph. Preserve each retained face: eye shape and spacing, nose or muzzle, mouth, jaw, ears, hairline, skin tone, fur colors and marking boundaries, natural age and expression.',subject,
 'Keep original head angle, gaze, pose and framing. Fit outfits to existing anatomy; pets retain animal bodies and paws.',
 'Replace the background and dress only included subjects. Remove excluded supporting figures and hands; fill their areas naturally, preserving included subjects and limbs.',
 'Outfit: '+(guide?outfit:String(notes).trim().slice(0,1200)||outfit),'Background: '+background,
 guide?.look?'Finish: '+guide.look:'',
 guide&&adventureMode(styleId)==='illustration'?'Preserve facial proportions in the chosen illustration style.':'',
 hasBranch?'Original photos define identity; the last image supplies artwork continuity only.':'',
 guide&&notes?'Details: '+String(notes).trim().slice(0,1200):'',
 'Faces stay unobstructed. Plain unbranded outfits. Include each subject once; no added characters or lettering.'
 ].filter(Boolean).join(' ');
}
