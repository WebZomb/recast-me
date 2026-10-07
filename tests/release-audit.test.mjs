import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('release audit derives the production marker from the exact checked-out application',()=>{
 const script=readFileSync(new URL('../scripts/launch-audit.cjs',import.meta.url),'utf8');
 assert.ok(script.includes("fs.readFileSync(path.resolve('public/index.html')"));
 assert.ok(script.includes('metrics.build!==expectedBuild'));
 assert.ok(script.includes('if(!expectedBuild)throw'));
 assert.ok(!script.includes('RM-051.1'));
 assert.ok(script.includes("['GET','HEAD','OPTIONS'].includes(r.method())"));
});
