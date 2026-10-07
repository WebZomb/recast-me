import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const wizard=readFileSync(new URL('../public/creation-wizard.js',import.meta.url),'utf8');
const hq=readFileSync(new URL('../src/highquality.js',import.meta.url),'utf8');
const wrangler=readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8');

test('RM053 keeps pet-first quick choices but exposes a broad subject library',()=>{
 for(const label of ['Two or more pets','Horse','Friends / group','Child / teen','Baby','Family + pet','Motorcycle / bike','Home / special place','Memorial / tribute','Anything else — describe it']) assert.ok(html.includes(label),label);
 assert.ok(wizard.includes("quickSubjects=['pet','person','person and pet','couple','family','car','friends','custom']"));
 assert.ok(wizard.includes('Browse all subjects ↓'));
 assert.match(html,/data-launch-build="RM-053"/);
});

test('expanded subjects preserve reference-label and transformation handling',()=>{
 for(const value of ['multiple pets','family and pet','motorcycle','horse','animal']) assert.ok(wizard.includes(value),value);
 assert.ok(hq.includes('"horse","animal"'));
 assert.ok(hq.includes('"motorcycle","bike"'));
 assert.ok(hq.includes('"friends","group","child","teen","baby","memorial"'));
});

test('render endpoint has a Worker burst limiter in addition to daily credit controls',()=>{
 assert.ok(wrangler.includes('"RENDER_RATE_LIMITER"'));
 assert.ok(wrangler.includes('"limit": 8'));
 assert.ok(hq.includes('env.RENDER_RATE_LIMITER.limit'));
 assert.ok(hq.includes('render_rate_limited'));
 assert.ok(hq.includes('env.RECAST_CREDIT_WALLET?.id'));
});

test('RM053 broadens Worlds without publishing franchise or team-logo presets',()=>{
 const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 for(const label of ['Rock Star','DJ Night','Red Carpet','Beach Escape','Paris Getaway','Master Chef','Pilot','Ancient Egypt','Medieval Kingdom','Tiny World','Food Fantasy']) assert.ok(app.includes(label),label);
 for(const group of ['Music & Fame','Travel & Lifestyle','Careers & Dreams','History & Legends','Funny & Wild']) assert.ok(app.includes(group),group);
 for(const mark of ['Simpsons','Family Guy','South Park','NFL','NBA','Disney','Marvel']) assert.equal(app.includes(mark),false,mark);
});
