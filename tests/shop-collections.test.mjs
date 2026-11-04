import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {SHOP_COLLECTIONS,collectionBySlug,collectionDesigns,categoryOffers} from '../public/shop-collections.js';
import {readyOffer} from '../public/shop-model.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const gallery=JSON.parse(read('public/shop-gallery.json'));
const designs=collectionDesigns(gallery.designs);
const nonMugs=SHOP_COLLECTIONS.filter(c=>c.slug!=='mugs');

test('35 exact-source Christmas pet illustrations are reused for each physical item, not fake new assets',()=>{
 assert.equal(designs.length,35);
 assert.equal(designs.filter(d=>d.pet==='dog').length,22);
 assert.equal(designs.filter(d=>d.pet==='cat').length,13);
 assert.equal(new Set(designs.map(d=>d.designId)).size,35);
 for(const d of designs){
  assert.match(d.artworkRevision,/^[a-f0-9]{64}$/);
  assert.match(d.artworkImage,/^https:\/\/cdn\.shopify\.com\//);
  assert.equal('priceCents' in d,false);
  assert.equal('variantId' in d,false);
  assert.equal(readyOffer(d),false);
 }
});
test('product pages cover all 17 configured physical categories with one canonical destination per item',()=>{
 assert.equal(SHOP_COLLECTIONS.length,17);
 assert.equal(nonMugs.length,16);
 assert.equal(new Set(SHOP_COLLECTIONS.map(c=>c.slug)).size,17);
 assert.equal(new Set(SHOP_COLLECTIONS.map(c=>c.url)).size,17);
 assert.equal(collectionBySlug('blankets').offerType,'blanket');
 assert.deepEqual(collectionBySlug('blankets').sizes,['50 × 60 in','60 × 80 in']);
 assert.equal(collectionBySlug('mugs').url,'/shop');
 for(const c of nonMugs){
  const file='public/shop-'+c.slug+'.html';
  assert.ok(existsSync(new URL('../'+file,import.meta.url)),file);
  const html=read(file);
  assert.match(html,new RegExp('data-collection="'+c.slug+'"'));
  assert.match(html,new RegExp('https://recastmeai.com/shop-'+c.slug+'\\.html'));
  assert.match(html,/name="robots" content="noindex,follow"/,'New preview-only product pages are not indexed before buyability proof');
  assert.match(html,/shop-category\.js\?v=1/);
  assert.match(html,/shop-category\.css\?v=1/);
  assert.match(html,/id="collection-dog"/);
  assert.match(html,/id="collection-cat"/);
  assert.match(html,/id="collection-availability"/);
  assert.match(html,/id="collection-detail-add" hidden/,'No unverified purchase button in fallback HTML');
  assert.doesNotMatch(html,/itemprop="price"|\$\d+\.\d{2}|"offers":/,'Do not advertise invented prices or structured product offers');
 }
});
test('existing mug and Christmas views link real item pages without replacing the original shop or cart',()=>{
 const shop=read('public/shop.js'),home=read('public/shop.html'),christmas=read('public/christmas.html');
 assert.match(shop,/import \{SHOP_COLLECTIONS\} from/);
 assert.match(shop,/link\.href=collection\.url/);
 assert.match(shop,/groupShopOffers\(offers\)/,'Existing approved mug grouping preserved');
 assert.match(shop,/await addPremade\(offer\)/,'Existing approved checkout preserved');
 for(const html of [home,christmas])assert.match(html,/shop\.js\?v=10/);
});
test('future approved blanket offers must exactly match the design revision and product family',()=>{
 const art=designs[0],blanket=collectionBySlug('blankets');
 const good={id:'blanket-50x60-fixture',designId:art.designId,artworkRevision:art.artworkRevision,
  product:'blanket',title:'Fixture only',pet:art.pet,breed:art.breed,variantLabel:'50×60',
  status:'verified',priceCents:7499,currency:'USD',variantId:'gid://shopify/ProductVariant/fixture',
  mockupUrl:'https://recast.test/proof/sample',proof:{provider:'printful',approved:true,artworkRevision:art.artworkRevision}};
 const wrong={...good,product:'mug'};
 const pending={...good,status:'pending'};
 const changed={...good,artworkRevision:'f'.repeat(64)};
 assert.equal(categoryOffers([wrong,pending,changed],blanket,designs).length,0);
 assert.deepEqual(categoryOffers([good],blanket,designs),[good]);
 assert.equal(readyOffer(good),true);
 assert.equal(categoryOffers([good],collectionBySlug('pillows'),designs).length,0);
 assert.equal(categoryOffers([good],blanket,[]).length,0);
});
test('page renderer shows no cart when supplier is not certified and never uses mug marketing art for blankets',()=>{
 const code=read('public/shop-category.js'),css=read('public/shop-category.css');
 assert.match(code,/if\(offer\)/);
 assert.match(code,/status==='verified'/);
 assert.match(code,/readyOffer\(o\)/);
 assert.match(code,/Actual .*preview in preparation/);
 assert.match(code,/addPremade\(offer\)/);
 assert.doesNotMatch(code,/\.salesImage/,'Mug sales illustration must not be misrepresented as blanket image');
 assert.match(css,/collection-preview--blanket/);
 assert.match(css,/object-fit:contain/,'Avoid cropping the source dog and cat artwork');
 assert.match(css,/@media\(max-width:600px\)/,'Narrow phone layout exists');
});
