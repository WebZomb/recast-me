// RM116: Keep the Standard API stable; share the *same compact identity-first*
// recipe as High Quality for every adventure. The model is still Klein 9B.
import {makeIdentityFirstAdventurePrompt} from './identity-first-adventure-prompt.js';
export function makeStandardAdventurePrompt(options={}){
 return makeIdentityFirstAdventurePrompt(options);
}
