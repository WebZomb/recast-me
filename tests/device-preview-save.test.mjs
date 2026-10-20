import test from 'node:test';
import assert from 'node:assert/strict';
import {offerDeviceSave} from '../public/device-preview-save.js';
function fixture(mobile,share){
 const nodes=[];
 const document={querySelector:()=>null,body:{append(){}},createElement(tag){const node={tag,style:{},append(){},setAttribute(){},addEventListener(){},remove(){this.removed=true},click(){this.clicked=true},showModal(){this.open=true}};nodes.push(node);return node;}};
 const env={document,matchMedia:()=>({matches:mobile}),navigator:share||{},URL:{createObjectURL:()=> 'blob:protected-preview',revokeObjectURL(){}},setTimeout(){}};
 const status={};const result={file:{name:'RC-TEST-preview.jpg'},image:'data:image/jpeg;base64,/9j/'};
 return {env,nodes,status,result};
}
test('desktop requests protected file download and does not claim folder or completed save',()=>{
 const f=fixture(false);offerDeviceSave(f.result,f.status,f.env);
 const link=f.nodes.find(n=>n.tag==='a');assert.equal(link.download,f.result.file.name);assert.equal(link.clicked,true);assert.equal(link.removed,true);assert.match(f.status.textContent,/browser chooses the folder/);
});
test('mobile sharing only starts on fresh tap and shares only the file',async()=>{
 let payload;const f=fixture(true,{canShare:()=>true,share:async p=>{payload=p}});
 offerDeviceSave(f.result,f.status,f.env);assert.equal(payload,undefined);
 await f.nodes.find(n=>n.textContent==='Save to device').onclick();
 assert.deepEqual(payload,{files:[f.result.file],title:'My Recast'});
 assert.equal(f.nodes.find(n=>n.tag==='img').src,f.result.image);
});
test('mobile cancellation and unsupported sharing retain My Recasts and offer image fallback',async()=>{
 for(const navigator of [{},{canShare:()=>true,share:async()=>{throw Object.assign(Error(),{name:'AbortError'})}}]){
  const f=fixture(true,navigator);offerDeviceSave(f.result,f.status,f.env);
  await f.nodes.find(n=>n.textContent==='Save to device').onclick();
  assert.match(f.status.textContent,/Saved to My Recasts/);
  assert.ok(f.nodes.some(n=>/Touch and hold|save canceled/.test(n.textContent||'')));
 }
});
