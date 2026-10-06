import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const BRAND_VERSION='orbit-approved-v1';
export const HEADER='https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recastmeai-approved-orbit-header-v1.png?v=1791313673';
export const ICON='https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recastmeai-approved-orbit-icon-v1.png?v=1791313742';
export const SOCIAL='https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recastmeai-approved-orbit-stacked-v1.png?v=1791313709';
const oldMark=/<span\b[^>]*class=["'][^"']*\bbrand-mark\b[^"']*["'][^>]*>\s*<span[^>]*>R<\/span>\s*<span[^>]*>M<\/span>\s*<\/span>\s*<span[^>]*>RECAST ME<\/span>/g;
const newMark=`<img class="recast-brand-logo" src="${HEADER}&amp;width=800" width="580" height="144" alt="Recast Me Ai" decoding="async">`;

export function brandHtml(input,{home=false}={}){
  const changed=input.replace(oldMark,newMark);
  if(changed===input&&!input.includes('class="recast-brand-logo"'))return input;
  let html=changed;
  if(!html.includes('/brand-orbit-v1.css'))html=html.replace(/<\/head>/i,'  <link rel="stylesheet" href="/brand-orbit-v1.css?v=1">\n</head>');
  if(!html.includes('name="recast-brand-version"')){
    html=html.replace(/<link\b(?=[^>]*\brel=["'](?:shortcut )?icon["'])[^>]*>/gi,'');
    html=html.replace(/<link\b(?=[^>]*\brel=["']apple-touch-icon["'])[^>]*>/gi,'');
    html=html.replace(/<\/head>/i,`  <meta name="recast-brand-version" content="${BRAND_VERSION}">\n  <link rel="icon" type="image/png" href="${ICON}&amp;width=64">\n  <link rel="apple-touch-icon" href="${ICON}&amp;width=180">\n</head>`);
  }
  if(home&&!html.includes('name="recast-brand-social"')){
    html=html.replace(/<meta\b(?=[^>]*(?:name|property)=["'](?:og:(?:title|description|image|image:alt)|twitter:(?:card|site|title|description|image|image:alt))["'])[^>]*>/gi,'');
    html=html.replace(/<\/head>/i,`  <meta name="recast-brand-social" content="${BRAND_VERSION}">\n  <meta property="og:title" content="Recast Me Ai — Your photo. A whole new world.">\n  <meta property="og:description" content="Turn photos of pets, people and the ones you love into AI artwork and personalized gifts.">\n  <meta property="og:image" content="${SOCIAL}">\n  <meta property="og:image:alt" content="Recast Me Ai — cyan and magenta swirling RM logo">\n  <meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:site" content="@recastmeai">\n  <meta name="twitter:title" content="Recast Me Ai — Your photo. A whole new world.">\n  <meta name="twitter:description" content="Personalized AI artwork for pets, people and the ones you love. Put your favorite on something real.">\n  <meta name="twitter:image" content="${SOCIAL}">\n  <meta name="twitter:image:alt" content="Recast Me Ai — cyan and magenta swirling RM logo">\n</head>`);
  }
  return html;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const modified=[];
  for(const file of readdirSync('public').filter(n=>n.endsWith('.html'))){
    const path=`public/${file}`,before=readFileSync(path,'utf8'),after=brandHtml(before,{home:file==='index.html'});
    if(after!==before){writeFileSync(path,after);modified.push(path);}
  }
  if(!readFileSync('public/index.html','utf8').includes('class="recast-brand-logo"'))throw new Error('Home logo replacement did not match; refusing to publish.');
  console.log(JSON.stringify({brand:BRAND_VERSION,modified},null,2));
  const index='docs/ASTRA-HANDOFF.md',link='\nLatest branding: [Approved RM orbit logo deployment and social assets](ASTRA-BRAND-ORBIT-2026-10-06.md).\n';
  if(!readFileSync(index,'utf8').includes('ASTRA-BRAND-ORBIT-2026-10-06.md'))writeFileSync(index,readFileSync(index,'utf8')+link);
}
