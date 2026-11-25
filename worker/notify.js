/* Avisos dentro do app + Web Push (VAPID, aes128gcm) sem dependências. */
const enc = new TextEncoder();
const b64u = (buf) => { let s = ''; for (const b of new Uint8Array(buf)) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const r = atob(s); const o = new Uint8Array(r.length); for (let i = 0; i < r.length; i++) o[i] = r.charCodeAt(i); return o; };
const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };

let vapidCache = null;
export async function getVapid(env) {
  if (vapidCache) return vapidCache;
  let row = await env.DB.prepare("SELECT v FROM config WHERE k = 'vapid'").first();
  if (!row) {
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const pub = b64u(await crypto.subtle.exportKey('raw', kp.publicKey));
    const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
    await env.DB.prepare("INSERT OR IGNORE INTO config (k, v) VALUES ('vapid', ?)").bind(JSON.stringify({ pub, jwk })).run();
    row = await env.DB.prepare("SELECT v FROM config WHERE k = 'vapid'").first();
  }
  const { pub, jwk } = JSON.parse(row.v);
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  vapidCache = { pub, key };
  return vapidCache;
}

async function jwt(vapid, aud, sub) {
  const head = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, vapid.key, enc.encode(`${head}.${body}`));
  return `${head}.${body}.${b64u(sig)}`;
}

async function hkdf(salt, ikm, info, len) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, len * 8));
}

async function encrypt(sub, payload) {
  const uaPub = unb64u(sub.p256dh), auth = unb64u(sub.auth);
  const eph = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', eph.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const secret = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, eph.privateKey, 256));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hkdf(auth, secret, cat(enc.encode('WebPush: info\0'), uaPub, asPub), 32);
  const cek = await hkdf(salt, prk, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, prk, enc.encode('Content-Encoding: nonce\0'), 12);
  const aes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const data = cat(enc.encode(payload), new Uint8Array([2]));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, data));
  const rs = new Uint8Array([0, 0, 0x10, 0]);
  return cat(salt, rs, new Uint8Array([asPub.length]), asPub, ct);
}

async function sendPush(env, sub, payload, origin) {
  try {
    const vapid = await getVapid(env);
    const aud = new URL(sub.endpoint).origin;
    const body = await encrypt(sub, JSON.stringify(payload));
    const res = await fetch(sub.endpoint, {
      method: 'POST',
      headers: { 'content-encoding': 'aes128gcm', 'content-type': 'application/octet-stream', ttl: '86400', urgency: 'normal', authorization: `vapid t=${await jwt(vapid, aud, origin)}, k=${vapid.pub}` },
      body
    });
    if (res.status === 404 || res.status === 410) await env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(sub.endpoint).run();
  } catch { /* aviso é opcional: nunca derruba a ação do usuário */ }
}

export function textFor(type, actor, n = 1) {
  const who = actor || 'Um profissional anônimo';
  switch (type) {
    case 'like': return n > 1 ? `${n} pessoas deram raio no seu post` : 'Alguém deu raio no seu post';
    case 'clike': return n > 1 ? `${n} pessoas deram raio no seu comentário` : 'Alguém deu raio no seu comentário';
    case 'comment': return `${who} comentou no seu post`;
    case 'reply': return `${who} respondeu seu comentário`;
    case 'mention': return `${who} mencionou você`;
    case 'follow': return `${who} começou a seguir você`;
    case 'request': return `${who} pediu para seguir você`;
    case 'placenew': return `Novas avaliações em ${actor || 'um local que você acompanha'}`;
    case 'announce': return 'Novo aviso do UniRad';
    case 'approved': return `${who} aceitou seu pedido para seguir`;
    default: return 'Novo aviso';
  }
}

/* Cria o aviso. Raios iguais ainda não lidos viram um só ("4 pessoas deram raio"). */
export async function notify(env, { to, type, actorId = null, actorName = null, ref = null, snippet = '' }) {
  if (!to || to === actorId) return;
  const now = Date.now();
  if (type === 'like' || type === 'clike' || type === 'placenew') {
    const ex = await env.DB.prepare('SELECT id FROM notifications WHERE user_id = ? AND type = ? AND ref = ? AND read = 0').bind(to, type, ref).first();
    if (ex) { await env.DB.prepare('UPDATE notifications SET n = n + 1, created_at = ? WHERE id = ?').bind(now, ex.id).run(); return; }
  }
  await env.DB.prepare('INSERT INTO notifications (id, user_id, type, actor_id, actor_name, ref, snippet, n, created_at, read) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 0)')
    .bind(crypto.randomUUID(), to, type, actorId, actorName, ref, String(snippet).slice(0, 80), now).run();
  const job = (async () => {
    const subs = await env.DB.prepare('SELECT endpoint, p256dh, auth FROM push_subs WHERE user_id = ?').bind(to).all();
    if (!subs.results.length) return;
    const payload = { title: 'UniRad', body: textFor(type, actorName), url: '/' };
    await Promise.all(subs.results.map((s) => sendPush(env, s, payload, env.origin)));
  })();
  if (env.ctx && env.ctx.waitUntil) env.ctx.waitUntil(job); else await job;
}
