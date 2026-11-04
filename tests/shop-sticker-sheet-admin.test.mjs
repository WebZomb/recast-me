import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('ready-made owner panel compares protected original image with real six-sticker product views',()=>{
 const html=read('public/admin.html'),ui=read('public/admin-sticker-sheet-qa.js');
 for(const id of ['sticker-sheet-proof-refresh','sticker-sheet-proof-status','sticker-sheet-proof-grid'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/admin-sticker-sheet-qa\.css\?v=1/);
 assert.match(html,/admin\.js\?v=sheet1/);
 assert.match(ui,/initStickerSheetReview/);
 assert.match(ui,/\/api\/shop\/sticker-sheet-pilot\/qa/);
 assert.match(ui,/\/api\/shop\/sticker-sheet-pilot/);
 assert.match(ui,/u\.origin!==location\.origin/);
 assert.match(ui,/referrerPolicy='no-referrer'/);
 assert.match(ui,/document\.createElement/);
 assert.doesNotMatch(ui,/\.innerHTML\s*=|localStorage|approveProduct|sendToProduction|cartAction/);
 assert.match(read('public/admin-sticker-sheet-qa.css'),/@media\(max-width:480px\)/);
});
test('coaster, magnet and six-sticker images all clear when Control Center locks',()=>{
 const admin=read('public/admin.js');
 assert.match(admin,/initCoasterReview\(api\)/);
 assert.match(admin,/initMagnetReview\(api\)/);
 assert.match(admin,/initStickerSheetReview\(api\)/);
 assert.match(admin,/stickerSheetReview\.load\(\)/);
 assert.match(admin,/function lock\(\)\{stickerSheetReview\.clear\(\);magnetReview\.clear\(\);coasterReview\.clear\(\)/);
 assert.match(read('src/router.js'),/runStickerSheetPilot\(env\)/);
 assert.match(read('src/shop-routes.js'),/stickerSheetPilotOwnerProof/);
});
