import test from 'node:test';
import assert from 'node:assert/strict';
import {screenText,moderateContent} from '../src/content-safety.js';
import {socialIntent} from '../src/social-products.js';
import {recipientFromOrder} from '../src/workflow.js';
import router from '../src/router.js';
import {visualVerdict,moderationVerdict} from './safety-fixtures.mjs';
import {setup,CLEAN} from './security-helpers.mjs';
const configured={CONTENT_MODERATION_ENABLED:'true',MODERATION_OPENAI_API_KEY:'test'};
const photo=()=>new File([CLEAN],'photo.jpg',{type:'image/jpeg'});

test('family-friendly text screening rejects explicit and obfuscated terms without matching harmless substrings',()=>{
  for(const text of ['make me nude','NSFW portrait','f.u.c.k','sh1t','n\u200bude'])assert.equal(screenText(text).status,'rejected',text);
  for(const text of ['Fantasy Warrior','my fluffy dog','classical portrait','a glass mug'])assert.equal(screenText(text).status,'passed',text);
});
test('missing activation is not reported as screened; required screening fails closed',async()=>{
  assert.equal((await moderateContent({}, {images:[photo()]})).status,'not_screened');
  await assert.rejects(moderateContent({}, {images:[photo()],required:true}),{status:503});
  await assert.rejects(moderateContent({CONTENT_MODERATION_ENABLED:'true'}, {images:[photo()]}),{status:503});
});
test('image safety API uses inline pixels and rejects flags, outages and malformed decisions',async t=>{
  const env=await setup(configured);
  let result=moderationVerdict();
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    if(url.endsWith('/responses'))return Response.json(visualVerdict());
    assert.equal(url,'https://api.openai.com/v1/moderations');const body=JSON.parse(options.body);
    assert.equal(body.model,'omni-moderation-latest');assert.match(body.input[0].image_url.url,/^data:image\/jpeg;base64,/);
    return Response.json(result);
  });
  assert.equal((await moderateContent(env,{images:[photo()]})).status,'passed');
  result=moderationVerdict({sexual:true});await assert.rejects(moderateContent(env,{images:[photo()]}),{reason:'content_policy'});
  result={results:[]};await assert.rejects(moderateContent(env,{images:[photo()]}),{reason:'content_screening_unavailable'});
});
test('rejected original-photo pixels never become stored purchasable artwork',async t=>{
  const env=await setup(configured);t.mock.method(globalThis,'fetch',async()=>Response.json(moderationVerdict({sexual:true})));
  const form=new FormData();form.set('photo',photo());form.set('consent','yes');
  const response=await router.fetch(new Request('https://recast.test/api/original-photo',{method:'POST',headers:{'x-recast-request':'1',origin:'https://recast.test'},body:form}),env,{});
  assert.equal(response.status,422);
  const rows=await env.ARTWORK.list({prefix:'requests/'});assert.equal(rows.objects.filter(x=>!x.key.includes('RC-TEST')).length,0);
});
test('X original-product intent avoids AI; requested AI transformation stays explicit',()=>{
  assert.equal(socialIntent('put this photo on a mug').mode,'original-product');
  assert.equal(socialIntent('send me any product with this picture').product.sku,'RECAST-MUG-11OZ');
  assert.equal(socialIntent('make AI artwork of my dog on a mug').mode,'ai');
  assert.equal(socialIntent('put this photo on a journal').product.design.version,7);
  assert.equal(socialIntent('put it on a phone case').product.design.version,7);
});
test('gift fulfillment uses recipient shipping details and buyer email, never buyer billing address',()=>{
  const recipient=recipientFromOrder({email:'buyer@example.test',shippingAddress:{firstName:'Gift',lastName:'Recipient',address1:'123 Recipient Road',city:'Philadelphia',countryCodeV2:'US',zip:'19103'},billingAddress:{name:'Buyer',address1:'999 Billing Street'}});
  assert.equal(recipient.name,'Gift Recipient');assert.equal(recipient.address1,'123 Recipient Road');assert.equal(recipient.email,'buyer@example.test');assert.ok(!JSON.stringify(recipient).includes('999 Billing'));
});
