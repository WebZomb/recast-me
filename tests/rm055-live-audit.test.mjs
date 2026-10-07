import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('published-example audit keeps all seven checks, closes browsers and has finite waits',()=>{
 const script=readFileSync(new URL('../scripts/rm055-published-example-audit.cjs',import.meta.url),'utf8');
 assert.ok(script.includes('record.examples.length,7'));
 assert.ok(script.includes("record.blocked.length,0"));
 assert.ok(script.includes('finally{await browser.close();report()}'));
 assert.ok(script.includes('setDefaultTimeout(12000)'));
 assert.ok(script.includes('timeout:20000'));
 assert.ok(script.includes('record.diagnostic='));
 assert.ok(script.includes("['GET','HEAD','OPTIONS']"));
});
