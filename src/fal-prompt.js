// Concise, front-loaded FLUX.2 reference edit instructions.
import {ADVENTURE_GUIDES,adventureMode} from '../public/adventure-guides.js';
// Existing Cloudflare prompt remains unchanged until independently verified.
const ILLUSTRATED=new Set(['animated-sitcom','cutout-comedy','anime','storybook','comic']);
function safe(value,limit=1200){return String(value||'').trim().slice(0,limit)}
export function makeFalCompactPrompt({styleId,subjectType,style,notes='',customWorld='',inputCount=1,hasBranch=false}={}){
 const subject=safe(subjectType,80).toLowerCase(),pet=/pet|dog|cat|puppy|kitten|horse|animal/.test(subject);
 const person=/person|couple|family|friend|group|child|teen|baby/.test(subject);
 const vehicle=/car|vehicle|truck|motorcycle|bike/.test(subject);
 const guide=ADVENTURE_GUIDES[styleId]||null;
 const illustrated=guide?adventureMode(styleId)==='illustration':ILLUSTRATED.has(styleId);
 const visualMode=illustrated?'premium ORIGINAL professional illustration':'photorealistic luxury commercial/editorial PHOTOGRAPH';
 const outfits=guide?[
   pet?'Dress the pet in '+guide.pet+'.':'',
   person?'Dress the people in '+guide.person+'.':'',
   vehicle?'Keep the vehicle silhouette while changing the location, lighting and appropriate exterior details.':''
 ].filter(Boolean).join(' '):'';
 const scene=styleId==='custom'?safe(customWorld,800):
   guide?(style?.name||styleId)+': NEW SCENE '+guide.scene+'. '+guide.look+'. '+outfits:
   (style?.name||'Custom World')+': '+safe(style?.prompt||'',450);
 const subjectLabel=pet?'same real animal':vehicle?'same real vehicle':person?'same real person or people':'same original subject(s)';
 const refs=hasBranch?'Earlier photos define original identity. The last photo is the previous successful Recast used only for continuity.':
  inputCount>1?'Use all '+inputCount+' reference photos to identify the requested individuals. Do not duplicate subjects seen in multiple photos.':'Use input image 0 as the original identity reference.';
 const identity=pet?'Preserve EXACT original dog/animal: real skull and muzzle profile, natural eye size and spacing, ear shape and angle, nose, every fur color patch and marking in its correct location, fur texture, breed and natural four-legged anatomy. No cartoon facial exaggeration or human body. Fit clothing around its natural animal form.':
 vehicle?'Preserve the exact silhouette, proportions, defining trim and recognizable shape of the real vehicle.':
 'Preserve each actual person’s face, natural age, eye and nose shape, mouth, jaw, skin tone, hairline, expression, physique and distinct identity. Never substitute a generic face or exaggerate features.';
 const details=safe(notes,1200);
 const royal=styleId==='royal'&&pet&&!guide?'Make an elegant royal pet portrait in a grand ornate palace courtyard. A beautifully fitted embroidered regal cape and small tasteful crown must leave the actual animal face and ears unobstructed. Golden-hour light, realistic fur and coherent shadows.':'';
 const prompt=[
  'Create ONE '+visualMode+' of the '+subjectLabel+' in a NEW scene. The result must look unmistakably like the reference.',
  'SELECTED WORLD AND COSTUME: '+scene+'.',
  royal,
  details?'CUSTOMER DIRECTION: '+details+'.':'',
  refs,identity,
  'REPLACE THE ORIGINAL BACKGROUND completely with the selected adventure location. Transform clothing, setting and lighting around the exact original identity; integrate shadows, scale and perspective, not a pasted original cutout.',
  'Naturally believable anatomy, no duplicated limbs, no logos, watermarks, third-party characters or text.'
 ].filter(Boolean).join(' ');
 if(prompt.length>3400)throw Object.assign(new Error('Shorten the custom direction to keep subject identity accurate.'),{reason:'input'});
 return prompt;
}
