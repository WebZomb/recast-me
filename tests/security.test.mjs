import test from 'node:test';import assert from 'node:assert/strict';
import {secureApplication,watermarkBytes,SECURITY_VERSION,WATERMARK_LABEL} from '../src/preview-security.js';
import {CLEAN,MARKED,ID,TOKEN,PRINT,setup,imageMock,submission,fakeApplication} from './security-helpers.mjs';
const get=(path)=>new Request(`https://recast.test${path}`);
const noCore={fetch(){throw Error('Upstream route should not run')}};
async function setMeta(env,changes){const key=`requests/${ID}/request.json`;const meta=await(await env.ARTWORK.get(key)).json();await env.ARTWORK.put(key,JSON.stringify({...meta,...changes}))}
function addAi(env){let calls=0;env.AI={async run(){calls++;return{image:CLEAN.toString('base64')}}};return()=>calls}

test('new render returns only a server-flattened preview; clean source stays private',async()=>{
 const env=await setup(),calls=addAi(env);const result=await secureApplication(fakeApplication()).fetch(submission(),env,{});assert.equal(result.status,200);
 const data=await result.json();assert.equal(data.image,`data:image/jpeg;base64,${MARKED.toString('base64')}`);assert.equal(data.watermarked,true);assert.equal(data.securityVersion,SECURITY_VERSION);assert.equal(calls(),1);
 assert.equal(await(await env.ARTWORK.get(`requests/${ID}/preview.b64`)).text(),CLEAN.toString('base64'));assert.equal(data.printAccessToken,undefined);assert.equal(data.requestId,ID);
});
test('missing image binding blocks before any AI call',async()=>{
 const env=await setup({IMAGES:null}),calls=addAi(env);const app=fakeApplication();const r=await secureApplication(app).fetch(submission(),env,{});assert.equal(r.status,503);assert.equal(calls(),0);assert.equal(app.calls,0);
});
test('missing private storage also blocks before inference',async()=>{
 const env=await setup(),calls=addAi(env);delete env.ARTWORK;const r=await secureApplication(fakeApplication()).fetch(submission(),env,{});assert.equal(r.status,503);assert.equal(calls(),0);
});
test('watermark failure never falls back to clean pixels',async()=>{
 const env=await setup({IMAGES:imageMock({fail:true})}),calls=addAi(env);const r=await secureApplication(fakeApplication()).fetch(submission(),env,{});
 assert.equal(r.status,503);assert.equal(calls(),1);assert.ok(!(await r.text()).includes(CLEAN.toString('base64')));assert.ok(await env.ARTWORK.get(`requests/${ID}/preview.b64`));
});
test('a recovered saved image does not require another AI render',async()=>{
 const env=await setup({IMAGES:imageMock({fail:true})}),calls=addAi(env);await secureApplication(fakeApplication()).fetch(submission(),env,{});env.IMAGES=imageMock();
 const r=await secureApplication(noCore).fetch(get(`/api/request/${ID}/preview?token=${TOKEN}`),env,{});assert.equal(r.status,200);assert.equal(calls(),1);assert.equal((await r.json()).watermarked,true);
});
test('an unchanged transform output is rejected',async()=>{const env=await setup({IMAGES:imageMock({unchanged:true})});await assert.rejects(watermarkBytes(env,CLEAN),e=>e.code==='watermark_failed')});
test('non-JPEG transform output is rejected',async()=>{const env=await setup({IMAGES:imageMock({format:'image/svg+xml'})});await assert.rejects(watermarkBytes(env,CLEAN))});
test('saved versions are watermarked and use private no-store headers',async()=>{
 const env=await setup();const r=await secureApplication(noCore).fetch(get(`/api/request/${ID}/preview?token=${TOKEN}`),env,{});assert.equal(r.status,200);assert.equal((await r.json()).image,`data:image/jpeg;base64,${MARKED.toString('base64')}`);assert.equal(r.headers.get('cache-control'),'private, no-store');assert.equal(r.headers.get('referrer-policy'),'no-referrer');
});
test('cached protected previews remain available when Images is offline',async()=>{
 const env=await setup(),app=secureApplication(noCore),req=get(`/api/request/${ID}/preview?token=${TOKEN}`);await app.fetch(req,env,{});env.IMAGES=null;const r=await app.fetch(req,env,{});assert.equal(r.status,200);assert.equal((await r.json()).watermarked,true);
});
test('source changes invalidate the protected derivative cache',async()=>{
 const env=await setup(),app=secureApplication(noCore),req=get(`/api/request/${ID}/preview?token=${TOKEN}`);await app.fetch(req,env,{});await env.ARTWORK.put(`requests/${ID}/preview.b64`,Buffer.from('changed source').toString('base64'));env.IMAGES=null;assert.equal((await app.fetch(req,env,{})).status,503);
});
test('wrong customer token cannot retrieve metadata or either image',async()=>{
 const env=await setup(),app=secureApplication(noCore);for(const tail of ['','/preview'])assert.equal((await app.fetch(get(`/api/request/${ID}${tail}?token=wrong`),env,{})).status,403);assert.equal(env.IMAGES.operations.length,0);
});
test('metadata is an allowlist and cannot expose old print tokens',async()=>{
 const env=await setup(),r=await secureApplication(noCore).fetch(get(`/api/request/${ID}?token=${TOKEN}`),env,{}),data=await r.json();assert.equal(data.request.styleName,'Royal');assert.equal(data.request.printAccessToken,undefined);assert.equal(data.request.accessToken,undefined);assert.equal(data.request.futureSecret,undefined);
});
test('unpaid print sources serve only the protected mockup image',async()=>{
 const env=await setup();const r=await secureApplication(noCore).fetch(get(`/api/print-source/${ID}?token=${PRINT}`),env,{});assert.equal(r.status,200);assert.deepEqual(Buffer.from(await r.arrayBuffer()),MARKED);
});
test('customer access token is not a print-service token',async()=>{
 const env=await setup();assert.equal((await secureApplication(noCore).fetch(get(`/api/print-source/${ID}?token=${TOKEN}`),env,{})).status,404);
});
test('unpaid final print source is blocked even with a valid legacy print token',async()=>{
 const env=await setup();await env.ARTWORK.put(`requests/${ID}/final-print.jpg`,CLEAN);assert.equal((await secureApplication(noCore).fetch(get(`/api/print-source/${ID}?token=${PRINT}&final=1`),env,{})).status,403);
});
test('paid prepared print source preserves exact stored final pixels',async()=>{
 const env=await setup();await setMeta(env,{paid:true});await env.ARTWORK.put(`requests/${ID}/final-print.jpg`,CLEAN);const r=await secureApplication(noCore).fetch(get(`/api/print-source/${ID}?token=${PRINT}&final=1`),env,{});assert.equal(r.status,200);assert.deepEqual(Buffer.from(await r.arrayBuffer()),CLEAN);assert.match(r.headers.get('cache-control'),/no-store/);
});
test('paid artwork still has a watermarked preview',async()=>{
 const env=await setup();await setMeta(env,{paid:true});const r=await secureApplication(noCore).fetch(get(`/api/request/${ID}/preview?token=${TOKEN}`),env,{});assert.equal((await r.json()).watermarked,true);
});
test('physical purchase alone does not grant digital downloads',async()=>{
 const env=await setup();await setMeta(env,{paid:true});assert.equal((await secureApplication(noCore).fetch(get(`/api/digital-download/${ID}?token=${TOKEN}`),env,{})).status,403);
});
test('valid paid digital entitlement keeps exact artwork and attachment headers',async()=>{
 const env=await setup();await setMeta(env,{paid:true,digitalEntitlement:'RECAST-DIGITAL-HD'});const r=await secureApplication(fakeApplication()).fetch(get(`/api/digital-download/${ID}?token=${TOKEN}`),env,{});assert.equal(r.status,200);assert.deepEqual(Buffer.from(await r.arrayBuffer()),CLEAN);assert.match(r.headers.get('content-disposition'),/attachment/);
});
test('payment for one artwork cannot unlock another artwork',async()=>{
 const env=await setup();await setMeta(env,{paid:true,digitalEntitlement:'RECAST-DIGITAL-HD'});const other='RC-TEST0002-ABCDEF';await env.ARTWORK.put(`requests/${other}/request.json`,JSON.stringify({requestId:other,accessToken:'other',paid:false}));const app=secureApplication(noCore);assert.equal((await app.fetch(get(`/api/digital-download/${other}?token=${TOKEN}`),env,{})).status,403);assert.equal((await app.fetch(get(`/api/digital-download/${other}?token=other`),env,{})).status,403);
});
test('explicit revoked or refunded metadata blocks paid downloads',async()=>{
 for(const change of [{refundedAt:'today'},{revokedAt:'today'},{financialStatus:'REFUNDED'},{paid:'true'}]){
 const env=await setup();await setMeta(env,{paid:true,digitalEntitlement:'RECAST-DIGITAL-HD',...change});assert.equal((await secureApplication(noCore).fetch(get(`/api/digital-download/${ID}?token=${TOKEN}`),env,{})).status,403);}
});
test('old raw product mockups are watermarked on delivery',async()=>{
 const env=await setup();const app=secureApplication({fetch:async()=>new Response(CLEAN,{headers:{'content-type':'image/jpeg'}})});const r=await app.fetch(get(`/api/mockup/image/${ID}/RECAST-POSTER-12X16/0?token=mockup-capability`),env,{});assert.deepEqual(Buffer.from(await r.arrayBuffer()),MARKED);
});
test('unauthorized product mockup failure is not converted into an image',async()=>{
 const env=await setup();const app=secureApplication({fetch:async()=>new Response('Not found',{status:404})});assert.equal((await app.fetch(get('/api/mockup/image/id/sku/0?token=wrong'),env,{})).status,404);assert.equal(env.IMAGES.operations.length,0);
});
test('public social preview responses are protected as raster bytes',async()=>{
 const env=await setup();const app=secureApplication({fetch:async()=>new Response(CLEAN,{headers:{'content-type':'image/jpeg'}})});const r=await app.fetch(get('/api/recast-share/share-id/preview'),env,{});assert.deepEqual(Buffer.from(await r.arrayBuffer()),MARKED);
});
test('refinements privately replace the client image with the stored source',async()=>{
 const env=await setup();addAi(env);let received;const app=fakeApplication({capture:async req=>{received=Buffer.from(await(await req.formData()).get('branchPreview').arrayBuffer())}});const r=await secureApplication(app).fetch(submission({branch:true}),env,{});assert.equal(r.status,200);assert.deepEqual(received,CLEAN);
});
test('failed storage never produces an orderable or clean preview',async()=>{
 const env=await setup();addAi(env);const r=await secureApplication(fakeApplication({persisted:false})).fetch(submission(),env,{});assert.equal(r.status,503);assert.ok(!(await r.text()).includes(CLEAN.toString('base64')));
});
test('unauthenticated model lab cannot call inference',async()=>{
 const env=await setup(),calls=addAi(env);const r=await secureApplication(fakeApplication()).fetch(submission({path:'/api/admin/model-test?model=dev'}),env,{});assert.equal(r.status,401);assert.equal(calls(),0);
});
test('owner model tests receive protected previews and use the same call cap',async()=>{
 const env=await setup({AI_DAILY_CALL_LIMIT:'0'}),calls=addAi(env);const r=await secureApplication(fakeApplication()).fetch(submission({path:'/api/admin/model-test?model=dev',admin:true}),env,{});assert.equal(r.status,429);assert.equal(calls(),0);
});
test('public operational diagnostics are authenticated and AI-test bypass is retired',async()=>{
 const env=await setup(),app=secureApplication(noCore);for(const path of ['/api/shopify-status','/api/printful-status','/api/storage-test','/api/ai-test'])assert.equal((await app.fetch(get(path),env,{})).status,401);assert.equal((await app.fetch(new Request('https://recast.test/api/ai-test',{method:'POST',headers:{authorization:'Bearer owner-test-secret'}}),env,{})).status,410);
});
test('duplicate submission produces a helpful error without another render',async()=>{
 const env=await setup(),calls=addAi(env),app=secureApplication(fakeApplication());assert.equal((await app.fetch(submission(),env,{})).status,200);const r=await app.fetch(submission(),env,{});assert.equal(r.status,409);assert.equal((await r.json()).reason,'duplicate_submission');assert.equal(calls(),1);
});
test('scheduled AI calls also use the shared cap',async()=>{
 const env=await setup({AI_DAILY_CALL_LIMIT:'0'}),calls=addAi(env);await assert.rejects(secureApplication(fakeApplication()).scheduled({},env,{}));assert.equal(calls(),0);
});
test('control status accurately says there is no configured allowance or monetary cap',async()=>{
 const env=await setup();const req=new Request('https://recast.test/api/admin/render-controls',{headers:{authorization:'Bearer owner-test-secret'}});const r=await secureApplication(noCore).fetch(req,env,{}),data=await r.json();assert.equal(data.renderControls.configured,false);assert.equal(data.monetaryBudgetEnforced,false);
});
test('watermark transform preserves aspect ratio and draws repeated branding plus footer',async()=>{
 const env=await setup();await watermarkBytes(env,CLEAN);const operations=env.IMAGES.operations;assert.deepEqual(operations[0],['transform',{width:768,height:960,fit:'scale-down'}]);assert.equal(operations.filter(x=>x[0]==='draw').length,2);assert.equal(operations.find(x=>x[0]==='draw')[1].repeat,true);
});

test('preview branding uses the public handle on every server-flattened derivative',()=>{assert.equal(WATERMARK_LABEL,'@RecastMeAi • PREVIEW');assert.equal(SECURITY_VERSION,'rm-preview-4')});

test('watermark draw inputs are raster PNG assets rather than SVG',async()=>{const env=await setup();await watermarkBytes(env,CLEAN);assert.equal(env.IMAGES.operations.filter(x=>x[0]==='draw').length,2)});
