import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('Ready-Made QA includes read-only supplier print-dimension review',()=>{
 const html=read('public/admin.html'),script=read('public/admin-printfile-audit.js');
 assert.match(html,/id="printfile-audit-status"/);
 assert.match(html,/id="printfile-audit-refresh"/);
 assert.match(html,/id="printfile-audit-list"/);
 assert.match(html,/admin-printfile-audit\.js\?v=1/);
 assert.match(html,/admin-printfile-audit\.css\?v=1/);
 assert.match(script,/\/api\/shop\/printfile-audit/);
 assert.match(script,/credentials:'omit'/);
 assert.match(script,/document\.createElement/);
 assert.doesNotMatch(script,/\.innerHTML\s*=|method:\s*'POST'|localStorage|window\.open|api\/basket\/approve|production|paymentIntent/);
 assert.match(read('public/admin-printfile-audit.css'),/@media\(max-width:670px\)/);
});
test('original shop and supplier pilot remain unchanged by read-only print-area scanning',()=>{
 const router=read('src/router.js'),scan=read('src/shop-printfile-audit.js'),routes=read('src/shop-routes.js');
 assert.match(router,/runPrintfileAudit\(env\)/);
 assert.match(routes,/if\(path==='\/api\/shop\/printfile-audit'\)/);
 assert.match(scan,/method:'GET'/);
 assert.match(scan,/redirect:'manual'/);
 assert.match(scan,/supplierProofApprovalRequired:true/);
 assert.match(scan,/checkoutEnabled:false/);
 assert.doesNotMatch(scan,/submitOrder|sendToProduction|addPremade\(|createMockup\(|setInventory\(|ShopifyOrder/);
});
