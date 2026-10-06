import {readFileSync,writeFileSync} from 'node:fs';
const rep=(p,a,b)=>{const s=readFileSync(p,'utf8');if(!s.includes(a))throw new Error('missing '+a+' in '+p);writeFileSync(p,s.replaceAll(a,b));};
rep('tests/checkout-ui.test.mjs',/jack-russell-source-v18\\\.webp/.source,/dog-original-v17\\\.webp/.source);
rep('tests/checkout-ui.test.mjs',"assert.match(app,/image:\"https:\\/\\/cdn\\.shopify\\.com\\/[^\"]*recast-neon-mug-cutout-v48\\.png/);","assert.match(app,/image:\"\\/assets\\/product-mug-v16\\.webp\"/);");
rep('tests/checkout-ui.test.mjs',"assert.match(checkout,/\"Custom Recast Mug\":\"https:\\/\\/cdn\\.shopify\\.com\\/[^\"]*recast-neon-mug-cutout-v48\\.png/);","assert.match(checkout,/\"Custom Recast Mug\":\"\\/assets\\/product-mug-v16\\.webp\"/);");
rep('tests/domain-flow-rm050.test.mjs',"assert.match(privateRecastLink('https://recastmeai.com',{requestId:'RC-ABCDEFGH',accessToken:'secret-token'}),/^https://recastmeai.com/#/);","assert.ok(privateRecastLink('https://recastmeai.com',{requestId:'RC-ABCDEFGH',accessToken:'secret-token'}).startsWith('https://recastmeai.com/#'));");
