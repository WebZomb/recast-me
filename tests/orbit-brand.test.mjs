import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {brandHtml,HEADER,ICON,SOCIAL} from '../scripts/apply-orbit-brand-v1.mjs';
const old='<span class="brand-mark" aria-hidden="true"><span>R</span><span>M</span></span><span>RECAST ME</span>';
const page=`<!doctype html><html><head><title>Keep this title</title></head><body><a class="brand" href="#home" aria-label="Recast Me home">${old}</a><form id="recast-form"><input name="qualityMode" value="high" checked><button>Create</button></form><footer><div class="brand compact-brand">${old}</div></footer><script src="/app.js?v=230" type="module"></script></body></html>`;

test('approved brand replaces both marks without changing forms or scripts',()=>{const out=brandHtml(page,{home:true});assert.equal((out.match(/class="recast-brand-logo"/g)||[]).length,2);assert.ok(out.includes('href="#home"'));assert.ok(out.includes('<title>Keep this title</title>'));assert.equal(out.match(/<form[\s\S]*?<\/form>/)[0],page.match(/<form[\s\S]*?<\/form>/)[0]);assert.ok(out.includes('<script src="/app.js?v=230" type="module"></script>'));assert.ok(out.includes('alt="Recast Me Ai"'));assert.ok(!out.includes('brand-mark'));});
test('brand application is idempotent',()=>{const once=brandHtml(page,{home:true});assert.equal(brandHtml(once,{home:true}),once);assert.equal((once.match(/name="twitter:card"/g)||[]).length,1);});
test('unrelated pages are left byte-for-byte unchanged',()=>{const text='<html><head></head><body><form>Order data</form></body></html>';assert.equal(brandHtml(text,{home:true}),text);});
test('non-home pages receive approved icons but no public social metadata',()=>{const out=brandHtml(page);assert.ok(out.includes(ICON));assert.ok(out.includes('/brand-orbit-v1.css'));assert.ok(!out.includes('twitter:card'));});
test('approved brand sources are store CDN assets not private customer artwork',()=>{for(const url of [HEADER,ICON,SOCIAL]){const u=new URL(url);assert.equal(u.hostname,'cdn.shopify.com');assert.ok(u.pathname.startsWith('/s/files/1/0854/3810/3796/files/recastmeai-approved-orbit-'));assert.ok(!u.searchParams.has('token'));}});
test('all patched pages retain accessible image labels and responsive logo styling',()=>{const css=readFileSync(new URL('../public/brand-orbit-v1.css',import.meta.url),'utf8');assert.match(css,/@media\(max-width:480px\)/);assert.match(css,/max-width:46vw/);assert.match(brandHtml(page),/width="580" height="144" alt="Recast Me Ai"/);});
