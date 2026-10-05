import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/checkout.js',import.meta.url),'utf8');
function setup(fetcher){
  const listeners={},calls=[],error={hidden:true,textContent:''},img={src:'',alt:''},caption={textContent:''};
  const layout={value:'single'},x={value:'center'},scale={value:'92'};
  const button={dataset:{product:'0'},textContent:'Shop Mug',disabled:false,parentElement:{querySelector:()=>error},addEventListener:(name,fn)=>button[name]=fn};
  const preview={disabled:false,textContent:'Preview'};
  const card={dataset:{productTitle:'Custom Recast Mug',active:'true',digital:'false'},classList:{add(){},remove(){}},
    querySelector:s=>s==='.product-art img'?img:s==='.example-design-label'?caption:s==='.mockup-error'?error:s==='.product-preview-action'?preview:s==='.recast-buy'?button:s==='[data-design-layout]'?layout:s==='[data-design-x]'?x:s==='[data-design-scale]'?scale:null};
  const grid={innerHTML:'marketing',children:[],classList:{add(){}},replaceChildren(){this.innerHTML='';this.children=[]},append(...items){this.children.push(...items)}};
  const document={querySelector:s=>s==='#product-grid'?grid:s==='#request-id'?{textContent:''}:s.startsWith('.recast-variant')?{value:'RECAST-MUG-15OZ'}:s.startsWith('[data-product-index')?card:null,querySelectorAll:s=>s==='.recast-buy'?[button]:[],addEventListener:(name,fn)=>listeners[name]=fn,createElement:()=>({children:[],setAttribute(){},addEventListener(name,fn){this[name]=fn},append(...x){this.children.push(...x)}})};
  const context={document,window:{},localStorage:{getItem:()=>JSON.stringify({requestId:'old',accessToken:'old-token'})},location:{origin:'https://recast.test'},URL,console:{warn(){}},setTimeout,fetch:async(...args)=>{calls.push(args);return fetcher(...args)}};
  vm.runInNewContext(source,context);
  return {context,grid,button,error,card,calls,select:async(id='new')=>{context.window.__recastActiveRequest={requestId:id,accessToken:`${id}-token`};await listeners['recast-artwork-selected']()}};
}
const catalog=()=>({ok:true,json:async()=>({ok:true,products:[{title:'Custom Recast Mug',status:'ACTIVE',variants:[{sku:'RECAST-MUG-15OZ',variantTitle:'15 oz',price:'29.99'}]}]})});
test('static asset HTML loads checkout without Worker HTML injection',()=>{
  const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  assert.match(html,/<script src="\/checkout\.js\?v=\d+" type="module"><\/script>/);
});
test('selected artwork beats stale storage and Mug purchase carries exact artwork and variant',async()=>{
  const ui=setup(async url=>String(url).includes('checkout-link')?{ok:true,json:async()=>({ok:true,checkoutUrl:'https://shop.test/checkout'})}:catalog());
  await ui.select();assert.equal(new URL(ui.calls[0][0]).searchParams.get('requestId'),'new');
  assert.match(ui.grid.innerHTML,/Shop Mug/);assert.doesNotMatch(ui.grid.innerHTML,/href="#start"/);
  await ui.button.click();assert.deepEqual(JSON.parse(ui.calls[1][1].body),{requestId:'new',accessToken:'new-token',sku:'RECAST-MUG-15OZ'});
  assert.equal(ui.context.location.href,'https://shop.test/checkout');
});
test('checkout failure is visible and retryable without losing artwork',async()=>{
  const ui=setup(async url=>String(url).includes('checkout-link')?{ok:false,json:async()=>({error:'Checkout unavailable'})}:catalog());
  await ui.select();await ui.button.click();assert.equal(ui.error.hidden,false);assert.equal(ui.error.textContent,'Checkout unavailable');assert.equal(ui.button.disabled,false);assert.equal(ui.context.location.href,undefined);
});
test('failed catalog has retry and older response cannot replace newly selected art',async()=>{
  const ui=setup(async()=>({ok:false,json:async()=>({})}));await ui.select();assert.equal(ui.grid.children[1].textContent,'Try loading products again');
  let release;const raced=setup(async url=>new URL(url).searchParams.get('requestId')==='first'?await new Promise(r=>release=r):catalog());
  const old=raced.select('first');await raced.select('second');release({ok:false,json:async()=>({})});await old;assert.match(raced.grid.innerHTML,/Shop Mug/);
});
test('stale product button cannot buy previous artwork after selection changed',async()=>{
  const ui=setup(async()=>catalog());await ui.select('first');ui.context.window.__recastActiveRequest={requestId:'second',accessToken:'second-token'};await ui.button.click();assert.equal(ui.calls.some(([url])=>String(url).includes('checkout-link')),false);
});

test('mockup failure is visible in an inline alert on touch devices',async()=>{
 const app=setup(async()=>({ok:false,json:async()=>({error:'Printful is not connected.'})}));
 const alert={hidden:true,textContent:''};const button={textContent:'Preview',disabled:false};
 app.context.mockupArgs={req:{requestId:'saved',accessToken:'test'},sku:'RECAST-MUG-11OZ',card:{querySelector:()=>alert},button};
 await vm.runInNewContext('generateRealMockup(mockupArgs)',app.context);
 assert.equal(alert.hidden,false);assert.equal(alert.textContent,'Printful is not connected.');assert.equal(button.disabled,false);
});
