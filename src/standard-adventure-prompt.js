// Same accepted identity/outfit/scene recipe as HQ; transport settings stay model-specific.
import {customerIdentityPrompt} from './customer-identity.js';
export function makeStandardAdventurePrompt({referenceGuide='',notes='',...options}={}){
 return customerIdentityPrompt({...options,notes:[referenceGuide,notes].filter(Boolean).join(' ')});
}
