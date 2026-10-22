// The native shells and the browser share these pages, but only the website
// offers paid digital artwork. Keep the channel per request, not in cookies or
// storage: opening the website on the same phone must retain its full catalog.
export function nativeAppPlatform(context=globalThis){
  const host=context.window||context;
  const handlers=host.webkit?.messageHandlers;
  if(handlers?.recastPreview||handlers?.recastAccess||handlers?.recastHaptic)return 'ios';
  // Future wrappers can inject this explicit marker before page scripts run.
  const explicit=String(host.RecastApp?.platform||'').toLowerCase();
  if(explicit==='ios'||explicit==='android')return explicit;
  const ua=String(context.navigator?.userAgent||host.navigator?.userAgent||'');
  const identified=ua.match(/\bRecastMeApp\/(ios|android)\b/i);
  if(identified)return identified[1].toLowerCase();
  if(/\bAndroid\b/i.test(ua)&&/;\s*wv\)/i.test(ua))return 'android';
  if(/\b(?:iPhone|iPad|iPod)\b/i.test(ua)&&/AppleWebKit/i.test(ua)&&/Mobile\//i.test(ua)&&!/(?:Safari|CriOS|FxiOS|EdgiOS|OPiOS)\//i.test(ua))return 'ios';
  return null;
}

export function isDigitalArtworkProduct(product){
  if(!product)return false;
  if(typeof product==='string')return /^RECAST-DIGITAL-(?:HD|PACK)$/i.test(product)||/^(?:HD Digital Recast|Recast Pack)$/i.test(product.trim());
  if(product.digital===true||product.tier==='digital')return true;
  if(isDigitalArtworkProduct(product.sku)||isDigitalArtworkProduct(product.title)||isDigitalArtworkProduct(product.name))return true;
  return Array.isArray(product.variants)&&product.variants.some(variant=>isDigitalArtworkProduct(variant));
}

export function appRequestHeaders(existing={}){
  const headers=new Headers(existing);
  const platform=nativeAppPlatform();
  if(platform)headers.set('x-recast-app-platform',platform);
  return headers;
}
