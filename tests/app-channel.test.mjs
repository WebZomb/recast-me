import test from 'node:test';
import assert from 'node:assert/strict';
import router from '../src/router.js';
import {requestAppPlatform} from '../src/app-channel.js';
import {setup, ID, TOKEN, CLEAN} from './security-helpers.mjs';
import {hash, normalizeProductDesign} from '../src/commerce-store.js';

const IOS_WEBVIEW = 'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const IOS_SAFARI = IOS_WEBVIEW + ' Version/27.0 Safari/604.1';
const ANDROID_WEBVIEW = 'Mozilla/5.0 (Linux; Android 16; Pixel 9 Build/TEST; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/140.0.0.0 Mobile Safari/537.36';
const ANDROID_CHROME = 'Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const APP_CLIENTS = [
  {name:'iOS bridge header', headers:{'x-recast-app-platform':'ios'}},
  {name:'Android bridge header', headers:{'x-recast-app-platform':'android'}},
  {name:'cached iOS WebView', headers:{'user-agent':IOS_WEBVIEW}},
  {name:'Android WebView', headers:{'user-agent':ANDROID_WEBVIEW}},
  {name:'explicit Android app UA', headers:{'user-agent':ANDROID_CHROME+' RecastMeApp/Android'}},
  {name:'native UA cannot be overridden by web header', headers:{'user-agent':IOS_WEBVIEW,'x-recast-app-platform':'web'}}
];
const WEB_CLIENTS = [{name:'website',headers:{}},{name:'iPhone Safari',headers:{'user-agent':IOS_SAFARI}},{name:'Android Chrome',headers:{'user-agent':ANDROID_CHROME}}];
const DIGITAL = ['RECAST-DIGITAL-HD','RECAST-DIGITAL-PACK'];
const SHARE = 'a'.repeat(40);

async function fixture(t) {
  const calls=[];
  const catalog = [
    ['Custom Recast Mug','RECAST-MUG-11OZ','24.99'],
    ['HD Digital Recast',DIGITAL[0],'4.99'],
    ['Recast Pack',DIGITAL[1],'9.99']
  ].map(([title,sku,price],index)=>({id:'p'+index,title,handle:'product-'+index,status:'ACTIVE',variants:{nodes:[{id:'gid://shopify/ProductVariant/'+(index+1),title:'Default',sku,price}]}}));
  t.mock.method(globalThis,'fetch',async(url,options={})=>{
    calls.push(String(url));
    if(String(url).includes('/oauth/'))return Response.json({access_token:'test-only',expires_in:3600});
    if(String(url).includes('/graphql.json')){
      assert.match(JSON.parse(options.body).query,/query RecastCatalog/);
      return Response.json({data:{products:{nodes:catalog}}});
    }
    throw new Error('Unexpected external operation '+url);
  });
  const env=await setup({SHOPIFY_SHOP:'test',SHOPIFY_CLIENT_ID:'test',SHOPIFY_CLIENT_SECRET:'test'});
  await env.ARTWORK.put('social/shares/'+SHARE+'.json',JSON.stringify({requestId:ID,sku:DIGITAL[0]}));
  const get=(path,headers={})=>router.fetch(new Request('https://recast.test'+path,{headers}),env,{});
  const post=(sku,headers={},path='/api/checkout-link',extra={})=>router.fetch(new Request('https://recast.test'+path,{method:'POST',headers:{origin:'https://recast.test','x-recast-request':'1','content-type':'application/json',...headers},body:JSON.stringify({requestId:ID,accessToken:TOKEN,sku,...extra})}),env,{});
  return {env,calls,get,post};
}

test('app channel identifies native shells without treating mobile browsers as apps',()=>{
  for(const {name,headers} of APP_CLIENTS)assert.ok(requestAppPlatform(new Request('https://recast.test',{headers})),name);
  for(const {name,headers} of WEB_CLIENTS)assert.equal(requestAppPlatform(new Request('https://recast.test',{headers})),null,name);
  assert.equal(requestAppPlatform(new Request('https://recast.test',{headers:{'x-recast-app-platform':' IOS '}})),'ios');
});

test('native catalog, seasonal offers and fulfillment mapping exclude digital SKUs; web retains them',async t=>{
  const {get}=await fixture(t);
  for(const client of [...APP_CLIENTS,...WEB_CLIENTS]){
    const native=APP_CLIENTS.includes(client);
    for(const path of ['/api/checkout-options?requestId='+ID+'&token='+TOKEN,'/api/social/'+SHARE+'/products']){
      const response=await get(path,client.headers),data=await response.json();
      assert.equal(response.status,200,client.name+' '+JSON.stringify(data));
      const skus=data.products.flatMap(p=>p.variants.map(v=>v.sku));
      assert.ok(skus.includes('RECAST-MUG-11OZ'),client.name);
      for(const sku of DIGITAL)assert.equal(skus.includes(sku),!native,client.name+' '+path+' '+sku);
      assert.match(response.headers.get('cache-control'),/no-store/);
    }
    const seasonal=await(await get('/api/seasonal-products',client.headers)).json();
    for(const sku of DIGITAL)assert.equal(seasonal.products.some(p=>p.sku===sku),!native,client.name);
    const mapping=await(await get('/api/fulfillment-map',client.headers)).json();
    assert.ok(mapping.mapping['RECAST-MUG-11OZ']);
    for(const sku of DIGITAL)assert.equal(Boolean(mapping.mapping[sku]),!native,client.name);
  }
});

test('native digital purchase attempts fail before external calls through direct and social routes',async t=>{
  const {post,calls}=await fixture(t);
  for(const {name,headers} of APP_CLIENTS){
    for(const sku of DIGITAL){
      for(const path of ['/api/checkout-link','/api/social/'+SHARE+'/checkout']){
        const response=await post(sku,headers,path),body=await response.json();
        assert.equal(response.status,403,name+' '+path);
        assert.equal(body.code,'digital_unavailable_in_app');
        assert.equal(body.checkoutUrl,undefined);
        assert.match(response.headers.get('cache-control'),/no-store/);
      }
    }
  }
  assert.equal(calls.length,0,'blocked digital attempts must not contact Shopify or providers');
});

test('website keeps both digital checkout paths including mobile browsers and shared artwork',async t=>{
  const {post}=await fixture(t);
  for(const {name,headers} of WEB_CLIENTS){
    for(const sku of DIGITAL){
      for(const path of ['/api/checkout-link','/api/social/'+SHARE+'/checkout']){
        const response=await post(sku,headers,path),body=await response.json();
        assert.equal(response.status,200,name+' '+JSON.stringify(body));
        assert.match(body.checkoutUrl,/^https:\/\/test\.myshopify\.com\/cart\//);
        assert.equal(body.sku,sku);
      }
    }
  }
});

test('native physical checkout still validates and freezes the approved product design',async t=>{
  const {env,post}=await fixture(t),sku='RECAST-MUG-11OZ';
  const design=normalizeProductDesign({product:'Mug'},{product:'Mug',layout:'two-sided',fill:'ambient',x:'center',scale:110,spacing:'standard'});
  const mockupId='v4-Mug-two-sided-ambient-center-110-standard';
  const proofHash=await hash(CLEAN.toString('base64')+'|'+JSON.stringify(design));
  await env.ARTWORK.put(`mockups/${ID}/${sku}/${mockupId}/task.json`,JSON.stringify({requestId:ID,sku,mockupId,status:'completed',sourceHash:proofHash,design,position:{area_width:2700,area_height:1050,width:2700,height:1050,left:0,top:0},images:[{title:'Front view'}]}));
  await env.ARTWORK.put(`mockups/${ID}/${sku}/${mockupId}/image-0.jpg`,CLEAN);
  for(const platform of ['ios','android']){
    const response=await post(sku,{'x-recast-app-platform':platform},'/api/checkout-link',{design,mockupId,confirmDesign:true}),body=await response.json();
    assert.equal(response.status,200,JSON.stringify(body));
    const properties=JSON.parse(Buffer.from(new URL(body.checkoutUrl).searchParams.get('properties'),'base64url').toString());
    assert.equal(properties['_Recast Proof'],proofHash);
    assert.ok(await env.ARTWORK.get('commerce/preapprovals/'+properties['_Recast Preapproval']+'.json'));
  }
});

test('digital downloads and download eligibility are website-only without changing purchased entitlement',async t=>{
  const {env,get}=await fixture(t);
  const key=`requests/${ID}/request.json`,meta=await(await env.ARTWORK.get(key)).json();
  await env.ARTWORK.put(key,JSON.stringify({...meta,paid:true,digitalEntitlement:DIGITAL[0]}));
  for(const {name,headers} of APP_CLIENTS){
    const response=await get(`/api/digital-download/${ID}?token=${TOKEN}`,headers);
    assert.equal(response.status,403,name);
    assert.equal((await response.json()).code,'digital_unavailable_in_app');
    const status=await(await get(`/api/order-status?requestId=${ID}&token=${TOKEN}`,headers)).json();
    assert.equal(status.request.digitalEntitlement,null,name);
  }
  for(const {name,headers} of WEB_CLIENTS){
    const response=await get(`/api/digital-download/${ID}?token=${TOKEN}`,headers);
    assert.equal(response.status,200,name);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()),CLEAN);
    const status=await(await get(`/api/order-status?requestId=${ID}&token=${TOKEN}`,headers)).json();
    assert.equal(status.request.digitalEntitlement,DIGITAL[0],name);
  }
  assert.equal((await(await env.ARTWORK.get(key)).json()).digitalEntitlement,DIGITAL[0]);
});
