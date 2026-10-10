import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
test('Public beta switches only High Quality to verified fal and preserves budgets/Standard/commerce',()=>{
 const config=JSON.parse(read('wrangler.jsonc').replace(/\/\/ Preserve the existing production Images binding during controlled testing\./,''));
 const vars=config.vars;
 assert.equal(vars.RECAST_HQ_PROVIDER,'fal');
 assert.equal(vars.FAL_PROVIDER_ENABLED,'true');
 assert.equal(vars.FAL_PROVIDER_VERIFIED,'true');
 assert.equal(vars.CF_PROVIDER_VERIFIED,'false');
 assert.equal(vars.FAL_OWNER_TEST_ENABLED,'true');
 assert.equal(vars.IMAGE_MODEL_QUICK,'@cf/black-forest-labs/flux-2-klein-9b');
 assert.equal(vars.HQ_FREE_ALLOWANCE,'3');assert.equal(vars.STANDARD_FREE_ALLOWANCE,'5');
 assert.equal(vars.AI_DAILY_CALL_LIMIT,'70');assert.equal(vars.AI_DAILY_BUDGET_CENTS,'500');
 assert.equal(vars.ORDER_SYNC_ENABLED,'true');assert.equal(vars.AUTO_PRINT_PREAPPROVED_ENABLED,'true');
});
test('Customer render timing and consent are accurate and clearly presented',()=>{
 const html=read('public/index.html');
 assert.doesNotMatch(html,/id="render-time-hint"/);
 assert.doesNotMatch(html,/id="generation-wait-note"/);
 assert.doesNotMatch(html,/30–40 seconds/); // The estimate lives only in the active waiting screen.
 assert.match(html,/id="generation-clock"/);
 assert.match(html,/fal\.ai or Cloudflare Workers AI/);
 assert.match(html,/render-wait-v1\.css\?v=2/);
 assert.match(html,/app\.js\?v=273/);
 assert.match(html,/aria-label="An animation indicating the render is still in progress, not a percentage"/);
 assert.match(html,/id="generation-elapsed" class="render-elapsed" role="timer"/);
 const css=read('public/render-wait-v1.css');
 assert.match(css,/@keyframes recastRenderSweep/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/#loading \.render-elapsed > #generation-clock/);
 assert.match(css,/#loading \.render-elapsed > \.render-clock-icon/);
 assert.match(css,/animation:none!important;transform:none!important/);
 assert.match(css,/border:0!important;border-radius:0!important/);
 assert.match(css,/#loading\.render-wait-active \.generation-track > span/);
});
test('Render overlay stages are timed, honest, visible, and stop cleanly',()=>{
 const source=read('public/app.js');
 const a=source.indexOf('let generationTimer=null;'),b=source.indexOf('function friendlyGenerationError(',a);
 assert.ok(a>0&&b>a,'Generation UI helpers were present');
 assert.match(source,/startGenerationUI\(selectedQuality\(\),'preparing'\)/);
 assert.match(source,/advanceGenerationUI\('rendering'\)/);
 assert.match(source,/advanceGenerationUI\('finishing'\)/);
 assert.equal((source.match(/30–40 seconds/g)||[]).length,2,'Estimate is only rendered in a single phase-specific detail field');
 assert.doesNotMatch(source,/render-time-hint-title|generation-wait-note/);
 assert.doesNotMatch(source,/Promise\.race\(/);
 let now=0,intervalCreated=0,intervalCleared=0;
 const nodes={};
 function node(name){
  nodes[name] ||= {textContent:'',style:{},classList:{items:new Set(),add(n){this.items.add(n)},remove(n){this.items.delete(n)},toggle(n,value){if(value)this.items.add(n);else this.items.delete(n)},contains(n){return this.items.has(n)}}};
  return nodes[name];
 }
 node('#generation-status');node('#generation-detail');node('#generation-clock');node('#generation-progress');node('#loading');
 const context=vm.createContext({
  Date:{now:()=>now},setInterval:()=>++intervalCreated,clearInterval:()=>{intervalCleared++},
  generationInFlight:true,
  document:{querySelector:node,querySelectorAll:()=>[]}
 });
 vm.runInContext(source.slice(a,b)+ '\n globalThis.TEST_API={startGenerationUI,advanceGenerationUI,tickGenerationUI,stopGenerationUI,updateQualityUI}',context);
 const api=context.TEST_API;
 api.startGenerationUI('high','preparing');
 assert.equal(node('#generation-status').textContent,'Preparing your photos…');
 assert.equal(node('#generation-clock').textContent,'0:00 elapsed');
 assert.equal(node('#loading').classList.contains('render-wait-active'),true);
 api.advanceGenerationUI('rendering');
 assert.match(node('#generation-detail').textContent,/30–40 seconds/);
 now=22000;api.tickGenerationUI();
 assert.equal(node('#generation-clock').textContent,'0:22 elapsed');
 assert.equal(node('#generation-status').textContent,'Making your Recast…');
 now=53000;api.tickGenerationUI();
 assert.equal(node('#generation-detail').textContent,'This is taking longer than usual. Your preview may still finish—please keep this page open.');
 now=93000;api.tickGenerationUI();
 assert.match(node('#generation-status').textContent,/taking longer/);
 api.advanceGenerationUI('finishing');
 assert.equal(node('#generation-status').textContent,'Your artwork is ready!');
 api.stopGenerationUI(true);
 assert.equal(node('#loading').classList.contains('render-wait-active'),false);
 assert.equal(node('#generation-progress').style.width,'100%');
 api.startGenerationUI('quick','rendering');
 now+=23000;api.tickGenerationUI();
 assert.match(node('#generation-detail').textContent,/Standard preview/);
 assert.doesNotMatch(node('#generation-detail').textContent,/30–40 seconds/);
 assert.doesNotMatch(node('#generation-detail').textContent,/30–40 seconds/);
 api.stopGenerationUI();
 assert.equal(intervalCreated,2);
 assert.ok(intervalCleared>=1);
});
