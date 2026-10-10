// Deployment smoke never starts paid inference, credits, or orders.
const origin='https://recastmeai.com';
const checks=[['home','/',200],['readiness','/api/render-readiness',200],['models','/api/model-status',200],['admin-auth','/api/admin/provider-status',401]];
async function open(path){
 let error;
 for(let n=0;n<4;n++){
  try{return await fetch(origin+path,{redirect:'follow',cache:'no-store',signal:AbortSignal.timeout(12000)})}
  catch(e){error=e;await new Promise(resolve=>setTimeout(resolve,500))}
 }
 throw error;
}
async function main(){
let errors=0;
for(const [name,path,status] of checks){
 try{
  const res=await open(path);
  const report={name,status:res.status};
  if(res.status!==status)errors++;
  if(name==='home'){report.hasBrand=(await res.text()).includes('Recast Me');if(!report.hasBrand)errors++}
  if(name==='readiness'){const j=await res.json();report.localReady=j.local?.ready===true;report.highReady=j.modes?.high?.ready===true;report.standardReady=j.modes?.quick?.ready===true;if(!report.localReady)errors++}
  console.log(JSON.stringify(report));
 }catch(e){errors++;console.error(JSON.stringify({name,error:String(e.message).slice(0,140)}))}
}
if(errors){console.error('Read-only production smoke failed:',errors);process.exitCode=1}else console.log('Read-only production smoke passed; no paid operations were performed.');

}
main().catch(error=>{
 console.error('Read-only production smoke terminated:',String(error?.message||error).slice(0,150));
 process.exitCode=1;
});
