// RM116: Both fal FLUX.2 High Quality and Cloudflare HQ backup use the same
// short identity-first text as Standard. No backend/model/credit changes.
import {makeIdentityFirstAdventurePrompt} from './identity-first-adventure-prompt.js';
export function makeFalCompactPrompt(options={}){
 return makeIdentityFirstAdventurePrompt(options);
}
