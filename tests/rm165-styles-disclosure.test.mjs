import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bindStylesDismissal} from '../public/styles-disclosure.js';
class Bus{
 constructor(){this.listeners=new Map();this.attrs={};this.label={textContent:''};this.nodes=new Set([this]);}
 addEventListener(type,fn){const list=this.listeners.get(type)||[];list.push(fn);this.listeners.set(type,list);}
 removeEventListener(type,fn){this.listeners.set(type,(this.listeners.get(type)||[]).filter(f=>f!==fn));}
 emit(type,event={}){for(const fn of this.listeners.get(type)||[])fn(event);}
 contains(node){return this.nodes.has(node);}
 setAttribute(k,v){this.attrs[k]=v;}
 querySelector(){return this.label;}
 focus(){this.focused=true;}
}
function fixture(open=true){
 const doc=new Bus(),panel=new Bus(),trigger=new Bus(),select=new Bus();
 panel.hidden=!open;panel.nodes.add(select);select.value='halloween';
 let observer;
 class Observer{constructor(fn){this.fn=fn;observer=this;}observe(p,opts){this.panel=p;this.opts=opts;}disconnect(){this.closed=true;}}
 const calls=[];
 const stop=bindStylesDismissal({panel,trigger,select,doc,Observer,setOpen(value){calls.push(value);panel.hidden=!value;}});
 return {doc,panel,trigger,select,calls,stop,observer};
}
const closed=x=>{assert.equal(x.panel.hidden,true);assert.equal(x.trigger.label.textContent,'More Styles ↓');assert.equal(x.trigger.attrs['aria-expanded'],'false');};
test('outside pointer/touch completes the tap before collapsing or moving its target',()=>{
 const x=fixture(),target={};
 x.doc.emit('pointerdown',{target});x.doc.emit('focusin',{target});
 assert.equal(x.panel.hidden,false,'Do not shift the page under the pointer');
 x.doc.emit('pointerup',{target});assert.equal(x.panel.hidden,false);
 x.doc.emit('click',{target});closed(x);assert.equal(x.select.value,'halloween');assert.equal(x.trigger.focused,undefined);
});
test('assistive clicks dismiss without requiring pointer events',()=>{const x=fixture();x.doc.emit('click',{target:{}});closed(x);});
test('clicks on the trigger, its image, the panel, and select stay inside',()=>{
 const x=fixture();const image={};x.trigger.nodes.add(image);
 for(const target of [x.trigger,image,x.panel,x.select])x.doc.emit('click',{target});
 assert.equal(x.panel.hidden,false);assert.equal(x.trigger.attrs['aria-expanded'],'true');assert.equal(x.calls.length,0);
});
test('Escape closes the disclosure and returns keyboard focus',()=>{
 const x=fixture();let prevented=false;x.doc.emit('keydown',{key:'Escape',preventDefault(){prevented=true;}});
 closed(x);assert.equal(prevented,true);assert.equal(x.trigger.focused,true);
});
test('keyboard focus leaving closes without stealing focus, even after a cancelled touch',()=>{
 const x=fixture();x.doc.emit('focusin',{target:x.select});assert.equal(x.panel.hidden,false);
 x.doc.emit('pointerdown',{target:x.select});x.doc.emit('pointercancel',{});
 x.doc.emit('focusin',{target:{}});closed(x);assert.equal(x.trigger.focused,undefined);
});
test('choosing any style including custom preserves it and closes the list',()=>{
 for(const value of ['halloween','royal','custom']){const x=fixture();x.select.value=value;x.select.emit('change');closed(x);assert.equal(x.select.value,value);}
});
test('externally hidden panels synchronize aria and copy without a mutation loop',()=>{
 const x=fixture();x.panel.hidden=true;x.observer.fn();closed(x);assert.equal(x.calls.length,0);
 x.panel.hidden=false;x.observer.fn();assert.equal(x.trigger.label.textContent,'Fewer Styles ↑');
 assert.deepEqual(x.observer.opts,{attributes:true,attributeFilter:['hidden']});
});
test('closed panels and unrelated keys are unaffected; cleanup removes listeners',()=>{
 const x=fixture(false);x.doc.emit('keydown',{key:'Enter'});x.doc.emit('click',{target:{}});assert.equal(x.calls.length,0);
 x.stop();assert.equal(x.observer.closed,true);x.panel.hidden=false;x.doc.emit('click',{target:{}});assert.equal(x.panel.hidden,false);
});
test('wizard loads the dismissal helper; helper cannot render or change commerce',()=>{
 const source=readFileSync('public/styles-disclosure.js','utf8');
 assert.doesNotMatch(source,/fetch\s*\(|localStorage|\/api\/|\.value\s*=/);
 assert.match(readFileSync('public/creation-wizard.js','utf8'),/bindStylesDismissal\(\{panel:allWorlds/);
});
