import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/checkout.js',import.meta.url),'utf8');
function setup(fetcher){
  const listeners={},calls=[],error={hidden:true};
  const button={dataset:{product:'0'},textContent:'Shop Mug',parentElement:{querySelector:()=>error},addEventListener:(name,fn)=>button[name]=fn};
  const grid={innerHTML:'marketing',children:[],classList:{add(){}},replaceChildren(){this.innerHTML='';this.children=[]},append(...items){this.children.push(...items)}};
  const document={querySelector:s=>s==='#product-grid'?grid:s==='#request-id'?{textContent:''}:s.startsWith('.recast-variant')?{value:'RECAST-MUG-15OZ'}:null,querySelectorAll:s=>s==='.recast-buy'?[button]:[],addEventListener:(name,fn)=>listeners[name]=fn,createElement:()=>({setAttribute(){},addEventListener(name,fn){this[name]=fn}})};
  const context={document,window:{},localStorage:{getItem:()=>JSON.stringify({requestId:'old',accessToken:'old-token'})},location:{origin:'https://recast.test'},URL,console:{warn(){}},setTimeout,fetch:async(...args)=>{calls.push(args);return fetcher(...args)}};
  vm.runInNewContext(source,context);
  return {context,grid,button,error,calls,select:async(id='new')=>{context.window.__recastActiveRequest={requestId:id,accessToken:`${id}-token`};await listeners['recast-artwork-selected']()}};
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
