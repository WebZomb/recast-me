import {nativeAppPlatform,isDigitalArtworkProduct,appRequestHeaders} from './app-channel.js?v=1';
export const seasonalProducts = [
  {name:"Poster",price:"from $29.99",asset:"poster",image:"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-poster-rm059.png?v=1791422885&width=1000",badge:"MOST POPULAR",pitch:"The easiest way to turn your Recast into wall art.",tier:"featured"},
  {name:"Hoodie",price:"from $59.99",asset:"hoodie",image:"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-hoodie-variety-20261017.png?v=1792212037&width=1000",badge:"FAN FAVORITE",pitch:"Wear your Recast as a premium statement piece.",tier:"featured"},
  {name:"Framed Poster",price:"from $44.99",asset:"framed-poster",image:"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-frame-rm059.png?v=1791422870&width=1000",badge:"DESK + WALL",pitch:"8×10 desk size or larger framed wall art — ready to display and gift.",tier:"featured"},
  {name:"Canvas",price:"from $69.99",asset:"canvas",image:"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-canvas-rm059.png?v=1791422862&width=1000",badge:"GALLERY PICK",pitch:"A bold upgrade for artwork that deserves more presence.",tier:"featured"},

  {name:"T-Shirt",price:"from $34.99",asset:"tshirt",image:"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-tshirt-variety-20261017.png?v=1792212044&width=1000",badge:"WEAR IT",pitch:"An easy everyday way to show off your Recast.",tier:"secondary"},
  {name:"Blanket",price:"from $74.99",asset:"blanket",image:"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-blanket-rm059.png?v=1791422915&width=1000",badge:"COZY PICK",pitch:"Big, soft, personal — especially good for pets and gifts.",tier:"secondary"},
  {name:"Mug",price:"from $24.99",asset:"mug",image:"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-mug-rm059.png?v=1791422827&width=1000",badge:"GIFTABLE",pitch:"A personalized gift that gets used every day.",tier:"secondary"},
  {name:"Tumbler",price:"$49.99",asset:"tumbler",image:"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-tumbler-rm059.png?v=1791422982&width=1000",badge:"TAKE IT WITH YOU",pitch:"Your Recast on a 20 oz everyday tumbler.",tier:"secondary"},
  {"name": "Sticker Sheet", "price": "$14.99", "image": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-sticker-sheet-rm061.png?v=1791427937&width=1000", "badge": "SIX STICKERS", "pitch": "Six matching full-picture stickers on one glossy sheet. Adventure backgrounds included.", "tier": "secondary"},
  {"name": "Tough Phone Case", "price": "$29.99", "image": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-tough-case-royal-lifestyle-rm145.png?v=1791819635&width=1000", "badge": "FULL WRAP", "pitch": "Your photo across the back and edges of a glossy Tough Case.", "tier": "secondary"},
  {"name": "Pillow", "price": "from $29.99", "image": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-pillow-rm059.png?v=1791422893&width=1000", "badge": "NEW", "pitch": "A personal touch for your favorite cozy spot.", "tier": "secondary"},
  {"name": "Hardcover Journal", "price": "$24.99", "image": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-journal-rm059.png?v=1791422974&width=1000", "badge": "NEW", "pitch": "Keep your ideas in a journal featuring your Recast.", "tier": "secondary"},
  {"name": "Puzzle", "price": "from $34.99", "image": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-puzzle-rm059.png?v=1791422922&width=1000", "badge": "NEW", "pitch": "Piece together your Recast in 252 or 520 pieces.", "tier": "secondary"},
  {"name": "Tote Bag", "price": "$39.99", "image": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-tote-rm059.png?v=1791422941&width=1000", "badge": "NEW", "pitch": "Carry your Recast on a roomy everyday tote.", "tier": "secondary"},
  {name:"Magnet 3-Pack",price:"$24.99",asset:"magnet",image:"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-magnet-rm059.png?v=1791422997&width=1000",badge:"ADD-ON",pitch:"Three matching magnets for a smaller, easy add-on.",tier:"secondary"},
  {name:"Coaster 4-Pack",price:"$39.99",asset:"coaster",image:"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-coaster-rm059.png?v=1791423005&width=1000",badge:"ADD-ON",pitch:"Four matching cork-back coasters featuring your artwork.",tier:"secondary"},

  {name:"HD Digital Recast",price:"$4.99",asset:"digital",image:"/assets/product-digital-v16.webp",badge:"DIGITAL ONLY",pitch:"Just want the clean artwork? Keep the high-resolution file without ordering merch.",tier:"digital"},
  {name:"Recast Pack",price:"$9.99",asset:"pack",image:"/assets/product-pack-v16.webp",badge:"DIGITAL PACK",pitch:"The complete digital set with high-resolution art plus useful crops and formats.",tier:"digital"}
];
const artKeys={'Poster':'poster','Hoodie':'hoodie','Framed Poster':'frame','Canvas':'canvas','T-Shirt':'tshirt','Blanket':'blanket','Tumbler':'tumbler','Sticker Sheet':'sticker','Tough Phone Case':'case','Pillow':'pillow','Hardcover Journal':'journal','Puzzle':'puzzle','Tote Bag':'tote','Magnet 3-Pack':'magnet','Coaster 4-Pack':'coaster'};
const CHRISTMAS_FIRST=['Mug','Pillow','Puzzle','Blanket','Poster','Canvas','Framed Poster','Hoodie','Tote Bag','Tough Phone Case','T-Shirt','Tumbler','Hardcover Journal','Sticker Sheet','Magnet 3-Pack','Coaster 4-Pack'];
export const CHRISTMAS_PITCH={
 'Mug':'Make their morning magical with a familiar face and a cozy Christmas look.',
 'Pillow':'Bring their favorite pet or family memory into the holiday living room.',
 'Puzzle':'Give them a Christmas adventure to piece together, one memory at a time.',
 'Blanket':'A cozy winter gift featuring the face they love most.',
 'Poster':'Turn a festive Recast into personalized Christmas wall art.',
 'Canvas':'Give a Christmas portrait a beautiful place on their wall.',
 'Framed Poster':'A festive framed keepsake, ready for their favorite spot.',
 'Hoodie':'A winter-ready hoodie starring their own Christmas artwork.',
 'Tote Bag':'Carry a little holiday magic wherever the season takes you.',
 'Tough Phone Case':'Put their favorite Christmas memory on a protective phone case.',
 'T-Shirt':'Wear their festive Recast long after the wrapping comes off.',
 'Tumbler':'Take their Christmas artwork along for every warm drink or cold sip.',
 'Hardcover Journal':'A personal place to write, wrapped in holiday magic.',
 'Sticker Sheet':'Six little reminders of a very personal Christmas adventure.',
 'Magnet 3-Pack':'Add their Christmas Recast to three everyday little keepsakes.',
 'Coaster 4-Pack':'A festive set for their coffee table and holiday gatherings.'
};
const node=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;};
const giftSlug=name=>'christmas_'+name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,20);
export function seasonalGiftHref({campaign,sku,name}){
 const christmas=campaign?.active?.id==='christmas';
 const params=new URLSearchParams({style:christmas?'christmas':campaign?.active?.style||'royal',gift:sku});
 if(christmas){
  params.set('utm_source','internal');
  params.set('utm_medium','christmas_specials');
  params.set('utm_campaign','christmas_2026');
  params.set('utm_content',giftSlug(name));
 }
 return '/?'+params.toString()+'#start';
}
export async function renderSeasonalProducts(campaign){
 const grid=document.getElementById('season-shop-grid'),status=document.getElementById('season-shop-status');if(!grid)return;
 try{
  const response=await fetch('/api/seasonal-products',{cache:'no-store',headers:appRequestHeaders()});
  const data=await response.json();
  if(!response.ok||!data.ok||!Array.isArray(data.products))throw Error('unavailable');
  const halloween=campaign.active?.id==='halloween',christmas=campaign.active?.id==='christmas';
  const items=seasonalProducts
   .filter(item=>!nativeAppPlatform()||!isDigitalArtworkProduct(item))
   .map(item=>({...item,live:data.products.find(p=>p.name===(item.name==='Tough Phone Case'?'Phone Case':item.name))}))
   .filter(item=>item.live&&Number.isFinite(Number(item.live.price))&&item.live.sku);
  if(christmas)items.sort((a,b)=>{const rank=x=>{const i=CHRISTMAS_FIRST.indexOf(x.name);return i<0?99:i;};return rank(a)-rank(b);});
  grid.replaceChildren();
  const offer=campaign.offer&&campaign.offer.percent===10&&campaign.offer.style==='christmas'&&campaign.checkoutReady!==false;
  const dollars=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
  for(const item of items){
   const physicalChristmas=christmas&&item.tier!=='digital';
   const card=node('article','season-shop-card'+(physicalChristmas?' season-shop-card-christmas':'')),href=seasonalGiftHref({campaign,sku:item.live.sku,name:item.name});
   if(physicalChristmas)card.dataset.christmasProduct=item.name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
   const link=node('a','season-shop-image'+(physicalChristmas?' season-shop-image-christmas':''));link.href=href;
   link.setAttribute('aria-label','Create your '+(physicalChristmas?'Christmas ':'')+item.name+' using your own photo');
   if(physicalChristmas){
    const art=node('img','season-christmas-product-image');
    const seasonalArt={...artKeys,Mug:'mug'};
    art.src=seasonalArt[item.name]?'/assets/christmas-'+seasonalArt[item.name]+'-20261101.webp':item.image;
    art.width=1024;art.height=1024;art.loading='lazy';art.decoding='async';
    art.alt=seasonalArt[item.name]?'Illustrative Christmas '+item.name+' design; personalize with your own photo':item.name+' product example; choose Christmas for your own design';
    link.append(art);
   }else{
    const img=node('img');img.width=1000;img.height=1000;img.loading='lazy';img.decoding='async';
    img.src=item.name==='Hoodie'?item.image:halloween?(item.name==='Mug'?'/assets/recast-halloween-mug-approved.jpg':artKeys[item.name]?'/assets/halloween-'+artKeys[item.name]+'-v166.webp':'/assets/recast-halloween-hero-v163.webp'):item.image;
    img.alt=item.name==='Hoodie'?'Illustrative black hoodie with centered soft-edge chest artwork':(halloween?'Halloween ':'')+item.name+' lifestyle example';
    link.append(img);
   }
   if(offer&&physicalChristmas)link.append(node('span','season-shop-sale','10% OFF'));
   else if(campaign.offer&&!christmas)link.append(node('span','season-shop-sale',campaign.offer.percent+'% OFF'));
   const body=node('div','season-shop-body');
   body.append(node('small','',physicalChristmas?'YOUR PHOTO · ILLUSTRATIVE EXAMPLE':item.tier==='digital'?'DIGITAL ART':'MADE WITH YOUR PHOTO'));
   body.append(node('h3','',item.name));
   body.append(node('p','',physicalChristmas?CHRISTMAS_PITCH[item.name]||item.pitch:item.pitch));
   if(physicalChristmas)body.append(node('div','season-christmas-selected','✓ Christmas style preselected · preview before checkout'));
   const price=node('div','season-shop-price');
   if(offer&&physicalChristmas){
    price.append(node('del','',dollars(Number(item.live.price))));
    price.append(node('strong','',dollars(Math.round(Number(item.live.price)*90)/100)));
    price.append(node('small','','Christmas-style artwork only'));
   }else if(campaign.offer&&!christmas){
    price.append(node('del','',dollars(Number(item.live.price))));
    price.append(node('strong','',dollars(Math.round(Number(item.live.price)*(100-campaign.offer.percent))/100)));
    price.append(node('small','','with '+campaign.offer.name+' filter'));
   }else price.append(node('strong','','from '+dollars(Number(item.live.price))));
   const cta=node('a','season-button season-button-primary',physicalChristmas?'Create my Christmas '+item.name+' →':'Create yours →');
   cta.href=href;
   body.append(price,cta);card.append(link,body);grid.append(card);
  }
  status.textContent=christmas
   ? 'Product images are illustrative examples, not supplier proofs. Your photo becomes the actual design. The 10% offer applies to eligible Christmas-style artwork, not unchanged original photos. Confirm your own preview, variant and delivery estimate before checkout.'
   :items.length?'Lifestyle examples. Preview your own artwork, size and placement before checkout.':'';
 }catch{status.textContent='The collection could not load. Refresh this page or start with your photo below.';}
}
