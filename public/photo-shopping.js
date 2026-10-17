// Describe only observed service state; personal allowance exhaustion is not an outage.
export function photoShoppingNotice(snapshot){
  if(!snapshot?.modes||!snapshot.local?.ready)return '';
  const high=snapshot.modes.high,standard=snapshot.modes.quick;
  if(high?.ready&&standard?.ready)return '';
  const unavailable=mode=>mode&&!mode.ready&&['unavailable','capacity','timeout'].includes(mode.reason);
  if(unavailable(high)&&unavailable(standard))return 'AI picture creation is temporarily unavailable. You can still create personalized gifts with your own photos or a saved Recast. Please check back soon for AI styles.';
  if(unavailable(high))return 'High Quality AI is temporarily unavailable. Please check back soon, or use your own photo on a product—no AI rendering needed.';
  if(unavailable(standard))return 'Standard AI is temporarily unavailable. You can use your own photo on a product or check High Quality availability.';
  return '';
}
