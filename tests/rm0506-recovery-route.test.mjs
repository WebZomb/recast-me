import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('RM0506 recovery action is routed to adminJobAction',()=>{
  const src=readFileSync(new URL('../src/workflow.js',import.meta.url),'utf8');
  const line=src.split('\n').find(x=>x.includes('/api\\/admin\\/job')&&x.includes('create-draft'));
  assert.ok(line,'Admin job route regex must exist');
  assert.match(line,/recover-missing-draft/);
  assert.match(line,/send-production/);
});
