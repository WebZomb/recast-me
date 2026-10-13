/* RM160 — real website navigation. Native TestFlight owns its SwiftUI tab bar.
   The existing .site-header is the natural location on desktop; phones use a
   fixed, illuminated black dock. Never render an empty decorative shell. */
(() => {
  if (window.webkit?.messageHandlers?.recastPreview) return;
  if (document.querySelector('nav.recast-mobile-nav')) return;

  const pages = [
    { path:'/#start',label:'Create', icon:'<path d="m4 19 11-11 4 4L8 23l-4-4Z"/><path d="m13 10 3 3M5 5l1.2-2.5L7.5 5 10 6.2 7.5 7.4 6.2 10 5 7.4 2.5 6.2 5 5ZM19 2l.6 1.6L21 4l-1.4.5L19 6l-.6-1.5L17 4l1.4-.4L19 2Z"/>' },
    { path:'/my-recasts.html',label:'My Recasts', icon:'<rect x="3" y="7" width="15" height="13" rx="2"/><path d="M7 7V4h14v13h-3"/><circle cx="9" cy="11" r="1.4"/><path d="m5 18 5-5 4 3 2-2"/>' },
    { path:'/my-orders.html',label:'My Orders', icon:'<path d="M3 7h18v14H3V7Zm0 0 3-4h12l3 4M12 3v18m-9-8h18"/>' },
    { path:'/guide.html',label:'Guide', icon:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 0 1 5 1c0 1.8-2.5 2-2.5 4m0 3.5h.01"/>' }
  ];

  const path = location.pathname.replace(/\/$/, '') || '/';
  const dock = document.createElement('nav');
  dock.className = 'recast-mobile-nav';
  dock.setAttribute('aria-label', 'Recast Me sections');
  dock.setAttribute('data-recast-nav-style', 'v161');

  for (const page of pages) {
    const link = document.createElement('a');
    link.href = page.path;
    link.setAttribute('data-recast-tab', page.label.toLowerCase().replaceAll(' ', '-'));
    const selected = page.path === '/#start'
      ? path === '/' || path === '/index.html'
      : path === page.path;
    if (selected) link.setAttribute('aria-current', 'page');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    // SVG markup below is static, hard-coded, and never interpolates user data.
    svg.innerHTML = page.icon;
    const text = document.createElement('span');
    text.textContent = page.label;
    link.append(svg, text);
    // A global legacy nav rule hides all non-CTA nav links under 980px. This
    // component explicitly overrides it, including if the CSS is momentarily
    // delayed or an older stylesheet is cached.
    link.style.setProperty('display', 'flex', 'important');
    dock.append(link);
  }
  if (dock.children.length !== 4) return;

  const mq = window.matchMedia('(min-width: 1060px)');
  const place = () => {
    const header = document.querySelector('.site-header');
    if (mq.matches && header) {
      const legacy = header.querySelector('nav:not(.recast-mobile-nav)');
      header.insertBefore(dock, legacy);
      document.body.classList.add('recast-desktop-header-nav');
      document.body.classList.remove('recast-desktop-floating-nav');
    } else {
      if (dock.parentElement !== document.body) document.body.append(dock);
      document.body.classList.toggle('recast-desktop-floating-nav', mq.matches);
      document.body.classList.remove('recast-desktop-header-nav');
    }
  };

  const old = document.querySelector('link[data-recast-bottom-nav]');
  if (old) old.href = '/mobile-bottom-nav.css?v=161';
  else {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/mobile-bottom-nav.css?v=161';
    css.dataset.recastBottomNav = 'v161';
    document.head.append(css);
  }
  document.body.classList.add('recast-web-mobile-nav');
  place();
  mq.addEventListener?.('change', place);

  window.addEventListener('pageshow', () => {
    if (!dock.isConnected) place();
  });
})();
