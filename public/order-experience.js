// Local, private purchase pointers. Only the Recast server can confirm Shopify payments.
const KEY = 'recast_checkout_records_v1';
const SEEN = 'recast_celebrated_orders_v1';
const MAX = 20;
function read(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback; }
  catch { return fallback; }
}
function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
function valid(row) {
  return row && /^RC-[A-Za-z0-9-]{1,100}$/.test(String(row.requestId || '')) &&
    typeof row.accessToken === 'string' && row.accessToken.length >= 16 &&
    row.accessToken.length <= 256 && !/\s/.test(row.accessToken);
}
function own(row) { return {requestId: row.requestId, accessToken: row.accessToken}; }
export function checkoutCandidates() {
  const stored = read(KEY, []);
  const recent = read('recast_recent_versions_v12', []);
  const current = read('recast_last_request', null);
  const all = [...(Array.isArray(stored) ? stored : []), current, ...(Array.isArray(recent) ? recent : [])];
  const seen = new Set();
  return all.filter(valid).filter(row => {
    if (seen.has(row.requestId)) return false;
    seen.add(row.requestId);
    return true;
  }).slice(0, MAX).map(own);
}
export function rememberCheckoutStarted(row) {
  if (!valid(row)) return false;
  const previous = read(KEY, []);
  const clean = (Array.isArray(previous) ? previous : []).filter(valid)
    .filter(item => item.requestId !== row.requestId);
  write(KEY, [{...own(row), startedAt: Date.now()}, ...clean].slice(0, MAX));
  return true;
}
function rememberConfirmed(row) {
  if (!valid(row)) return;
  const previous = read(KEY, []);
  const original = Array.isArray(previous) ? previous.find(item => item.requestId === row.requestId) : null;
  rememberCheckoutStarted(row);
  const saved = read(KEY, []);
  saved[0] = {...saved[0], startedAt: original?.startedAt || Date.now(), confirmedAt: original?.confirmedAt || Date.now()};
  write(KEY, saved.slice(0, MAX));
}
function orderLink(row) {
  return '/order.html?requestId=' + encodeURIComponent(row.requestId) +
    '&token=' + encodeURIComponent(row.accessToken);
}
export {orderLink};
async function statusFor(row) {
  const query = new URLSearchParams({requestId: row.requestId, token: row.accessToken});
  const response = await fetch('/api/order-status?' + query.toString(),
    {credentials: 'same-origin', cache: 'no-store', referrerPolicy: 'no-referrer'});
  if (!response.ok) return [];
  const data = await response.json().catch(() => null);
  if (!data?.ok || data.request?.paid !== true || !Array.isArray(data.jobs)) return [];
  const groups = new Map();
  for (const job of data.jobs) {
    if (!job?.orderName) continue;
    if (!groups.has(job.orderName)) groups.set(job.orderName, []);
    groups.get(job.orderName).push(job);
  }
  if (!groups.size) return [];
  rememberConfirmed(row);
  return [...groups].map(([orderName, jobs]) => ({
    ...own(row), orderName, jobs, creditsEnabled: Boolean(data.creditsEnabled),
    createdAt: jobs[0]?.createdAt || new Date().toISOString()
  }));
}
export async function verifiedOrders() {
  const rows = checkoutCandidates().slice(0, MAX);
  // Bounded requests; failed/private links never count as orders.
  const result = [];
  for (let i = 0; i < rows.length; i += 3) {
    const batch = await Promise.all(rows.slice(i, i + 3).map(row => statusFor(row).catch(() => [])));
    for (const group of batch) result.push(...group);
  }
  const unique = new Set();
  return result.filter(row => {
    if (unique.has(row.orderName)) return false;
    unique.add(row.orderName);
    return true;
  }).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
export async function confirmOrderBonus(order) {
  if (!order?.creditsEnabled || !order.jobs?.length) return {message: 'Your order is confirmed. See your Recast credit balance for bonuses.'};
  try {
    const walletResponse = await fetch('/api/render-credits', {credentials:'same-origin',cache:'no-store'});
    const wallet = await walletResponse.json();
    if (!walletResponse.ok || !wallet.initialized) return {message:'Your purchase is confirmed. Open the original creator browser to claim bonus renders.'};
    const job = order.jobs[0];
    const response = await fetch('/api/order-bonus/' + encodeURIComponent(job.id), {
      method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-recast-request':'1'},
      body:JSON.stringify({token:order.accessToken})
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) return {message:'Your order is confirmed. Bonus credits can be checked from your private order page.'};
    const count = Number(data.bonus) || 0;
    return {message:count > 0
      ? count + ' bonus High Quality ' + (count === 1 ? 'render' : 'renders') + ' ready to use!'
      : 'Your bonus renders have been applied. Check your High Quality balance.', bonus:count};
  } catch {
    return {message:'Order confirmed. Bonus credit status will be available from your private order page.'};
  }
}
const escape = value => String(value || '').replace(/[&<>"']/g, character =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
function celebrate(order, bonus) {
  document.querySelector('.recast-celebration-layer')?.remove();
  const layer = document.createElement('div');
  layer.className = 'recast-celebration-layer';
  layer.innerHTML = '<div class="recast-celebration-backdrop"></div>' +
    '<section class="recast-celebration" role="dialog" aria-modal="true" aria-labelledby="recast-celebration-title">' +
    '<div class="recast-confetti" aria-hidden="true">' + Array.from({length: 16}, () => '<i></i>').join('') + '</div>' +
    '<span class="recast-celebration-badge" aria-hidden="true">✦</span>' +
    '<div class="eyebrow">IT’S OFFICIAL!</div><h2 id="recast-celebration-title">🎉 Congrats! Your order is in!</h2>' +
    '<p class="celebration-order"></p><p class="celebration-bonus"></p>' +
    '<a class="button primary celebration-track" href="' + escape(orderLink(order)) + '">See my order &amp; tracking →</a>' +
    '<button type="button" class="button ghost celebration-more">Make another picture</button>' +
    '<button type="button" class="celebration-close" aria-label="Close celebration">×</button>' +
    '</section>';
  layer.querySelector('.celebration-order').textContent = order.orderName + ' confirmed · ' +
    (order.jobs.map(job => job.product).filter(Boolean).join(', ') || 'Personalized gift');
  layer.querySelector('.celebration-bonus').textContent = bonus.message;
  const close = () => { layer.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = event => {if (event.key === 'Escape') close();};
  layer.querySelector('.celebration-close').addEventListener('click',close);
  layer.querySelector('.recast-celebration-backdrop').addEventListener('click',close);
  layer.querySelector('.celebration-more').addEventListener('click',() => {
    close();
    document.querySelector('#start')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
  document.addEventListener('keydown',onKey);
  document.body.append(layer);
  layer.querySelector('.celebration-close').focus({preventScroll:true});
  window.webkit?.messageHandlers?.recastHaptic?.postMessage('success');
}
export function initCheckoutReturnExperience(onCreditRefresh = () => {}) {
  let checking = false, lastCheck = 0;
  async function check() {
    if (checking || document.visibilityState === 'hidden' || Date.now() - lastCheck < 30000) return;
    if (!checkoutCandidates().length) return;
    checking = true; lastCheck = Date.now();
    try {
      const orders = await verifiedOrders();
      const seen = read(SEEN, []);
      const previous = Array.isArray(seen) ? seen : [];
      const next = orders.find(order => !previous.includes(order.orderName));
      if (!next) return;
      const bonus = await confirmOrderBonus(next);
      write(SEEN, [next.orderName,...previous].slice(0, MAX));
      celebrate(next, bonus);
      onCreditRefresh();
    } finally { checking = false; }
  }
  window.addEventListener('recast-app-resumed', () => {lastCheck = 0; check().catch(() => {});});
  window.addEventListener('focus', () => {check().catch(() => {});});
  document.addEventListener('visibilitychange', () => {if (document.visibilityState === 'visible') check().catch(() => {});});
  setTimeout(() => check().catch(() => {}), 1600);
}
