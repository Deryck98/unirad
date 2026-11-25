/* Camada de dados do UniRad. Usa o servidor (/api) quando existe; senão cai no modo demonstração (só neste aparelho). */
import { CONFIG, LocalStore as L } from './data.js';

export class ApiError extends Error {}

async function call(method, path, body) {
  let res;
  try {
    res = await fetch('/api' + path, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError('Sem conexão. Verifique a internet e tente de novo.');
  }
  let data = null;
  try { data = await res.json(); } catch { /* sem corpo */ }
  if (!res.ok) throw new ApiError((data && data.error) || 'Algo deu errado. Tente de novo.');
  return data;
}

const api = {
  mode: 'api',
  async init() { return (await call('GET', '/me')).user; },
  async signup(d) { return (await call('POST', '/signup', d)).user; },
  async login(email, password) { return (await call('POST', '/login', { email, password })).user; },
  async logout() { await call('POST', '/logout'); },
  async deleteAccount(password) { await call('DELETE', '/me', { password }); },
  async setAnon(anon) { await call('PATCH', '/me', { anon }); },
  saveProfile(p) { return call('PATCH', '/me', p); },
  async getUser(id) { return (await call('GET', '/users/' + id)).user; },
  stats(scope) { return call('GET', '/stats?scope=' + encodeURIComponent(scope)); },
  posts({ scope, cat, before }) { return call('GET', `/posts?scope=${encodeURIComponent(scope)}&cat=${cat || 'tudo'}${before ? '&before=' + before : ''}`); },
  vote(id, opt) { return call('POST', `/posts/${id}/vote`, { opt }); },
  async upload(blob) {
    let res;
    try { res = await fetch('/api/upload', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': blob.type || 'image/jpeg' }, body: blob }); }
    catch { throw new Error('Sem conexão. Verifique a internet e tente de novo.'); }
    let data = null; try { data = await res.json(); } catch { /* sem corpo */ }
    if (!res.ok) throw new Error((data && data.error) || 'Não consegui enviar a foto.');
    return data.key;
  },
  addPost(p) { return call('POST', '/posts', p); },
  toggleLike(id) { return call('POST', `/posts/${id}/like`); },
  addComment(id, text, anon) { return call('POST', `/posts/${id}/comments`, { text, anon }); },
  report(id) { return call('POST', `/posts/${id}/report`); },
  deletePost(id) { return call('DELETE', `/posts/${id}`); },
  editComment(id, text) { return call('PATCH', `/comments/${id}`, { text }); },
  deleteComment(id) { return call('DELETE', `/comments/${id}`); },
  editPost(id, text) { return call('PATCH', `/posts/${id}`, { text }); },
  addDelay(d) { return call('POST', '/delays', d); }
};

/* ---- modo demonstração (localStorage) com a mesma interface ---- */
const demo = {
  mode: 'demo',
  async init() { const u = L.user; return u ? { id: u.id, name: u.name, role: u.role, region: u.region, anon: !!u.anon, bio: u.bio || '', trainings: u.trainings || '', experience: u.experience || '' } : null; },
  async signup(d) { const u = L.signup({ name: d.name, crtr: d.crtr, role: d.role, region: d.region, anon: d.anon }); return { id: u.id, name: u.name, role: u.role, region: u.region, anon: !!u.anon }; },
  async login() { throw new ApiError('No modo demonstração não há login. Crie um cadastro.'); },
  async logout() { L.reset(); L.logout(); },
  async deleteAccount() { L.reset(); L.logout(); },
  async setAnon(anon) { L.updateUser({ anon }); },
  async saveProfile(p) { L.updateUser(p); },
  async getUser() { return null; },
  async stats(scope) {
    const s = scope === 'brasil' ? 'brasil' : Number(scope);
    const delays = L.delays(s);
    const withDays = delays.filter((d) => d.type === 'Salário atrasado' && d.days > 0);
    const by = {};
    delays.forEach((d) => { const k = d.hospital.trim(); if (k) by[k] = (by[k] || 0) + 1; });
    const top = Object.entries(by).filter(([, n]) => n >= CONFIG.hideHospitalBelow).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([hospital, n]) => ({ hospital, n }));
    return { members: L.memberCount(s === 'brasil' ? null : s), national: L.memberCount(null), delays: { total: delays.length, avgDays: withDays.length ? Math.round(withDays.reduce((a, d) => a + d.days, 0) / withDays.length) : 0, top } };
  },
  async vote() {},
  async posts({ scope, cat }) {
    const uid = L.user.id;
    return { more: false, posts: L.posts({ scope: scope === 'brasil' ? 'brasil' : Number(scope), cat }).map((p) => ({
      id: p.id, cat: p.cat, scope: p.scope, region: p.region, author: p.author, text: p.text, place: p.place || '', salary: p.salary || '', t: p.t,
      likes: p.likes, liked: p.likedBy.includes(uid), mine: !p.sample && p.author === L.user.name && !p.anon, sample: !!p.sample,
      comments: p.comments.map((c) => ({ id: c.id, author: c.author, text: c.text, t: c.t })), poll: null
    })) };
  },
  async upload() { throw new Error('Fotos só funcionam na versão completa.'); },
  async addPost(p) { L.addPost({ cat: p.cat, scope: p.scope, region: L.user.region, anon: !!p.anon, author: p.anon ? 'Profissional anônimo' : L.user.name, text: p.text, place: p.place || '', salary: p.salary || '' }); },
  async toggleLike(id) { L.toggleLike(id); },
  async addComment(id, text, anon) { L.addComment(id, text, anon ? 'Profissional anônimo' : L.user.name); },
  async report(id) { L.report(id); },
  async deletePost() {},
  async editPost() {},
  async editComment() {},
  async deleteComment() {},
  async addDelay(d) { (d.items || []).forEach((it) => L.addDelay({ region: L.user.region, hospital: d.hospital, type: d.type, month: it.month, days: it.days, anon: true })); }
};

export async function connect() {
  try {
    const r = await fetch('/api/health', { cache: 'no-store' });
    if (r.ok && (await r.json()).ok) return api;
  } catch { /* sem servidor */ }
  return demo;
}
