import {verifiedOrders,orderLink} from './order-experience.js?v=2';
const list=document.querySelector('#orders-list');
const status=document.querySelector('#orders-status');
const button=document.querySelector('#orders-refresh');
const escape=value=>String(value ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function label(job) {
  const map = {
    design_confirmed:'Design confirmed · preparing print',ready_for_printful_draft:'Preparing production',
    printful_draft_ready:'Production order prepared',submitted_to_printful:'With the print partner',
    in_printful_production:'In production',shipped:'Shipped',partially_shipped:'Partially shipped',
    auto_print_review:'Checking production details',owner_release_review:'Checking production details',
    printful_failed:'Production update needed',on_hold:'On hold for review',
    canceled:'Canceled',payment_hold:'Payment under review',digital_ready:'Download ready'
  };
  return map[job.status] || 'Preparing your order';
}
let busy=false,last=0;
async function refresh(force=false) {
  if (busy || (!force && Date.now()-last < 30000)) return;
  busy=true;last=Date.now();button.disabled=true;button.textContent='Checking updates…';
  try {
    const orders=await verifiedOrders();
    list.replaceChildren();
    if (!orders.length) {
      status.textContent='No confirmed purchases found on this device yet. Orders may take a few minutes to appear after checkout. Keep your Shopify receipt and original private Recast link for recovery.';
      return;
    }
    status.textContent=orders.length + (orders.length===1?' confirmed order':' confirmed orders') + ' saved on this device. Tracking appears once the print partner ships.';
    for (const order of orders) {
      const box=document.createElement('article');
      box.className='order-history-item';
      box.innerHTML='<div class="order-history-top"><span class="order-history-kicker">PURCHASE CONFIRMED</span><strong></strong></div>' +
        '<div class="order-history-products"></div><p class="order-history-date"></p>' +
        '<div class="order-history-status"></div><div class="order-history-actions"></div>';
      box.querySelector('.order-history-top strong').textContent=order.orderName;
      box.querySelector('.order-history-products').textContent=order.jobs.map(j => j.product).join(' · ');
      const date=Date.parse(order.createdAt);
      box.querySelector('.order-history-date').textContent=Number.isFinite(date) ? new Date(date).toLocaleDateString() : '';
      const stage=box.querySelector('.order-history-status');
      const actions=box.querySelector('.order-history-actions');
      let hasLiveTracking=false;
      for (const job of order.jobs) {
        const row=document.createElement('div');
        row.className='order-history-progress';
        row.textContent=(job.product || 'Your product') + ' — ' + label(job);
        stage.append(row);
        // Print partners sometimes create an unresolvable placeholder before
        // dispatch. Only server-verified shipped statuses with a tracking
        // number can become a clickable carrier link.
        const shipped=['shipped','partially_shipped'].includes(String(job.status||'').toLowerCase());
        if (shipped && job.trackingReady === true && job.trackingNumber && typeof job.trackingUrl === 'string') {
          try {
            const url=new URL(job.trackingUrl);
            if (url.protocol==='https:' && !url.username && !url.password) {
              const track=document.createElement('a');
              track.href=url.href;track.target='_blank';track.rel='noopener noreferrer';
              track.className='button ghost';track.textContent='Track with carrier ↗';
              const number=document.createElement('small');number.className='order-tracking-number';
              number.textContent=(job.carrier||'Carrier')+' · '+job.trackingNumber;
              actions.append(track,number);hasLiveTracking=true;
            }
          } catch {}
        }
      }
      if (!hasLiveTracking) {
        const waiting=document.createElement('p');
        waiting.className='order-tracking-pending';
        waiting.textContent=order.jobs.some(j=>['shipped','partially_shipped'].includes(j.status))
          ?'Your shipment is being finalized. A verified carrier tracking link will appear here once available.'
          :'Carrier tracking will appear here after your item ships. No action is needed.';
        actions.append(waiting);
      }
      const link=document.createElement('a');
      link.className='button primary';link.href=orderLink(order);link.textContent='Order details & updates →';
      actions.prepend(link);
      list.append(box);
    }
  } catch {
    status.textContent='Order updates are temporarily unavailable. Try again shortly.';
  } finally {busy=false;button.disabled=false;button.textContent='Refresh order updates';}
}
button.addEventListener('click',() => refresh(true));
window.addEventListener('recast-app-resumed',() => refresh(true));
document.addEventListener('visibilitychange',() => {if(document.visibilityState==='visible')refresh()});
refresh(true);
