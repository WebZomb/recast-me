export const CLEAN = Buffer.concat([Buffer.from([255,216,255]),Buffer.alloc(240,0x54),Buffer.from([255,217])]);
export const MARKED = Buffer.concat([Buffer.from([255,216,255]),Buffer.alloc(240,0x4d),Buffer.from([255,217])]);
export const ID = 'RC-TEST0001-ABCDEF';
export const TOKEN = 'customer-test-token';
export const PRINT = 'print-service-test-token';
export class Bucket {
  objects = new Map(); serial = 0;
  async get(key) {
    const stored = this.objects.get(key); if (!stored) return null;
    const {bytes, options, etag} = stored;
    return {etag, customMetadata:options.customMetadata, httpMetadata:options.httpMetadata,
      body:new Blob([bytes]).stream(), text:async()=>bytes.toString(), json:async()=>JSON.parse(bytes.toString()), arrayBuffer:async()=>Uint8Array.from(bytes).buffer};
  }
  async put(key, value, options={}) {
    const bytes = typeof value==='string' ? Buffer.from(value) : value instanceof ReadableStream ? Buffer.from(await new Response(value).arrayBuffer()) : Buffer.from(value);
    const old = this.objects.get(key), condition = options.onlyIf;
    if ((condition instanceof Headers && condition.get('If-None-Match')==='*' && old) || (condition?.etagMatches && old?.etag!==condition.etagMatches)) return null;
    const etag = String(++this.serial);
    this.objects.set(key,{bytes,options,etag});return {etag};
  }
  async head(key) {return this.get(key)}
  async delete(keys) { for (const key of Array.isArray(keys)?keys:[keys]) this.objects.delete(key) }
  async list({prefix='',limit=1000}={}) {return {objects:[...this.objects.keys()].filter(k=>k.startsWith(prefix)).slice(0,limit).map(key=>({key})),truncated:false}}
}
export function imageMock({fail=false,unchanged=false, format='image/jpeg'}={}) {
  const operations=[];
  const images={operations,info:async()=>({width:1024,height:1280}),input(stream){
    const chain={stream,draws:0,transform(options){operations.push(['transform',options]);return this},draw(overlay,options){this.draws++;operations.push(['draw',options]);return this},async output(options){
      operations.push(['output',options]);
      if(fail)throw new Error('TEST_IMAGE_SERVICE_FAILURE');
      const bytes=unchanged||!this.draws?CLEAN:MARKED;
      return {response:()=>new Response(bytes,{headers:{'content-type':format}})}
    }};return chain;
  }};return images;
}
export async function setup(extra={}) {
  const env={ARTWORK:new Bucket(),IMAGES:imageMock(),ADMIN_TOKEN:'owner-test-secret',...extra};
  await env.ARTWORK.put(`requests/${ID}/request.json`,JSON.stringify({requestId:ID,accessToken:TOKEN,printAccessToken:PRINT,previewMime:'image/jpeg',paid:false,styleName:'Royal',futureSecret:'not-for-customer'}));
  await env.ARTWORK.put(`requests/${ID}/preview.b64`,CLEAN.toString('base64'));
  return env;
}
export function submission({path='/api/transform-v2',id='ATTEMPT-TEST-000001',branch=false,admin=false}={}) {
  const form=new FormData();form.set('style','royal');form.set('subject','pet');form.set('notes','Royal portrait');form.set('qualityMode','high');
  if(id)form.set('clientAttemptId',id);
  form.set('image_0',new File([CLEAN],'pet.jpg',{type:'image/jpeg'}));
  if(branch){form.set('branchRequestId',ID);form.set('branchAccessToken',TOKEN);form.set('branchPreview',new File([MARKED],'untrusted.jpg',{type:'image/jpeg'}));}
  return new Request(`https://recast.test${path}`,{method:'POST',body:form,headers:admin?{authorization:'Bearer owner-test-secret'}:{}});
}
export function fakeApplication({persisted=true,capture=null}={}) {
  return {calls:0,async fetch(request,env){
    this.calls++;
    if(capture)await capture(request.clone(),env);
    if(new URL(request.url).pathname.startsWith('/api/digital-download/'))return new Response(CLEAN,{headers:{'content-type':'image/jpeg','content-disposition':'attachment; filename="recast.jpg"'}});
    const ai=await env.AI.run('@cf/black-forest-labs/flux-2-dev',{});
    return Response.json({ok:true,requestId:ID,accessToken:TOKEN,persisted,image:`data:image/jpeg;base64,${ai.image}`,modelUsed:'@cf/black-forest-labs/flux-2-dev',printAccessToken:PRINT});
  },async scheduled(_controller,env){await env.AI.run('test',{});return {ok:true}}};
}
