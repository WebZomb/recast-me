const endpoint='/api/admin/shop-source-repair/frenchie',status=document.querySelector('#status'),button=document.querySelector('#prepare'),original=document.querySelector('#original');
let current=null,busy=false;
async function request(body){
 const token=sessionStorage.getItem('recast_admin_token');if(!token)throw Error('Unlock the existing private gift review in this tab first.');
 const response=await fetch(endpoint,{method:body?'POST':'GET',headers:{authorization:'Bearer '+token,'x-recast-request':'1',...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'omit',redirect:'error'}),data=await response.json();
 if(!response.ok||!data.ok)throw Error(data.error||'Saved status unavailable.');return data;
}
async function refresh(){if(busy)return;try{
 current=await request();status.textContent='Saved status: '+current.status+'. Fresh attempt: '+(current.attempt||'not requested')+'. Earlier provider outcome: unknown.';
 button.disabled=current.status!=='needs_review'||Boolean(current.attempt);original.replaceChildren();const url=new URL(current.source.asset);
 if(url.origin==='https://cdn.shopify.com'&&url.pathname.startsWith('/s/files/1/0854/3810/3796/files/')){const img=document.createElement('img');img.src=url.href;img.alt='Original approved French Bulldog Christmas Toy Shop artwork';img.referrerPolicy='no-referrer';original.append(img);}
 }catch(error){status.textContent=error.message;button.disabled=true;}}
button.addEventListener('click',async()=>{
 if(busy||button.disabled||!confirm('Request ONE fresh supplier mockup for this French Bulldog coaster? The previous provider outcome remains unknown and its records are preserved. No payment, printing or product publication.'))return;
 busy=true;button.disabled=true;status.textContent='Recording one fresh preview attempt…';
 try{const result=await request({confirmFreshPreview:true,acknowledgePriorUnknown:true,sourceRevision:current.source.sha256});status.textContent='Saved: '+result.status+'. Return to gift review when preparation completes.';}catch(error){status.textContent=error.message;}
 finally{busy=false;}
});
document.querySelector('#refresh').addEventListener('click',refresh);refresh();
