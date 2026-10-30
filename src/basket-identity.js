// Inert server adapter: no route imports this file. Browser possession of the
// existing private wallet cookie identifies a basket, not a person or artwork.
import { walletFor } from './render-credits.js';
import { sameOrigin, fault } from './commerce-store.js';
import { createBasket } from './basket-state.js';

export async function basketIdentity(request, env, basketId) {
  if (!['GET', 'POST'].includes(request.method))
    throw fault('basket_method', 'Unsupported basket request.', 405);
  // Require the established same-origin/header guard even for private reads.
  sameOrigin(request);
  createBasket({ basketId, ownerId: 'validation-only' });
  const cookies = (request.headers.get('cookie') || '').split(';').map(v => v.trim())
    .filter(v => v.startsWith('__Host-recast-credit='));
  if (cookies.length !== 1 || !/^__Host-recast-credit=[a-f0-9]{64}$/.test(cookies[0]))
    throw fault('basket_session_required', 'Please reopen your saved basket in the same browser.', 401);
  if (!env.ARTWORK || typeof env.ARTWORK.get !== 'function')
    throw fault('basket_session_unavailable', 'Your basket is temporarily unavailable. Please try again.', 503);
  let wallet;
  try { wallet = await walletFor(request, env); }
  catch { throw fault('basket_session_unavailable', 'Your basket is temporarily unavailable. Please try again.', 503); }
  if (!wallet) throw fault('basket_session_required', 'Please reopen your saved basket in the same browser.', 401);
  if (!/^[a-f0-9]{64}$/.test(wallet.id) || !wallet.orders ||
      typeof wallet.orders !== 'object' || Array.isArray(wallet.orders) ||
      typeof wallet.createdAt !== 'string' || !Number.isFinite(Date.parse(wallet.createdAt)))
    throw fault('basket_session_unavailable', 'Your basket is temporarily unavailable. Please try again.', 503);
  // Never use body/query/header ownerId, network identity, or artwork tokens.
  // Keep this server-only; API responses must not serialize wallet or ownerId.
  return Object.freeze({ basketId, ownerId: wallet.id });
}
