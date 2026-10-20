/* RM160 — real website navigation. Native TestFlight owns its SwiftUI tab bar.
   The existing .site-header is the natural location on desktop; phones use a
   fixed, illuminated black dock. Never render an empty decorative shell. */
(() => {
  // The iOS shell already provides Help and its own navigation.
  if (window.webkit?.messageHandlers?.recastPreview) return;
  const help=document.createElement('a');help.href='/guide.html';help.textContent='Help';help.className='community-help-link';help.setAttribute('aria-label','Help and Guide');
  const header=document.querySelector('.site-header, .library-header');if(header)header.append(help);
  if (document.querySelector('nav.recast-mobile-nav')) return;

  const pages = [
    { path:'/#start',label:'Create', icon:'<path d="m4 19 11-11 4 4L8 23l-4-4Z"/><path d="m13 10 3 3M5 5l1.2-2.5L7.5 5 10 6.2 7.5 7.4 6.2 10 5 7.4 2.5 6.2 5 5ZM19 2l.6 1.6L21 4l-1.4.5L19 6l-.6-1.5L17 4l1.4-.4L19 2Z"/>' },
    { path:'/my-recasts.html',label:'My Recasts', icon:'<rect x="3" y="7" width="15" height="13" rx="2"/><path d="M7 7V4h14v13h-3"/><circle cx="9" cy="11" r="1.4"/><path d="m5 18 5-5 4 3 2-2"/>' },
    { path:'/my-orders.html',label:'My Orders', icon:'<path d="M3 7h18v14H3V7Zm0 0 3-4h12l3 4M12 3v18m-9-8h18"/>' },
    { path:'/specials.html',label:'Specials', icon:'<path d="M3 9h18v12H3V9Z"/><path d="M2 6h20v3H2zM12 6v15"/><path d="M12 6C9 1 5 1 5 4c0 2 3 2 7 2Zm0 0c3-5 7-5 7-2 0 2-3 2-7 2Z"/>' },
    { path:'/community.html',label:'Community', icon:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2"/>' }
  ];

  // Cloudflare serves both extensionless URLs and .html paths. They must
  // highlight the same tab instead of leaving Specials or My Orders inactive.
  const route = pathname => {
    const compact = String(pathname || '/').replace(/\/$/, '').replace(/\.html$/, '') || '/';
    return compact === '/index' ? '/' : compact;
  };
  const path = route(location.pathname);
  const dock = document.createElement('nav');
  dock.className = 'recast-mobile-nav';
  dock.setAttribute('aria-label', 'Recast Me sections');
  dock.setAttribute('data-recast-nav-style', 'v164');

  for (const page of pages) {
    const link = document.createElement('a');
    link.href = page.path;
    link.setAttribute('data-recast-tab', page.label.toLowerCase().replaceAll(' ', '-'));
    const selected = page.path === '/#start'
      ? path === '/'
      : path === route(page.path);
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
  if (dock.children.length !== 5) return;

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

  const helpStyle=document.createElement('link');helpStyle.rel='stylesheet';helpStyle.href='/community.css?v=1';document.head.append(helpStyle);
  const old = document.querySelector('link[data-recast-bottom-nav]');
  if (old) old.href = '/mobile-bottom-nav.css?v=163';
  else {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/mobile-bottom-nav.css?v=163';
    css.dataset.recastBottomNav = 'v164';
    document.head.append(css);
  }
  document.body.classList.add('recast-web-mobile-nav');
  place();
  mq.addEventListener?.('change', place);

  window.addEventListener('pageshow', () => {
    if (!dock.isConnected) place();
  });
})();
