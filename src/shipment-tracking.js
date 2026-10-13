// A provider order can expose an early placeholder tracking URL. Do not present
// it as carrier tracking until Printful reports shipment AND a tracking number.
// This helper runs after the customer's private artwork token is validated.
export function publicShipmentTracking(job) {
  const state=String(job?.status||'').toLowerCase();
  const shipped=state==='shipped'||state==='partially_shipped';
  const number=String(job?.trackingNumber||'').trim();
  const hasNumber=shipped&&/^[A-Za-z0-9][A-Za-z0-9 .-]{5,79}$/.test(number);
  const carrier=String(job?.carrier||'').trim().slice(0,60);
  let trackingUrl=null;
  if(hasNumber&&typeof job?.trackingUrl==='string') {
    try {
      const url=new URL(job.trackingUrl);
      const host=url.hostname.toLowerCase();
      const publiclyRoutable=host.includes('.')&&!host.endsWith('.local')&&
        host!=='localhost'&&!/^(?:127|10|0)\./.test(host)&&
        !/^192\.168\./.test(host)&&
        !/^172\.(?:1[6-9]|2\d|3[01])\./.test(host);
      if(url.protocol==='https:'&&!url.username&&!url.password&&
         (!url.port||url.port==='443')&&publiclyRoutable) trackingUrl=url.href;
    } catch {}
  }
  return {
    trackingReady:Boolean(hasNumber&&trackingUrl),
    trackingUrl,
    trackingNumber:hasNumber?number:null,
    carrier:hasNumber?carrier||null:null
  };
}
