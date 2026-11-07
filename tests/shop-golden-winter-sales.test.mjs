import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../public/shop.js',import.meta.url),'utf8');
const shop=readFileSync(new URL('../public/shop.html',import.meta.url),'utf8');
const christmas=readFileSync(new URL('../public/christmas.html',import.meta.url),'utf8');

test('Only the original Golden Retriever 11 oz sales illustration gets the richer Christmas background',()=>{
  assert.ok(source.includes("'golden-winter-lights-mug-11oz':'https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-winter-lights-festive-sales-v2-20261103.webp?v=1793757067'"));
  assert.ok(source.includes("'golden-winter-lights-mug-15oz':'/shop-assets/golden-mug-15oz-sales.webp'"));
  assert.ok(source.includes("offer.designId==='christmas-golden-retriever-winter-lights'"));
  assert.ok(source.includes("offer.artworkRevision==='a003e979d4a1c2056d37f9c23610399dd83ed82ec0f85cde8733f99fbd1ff0a2'"));
  assert.ok(source.includes("salesForApproved.get(offer.designId+'|'+offer.artworkRevision)"));
  assert.match(shop,/src="\/shop\.js\?v=11"/);
  assert.match(christmas,/src="\/shop\.js\?v=11"/);
  assert.doesNotMatch(source,/christmas-village-golden-retriever-mug-sales-v2/);
});
