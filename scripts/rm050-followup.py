from pathlib import Path

def replace(path, old, new):
    p=Path(path); s=p.read_text(); assert old in s, path
    p.write_text(s.replace(old,new))
replace('scripts/rm050-browser-tests.cjs','new URL(request.url),p=url.pathname','new URL(request.url()),p=url.pathname')
replace('public/app.js', "fallback.exhausted&&mode==='high'?fallback.message:readinessMessage(mode)", "fallback.exhausted&&mode==='high'?'High Quality allowance used. See your options below.':readinessMessage(mode)")
replace('public/index.html','id="choose-standard">Try Standard Preview','id="choose-standard">Use Standard instead')
replace('public/admin-settings.js',"const button=form.querySelector('[type=submit]');button.disabled=true;", "const button=form.querySelector('[type=submit]');button.disabled=true;text('owner-settings-save-status','');")
replace('public/admin.html','<span>Website calls</span>','<span>Website attempts</span>')
replace('public/admin.html','<span>X calls</span>','<span>X attempts</span>')
p=Path('docs/ASTRA-SESSION-RM-050.md');p.write_text(p.read_text()+'\nCI attempt 37528626385: source checksum, 196 Node tests and Wrangler bundle passed. Browser harness stopped because Playwright Request.url was referenced instead of called; fixed the test harness to use url(). No browser pass or publication was claimed from that failed attempt. Also shortened the repeated exhaustion notice, clarified the Standard selection button, and cleared stale admin save errors.\n')
