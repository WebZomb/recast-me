import {readFileSync,writeFileSync} from 'node:fs';
function replaceOnce(path,oldText,newText){
  const text=readFileSync(path,'utf8');
  if(text.split(oldText).length!==2)throw new Error('Expected one exact integration point in '+path);
  writeFileSync(path,text.replace(oldText,()=>newText));
}
replaceOnce('src/router.js','import app from "./entry.js";',
  'import app from "./entry.js";\nimport {printfulDiagnosticRoute} from "./printful-diagnostics.js";');
replaceOnce('src/router.js','    const url = new URL(request.url);',
  '    const url = new URL(request.url);\n    const diagnostic = await printfulDiagnosticRoute(request, env, {requireAdmin});\n    if (diagnostic) return diagnostic;');
replaceOnce('public/admin.js',"import {initOwnerSettings} from './admin-settings.js?v=250';",
  "import {initOwnerSettings} from './admin-settings.js?v=250';\nimport {attachPrintfulDiagnostic} from './printful-diagnostics.js?v=rm0503';");
replaceOnce('public/admin.js','  article.append(actions);list.append(article);shownJobs++;',
  '  article.append(actions);attachPrintfulDiagnostic(article,j,api);list.append(article);shownJobs++;');
replaceOnce('public/admin.js',"location.hostname==='recast-me.sergz24.workers.dev'?'Production':'Preview / alternate host'",
  "['recastmeai.com','recast-me.sergz24.workers.dev'].includes(location.hostname)?'Production':'Preview / alternate host'");
replaceOnce('public/admin.js',' · RM-050`;',' · RM-050.3 diagnostics`;');
replaceOnce('public/admin.html','/admin.js?v=rm050','/admin.js?v=rm0503');
const index='docs/ASTRA-HANDOFF.md',before=readFileSync(index,'utf8');
writeFileSync(index,before+'\nLatest fulfillment diagnostics: [RM-050.3 — read-only Printful order lookup and draft-attempt investigation](ASTRA-SESSION-RM-0503.md).\n');
console.log('Integrated read-only diagnostics. No order state, retry claim, scheduler, generator or print layout changed.');
