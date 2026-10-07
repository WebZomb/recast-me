import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {productPrintfile} from '../src/commerce-store.js';
import {mockupPosition} from '../src/workflow.js';

test('RM0511 Printful dimensions accept numeric strings instead of falsely reporting unavailable',()=>{
  const catalog={
    printfiles:[{printfile_id:44,width:'2700',height:'1050',dpi:150}],
    variant_printfiles:[{variant_id:'23470',placements:{default:'44'}}]
  };
  const file=productPrintfile(catalog,23470,'default');
  assert.equal(file.width,2700);assert.equal(file.height,1050);
  const pos=mockupPosition(catalog,23470,'default',{width:1024,height:1024,product:'Tumbler',design:{product:'Tumbler',layout:'two-sided',fill:'ambient',x:'center',scale:108,spacing:'standard'}});
  assert.deepEqual(pos,{area_width:2700,area_height:1050,width:2700,height:1050,top:0,left:0});
});

test('RM0511 checkout deduplicates repeated Printful view labels and uses compact names',()=>{
  const source=readFileSync(new URL('../public/checkout.js',import.meta.url),'utf8');
  const context={document:{querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}},window:{},localStorage:{getItem:()=>null},location:{origin:'https://recast.test'},URL,console,setTimeout,fetch:async()=>({ok:false,json:async()=>({})})};
  vm.runInNewContext(source,context);
  const views=vm.runInNewContext(`uniqueMockupViews([
    {title:'Front view',url:'1'},{title:'Front view',url:'2'},
    {title:'Back',url:'3'},{title:'Back view',url:'4'},
    {title:'Product details',url:'5'}
  ])`,context);
  assert.deepEqual(Array.from(views,v=>v.label),['Front','Back','Detail']);
});

test('RM0511 apparel defaults are centered transparent fit rather than a large pasted square',()=>{
  const source=readFileSync(new URL('../public/checkout.js',import.meta.url),'utf8');
  assert.match(source,/"Custom Recast Hoodie": \{product:"Hoodie",layout:"fit",fill:"transparent",x:"center",scale:100/);
  assert.match(source,/"Custom Recast T-Shirt": \{product:"T-Shirt",layout:"fit",fill:"transparent",x:"center",scale:100/);
});

test('RM0511 product UI uses compact view chips and a compact ready badge',()=>{
  const css=readFileSync(new URL('../public/product-polish-v53.css',import.meta.url),'utf8');
  const source=readFileSync(new URL('../public/checkout.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  assert.match(html,/product-polish-v53\.css\?v=[1234]/);
  assert.match(source,/className="mockup-view-chip"/);
  assert.match(source,/button\.textContent="Preview ready ✓"/);
  assert.match(css,/\.mockup-view-chip\[aria-pressed="true"\]/);
  assert.match(css,/\.real-mockup-ready \.product-preview-action/);
});

test('RM0511 storefront errors do not expose deployment stage or worker IDs',()=>{
  const source=readFileSync(new URL('../public/checkout.js',import.meta.url),'utf8');
  assert.match(source,/console\.warn\("Recast product preview start failed"/);
  assert.match(source,/Your Recast is saved/);
  const publicThrow=source.slice(source.indexOf('const customer='),source.indexOf('const mockupId='));
  assert.doesNotMatch(publicThrow,/throw new Error\(internal\)/);
});
