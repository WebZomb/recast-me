// Explicit authenticated Model Lab experiments only; never a public model selector.
export const OWNER_IDENTITY_MODELS=Object.freeze({
 'dev-edit':Object.freeze({endpoint:'fal-ai/flux-2/edit',queueRoot:'fal-ai/flux-2',label:'FLUX.2 dev · edit recipe'}),
 'nano-banana':Object.freeze({endpoint:'fal-ai/nano-banana/edit',queueRoot:'fal-ai/nano-banana',label:'Nano Banana · original'})
});
export function ownerIdentityModel(env){
 if(env.RECAST_OWNER_PILOT_REQUEST!=='true'||!env.RECAST_OWNER_IDENTITY_MODEL)return null;
 const candidate=OWNER_IDENTITY_MODELS[env.RECAST_OWNER_IDENTITY_MODEL];
 if(!candidate)throw Object.assign(new Error('Unsupported owner comparison.'),{reason:'input'});
 return candidate;
}
export const OWNER_IDENTITY_PROMPT_VERSION='owner-identity-edit-v1';
export function ownerIdentityPrompt({notes='',customWorld=''}={}){
 return [
  'Edit this photograph. Keep the original foreground subject, face, head angle, expression, age and proportions unchanged.',
  'Preserve the eyes, nose, mouth or muzzle, ears, hair or fur, and the exact boundaries of facial markings. A puppy must retain its original youthful face.',
  'Change the outfit and background only. Fit clothing to the photographed anatomy; animals keep animal bodies and paws. A supporting cropped hand is not another portrait subject.',
  'Requested outfit: '+String(notes).trim().slice(0,1200)+'.',
  'New background: '+String(customWorld).trim().slice(0,800)+'.',
  'Keep the original pose and a close view of the face. Match surrounding light and shadows naturally. No additional subjects, text or logos.'
 ].join(' ');
}
