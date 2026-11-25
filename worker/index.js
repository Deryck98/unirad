/* UniRad - API (Cloudflare Worker + D1). Sem dependências. */

const DAY = 86400000;
const SESSION_DAYS = 30;
const ROLES = ['Técnico em Radiologia', 'Tecnólogo em Radiologia'];
const DELAY_TYPES = ['Salário atrasado', 'Pagamento abaixo do piso', 'Hora extra / plantão sem pagar', 'Adicional não pago', 'Outro'];
const CATS = ['geral', 'vagas', 'cursos', 'enquete'];
const PAGE = 20;
const MAX_IMG = 1500000;
const KEY_RE = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;
const REGION_MAX = 19;
const HIDE_AFTER_REPORTS = 3;
const MIN_FOR_HOSPITAL = 3;

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const bad = (m) => new HttpError(400, m);

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });

const enc = new TextEncoder();
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (h) => new Uint8Array(h.match(/.{2}/g).map((x) => parseInt(x, 16)));

async function sha256(text) { return toHex(await crypto.subtle.digest('SHA-256', enc.encode(text))); }
async function hashPassword(password, saltHex) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: 100000 }, key, 256);
  return toHex(bits);
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function getCookie(req, name) {
  const c = req.headers.get('cookie') || '';
  for (const part of c.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}
const sessionCookie = (token, maxAge) =>
  `unirad_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;

async function createSession(env, userId) {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const expires = Date.now() + SESSION_DAYS * DAY;
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(await sha256(token), userId, expires).run();
  return token;
}

async function currentUser(req, env) {
  const token = getCookie(req, 'unirad_session');
  if (!token) return null;
  const row = await env.DB.prepare(
    'SELECT u.id, u.name, u.role, u.region, u.anon_default, u.bio, u.trainings, u.experience, u.avatar FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?'
  ).bind(await sha256(token), Date.now()).first();
  return row || null;
}
const publicUser = (u) => ({ id: u.id, name: u.name, role: u.role, region: u.region, anon: !!u.anon_default, bio: u.bio || '', trainings: u.trainings || '', experience: u.experience || '', avatar: u.avatar || '' });

async function readJson(req) {
  const ct = req.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw bad('Requisição inválida.');
  try { return await req.json(); } catch { throw bad('Requisição inválida.'); }
}
const str = (v, max) => String(v ?? '').trim().slice(0, max);

function checkOrigin(req, url) {
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== url.host) throw new HttpError(403, 'Origem não permitida.');
}

function scopeClause(scope) {
  if (scope === 'brasil') return { sql: "p.scope = 'brasil'", args: [] };
  const r = Number(scope);
  if (!Number.isInteger(r) || r < 1 || r > REGION_MAX) throw bad('Região inválida.');
  return { sql: 'p.region = ?', args: [r] };
}

/* ---------- rotas ---------- */
async function signup(req, env) {
  const b = await readJson(req);
  const name = str(b.name, 80);
  const email = str(b.email, 120).toLowerCase();
  const crtrRaw = str(b.crtr, 12).toUpperCase();
  const role = str(b.role, 40);
  const region = Number(b.region);
  const password = String(b.password ?? '');
  if (name.length < 5) throw bad('Digite seu nome completo.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw bad('Digite um e-mail válido.');
  if (!ROLES.includes(role)) throw bad('Escolha sua função.');
  const m = /^(\d{3,6})([TNA])$/.exec(crtrRaw);
  if (!m) throw bad('Digite o número do CRTR (só os números; a letra é automática).');
  if (m[2] !== (role.startsWith('Tecnólogo') ? 'N' : 'T')) throw bad('A letra do CRTR não combina com a função escolhida.');
  const crtr = m[1].padStart(5, '0') + m[2];
  if (!Number.isInteger(region) || region < 1 || region > REGION_MAX) throw bad('Escolha a região do seu CRTR.');
  if (password.length < 6 || password.length > 100) throw bad('A senha precisa ter de 6 a 100 caracteres.');

  const dupe = await env.DB.prepare('SELECT email, crtr FROM users WHERE email = ? OR (region = ? AND crtr = ?)').bind(email, region, crtr).first();
  if (dupe) throw new HttpError(409, dupe.email === email ? 'Esse e-mail já tem cadastro. Use Entrar.' : 'Esse CRTR já está cadastrado nessa região. Se for o seu, use Entrar.');

  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await hashPassword(password, salt);
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO users (id, name, email, crtr, role, region, anon_default, pass_hash, pass_salt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, name, email, crtr, role, region, b.anon === false ? 0 : 1, hash, salt, Date.now()).run();
  const token = await createSession(env, id);
  const user = await currentUserById(env, id);
  return json({ user: publicUser(user) }, 201, { 'set-cookie': sessionCookie(token, SESSION_DAYS * 86400) });
}
const currentUserById = (env, id) => env.DB.prepare('SELECT id, name, role, region, anon_default, bio, trainings, experience, avatar FROM users WHERE id = ?').bind(id).first();

async function login(req, env) {
  const b = await readJson(req);
  const email = str(b.email, 120).toLowerCase();
  const password = String(b.password ?? '');
  const u = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  /* tempo parecido haja ou não usuário, para não revelar e-mails cadastrados */
  const salt = u ? u.pass_salt : '00'.repeat(16);
  const hash = await hashPassword(password, salt);
  if (!u || !timingSafeEqual(hash, u.pass_hash)) throw new HttpError(401, 'E-mail ou senha incorretos.');
  const token = await createSession(env, u.id);
  return json({ user: publicUser(u) }, 200, { 'set-cookie': sessionCookie(token, SESSION_DAYS * 86400) });
}

async function logout(req, env) {
  const token = getCookie(req, 'unirad_session');
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
}

async function deleteAccount(req, env, user) {
  const b = await readJson(req);
  const row = await env.DB.prepare('SELECT pass_hash, pass_salt FROM users WHERE id = ?').bind(user.id).first();
  if (!row || !timingSafeEqual(await hashPassword(String(b.password ?? ''), row.pass_salt), row.pass_hash)) throw new HttpError(401, 'Senha incorreta.');
  const id = user.id;
  const ups = await env.DB.prepare('SELECT key FROM uploads WHERE user_id = ?').bind(id).all();
  for (let i = 0; i < ups.results.length; i += 500) await env.PHOTOS.delete(ups.results.slice(i, i + 500).map((r) => r.key));
  await env.DB.batch([
    env.DB.prepare('DELETE FROM uploads WHERE user_id = ?').bind(id),
    env.DB.prepare('DELETE FROM comment_likes WHERE user_id = ? OR comment_id IN (SELECT id FROM comments WHERE user_id = ? OR post_id IN (SELECT id FROM posts WHERE user_id = ?))').bind(id, id, id),
    env.DB.prepare('DELETE FROM comments WHERE user_id = ? OR post_id IN (SELECT id FROM posts WHERE user_id = ?)').bind(id, id),
    env.DB.prepare('DELETE FROM likes WHERE user_id = ? OR post_id IN (SELECT id FROM posts WHERE user_id = ?)').bind(id, id),
    env.DB.prepare('DELETE FROM reports WHERE user_id = ? OR post_id IN (SELECT id FROM posts WHERE user_id = ?)').bind(id, id),
    env.DB.prepare('DELETE FROM poll_votes WHERE user_id = ? OR post_id IN (SELECT id FROM posts WHERE user_id = ?)').bind(id, id),
    env.DB.prepare('DELETE FROM posts WHERE user_id = ?').bind(id),
    env.DB.prepare('DELETE FROM delays WHERE user_id = ?').bind(id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id)
  ]);
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
}

async function stats(url, env) {
  const scope = url.searchParams.get('scope') || 'brasil';
  const national = (await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first()).n;
  let members = national;
  let dWhere = '1=1';
  const args = [];
  if (scope !== 'brasil') {
    const r = Number(scope);
    if (!Number.isInteger(r) || r < 1 || r > REGION_MAX) throw bad('Região inválida.');
    members = (await env.DB.prepare('SELECT COUNT(*) AS n FROM users WHERE region = ?').bind(r).first()).n;
    dWhere = 'region = ?'; args.push(r);
  }
  const total = (await env.DB.prepare(`SELECT COUNT(DISTINCT COALESCE(batch_id, id)) AS n FROM delays WHERE ${dWhere}`).bind(...args).first()).n;
  const avg = (await env.DB.prepare(`SELECT AVG(days) AS a FROM delays WHERE ${dWhere} AND type = 'Salário atrasado' AND days > 0`).bind(...args).first()).a;
  const top = await env.DB.prepare(
    `SELECT MIN(hospital) AS hospital, COUNT(DISTINCT COALESCE(batch_id, id)) AS n FROM delays WHERE ${dWhere} GROUP BY LOWER(TRIM(hospital)) HAVING COUNT(DISTINCT COALESCE(batch_id, id)) >= ? ORDER BY n DESC LIMIT 5`
  ).bind(...args, MIN_FOR_HOSPITAL).all();
  return json({ members, national, delays: { total, avgDays: avg ? Math.round(avg) : 0, top: top.results } });
}

async function listPosts(url, env, user) {
  const sc = scopeClause(url.searchParams.get('scope') || 'brasil');
  const cat = url.searchParams.get('cat') || 'tudo';
  let catSql = '';
  const args = [user.id, ...sc.args];
  if (cat !== 'tudo') {
    if (!CATS.includes(cat)) throw bad('Categoria inválida.');
    catSql = ' AND p.cat = ?'; args.push(cat);
  }
  const before = Number(url.searchParams.get('before')) || 0;
  let beforeSql = '';
  if (before) { beforeSql = ' AND p.created_at < ?'; args.push(before); }
  const rows = await env.DB.prepare(
    `SELECT p.id, p.cat, p.scope, p.region, p.anon, p.author_name, p.text, p.place, p.salary, p.poll, p.image, p.created_at, p.user_id, (SELECT avatar FROM users u WHERE u.id = p.user_id) AS avatar,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes,
      EXISTS (SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked
     FROM posts p
     WHERE ${sc.sql}${catSql}${beforeSql} AND (SELECT COUNT(*) FROM reports r WHERE r.post_id = p.id) < ${HIDE_AFTER_REPORTS}
     ORDER BY p.created_at DESC LIMIT ${PAGE + 1}`
  ).bind(...args).all();
  const more = rows.results.length > PAGE;
  const posts = rows.results.slice(0, PAGE);
  const byId = new Map(posts.map((p) => [p.id, []]));
  if (posts.length) {
    const ids = posts.map((p) => p.id);
    const cm = await env.DB.prepare(
      `SELECT c.id, c.post_id, c.user_id, c.anon, c.author_name, c.text, c.created_at, c.parent_id, (SELECT avatar FROM users u WHERE u.id = c.user_id) AS avatar,
        (SELECT COUNT(*) FROM comment_likes l WHERE l.comment_id = c.id) AS likes,
        EXISTS(SELECT 1 FROM comment_likes l WHERE l.comment_id = c.id AND l.user_id = ?) AS liked
       FROM comments c WHERE c.post_id IN (${ids.map(() => '?').join(',')}) ORDER BY c.created_at ASC`
    ).bind(user.id, ...ids).all();
    for (const c of cm.results) byId.get(c.post_id)?.push({ id: c.id, author: c.anon ? 'Profissional anônimo' : c.author_name, text: c.text, t: c.created_at, mine: c.user_id === user.id, parent: c.parent_id || null, avatar: c.anon ? null : (c.avatar || null), likes: c.likes, liked: !!c.liked });
    const pollIds = posts.filter((p) => p.poll).map((p) => p.id);
    if (pollIds.length) {
      const q = pollIds.map(() => '?').join(',');
      const cnt = await env.DB.prepare(`SELECT post_id, opt, COUNT(*) AS n FROM poll_votes WHERE post_id IN (${q}) GROUP BY post_id, opt`).bind(...pollIds).all();
      const mine = await env.DB.prepare(`SELECT post_id, opt FROM poll_votes WHERE user_id = ? AND post_id IN (${q})`).bind(user.id, ...pollIds).all();
      for (const p of posts) {
        if (!p.poll) continue;
        const opts = JSON.parse(p.poll);
        const counts = opts.map((t, i) => ({ t, n: cnt.results.find((r) => r.post_id === p.id && r.opt === i)?.n || 0 }));
        const v = mine.results.find((r) => r.post_id === p.id);
        p.pollOut = { options: counts, total: counts.reduce((a, c) => a + c.n, 0), voted: v ? v.opt : null };
      }
    }
  }
  return json({
    posts: posts.map((p) => ({
      id: p.id, cat: p.cat, scope: p.scope, region: p.region,
      author: p.anon ? 'Profissional anônimo' : p.author_name, authorId: p.anon ? null : p.user_id, authorAvatar: p.anon ? null : (p.avatar || null), image: p.image || null,
      text: p.text, place: p.place || '', salary: p.salary || '', t: p.created_at,
      likes: p.likes, liked: !!p.liked, mine: p.user_id === user.id, comments: byId.get(p.id) || [], poll: p.pollOut || null
    })),
    more
  });
}

async function rateLimit(env, table, userId, max, windowMs) {
  const n = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id = ? AND created_at > ?`).bind(userId, Date.now() - windowMs).first()).n;
  if (n >= max) throw new HttpError(429, 'Muitas ações em pouco tempo. Tente de novo mais tarde.');
}

function sniff(b) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return ['image/jpeg', 'jpg'];
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return ['image/png', 'png'];
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return ['image/webp', 'webp'];
  return null;
}

async function upload(req, env, user) {
  const len = Number(req.headers.get('content-length') || 0);
  if (len > MAX_IMG) throw new HttpError(413, 'Foto muito grande. Tente outra.');
  const buf = await req.arrayBuffer();
  if (!buf.byteLength || buf.byteLength > MAX_IMG) throw new HttpError(413, 'Foto muito grande. Tente outra.');
  const kind = sniff(new Uint8Array(buf.slice(0, 16)));
  if (!kind) throw bad('Envie uma imagem JPG, PNG ou WEBP.');
  await rateLimit(env, 'uploads', user.id, 30, DAY);
  const key = `${crypto.randomUUID()}.${kind[1]}`;
  await env.PHOTOS.put(key, buf, { httpMetadata: { contentType: kind[0] } });
  await env.DB.prepare('INSERT INTO uploads (key, user_id, created_at) VALUES (?, ?, ?)').bind(key, user.id, Date.now()).run();
  return json({ key }, 201);
}

async function serveImage(env, key) {
  if (!KEY_RE.test(key)) throw new HttpError(404, 'Não encontrado.');
  const obj = await env.PHOTOS.get(key);
  if (!obj) throw new HttpError(404, 'Não encontrado.');
  return new Response(obj.body, { headers: { 'content-type': obj.httpMetadata?.contentType || 'application/octet-stream', 'cache-control': 'private, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' } });
}

async function ownUpload(env, user, key) {
  if (!KEY_RE.test(key)) throw bad('Foto inválida.');
  const r = await env.DB.prepare('SELECT 1 AS x FROM uploads WHERE key = ? AND user_id = ?').bind(key, user.id).first();
  if (!r) throw bad('Foto inválida.');
}

async function dropImage(env, key) {
  if (!key) return;
  await env.PHOTOS.delete(key);
  await env.DB.prepare('DELETE FROM uploads WHERE key = ?').bind(key).run();
}

async function createPost(req, env, user) {
  const b = await readJson(req);
  const cat = str(b.cat, 10);
  const scope = b.scope === 'brasil' ? 'brasil' : 'regiao';
  const text = str(b.text, 800);
  if (!CATS.includes(cat)) throw bad('Escolha o tipo da publicação.');
  if (text.length < 3) throw bad('Escreva algo na publicação.');
  let poll = null;
  if (cat === 'enquete') {
    const opts = Array.isArray(b.poll) ? b.poll.map((x) => str(x, 40)).filter(Boolean) : [];
    if (opts.length < 2 || opts.length > 4) throw bad('A enquete precisa de 2 a 4 opções.');
    poll = JSON.stringify(opts);
  }
  let image = null;
  if (b.image) { image = str(b.image, 60); await ownUpload(env, user, image); }
  await rateLimit(env, 'posts', user.id, 20, DAY);
  const anon = b.anon === false ? 0 : 1;
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO posts (id, user_id, cat, scope, region, anon, author_name, text, place, salary, created_at, poll, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, user.id, cat, scope, user.region, anon, anon ? null : user.name, text,
      cat === 'vagas' ? str(b.place, 80) : null, cat === 'vagas' ? str(b.salary, 30) : null, Date.now(), poll, image).run();
  return json({ id }, 201);
}

async function postExists(env, id) {
  return !!(await env.DB.prepare('SELECT 1 AS x FROM posts WHERE id = ?').bind(id).first());
}

async function toggleLike(env, user, id) {
  if (!(await postExists(env, id))) throw new HttpError(404, 'Publicação não encontrada.');
  const del = await env.DB.prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?').bind(id, user.id).run();
  if (!del.meta.changes) await env.DB.prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)').bind(id, user.id).run();
  return json({ ok: true });
}

async function votePoll(req, env, user, id) {
  const b = await readJson(req);
  const row = await env.DB.prepare('SELECT poll FROM posts WHERE id = ?').bind(id).first();
  if (!row || !row.poll) throw new HttpError(404, 'Enquete não encontrada.');
  const opt = Number(b.opt);
  if (!Number.isInteger(opt) || opt < 0 || opt >= JSON.parse(row.poll).length) throw bad('Opção inválida.');
  const cur = await env.DB.prepare('SELECT opt FROM poll_votes WHERE post_id = ? AND user_id = ?').bind(id, user.id).first();
  if (cur && cur.opt === opt) await env.DB.prepare('DELETE FROM poll_votes WHERE post_id = ? AND user_id = ?').bind(id, user.id).run();
  else if (cur) await env.DB.prepare('UPDATE poll_votes SET opt = ? WHERE post_id = ? AND user_id = ?').bind(opt, id, user.id).run();
  else await env.DB.prepare('INSERT INTO poll_votes (post_id, user_id, opt) VALUES (?, ?, ?)').bind(id, user.id, opt).run();
  return json({ ok: true });
}

async function addComment(req, env, user, id) {
  const b = await readJson(req);
  const text = str(b.text, 300);
  if (!text) throw bad('Escreva um comentário.');
  if (!(await postExists(env, id))) throw new HttpError(404, 'Publicação não encontrada.');
  await rateLimit(env, 'comments', user.id, 60, DAY);
  const anon = b.anon === false ? 0 : 1;
  let parent = null;
  if (b.parent) {
    const pr = await env.DB.prepare('SELECT id, parent_id FROM comments WHERE id = ? AND post_id = ?').bind(String(b.parent), id).first();
    if (!pr) throw new HttpError(404, 'Comentário não encontrado.');
    parent = pr.parent_id || pr.id;
  }
  await env.DB.prepare('INSERT INTO comments (id, post_id, user_id, anon, author_name, text, created_at, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), id, user.id, anon, anon ? null : user.name, text, Date.now(), parent).run();
  return json({ ok: true }, 201);
}

async function reportPost(env, user, id) {
  if (!(await postExists(env, id))) throw new HttpError(404, 'Publicação não encontrada.');
  await env.DB.prepare('INSERT OR IGNORE INTO reports (post_id, user_id, created_at) VALUES (?, ?, ?)').bind(id, user.id, Date.now()).run();
  return json({ ok: true });
}

async function deletePost(env, user, id) {
  const own = await env.DB.prepare('SELECT image FROM posts WHERE id = ? AND user_id = ?').bind(id, user.id).first();
  if (!own) throw new HttpError(404, 'Publicação não encontrada.');
  await dropImage(env, own.image);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE post_id = ?)').bind(id),
    env.DB.prepare('DELETE FROM comments WHERE post_id = ?').bind(id),
    env.DB.prepare('DELETE FROM likes WHERE post_id = ?').bind(id),
    env.DB.prepare('DELETE FROM reports WHERE post_id = ?').bind(id),
    env.DB.prepare('DELETE FROM poll_votes WHERE post_id = ?').bind(id),
    env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id)
  ]);
  return json({ ok: true });
}

async function createDelay(req, env, user) {
  const b = await readJson(req);
  const hospital = str(b.hospital, 80);
  const type = str(b.type, 40);
  const raw = Array.isArray(b.items) ? b.items : [{ month: b.month, days: b.days }];
  if (!hospital) throw bad('Informe o hospital ou a clínica.');
  if (!DELAY_TYPES.includes(type)) throw bad('Escolha o que aconteceu.');
  if (!raw.length || raw.length > 12) throw bad('Marque de 1 a 12 meses.');
  const seen = new Set();
  const items = raw.map((it) => ({ month: str(it && it.month, 7), days: Math.max(0, Math.min(31, Math.round(Number(it && it.days) || 0))) }));
  for (const it of items) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(it.month)) throw bad('Mês inválido.');
    if (seen.has(it.month)) throw bad('Mês repetido.');
    seen.add(it.month);
  }
  await rateLimit(env, 'delays', user.id, 40, DAY);
  const batch = crypto.randomUUID();
  const now = Date.now();
  await env.DB.batch(items.map((it) =>
    env.DB.prepare('INSERT INTO delays (id, user_id, region, hospital, type, month, days, created_at, batch_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), user.id, user.region, hospital, type, it.month, it.days, now, batch)));
  return json({ ok: true }, 201);
}

/* ---------- entrada ---------- */
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
    try {
      const { pathname: p } = url;
      const m = req.method;
      if (p === '/api/health') return json({ ok: true });
      if (m !== 'GET') checkOrigin(req, url);

      if (p === '/api/signup' && m === 'POST') return await signup(req, env);
      if (p === '/api/login' && m === 'POST') return await login(req, env);
      if (p === '/api/logout' && m === 'POST') return await logout(req, env);

      const user = await currentUser(req, env);
      if (p === '/api/me' && m === 'GET') return user ? json({ user: publicUser(user) }) : json({ user: null });
      if (!user) throw new HttpError(401, 'Entre para continuar.');

      if (p === '/api/me' && m === 'PATCH') {
        const b = await readJson(req);
        if (typeof b.anon === 'boolean') await env.DB.prepare('UPDATE users SET anon_default = ? WHERE id = ?').bind(b.anon ? 1 : 0, user.id).run();
        if ('avatar' in b) {
          const old = (await env.DB.prepare('SELECT avatar FROM users WHERE id = ?').bind(user.id).first())?.avatar;
          let nk = '';
          if (b.avatar) { nk = str(b.avatar, 60); await ownUpload(env, user, nk); }
          await env.DB.prepare('UPDATE users SET avatar = ? WHERE id = ?').bind(nk || null, user.id).run();
          if (old && old !== nk) await dropImage(env, old);
        }
        if ('name' in b) {
          const nm = str(b.name, 40);
          if (nm.length < 2) throw bad('Digite um nome com pelo menos 2 letras.');
          await env.DB.batch([
            env.DB.prepare('UPDATE users SET name = ? WHERE id = ?').bind(nm, user.id),
            env.DB.prepare('UPDATE posts SET author_name = ? WHERE user_id = ?').bind(nm, user.id),
            env.DB.prepare('UPDATE comments SET author_name = ? WHERE user_id = ?').bind(nm, user.id),
          ]);
        }
        if ('bio' in b || 'trainings' in b || 'experience' in b) {
          await env.DB.prepare('UPDATE users SET bio = ?, trainings = ?, experience = ? WHERE id = ?')
            .bind(str(b.bio, 160), str(b.trainings, 500), str(b.experience, 500), user.id).run();
        }
        return json({ ok: true });
      }
      if (p === '/api/me' && m === 'DELETE') return await deleteAccount(req, env, user);
      if (p === '/api/stats' && m === 'GET') return await stats(url, env);
      if (p === '/api/posts' && m === 'GET') return await listPosts(url, env, user);
      if (p === '/api/posts' && m === 'POST') return await createPost(req, env, user);
      if (p === '/api/delays' && m === 'POST') return await createDelay(req, env, user);
      if (p === '/api/upload' && m === 'POST') return await upload(req, env, user);
      const im = p.match(/^\/api\/img\/([0-9a-f-]{36}\.[a-z]{3,4})$/);
      if (im && m === 'GET') return await serveImage(env, im[1]);

      const um = p.match(/^\/api\/users\/([0-9a-f-]{36})$/);
      if (um && m === 'GET') {
        const u = await env.DB.prepare('SELECT name, role, region, bio, trainings, experience, avatar FROM users WHERE id = ?').bind(um[1]).first();
        if (!u) throw new HttpError(404, 'Perfil não encontrado.');
        return json({ user: { name: u.name, role: u.role, region: u.region, bio: u.bio || '', trainings: u.trainings || '', experience: u.experience || '', avatar: u.avatar || '' } });
      }

      const cmm = p.match(/^\/api\/comments\/([0-9a-f-]{36})$/);
      const clm = p.match(/^\/api\/comments\/([0-9a-f-]{36})\/like$/);
      if (clm && m === 'POST') {
        const ex = await env.DB.prepare('SELECT 1 AS x FROM comments WHERE id = ?').bind(clm[1]).first();
        if (!ex) throw new HttpError(404, 'Comentário não encontrado.');
        const del = await env.DB.prepare('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?').bind(clm[1], user.id).run();
        if (!del.meta.changes) await env.DB.prepare('INSERT OR IGNORE INTO comment_likes (comment_id, user_id) VALUES (?, ?)').bind(clm[1], user.id).run();
        return json({ ok: true });
      }
      if (cmm && m === 'PATCH') {
        const text = str((await readJson(req)).text, 300);
        if (!text) throw bad('Escreva um comentário.');
        const r = await env.DB.prepare('UPDATE comments SET text = ? WHERE id = ? AND user_id = ?').bind(text, cmm[1], user.id).run();
        if (!r.meta.changes) throw new HttpError(404, 'Comentário não encontrado.');
        return json({ ok: true });
      }
      if (cmm && m === 'DELETE') {
        const own = await env.DB.prepare('SELECT id FROM comments WHERE id = ? AND user_id = ?').bind(cmm[1], user.id).first();
        if (!own) throw new HttpError(404, 'Comentário não encontrado.');
        await env.DB.batch([
          env.DB.prepare('DELETE FROM comment_likes WHERE comment_id = ? OR comment_id IN (SELECT id FROM comments WHERE parent_id = ?)').bind(own.id, own.id),
          env.DB.prepare('DELETE FROM comments WHERE id = ? OR parent_id = ?').bind(own.id, own.id),
        ]);
        return json({ ok: true });
      }
      const pm = p.match(/^\/api\/posts\/([0-9a-f-]{36})(?:\/(like|comments|report|vote))?$/);
      if (pm) {
        const [, id, action] = pm;
        if (!action && m === 'DELETE') return await deletePost(env, user, id);
        if (!action && m === 'PATCH') {
          const b = await readJson(req);
          const text = str(b.text, 800);
          if (text.length < 3) throw bad('Escreva algo na publicação.');
          const r = await env.DB.prepare('UPDATE posts SET text = ? WHERE id = ? AND user_id = ?').bind(text, id, user.id).run();
          if (!r.meta.changes) throw new HttpError(404, 'Publicação não encontrada.');
          return json({ ok: true });
        }
        if (action === 'like' && m === 'POST') return await toggleLike(env, user, id);
        if (action === 'comments' && m === 'POST') return await addComment(req, env, user, id);
        if (action === 'report' && m === 'POST') return await reportPost(env, user, id);
        if (action === 'vote' && m === 'POST') return await votePoll(req, env, user, id);
      }
      throw new HttpError(404, 'Não encontrado.');
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error('erro', e && e.stack || e);
      return json({ error: 'Erro no servidor. Tente de novo.' }, 500);
    }
  }
};
