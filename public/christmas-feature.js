/* Merchandising only: never changes server promotion eligibility or checkout. */
export function christmasCampaign(campaign = {}, { fixed = false, now = new Date() } = {}) {
  const parts = new Intl.DateTimeFormat('en-US', {timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const value = type => parts.find(part => part.type === type).value;
  const today = value('year') + '-' + value('month') + '-' + value('day');
  if (!fixed && (today < '2026-10-30' || today > '2026-12-25')) return campaign;
  if (campaign.active?.id === 'christmas') return campaign;
  let year = Number(value('year'));
  if (fixed && today.slice(5) > '12-25') year++;
  return {...campaign, active:{id:'christmas',title:'Christmas',style:'christmas',date:year+'-12-25'}, offer:null, checkoutReady:false};
}
