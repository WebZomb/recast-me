// Product availability by client channel, not an authentication boundary.
// Native clients send this header on first-party requests. Legacy WKWebView and
// Android WebView user agents are also recognized so cached clients fail closed.
// Do not persist the channel: Safari/Chrome on the same phone remain the website.
export function requestAppPlatform(request) {
  const explicit = (request.headers.get('x-recast-app-platform') || '').trim().toLowerCase();
  if (explicit === 'ios' || explicit === 'android') return explicit;
  const ua = request.headers.get('user-agent') || '';
  const app = ua.match(/\bRecastMeApp\/(iOS|Android)\b/i);
  if (app) return app[1].toLowerCase();
  if (/Android/i.test(ua) && /;\s*wv\)/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua) && /AppleWebKit/i.test(ua) && /Mobile\//i.test(ua)
      && !/Safari\/|CriOS\/|FxiOS\/|EdgiOS\/|OPiOS\//i.test(ua)) return 'ios';
  return null;
}

export function isNativeAppRequest(request) {
  return requestAppPlatform(request) !== null;
}

// Internal social checkout bridges must retain the caller's product policy,
// without forwarding unrelated credentials or private browser headers.
export function appChannelHeaders(request, initial = {}) {
  const headers = new Headers(initial);
  const platform = requestAppPlatform(request);
  if (platform) headers.set('x-recast-app-platform', platform);
  return headers;
}

export function digitalUnavailableInAppResponse() {
  return Response.json({
    ok: false,
    code: 'digital_unavailable_in_app',
    error: 'Digital artwork is unavailable in this app.'
  }, {status: 403, headers: {'cache-control': 'private, no-store'}});
}
