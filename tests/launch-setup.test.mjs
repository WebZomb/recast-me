import test from 'node:test';
import assert from 'node:assert/strict';
import {launchSetup} from '../src/launch-setup.js';
test('launch setup distinguishes absent and partial challenge configuration',()=>{
 assert.equal(launchSetup({},{} )[1].state,'Setup required');
 assert.match(launchSetup({TURNSTILE_SITE_KEY:'fixture'},{} )[1].state,/Incomplete/);
 assert.match(launchSetup({TURNSTILE_SITE_KEY:'fixture',TURNSTILE_SECRET_KEY:'private'},{} )[1].state,/live challenge needed/);
});
test('configured protections do not imply live acceptance or expose secrets',()=>{
 const result=launchSetup({CONTENT_MODERATION_ENABLED:'true',MODERATION_OPENAI_API_KEY:'never-return-this',TURNSTILE_SECRET_KEY:'also-private'},{credentials:true,contentModeration:true,approved:false});
 assert.match(result[0].state,/live test needed/);assert.equal(result[2].state,'Approval required');
 assert.doesNotMatch(JSON.stringify(result),/never-return-this|also-private/);
});
