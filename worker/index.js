/* UniRad - API (Cloudflare Worker + D1). Sem dependências. */

const DAY = 86400000;
const SESSION_DAYS = 30;
const ROLES = ['Técnico em Radiologia', 'Tecnólogo em Radiologia'];
const DELAY_TYPES = ['Salário atrasado', 'Pagamento abaixo do piso', 'Hora extra / plantão sem pagar', 'Adicional não pago', 'Outro'];
const CATS = ['geral', 'vagas', 'cursos'];
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
    'SELECT u.id, u.name, u.role, u.region, u.anon_default FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?'
  ).bind(await sha256(token), Date.now()).first();
  return row || null;
}
const publicUser = (u) => ({ id: u.id, name: u.name, role: u.role, region: u.region, anon: !!u.anon_default });

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
  const crtr = str(b.crtr, 12);
  const role = str(b.role, 40);
  const region = Number(b.region);
  const password = String(b.password ?? '');
  if (name.length < 5) throw bad('Digite seu nome completo.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw bad('Digite um e-mail válido.');
  if (!/^[0-9A-Za-z.\-/]{3,12}$/.test(crtr)) throw bad('Digite o número do CRTR (3 a 12 caracteres).');
  if (!ROLES.includes(role)) throw bad('Escolha sua função.');
  if (!Number.isInteger(region) || region < 1 || region > REGION_MAX) throw bad('Escolha a região do seu CRTR.');
  if (password.length < 8 || password.length > 100) throw bad('A senha precisa ter de 8 a 100 caracteres.');

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
const currentUserById = (env, id) => env.DB.prepare('SELECT id, name, role, region, anon_default FROM users WHERE id = ?').bind(id).first();

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
  await env.DB.batch([
    env.DB.prepare('DELETE FROM comments WHERE user_id = ? OR post_id IN (SELECT id FROM posts WHERE user_id = ?)').bind(id, id),
    env.DB.prepare('DELETE FROM likes WHERE user_id = ? OR post_id IN (SELECT id FROM posts WHERE user_id = ?)').bind(id, id),
    env.DB.prepare('DELETE FROM reports WHERE user_id = ? OR post_id IN (SELECT id FROM posts WHERE user_id = ?)').bind(id, id),
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
  const total = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM delays WHERE ${dWhere}`).bind(...args).first()).n;
  const avg = (await env.DB.prepare(`SELECT AVG(days) AS a FROM delays WHERE ${dWhere} AND type = 'Salário atrasado' AND days > 0`).bind(...args).first()).a;
  const top = await env.DB.prepare(
    `SELECT MIN(hospital) AS hospital, COUNT(*) AS n FROM delays WHERE ${dWhere} GROUP BY LOWER(TRIM(hospital)) HAVING COUNT(*) >= ? ORDER BY n DESC LIMIT 5`
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
  const rows = await env.DB.prepare(
    `SELECT p.id, p.cat, p.scope, p.region, p.anon, p.author_name, p.text, p.place, p.salary, p.created_at, p.user_id,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes,
      EXISTS (SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked
     FROM posts p
     WHERE ${sc.sql}${catSql} AND (SELECT COUNT(*) FROM reports r WHERE r.post_id = p.id) < ${HIDE_AFTER_REPORTS}
     ORDER BY p.created_at DESC LIMIT 50`
  ).bind(...args).all();
  const posts = rows.results;
  const byId = new Map(posts.map((p) => [p.id, []]));
  if (posts.length) {
    const ids = posts.map((p) => p.id);
    const cm = await env.DB.prepare(
      `SELECT id, post_id, anon, author_name, text, created_at FROM comments WHERE post_id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at ASC`
    ).bind(...ids).all();
    for (const c of cm.results) byId.get(c.post_id)?.push({ id: c.id, author: c.anon ? 'Profissional anônimo' : c.author_name, text: c.text, t: c.created_at });
  }
  return json({
    posts: posts.map((p) => ({
      id: p.id, cat: p.cat, scope: p.scope, region: p.region,
      author: p.anon ? 'Profissional anônimo' : p.author_name,
      text: p.text, place: p.place || '', salary: p.salary || '', t: p.created_at,
      likes: p.likes, liked: !!p.liked, mine: p.user_id === user.id, comments: byId.get(p.id) || []
    }))
  });
}

async function rateLimit(env, table, userId, max, windowMs) {
  const n = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE user_id = ? AND created_at > ?`).bind(userId, Date.now() - windowMs).first()).n;
  if (n >= max) throw new HttpError(429, 'Muitas ações em pouco tempo. Tente de novo mais tarde.');
}

async function createPost(req, env, user) {
  const b = await readJson(req);
  const cat = str(b.cat, 10);
  const scope = b.scope === 'brasil' ? 'brasil' : 'regiao';
  const text = str(b.text, 800);
  if (!CATS.includes(cat)) throw bad('Escolha o tipo da publicação.');
  if (text.length < 3) throw bad('Escreva algo na publicação.');
  await rateLimit(env, 'posts', user.id, 20, DAY);
  const anon = b.anon === false ? 0 : 1;
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO posts (id, user_id, cat, scope, region, anon, author_name, text, place, salary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, user.id, cat, scope, user.region, anon, anon ? null : user.name, text,
      cat === 'vagas' ? str(b.place, 80) : null, cat === 'vagas' ? str(b.salary, 30) : null, Date.now()).run();
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

async function addComment(req, env, user, id) {
  const b = await readJson(req);
  const text = str(b.text, 300);
  if (!text) throw bad('Escreva um comentário.');
  if (!(await postExists(env, id))) throw new HttpError(404, 'Publicação não encontrada.');
  await rateLimit(env, 'comments', user.id, 60, DAY);
  const anon = b.anon === false ? 0 : 1;
  await env.DB.prepare('INSERT INTO comments (id, post_id, user_id, anon, author_name, text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), id, user.id, anon, anon ? null : user.name, text, Date.now()).run();
  return json({ ok: true }, 201);
}

async function reportPost(env, user, id) {
  if (!(await postExists(env, id))) throw new HttpError(404, 'Publicação não encontrada.');
  await env.DB.prepare('INSERT OR IGNORE INTO reports (post_id, user_id, created_at) VALUES (?, ?, ?)').bind(id, user.id, Date.now()).run();
  return json({ ok: true });
}

async function deletePost(env, user, id) {
  const own = await env.DB.prepare('SELECT 1 AS x FROM posts WHERE id = ? AND user_id = ?').bind(id, user.id).first();
  if (!own) throw new HttpError(404, 'Publicação não encontrada.');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM comments WHERE post_id = ?').bind(id),
    env.DB.prepare('DELETE FROM likes WHERE post_id = ?').bind(id),
    env.DB.prepare('DELETE FROM reports WHERE post_id = ?').bind(id),
    env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id)
  ]);
  return json({ ok: true });
}

async function createDelay(req, env, user) {
  const b = await readJson(req);
  const hospital = str(b.hospital, 80);
  const type = str(b.type, 40);
  const month = str(b.month, 7);
  const days = Math.max(0, Math.min(365, Math.round(Number(b.days) || 0)));
  if (!hospital) throw bad('Informe o hospital ou a clínica.');
  if (!DELAY_TYPES.includes(type)) throw bad('Escolha o que aconteceu.');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw bad('Mês inválido.');
  await rateLimit(env, 'delays', user.id, 8, DAY);
  await env.DB.prepare('INSERT INTO delays (id, user_id, region, hospital, type, month, days, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), user.id, user.region, hospital, type, month, days, Date.now()).run();
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
        await env.DB.prepare('UPDATE users SET anon_default = ? WHERE id = ?').bind(b.anon === false ? 0 : 1, user.id).run();
        return json({ ok: true });
      }
      if (p === '/api/me' && m === 'DELETE') return await deleteAccount(req, env, user);
      if (p === '/api/stats' && m === 'GET') return await stats(url, env);
      if (p === '/api/posts' && m === 'GET') return await listPosts(url, env, user);
      if (p === '/api/posts' && m === 'POST') return await createPost(req, env, user);
      if (p === '/api/delays' && m === 'POST') return await createDelay(req, env, user);

      const pm = p.match(/^\/api\/posts\/([0-9a-f-]{36})(?:\/(like|comments|report))?$/);
      if (pm) {
        const [, id, action] = pm;
        if (!action && m === 'DELETE') return await deletePost(env, user, id);
        if (action === 'like' && m === 'POST') return await toggleLike(env, user, id);
        if (action === 'comments' && m === 'POST') return await addComment(req, env, user, id);
        if (action === 'report' && m === 'POST') return await reportPost(env, user, id);
      }
      throw new HttpError(404, 'Não encontrado.');
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error('erro', e && e.stack || e);
      return json({ error: 'Erro no servidor. Tente de novo.' }, 500);
    }
  }
};
