#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    (ROOT / path).write_text(text, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one replacement target, found {count}: {old[:120]!r}")
    write(path, text.replace(old, new, 1))


# 1) Remove the self-imposed Promise.race timeout and classify real errors accurately.
replace_once(
    "src/highquality.js",
    '''function isCapacity(error){const m=errorText(error);return m.includes("3040")||m.includes("out of capacity")||m.includes("capacity temporarily exceeded")||m.includes("busy")||m.includes("overload")}
function isTransient(error){const m=errorText(error);return isCapacity(error)||m.includes("timeout")||m.includes("timed out")||m.includes("503")||m.includes("502")||m.includes("504")}''',
    '''function isCapacity(error){const m=errorText(error);return m.includes("3040")||m.includes("out of capacity")||m.includes("capacity temporarily exceeded")||m.includes("busy")||m.includes("overload")}
function isTimeout(error){const m=errorText(error);return error?.reason==="timeout"||error?.name==="TimeoutError"||m.includes("timeout")||m.includes("timed out")}
function isTemporaryUnavailable(error){const m=errorText(error);return m.includes("503")||m.includes("502")||m.includes("504")||m.includes("service unavailable")||m.includes("upstream unavailable")}'''
)

replace_once(
    "src/highquality.js",
    '''async function withAttemptTimeout(promise,ms){
  let timer;
  try{
    return await Promise.race([
      promise,
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error("attempt timeout"),{reason:"capacity"})),ms)})
    ])
  }finally{clearTimeout(timer)}
}

async function tryGeneration(env,model,prompt,inputFiles,kind,settings,timeoutMs){
  const image=await withAttemptTimeout(
    runModel(makeForm(prompt,inputFiles,settings),env,model),
    timeoutMs
  );''',
    '''async function tryGeneration(env,model,prompt,inputFiles,kind,settings){
  // Do not race AI.run against a local timer. Promise.race does not cancel the
  // provider call, so the old 125s/60s timers could discard a late successful
  // result while the inference continued. Capacity is handled by rejectIfBusy;
  // genuine provider timeouts are classified from the provider error itself.
  const image=await runModel(makeForm(prompt,inputFiles,settings),env,model);'''
)

for old, new in [
    ('tryGeneration(env,model,main,inputFiles,"high-primary",settings,125000)', 'tryGeneration(env,model,main,inputFiles,"high-primary",settings)'),
    ('tryGeneration(env,model,safe,inputFiles,"high-safe",settings,125000)', 'tryGeneration(env,model,safe,inputFiles,"high-safe",settings)'),
    ('tryGeneration(env,model,main,inputFiles,"quick-primary",settings,60000)', 'tryGeneration(env,model,main,inputFiles,"quick-primary",settings)'),
    ('tryGeneration(env,model,safe,inputFiles,"quick-safe",settings,60000)', 'tryGeneration(env,model,safe,inputFiles,"quick-safe",settings)'),
]:
    replace_once("src/highquality.js", old, new)

replace_once(
    "src/highquality.js",
    '''        if(isModeration(last))throw Object.assign(new Error("moderation"),{reason:"moderation",code:3030,cause:last});
        if(isTransient(last)||isCapacity(last))throw Object.assign(new Error("capacity"),{reason:"capacity",cause:last});
        throw Object.assign(new Error("provider"),{reason:"provider",cause:last});''',
    '''        if(isModeration(last))throw Object.assign(new Error("moderation"),{reason:"moderation",code:3030,cause:last});
        if(isTimeout(last))throw Object.assign(new Error("timeout"),{reason:"timeout",cause:last});
        if(isCapacity(last))throw Object.assign(new Error("capacity"),{reason:"capacity",cause:last});
        if(isTemporaryUnavailable(last))throw Object.assign(new Error("unavailable"),{reason:"unavailable",cause:last});
        throw Object.assign(new Error("provider"),{reason:"provider",cause:last});'''
)

replace_once(
    "src/highquality.js",
    '''    if(isCapacity(firstError)){
      // Capacity is not a quality failure and should not trigger a second
      // automatic provider submission. The UI can invite a deliberate retry.
      throw Object.assign(new Error("capacity"),{reason:"capacity",cause:firstError});
    }
    if(isTransient(firstError))throw Object.assign(new Error("capacity"),{reason:"capacity",cause:firstError});
    throw Object.assign(new Error("provider"),{reason:"provider",cause:firstError});''',
    '''    if(isTimeout(firstError))throw Object.assign(new Error("timeout"),{reason:"timeout",cause:firstError});
    if(isCapacity(firstError)){
      // Capacity is not a quality failure and should not trigger a second
      // automatic provider submission. The UI can invite a deliberate retry.
      throw Object.assign(new Error("capacity"),{reason:"capacity",cause:firstError});
    }
    if(isTemporaryUnavailable(firstError))throw Object.assign(new Error("unavailable"),{reason:"unavailable",cause:firstError});
    throw Object.assign(new Error("provider"),{reason:"provider",cause:firstError});'''
)

replace_once(
    "src/highquality.js",
    '''      if(isModeration(last))throw Object.assign(new Error("moderation"),{reason:"moderation",code:3030,cause:last});
      if(isTransient(last)||isCapacity(last))throw Object.assign(new Error("capacity"),{reason:"capacity",cause:last});
      throw Object.assign(new Error("provider"),{reason:"provider",cause:last});''',
    '''      if(isModeration(last))throw Object.assign(new Error("moderation"),{reason:"moderation",code:3030,cause:last});
      if(isTimeout(last))throw Object.assign(new Error("timeout"),{reason:"timeout",cause:last});
      if(isCapacity(last))throw Object.assign(new Error("capacity"),{reason:"capacity",cause:last});
      if(isTemporaryUnavailable(last))throw Object.assign(new Error("unavailable"),{reason:"unavailable",cause:last});
      throw Object.assign(new Error("provider"),{reason:"provider",cause:last});'''
)

replace_once(
    "src/highquality.js",
    '''  if(isTransient(firstError)||isCapacity(firstError))throw Object.assign(new Error("capacity"),{reason:"capacity",cause:firstError});
  throw Object.assign(new Error("provider"),{reason:"provider",cause:firstError});''',
    '''  if(isTimeout(firstError))throw Object.assign(new Error("timeout"),{reason:"timeout",cause:firstError});
  if(isCapacity(firstError))throw Object.assign(new Error("capacity"),{reason:"capacity",cause:firstError});
  if(isTemporaryUnavailable(firstError))throw Object.assign(new Error("unavailable"),{reason:"unavailable",cause:firstError});
  throw Object.assign(new Error("provider"),{reason:"provider",cause:firstError});'''
)

replace_once(
    "src/highquality.js",
    '''      const quota=gate.reason==='quota';
      return json({error:quota?'shared_ai_capacity_used':'render_not_ready',reason:gate.reason,retryable:false,retryAt:gate.retryAt||null,qualityMode,userMessage:gate.reason==='configuration'?'Image creation is unavailable while Recast Me checks its required services. Your photo and settings are safe.':quota?'Recast Me has reached its shared AI capacity. Your settings are safe; try again after the cooldown.':qualityMode==='quick'?'Quick Preview is cooling down after a busy response. Wait for Ready before trying again.':'High-Quality Preview is cooling down after a busy response. Wait for Ready before trying again.'},gate.status||503);''',
    '''      const quota=gate.reason==='quota';
      const label=qualityMode==='quick'?'Quick Preview':'High-Quality Preview';
      const userMessage=gate.reason==='configuration'
        ?'Image creation is unavailable while Recast Me checks its required services. Your photo and settings are safe.'
        :quota
        ?'Recast Me has reached its shared AI capacity. Your settings are safe; try again after the cooldown.'
        :gate.reason==='timeout'
        ?`${label} is cooling down after a timeout. Your settings are safe; wait for Ready before trying again.`
        :gate.reason==='unavailable'
        ?`${label} is cooling down after a temporary provider error. Your settings are safe; wait for Ready before trying again.`
        :`${label} is cooling down after a confirmed busy response. Your settings are safe; wait for Ready before trying again.`;
      return json({error:quota?'shared_ai_capacity_used':'render_not_ready',reason:gate.reason,retryable:false,retryAt:gate.retryAt||null,qualityMode,userMessage},gate.status||503);'''
)

replace_once(
    "src/highquality.js",
    '''    if(['capacity','quota'].includes(reason))await recordRenderHealth(env,qualityMode,'failed',reason);''',
    '''    if(['capacity','quota','timeout','unavailable'].includes(reason))await recordRenderHealth(env,qualityMode,'failed',reason);'''
)

replace_once(
    "src/highquality.js",
    '''    if(reason==="capacity")return json({error:"engine_busy",reason:"capacity",retryable:true,diagnosticId,qualityMode,userMessage:"The image engine is temporarily busy. Your photo is safe — tap Try again in a moment."},503);
    return json({error:"generation_failed",reason,retryable:true,diagnosticId,qualityMode,userMessage:"We could not finish this preview. Your uploaded photo was not changed."},500)''',
    '''    if(reason==="capacity")return json({error:"engine_busy",reason:"capacity",retryable:true,diagnosticId,qualityMode,userMessage:"The image engine returned a confirmed busy response. Your photo and settings are safe; wait for Ready before trying again."},503);
    if(reason==="timeout")return json({error:"engine_timeout",reason:"timeout",retryable:true,diagnosticId,qualityMode,userMessage:"The image provider timed out before returning the artwork. Your photo and settings are safe; wait for Ready before trying again."},504);
    if(reason==="unavailable")return json({error:"engine_unavailable",reason:"unavailable",retryable:true,diagnosticId,qualityMode,userMessage:"The image provider is temporarily unavailable. Your photo and settings are safe; wait for Ready before trying again."},503);
    return json({error:"generation_failed",reason,retryable:true,diagnosticId,qualityMode,userMessage:"We could not finish this preview. Your uploaded photo was not changed."},500)'''
)

replace_once("src/highquality.js", '    version:"v1.5",', '    version:"v1.6",')

# 2) Replace render health with explicit per-reason circuits.
write("src/render-health.js", '''const PREFIX='system/render-health',LEGACY_KEY='system/render-health.json',MODES=new Set(['high','quick']);
const BLOCKING_REASONS=new Set(['capacity','quota','timeout','unavailable']);
const modeName=m=>MODES.has(m)?m:'high',key=m=>`${PREFIX}-${modeName(m)}.json`,nowMs=n=>n instanceof Date?n.getTime():Number(n??Date.now()),parseMs=v=>{const n=Date.parse(v||'');return Number.isFinite(n)?n:0};
function seconds(env,name,fallback,min,max){return Math.max(min,Math.min(max,Number(env[name]||fallback)))*1000}
function cooldown(env,reason){
  if(reason==='capacity')return seconds(env,'RENDER_CAPACITY_COOLDOWN_SECONDS',90,15,900);
  if(reason==='quota')return seconds(env,'RENDER_QUOTA_COOLDOWN_SECONDS',300,60,86400);
  if(reason==='timeout')return seconds(env,'RENDER_TIMEOUT_COOLDOWN_SECONDS',45,15,900);
  if(reason==='unavailable')return seconds(env,'RENDER_UNAVAILABLE_COOLDOWN_SECONDS',60,15,1800);
  return 0;
}
async function readJson(env,objectKey){const object=await env.ARTWORK?.get(objectKey);return object?object.json().catch(()=>null):null}
export function localReadiness(env){const missing=[];if(!env.AI?.run)missing.push('AI');if(!env.ARTWORK?.get||!env.ARTWORK?.put)missing.push('ARTWORK');if(!env.IMAGES?.input||!env.IMAGES?.info)missing.push('IMAGES');const controls=String(env.AI_DAILY_CALL_LIMIT??'');if(controls&&!/^(0|[1-9]\d*)$/.test(controls))missing.push('AI_DAILY_CALL_LIMIT');return{ready:missing.length===0,missing}}
export async function renderHealth(env,mode='high',now=Date.now()){
  const local=localReadiness(env),selected=modeName(mode);
  if(!local.ready)return{state:'unconfigured',ready:false,mode:selected,reason:'configuration',missing:local.missing,checkedAt:null,retryAt:null,lastResult:null,lastReason:'configuration',lastSuccessAt:null,lastFailureAt:null,visitorDailyLimit:null};
  const current=nowMs(now),last=await readJson(env,key(selected))||await readJson(env,LEGACY_KEY),retry=parseMs(last?.retryAt),blocked=last?.status==='failed'&&BLOCKING_REASONS.has(last?.reason)&&retry>current;
  return{state:blocked?'paused':'ready',ready:!blocked,mode:selected,reason:blocked?last.reason:null,checkedAt:last?.checkedAt||null,retryAt:blocked?last.retryAt:null,lastResult:last?.status||null,lastReason:last?.reason||null,lastSuccessAt:last?.lastSuccessAt||null,lastFailureAt:last?.lastFailureAt||null,visitorDailyLimit:null};
}
export async function readinessSnapshot(env,now=Date.now()){const local=localReadiness(env),[high,quick]=await Promise.all([renderHealth(env,'high',now),renderHealth(env,'quick',now)]);return{ok:local.ready,checkedAt:new Date(nowMs(now)).toISOString(),local,modes:{high,quick},costsAiCall:false}}
export async function assertRenderReady(env,mode='high',now=Date.now()){const health=await renderHealth(env,mode,now);if(health.ready)return health;const status=health.reason==='quota'?429:health.reason==='timeout'?504:503;throw Object.assign(new Error(health.state==='unconfigured'?'render configuration unavailable':health.reason||'render paused'),{reason:health.reason||'configuration',readiness:true,retryAt:health.retryAt,status})}
export async function recordRenderHealth(env,mode,status,reason=null,now=Date.now()){
  if(mode==='success'||mode==='failed'){reason=status||null;status=mode;mode='high'}
  if(!env.ARTWORK)return;
  const selected=modeName(mode),current=nowMs(now),previous=await readJson(env,key(selected));
  const delay=status==='failed'?cooldown(env,reason):0;
  const retryAt=delay?new Date(current+delay).toISOString():null;
  const payload={mode:selected,status,reason,checkedAt:new Date(current).toISOString(),retryAt,lastSuccessAt:status==='success'?new Date(current).toISOString():previous?.lastSuccessAt||null,lastFailureAt:status==='failed'?new Date(current).toISOString():previous?.lastFailureAt||null};
  await env.ARTWORK.put(key(selected),JSON.stringify(payload),{httpMetadata:{contentType:'application/json'}}).catch(()=>{});
  return payload;
}
''')

# 3) Make the browser distinguish timeout, busy, and unavailable states.
replace_once(
    "public/app.js",
    '''  if(error?.name==='AbortError') return `${label} took too long this time. Your photo and settings are still here — try again or switch quality.`;''',
    '''  if(error?.name==='AbortError') return `${label} was still processing after several minutes, so this page stopped waiting. Keep this page open briefly and check Recent Versions before starting another attempt.`;'''
)
replace_once(
    "public/app.js",
    '''  if(data?.reason==='capacity') return `${label} is temporarily busy. Your photo and settings are still here — try again or switch quality.`;''',
    '''  if(data?.reason==='timeout') return `${label} timed out before the provider returned the artwork. Your photo and settings are still here — wait for Ready before trying again.`;
  if(data?.reason==='capacity') return `${label} received a confirmed busy response. Your photo and settings are still here — wait for Ready or choose another ready quality.`;
  if(data?.reason==='unavailable') return `${label} is temporarily unavailable. Your photo and settings are still here — wait for Ready before trying again.`;'''
)
replace_once(
    "public/app.js",
    '''  if(health.reason==='quota')return `${qualityLabel(mode)} · Shared capacity paused`;
  if(health.reason==='capacity')return `${qualityLabel(mode)} · Temporarily busy — cooling down`;''',
    '''  if(health.reason==='quota')return `${qualityLabel(mode)} · Shared capacity paused`;
  if(health.reason==='timeout')return `${qualityLabel(mode)} · Previous attempt timed out — cooling down`;
  if(health.reason==='capacity')return `${qualityLabel(mode)} · Confirmed busy — cooling down`;
  if(health.reason==='unavailable')return `${qualityLabel(mode)} · Provider temporarily unavailable`;'''
)
replace_once(
    "public/app.js",
    '''  const copy=document.querySelector('#model-copy');if(copy)copy.textContent=readinessMessage(mode);''',
    '''  const copy=document.querySelector('#model-copy');if(copy)copy.textContent=readinessMessage(mode);
  const dot=document.querySelector('.quality-dot');if(dot)dot.dataset.state=ready?'ready':readinessSnapshot?.local?.ready?'waiting':'error';'''
)
replace_once(
    "public/app.js",
    '''    retry.textContent=ready
      ?(lastAttemptQuality==='quick'?'Try Quick again':'Try High-Quality again')
      :(lastAttemptQuality==='quick'?'Quick temporarily busy — checking…':'High Quality temporarily busy — checking…');''',
    '''    const waitText=failed?.reason==='timeout'
      ?`${qualityLabel(lastAttemptQuality)} timed out — checking readiness…`
      :failed?.reason==='unavailable'
      ?`${qualityLabel(lastAttemptQuality)} unavailable — checking…`
      :failed?.reason==='capacity'
      ?`${qualityLabel(lastAttemptQuality)} busy — checking…`
      :`${qualityLabel(lastAttemptQuality)} unavailable — checking…`;
    retry.textContent=ready?(lastAttemptQuality==='quick'?'Try Quick again':'Try High-Quality again'):waitText;'''
)

css_path="public/site-v10.css"
css=read(css_path)
marker="/* RM-010 render readiness status */"
if marker not in css:
    css += '''\n\n/* RM-010 render readiness status */\n.quality-dot[data-state="ready"]{background:#5ee58c!important;box-shadow:0 0 12px rgba(94,229,140,.55)!important}\n.quality-dot[data-state="waiting"]{background:#ffb84d!important;box-shadow:0 0 12px rgba(255,184,77,.55)!important}\n.quality-dot[data-state="error"]{background:#ff5575!important;box-shadow:0 0 12px rgba(255,85,117,.55)!important}\n'''
    write(css_path,css)

# 4) Add cooldown variables.
replace_once(
    "wrangler.jsonc",
    '''    "RENDER_CAPACITY_COOLDOWN_SECONDS": "90",
    "RENDER_QUOTA_COOLDOWN_SECONDS": "300"''',
    '''    "RENDER_CAPACITY_COOLDOWN_SECONDS": "90",
    "RENDER_QUOTA_COOLDOWN_SECONDS": "300",
    "RENDER_TIMEOUT_COOLDOWN_SECONDS": "45",
    "RENDER_UNAVAILABLE_COOLDOWN_SECONDS": "60"'''
)

# 5) Regression tests: no artificial timer, distinct timeout response, and circuits.
generator_path="tests/generator.test.mjs"
generator=read(generator_path)
if "node:fs" not in generator:
    generator=generator.replace("import assert from 'node:assert/strict';", "import assert from 'node:assert/strict';\nimport {readFileSync} from 'node:fs';")
anchor="""test('a recent quota failure blocks repeat paid calls briefly, then permits a fresh attempt',async()=>{"""
addition="""test('provider timeout is distinct from capacity and does not auto-retry',async()=>{\n  let calls=0;const env=envFor(async()=>{calls++;throw new Error('upstream request timed out')});\n  const response=await highQualityTransform(submission(),env);assert.equal(response.status,504);\n  const result=await response.json();assert.equal(result.reason,'timeout');assert.equal(calls,1);\n  assert.match(result.userMessage,/timed out/i);\n});\n\ntest('generation source has no local Promise.race attempt timer',()=>{\n  const source=readFileSync(new URL('../src/highquality.js',import.meta.url),'utf8');\n  assert.doesNotMatch(source,/withAttemptTimeout|attempt timeout|Promise\\.race/);\n});\n\n"""
if addition not in generator:
    if anchor not in generator: raise RuntimeError("generator test anchor missing")
    generator=generator.replace(anchor,addition+anchor,1)
write(generator_path,generator)

readiness_path="tests/render-readiness.test.mjs"
readiness=read(readiness_path)
if "timeout has its own short circuit" not in readiness:
    readiness += """test('timeout has its own short circuit and leaves the other mode ready',async()=>{const e=make({RENDER_TIMEOUT_COOLDOWN_SECONDS:'45'}),n=Date.parse('2026-09-29T20:00:00Z');await recordRenderHealth(e.env,'high','failed','timeout',n);const high=await renderHealth(e.env,'high',n+1000),quick=await renderHealth(e.env,'quick',n+1000);assert.equal(high.ready,false);assert.equal(high.reason,'timeout');assert.equal(quick.ready,true);await assert.rejects(assertRenderReady(e.env,'high',n+1000),x=>x.reason==='timeout'&&x.status===504);assert.equal((await renderHealth(e.env,'high',n+46000)).ready,true);assert.equal(e.calls(),0)});\ntest('temporary provider outage has a separate cooldown',async()=>{const e=make({RENDER_UNAVAILABLE_COOLDOWN_SECONDS:'60'}),n=Date.parse('2026-09-29T20:00:00Z');await recordRenderHealth(e.env,'quick','failed','unavailable',n);assert.equal((await renderHealth(e.env,'quick',n+59000)).ready,false);assert.equal((await renderHealth(e.env,'quick',n+61000)).ready,true);assert.equal(e.calls(),0)});\n"""
write(readiness_path,readiness)

client_test=ROOT/"tests/client-timeout-ui.test.mjs"
client_test.write_text("""import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';\nconst source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');\ntest('client labels timeout separately from confirmed busy',()=>{assert.match(source,/reason==='timeout'/);assert.match(source,/confirmed busy response/i);assert.match(source,/timed out — checking readiness/i)});\ntest('readiness dot exposes ready waiting and error states',()=>{assert.match(source,/dot\\.dataset\\.state/);const css=readFileSync(new URL('../public/site-v10.css',import.meta.url),'utf8');for(const state of ['ready','waiting','error'])assert.match(css,new RegExp(`data-state=\\"${state}\\"`))});\n""",encoding="utf-8")

# 6) Astra handoff: exact evidence, rationale, tests, risks, and rollback.
notes='''# RM-010 — remove false capacity timeout and classify failures accurately

Date: 2026-09-29
Parent: `21d64268631c1609a31dfe7acd01e95001247fe7`

## Evidence that triggered this change

The owner opened the private R2 diagnostic for `GEN-MUN9XZCT-7231`. It records `stage: ai-generation`, `reason: capacity`, `providerCode: null`, and `providerMessage: attempt timeout`. That message was generated by Recast Me itself, not a Cloudflare 3040 capacity response.

Inspection found a local `Promise.race` timer inside `highquality.js`: 125 seconds for High Quality and 60 seconds for Quick. When that timer won, it threw `attempt timeout` with `reason: capacity`. A JavaScript Promise race does not cancel the losing `AI.run` promise, so a late successful inference could continue but be discarded and misreported as capacity. This also made the readiness circuit and UI claim confirmed provider congestion without a provider code.

## Implemented correction

- Removed both local AI attempt timers. Synchronous generation now awaits `AI.run` directly; Cloudflare's `rejectIfBusy: true` remains the immediate, documented busy guard.
- A genuine provider timeout is classified as `timeout`, not `capacity`.
- Confirmed 3040/busy/overload messages remain `capacity`.
- Temporary 502/503/504/service-unavailable responses are classified as `unavailable`.
- No automatic retry is added for timeout, busy, or unavailable failures.
- Per-mode circuits now use separate defaults: capacity 90s, quota 300s, timeout 45s, unavailable 60s. Quick and High remain independent.
- UI and diagnostics now distinguish timeout, confirmed busy, provider unavailable, quota, and browser-side waiting limits. The readiness dot is green only when eligible, amber while waiting, and red for missing local configuration.
- If the browser itself stops waiting after its longer page timeout, the message instructs the user to check Recent Versions before starting another attempt, reducing duplicate-render risk.

## Important limits

This removes a known self-inflicted timeout; it does not guarantee that Flux 2 Dev will complete or preserve likeness. The existing browser wait limit remains 270 seconds for High Quality and 135 seconds for Quick. A browser abort may not prove the provider stopped, so the site does not automatically resubmit. Durable background rendering/resume remains future work.

No engine/provider switch, paid comparison, production merge, purchase, Printful action, X post, or AI inference was performed while applying RM-010.

## Validation and rollback

The one-time patch workflow must run the entire mocked suite and Wrangler dry-run before it commits the application changes. After the resulting commit, the normal repository CI and Cloudflare Preview must also pass. Live acceptance still requires one controlled render, visible flattened watermark in large and Recent Versions images, saved-image protection, and likeness review.

Rollback before merge: leave PR #1 draft/unmerged or reset the branch to `21d6426`. Rolling back would restore the misleading local timeout and is not a safe production remedy.
'''
write("docs/ASTRA-SESSION-RM-010.md",notes)

handoff_path="docs/ASTRA-HANDOFF.md"
handoff=read(handoff_path)
entry='- [RM-010: timeout classification and wait-policy correction](ASTRA-SESSION-RM-010.md). R2 diagnostic `GEN-MUN9XZCT-7231` proved the prior “capacity” result was Recast Me’s own 125-second timer; the artificial timer is removed and timeout/busy/unavailable states are now distinct.\n'
if entry not in handoff:
    handoff += "\n"+entry
write(handoff_path,handoff)

print("RM-010 patch applied successfully")
