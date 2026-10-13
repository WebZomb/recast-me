import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('public/mobile-bottom-nav.js','utf8');
function runAt(pathname,native=false){
  const bodyClasses=new Set();
  function node(tag){
    return {
      tagName:tag,className:'',children:[],attributes:{},style:{setProperty(){}},
      classList:{
        add(v){bodyClasses.add(v)},remove(v){bodyClasses.delete(v)},
        toggle(v,on){if(on)bodyClasses.add(v);else bodyClasses.delete(v)}
      },
      append(...items){
        for(const item of items){this.children.push(item);item.parentElement=this;item.isConnected=true}
      },
      setAttribute(key,value){this.attributes[key]=String(value)}
    };
  }
  const body=node('body'),head=node('head');
  const document={
    body,head,
    querySelector(){return null},
    createElement:node,createElementNS(_ns,name){return node(name)}
  };
  const window={
    webkit:native?{messageHandlers:{recastPreview:{}}}:undefined,
    matchMedia(){return {matches:false,addEventListener(){}}},
    addEventListener(){}
  };
  vm.runInNewContext(source,{window,document,location:{pathname},console});
  const dock=body.children.find(x=>x.className==='recast-mobile-nav');
  return {dock,selected:dock?.children.filter(x=>x.attributes['aria-current']==='page')
                      .map(x=>x.children[1]?.textContent)||[]};
}
test('Cloudflare extensionless and canonical .html pages highlight the same tab',()=>{
  const tests=[
    ['/', 'Create'],['/index.html','Create'],['/index','Create'],
    ['/my-recasts','My Recasts'],['/my-recasts.html','My Recasts'],
    ['/my-orders','My Orders'],['/my-orders.html','My Orders'],
    ['/specials','Specials'],['/specials.html','Specials'],
    ['/guide','Guide'],['/guide.html','Guide']
  ];
  for(const [pathname,expected] of tests){
    const {dock,selected}=runAt(pathname);
    assert.ok(dock,pathname+' should have a nav');
    assert.equal(dock.children.length,5,pathname+' should show five destinations');
    assert.deepEqual(selected,[expected],pathname+' highlights correct button');
  }
});
test('Unrelated pages do not incorrectly highlight a different nav tab',()=>{
  const {selected}=runAt('/private-order');
  assert.deepEqual(selected,[]);
});
test('Native TestFlight keeps only its real SwiftUI tab bar, not a duplicate web dock',()=>{
  assert.equal(runAt('/specials',true).dock,undefined);
});
