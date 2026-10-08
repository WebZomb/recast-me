// Narrow Gmail SMTP client for plain-text owner alerts. No arbitrary hosts or headers.
const mailbox = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
export function gmailReady(env) {
  return mailbox.test(env.ALERT_GMAIL_USER || '') && /@gmail\.com$/i.test(env.ALERT_GMAIL_USER || '') && /^[a-z]{16}$/i.test(String(env.ALERT_GMAIL_APP_PASSWORD || '').replace(/ /g, ''));
}
export async function sendGmailAlert(env, {to, subject, text, identity}, connectSocket, timeoutMs = 15000) {
  if (!gmailReady(env) || !mailbox.test(to) || to.length > 254 || !/^[\x20-\x7e]{1,100}$/.test(subject) || text.length > 4096 || !/^[a-f0-9]{64}$/.test(identity)) {
    return {status:'blocked', reason:'alert_gmail_configuration'};
  }
  let socket, timer;
  const close = () => { try { socket?.close().catch(() => {}); } catch {} };
  try {
    const connect = connectSocket || (await import('cloudflare:sockets')).connect;
    socket = connect({hostname:'smtp.gmail.com', port:465}, {secureTransport:'on'});
    socket.closed.catch(() => {});
    const reader = socket.readable.getReader(), writer = socket.writable.getWriter();
    const encoder = new TextEncoder(), decoder = new TextDecoder();
    let buffer = '', bytes = 0;
    const line = async () => {
      while (!buffer.includes('\r\n')) {
        const chunk = await reader.read();
        if (chunk.done) throw Error('smtp_closed');
        bytes += chunk.value.length;
        if (bytes > 32768) throw Error('smtp_response_limit');
        buffer += decoder.decode(chunk.value, {stream:true});
      }
      const end = buffer.indexOf('\r\n'), value = buffer.slice(0,end);
      buffer = buffer.slice(end+2);
      return value;
    };
    const reply = async expected => {
      let code;
      for (let n=0; n<100; n++) {
        const match = /^(\d{3})([ -])/.exec(await line());
        if (!match || (code && code !== match[1])) throw Error('smtp_protocol');
        code = match[1];
        if (match[2] === ' ') {
          if (!expected.includes(Number(code))) {
            const error = Error('smtp_rejected');
            error.rejected = /^[45]/.test(code);
            throw error;
          }
          return;
        }
      }
      throw Error('smtp_response_limit');
    };
    const write = value => writer.write(encoder.encode(value+'\r\n'));
    const command = async (value, expected) => { await write(value); await reply(expected); };
    const send = async () => {
      await socket.opened;
      await reply([220]);
      await command('EHLO recastmeai.com',[250]);
      const password = env.ALERT_GMAIL_APP_PASSWORD.replace(/ /g,'');
      await command('AUTH PLAIN '+btoa('\0'+env.ALERT_GMAIL_USER+'\0'+password),[235]);
      await command('MAIL FROM:<'+env.ALERT_GMAIL_USER+'>',[250]);
      await command('RCPT TO:<'+to+'>',[250,251]);
      await command('DATA',[354]);
      const encoded = btoa(String.fromCharCode(...encoder.encode(text))).match(/.{1,76}/g).join('\r\n');
      await write([
        'From: Recast Me Alerts <'+env.ALERT_GMAIL_USER+'>', 'To: <'+to+'>',
        'Subject: '+subject, 'Date: '+new Date().toUTCString(),
        'Message-ID: <'+identity+'@recastmeai.com>', 'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', encoded, '.'
      ].join('\r\n'));
      await reply([250]); // Only the final DATA acknowledgement means provider acceptance.
      return {status:'accepted', providerId:identity};
    };
    return await Promise.race([send(), new Promise((_,reject) => {timer=setTimeout(() => {close();reject(Error('smtp_timeout'));},timeoutMs);})]);
  } catch(error) {
    // Never return provider text or credentials, and never retry ambiguous submissions.
    return {status:error.rejected?'rejected':'unknown', reason:error.rejected?'gmail_rejected':'connection_result_unknown'};
  } finally { clearTimeout(timer); close(); }
}
