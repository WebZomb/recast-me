const KEY = 'system/render-health.json';

export async function renderHealth(env) {
  const object = await env.ARTWORK?.get(KEY);
  const last = object ? await object.json().catch(() => null) : null;
  return {
    state: !env.AI ? 'unconfigured' : last?.reason === 'quota' && Date.parse(last.retryAt) > Date.now() ? 'paused' : last?.status === 'success' ? 'last_render_succeeded' : 'unverified',
    lastResult: last?.status || null,
    reason: last?.reason || null,
    checkedAt: last?.checkedAt || null,
    retryAt: last?.retryAt || null,
    visitorDailyLimit: null
  };
}

export async function recordRenderHealth(env, status, reason = null) {
  if (!env.ARTWORK) return;
  // Short cooldown allows billing upgrades to take effect without a redeploy.
  await env.ARTWORK.put(KEY, JSON.stringify({
    status, reason, checkedAt: new Date().toISOString(),
    retryAt: reason === 'quota' ? new Date(Date.now() + 60000).toISOString() : null
  }), {httpMetadata: {contentType: 'application/json'}}).catch(() => {});
}
