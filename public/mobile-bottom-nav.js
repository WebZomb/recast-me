// Same four destinations as the SwiftUI TabView. The newer native app owns
// its own tab bar; the older 3-tab TestFlight build gets an interim Orders pill.
const isNative=Boolean(window.webkit?.messageHandlers?.recastPreview);
const hasFourNativeTabs=Boolean(window.webkit?.messageHandlers?.recastHaptic);
const path=location.pathname.replace(/\/$/,'')||'/';
if(isNative){
  // Native app owns its bottom tab bar. Do not stack an awkward floating
  // Orders pill over it. The signed TestFlight update supplies the real tab.
} else {
  const pages=[
    {path:'/#start',label:'Create',icon:'<path d="m4 19 11-11 4 4L8 23l-4-4Z"/><path d="m13 10 3 3M5 5l1.2-2.5L7.5 5 10 6.2 7.5 7.4 6.2 10 5 7.4 2.5 6.2 5 5ZM19 2l.6 1.6L21 4l-1.4.5L19 6l-.6-1.5L17 4l1.4-.4L19 2Z"/>'},
    {path:'/my-recasts.html',label:'My Recasts',icon:'<rect x="3" y="7" width="15" height="13" rx="2"/><path d="M7 7V4h14v13h-3"/><circle cx="9" cy="11" r="1.4"/><path d="m5 18 5-5 4 3 2-2"/>'},
    {path:'/my-orders.html',label:'My Orders',icon:'<path d="M3 7h18v14H3V7Zm0 0 3-4h12l3 4M12 3v18m-9-8h18"/>'},
    {path:'/guide.html',label:'Guide',icon:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 0 1 5 1c0 1.8-2.5 2-2.5 4m0 3.5h.01"/>'}
  ];
  const nav=document.createElement('nav');
  nav.className='recast-mobile-nav';nav.setAttribute('aria-label','Recast Me sections');
  for(const page of pages){
    const a=document.createElement('a');a.href=page.path;
    const current=page.path==='/#start'?(path==='/'||path==='/index.html'):page.path===path;
    if(current)a.setAttribute('aria-current','page');
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
    // Static trusted SVG paths only, never user data.
    svg.innerHTML=page.icon;
    const label=document.createElement('span');label.textContent=page.label;
    a.append(svg,label);nav.append(a);
  }
  document.body.append(nav);document.body.classList.add('recast-web-mobile-nav');
  loadStyle();
}
function loadStyle(){
  if(document.querySelector('link[data-recast-bottom-nav]'))return;
  const link=document.createElement('link');link.rel='stylesheet';
  link.href='/mobile-bottom-nav.css?v=1';link.dataset.recastBottomNav='1';
  document.head.append(link);
}
