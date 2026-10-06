from pathlib import Path

def replace(path, old, new):
    p=Path(path); s=p.read_text(); assert old in s, path
    p.write_text(s.replace(old,new))
replace('scripts/rm050-browser-tests.cjs','new URL(request.url),p=url.pathname','new URL(request.url()),p=url.pathname')
replace('scripts/rm050-browser-tests.cjs', "else if(p==='/api/public-config')", "else if(p==='/api/request/RC-TEST0001-ABCDEF/preview')d={ok:true,watermarked:true,image:'data:image/webp;base64,'+fs.readFileSync(path.join(root,'assets/world-game-v18.webp')).toString('base64')};\n   else if(p==='/api/public-config')")
replace('scripts/rm050-browser-tests.cjs', "assert.equal(await page.locator('.product-design-controls').count(),1);", "await page.locator('.product-design-controls').waitFor({state:'attached'});assert.equal(await page.locator('.product-design-controls').count(),1);")
replace('public/app.js', "fallback.exhausted&&mode==='high'?fallback.message:readinessMessage(mode)", "fallback.exhausted&&mode==='high'?'High Quality allowance used. See your options below.':readinessMessage(mode)")
replace('public/index.html','id="choose-standard">Try Standard Preview','id="choose-standard">Use Standard instead')
replace('public/admin-settings.js',"const button=form.querySelector('[type=submit]');button.disabled=true;", "const button=form.querySelector('[type=submit]');button.disabled=true;text('owner-settings-save-status','');")
replace('public/admin.html','<span>Website calls</span>','<span>Website attempts</span>')
replace('public/admin.html','<span>X calls</span>','<span>X attempts</span>')
p=Path('docs/ASTRA-SESSION-RM-050.md');p.write_text(p.read_text()+'\nCI attempt 37528626385: source checksum, 196 Node tests and Wrangler bundle passed. Browser harness stopped because Playwright Request.url was referenced instead of called; fixed the harness to use url(). CI attempt 37529121500 also passed 196 Node tests and bundle, then correctly rejected its incomplete saved-preview fixture: no image had been returned, so the app did not activate checkout. Added the mocked protected-preview response and wait for checkout activation. Neither failed attempt published application changes. Also shortened the repeated exhaustion notice, clarified the Standard selection button, and cleared stale admin save errors.\n')
