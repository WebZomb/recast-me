import test from 'node:test';
import assert from 'node:assert/strict';
import {smallGiftOwnerPublish,SMALL_GIFT_PUBLISH_PATH} from '../src/shop-small-gift-publish.js';
const request=origin=>new Request(origin+SMALL_GIFT_PUBLISH_PATH,{method:'POST',headers:{origin,authorization:'Bearer fixture-owner','x-recast-request':'1','content-type':'application/json'},body:'{}'});
const base=()=>({ADMIN_TOKEN:'fixture-owner',LIVE_APP_URL:'https://recastmeai.com',ARTWORK:{get(){throw Error('Storage should not be reached');},put(){throw Error('Storage should not be written');}}});
test('disabled finished-gift release rejects publication before any storage read',async()=>{
 for(const value of [undefined,'false']){
  const env={...base(),PREMADE_SMALL_GIFT_RELEASE_ENABLED:value};
  const response=await smallGiftOwnerPublish(request('https://recastmeai.com'),env);
  assert.equal(response.status,503);assert.match(await response.text(),/currently disabled/);
 }
});
test('even a valid owner session on a preview host cannot publish into live storage',async()=>{
 const response=await smallGiftOwnerPublish(request('https://preview.example.invalid'),{...base(),PREMADE_SMALL_GIFT_RELEASE_ENABLED:'true'});
 assert.equal(response.status,403);assert.match(await response.text(),/configured live owner site/);
});
