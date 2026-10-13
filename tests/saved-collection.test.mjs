import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {savedRecasts,saveRecast,removeRecast,COLLECTION_LIMIT,productLink} from '../public/recast-collection.js';

const token='a'.repeat(64);
const data=new Map();
function fresh(){
 data.clear();
 globalThis.localStorage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value))};
 globalThis.location={origin:'https://recastmeai.com'};
}
test('browser and iPhone both show a Save to My Recasts action and reuse private artwork',()=>{
 fresh();
 const page=fs.readFileSync('public/index.html','utf8');
 const app=fs.readFileSync('public/app.js','utf8');
 assert.match(page,/id="save-native-preview" class="preview-quick-button preview-quick-save"/);
 assert.match(page,/id="share-preview" class="preview-quick-button preview-quick-share"/);
 assert.doesNotMatch(page,/class="preview-more"/);
 assert.match(page,/href="\/my-recasts.html"/);
 assert.match(app,/saveRecast/);
 assert.match(app,/accessToken:lastSuccessfulPreviewMeta\?\.accessToken/);
 // Native Keychain access and the offline gallery are validated on the separate
 // iOS TestFlight branch; the web PR must work independently at release.
 assert.match(app,/messageHandlers\.recastPreview\.postMessage/);
});
test('saved browser link allows exact artwork to be reopened for a product without another render',()=>{
 fresh();
 const row={requestId:'RC-SAMPLE-A1',accessToken:token,styleName:'DJ Night'};
 assert.equal(saveRecast(row).ok,true);
 assert.equal(savedRecasts().length,1);
 const url=productLink(savedRecasts()[0]);
 const u=new URL(url);
 assert.equal(u.origin,'https://recastmeai.com');
 assert.equal(new URLSearchParams(u.hash.slice(1)).get('recast'),row.requestId);
 assert.equal(new URLSearchParams(u.hash.slice(1)).get('key'),row.accessToken);
 assert.equal(new URLSearchParams(u.hash.slice(1)).get('shop'),'1');
 assert.equal(removeRecast(row.requestId),true);
 assert.deepEqual(savedRecasts(),[]);
});
test('invalid links cannot enter favorites and the saved collection is capped at twenty',()=>{
 fresh();
 assert.equal(saveRecast({requestId:'RC-X',accessToken:'oops'}).ok,false);
 for(let i=0;i<COLLECTION_LIMIT;i++)assert.equal(saveRecast({requestId:'RC-SAVED-'+i,accessToken:token}).ok,true);
 assert.equal(savedRecasts().length,20);
 assert.equal(saveRecast({requestId:'RC-EXTRA',accessToken:token}).ok,false);
 // Saving an existing favorite moves it to the top without using extra space.
 assert.equal(saveRecast({requestId:'RC-SAVED-0',accessToken:token}).ok,true);
 assert.equal(savedRecasts()[0].requestId,'RC-SAVED-0');
});
test('demo page is safe, publicly viewable without a charge and never pretends to grant credits',()=>{
 const page=fs.readFileSync('public/purchase-demo.html','utf8');
 assert.match(page,/NO PURCHASE · NO REAL CREDITS/);
 assert.match(page,/Example reward: \+3 High Quality Recasts/);
 assert.match(page,/noindex,nofollow/);
 assert.doesNotMatch(page,/\/api\/order-bonus|\/api\/checkout-link|cardNumber/);
});
