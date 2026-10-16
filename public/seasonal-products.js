export const seasonalProducts = [
  {name:"Poster",price:"from $29.99",asset:"poster",image:"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-poster-rm059.png?v=1791422885&width=1000",badge:"MOST POPULAR",pitch:"The easiest way to turn your Recast into wall art.",tier:"featured"},
  {name:"Hoodie",price:"from $59.99",asset:"hoodie",image:"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-hoodie-black-s-verified-rm055.jpg?v=1791357294&width=1000",badge:"FAN FAVORITE",pitch:"Wear your Recast as a premium statement piece.",tier:"featured"},
  {name:"Framed Poster",price:"from $44.99",asset:"framed-poster",image:"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-frame-rm059.png?v=1791422870&width=1000",badge:"DESK + WALL",pitch:"8×10 desk size or larger framed wall art — ready to display and gift.",tier:"featured"},
  {name:"Canvas",price:"from $69.99",asset:"canvas",image:"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-canvas-rm059.png?v=1791422862&width=1000",badge:"GALLERY PICK",pitch:"A bold upgrade for artwork that deserves more presence.",tier:"featured"},

  {name:"T-Shirt",price:"from $34.99",asset:"tshirt",image:"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-tshirt-rm059.png?v=1791422934&width=1000",badge:"WEAR IT",pitch:"An easy everyday way to show off your Recast.",tier:"secondary"},
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
const node=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;};
export async function renderSeasonalProducts(campaign){
 const grid=document.getElementById('season-shop-grid'),status=document.getElementById('season-shop-status');if(!grid)return;
 try{
  const response=await fetch('/api/seasonal-products',{cache:'no-store'});const data=await response.json();if(!response.ok||!data.ok||!Array.isArray(data.products))throw Error('unavailable');
  const halloween=campaign.active?.id==='halloween';
  const items=seasonalProducts.map(item=>({...item,live:data.products.find(p=>p.name===(item.name==='Tough Phone Case'?'Phone Case':item.name))})).filter(item=>item.live);
  grid.replaceChildren();
  for(const item of items){
   const card=node('article','season-shop-card');
   const link=node('a','season-shop-image');link.href='/?style='+encodeURIComponent(campaign.active?.style||'royal')+'&gift='+encodeURIComponent(item.live.sku)+'#start';link.setAttribute('aria-label','Create your '+item.name);
   const img=node('img');img.width=1000;img.height=1000;img.loading='lazy';img.decoding='async';
   img.src=item.name==='Hoodie'?item.image:halloween?(item.name==='Mug'?'/assets/recast-halloween-mug-approved.jpg':artKeys[item.name]?'/assets/halloween-'+artKeys[item.name]+'-v166.webp':'/assets/recast-halloween-hero-v163.webp'):item.image;
   img.alt=item.name==='Hoodie'?'Printful preview: black hoodie size S with soft-edge chest artwork':(halloween?'Halloween ':'')+item.name+' lifestyle example';link.append(img);
   if(campaign.offer)link.append(node('span','season-shop-sale','10% OFF'));
   const body=node('div','season-shop-body');body.append(node('small','',item.tier==='digital'?'DIGITAL ART':'MADE WITH YOUR PHOTO'),node('h3','',item.name),node('p','',item.pitch));
   const price=node('div','season-shop-price');
   const dollars=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
   if(campaign.offer){price.append(node('del','',dollars(item.live.price)),node('strong','',dollars(Math.round(item.live.price*100*(1-campaign.offer.percent/100))/100)),node('small','','with '+campaign.offer.name+' filter'));}
   else price.append(node('strong','','from '+dollars(item.live.price)));
   const cta=node('a','season-button season-button-primary','Create yours →');cta.href=link.href;
   body.append(price,cta);card.append(link,body);grid.append(card);
  }
  status.textContent=items.length?'Lifestyle examples. Preview your own artwork, size and placement before checkout.':'';
 }catch{status.textContent='The collection could not load. Refresh this page or start with your photo below.';}
}
