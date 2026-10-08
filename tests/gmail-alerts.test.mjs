import test from 'node:test';
import assert from 'node:assert/strict';
import {gmailReady,sendGmailAlert} from '../src/gmail-alerts.js';
import {alertReadiness,alertSetup} from '../src/owner-alerts.js';
const env={ALERT_EMAIL_PROVIDER:'gmail',ALERT_GMAIL_USER:'fixture@gmail.com',ALERT_GMAIL_APP_PASSWORD:'abcd efgh ijkl mnop'};
const message={to:'owner@example.com',subject:'Recast Me test alert',text:'Test\n.with dot\nUnicode ✓',identity:'a'.repeat(64)};
function fixture({rejectAuth=false,disconnectAfterData=false,stall=false}={}) {
 let controller, closed=false, writes=[], step=0;
 const enc=new TextEncoder();
 const emit=s=>{for (const part of [s.slice(0,3),s.slice(3)])controller.enqueue(enc.encode(part));};
 const socket={opened:Promise.resolve(),closed:Promise.resolve(),readable:new ReadableStream({start(c){controller=c;if(!stall)emit('220 smtp ready\r\n');}}),writable:new WritableStream({write(bytes){
  const value=new TextDecoder().decode(bytes);writes.push(value);
  const answers=['250-smtp ready\r\n250 AUTH PLAIN LOGIN\r\n',rejectAuth?'535 private provider text\r\n':'235 authenticated\r\n','250 sender ok\r\n','250 recipient ok\r\n','354 send data\r\n','250 queued\r\n'];
  if(step===5&&disconnectAfterData){controller.close();closed=true;}else emit(answers[step]);step++;
 }}),close:async()=>{if(!closed){closed=true;controller.close();}}};
 return {writes,connect:(address,options)=>{assert.deepEqual(address,{hostname:'smtp.gmail.com',port:465});assert.equal(options.secureTransport,'on');return socket;},isClosed:()=>closed};
}
test('Gmail readiness is explicit, rejects partial configuration and never falls back',()=>{
 assert.equal(gmailReady(env),true);
 assert.equal(alertReadiness({...env,ALERT_GMAIL_APP_PASSWORD:'',ALERT_RESEND_API_KEY:'secret',ALERT_EMAIL_FROM:'a@b.com'}).email,false);
 assert.match(alertSetup({...env,ALERT_GMAIL_APP_PASSWORD:''}).email,/app password/);
});
test('Gmail TLS SMTP accepts only final DATA acknowledgement with safe encoded body',async()=>{
 const f=fixture();assert.equal((await sendGmailAlert(env,message,f.connect)).status,'accepted');
 assert.equal(f.writes.length,6);assert.match(f.writes[5],/From: Recast Me Alerts <fixture@gmail.com>/);
 assert.match(f.writes[5],/Content-Transfer-Encoding: base64/);assert.equal(f.isClosed(),true);
});
test('Gmail auth rejection is sanitized and never sends DATA',async()=>{
 const f=fixture({rejectAuth:true});const result=await sendGmailAlert(env,message,f.connect);
 assert.equal(result.status,'rejected');assert.equal(f.writes.length,2);assert.doesNotMatch(JSON.stringify(result),/private provider|abcdefgh/);
});
test('SMTP disconnection after submission remains unknown without retry',async()=>{
 const f=fixture({disconnectAfterData:true});assert.equal((await sendGmailAlert(env,message,f.connect)).status,'unknown');assert.equal(f.writes.length,6);
});
test('SMTP timeout closes connection and returns unknown',async()=>{
 const f=fixture({stall:true});assert.equal((await sendGmailAlert(env,message,f.connect,10)).status,'unknown');assert.equal(f.isClosed(),true);assert.equal(f.writes.length,0);
});
test('Header injection and malformed credentials are blocked before network',async()=>{
 const connect=()=>{throw Error('must not connect');};
 for(const change of [{to:'owner@example.com\r\nBcc: evil@example.com'},{subject:'Hi\r\nBcc: evil'},{identity:'invalid'}])assert.equal((await sendGmailAlert(env,{...message,...change},connect)).status,'blocked');
 assert.equal((await sendGmailAlert({...env,ALERT_GMAIL_USER:'owner@example.com'},message,connect)).status,'blocked');
});
