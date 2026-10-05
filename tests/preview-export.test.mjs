import test from 'node:test';
import assert from 'node:assert/strict';
import {protectedPreviewFile} from '../public/preview-export.js';
const version={requestId:'RC-TEST-123',accessToken:'private-token'};
const image='data:image/jpeg;base64,/9j/';
test('share exports only watermarked preview bytes and no private link',async()=>{
 let called;
 const result=await protectedPreviewFile(version,async(url,options)=>{called={url,options};return Response.json({ok:true,watermarked:true,image})});
 assert.match(called.url,/\/preview\?token=/);assert.equal(called.options.referrerPolicy,'no-referrer');
 assert.equal(result.file.name,'RC-TEST-123-RecastMeAi-preview.jpg');assert.equal(result.file.type,'image/jpeg');
 assert.equal(JSON.stringify(result).includes('private-token'),false);
});
test('share rejects unmarked, unsuccessful, malformed and oversized previews',async()=>{
 for(const body of [{ok:true,image},{ok:false,watermarked:true,image},{ok:true,watermarked:true,image:'data:image/svg+xml;base64,AAAA'},{ok:true,watermarked:true,image:'data:image/jpeg;base64,AAAA'},{ok:true,watermarked:true,image:'data:image/jpeg;base64,'+'A'.repeat(16000000)}]){
  await assert.rejects(protectedPreviewFile(version,async()=>Response.json(body)));
 }
 await assert.rejects(protectedPreviewFile({requestId:'../../clean',accessToken:'t'},()=>{throw Error('must not fetch')}));
});
