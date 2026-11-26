import { CONFIG, REGIONS, DELAY_TYPES, regionLabel } from './data.js';
import { connect } from './store.js';
import { emblem, startSmil } from './emblem.js';

const $app = document.getElementById('app');
let Store = null;
const ui = { tab: 'inicio', view: 'mine', cat: 'tudo', modal: null, open: {}, regionQuery: '', regionPick: null, anonDefault: false, viewUser: null, dsel: {}, dy: new Date().getFullYear(), editPost: null, menu: null, cpost: null, cAnon: false, replyTo: null, rep: {}, photoBlob: null, zoomSrc: '', signupStep: 1, sd: {}, more: false, postCat: 'geral', user: null, screen: 'welcome', stats: null, posts: null, loading: false, seq: 0 };

/* ---------- utilidades ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const ago = (t) => {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
};
const logo = (s = 36) => emblem({ size: s, text: false });
const ICONS = {
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  repeat: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  msg: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8.01" y2="11"/><line x1="12" y1="11" x2="12.01" y2="11"/><line x1="16" y1="11" x2="16.01" y2="11"/><line x1="8" y1="15" x2="8.01" y2="15"/><line x1="12" y1="15" x2="12.01" y2="15"/><line x1="16" y1="15" x2="16.01" y2="15"/><line x1="8" y1="19" x2="12" y2="19"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
  thumb: '<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  poll: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  up: '<polyline points="18 15 12 9 6 15"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  chev: '<polyline points="9 18 15 12 9 6"/>',
  bolt: '<path d="M13 3v7h6l-8 11v-7H5z"/>',
  dots: '<circle cx="12" cy="5" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="19" r="1.7" fill="currentColor"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'
};
const emptyState = (icon, title, text, act = '', label = '') => `<div class="empty"><span class="emic">${ic(icon, 28)}</span><b>${title}</b><p>${text}</p>${act ? `<button class="btn out sm" data-action="${act}">${label}</button>` : ''}</div>`;
const ic = (n, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
const CATS = { geral: 'Geral', vagas: 'Vagas', cursos: 'Cursos', enquete: 'Enquete', aviso: 'Aviso' };

const CAT_NAME = { geral: 'Geral', vagas: 'Vaga', cursos: 'Curso', enquete: 'Enquete', aviso: 'Aviso', direitos: 'Direitos' };
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const scopeOf = (v) => (v === 'mine' ? ui.user.region : v === 'brasil' ? 'brasil' : v === 'seguindo' ? 'seguindo' : Number(v));
const viewName = (v) => (v === 'seguindo' ? 'Seguindo' : v === 'mine' ? regionLabel(ui.user.region).split(' · ')[0] : v === 'brasil' ? 'Brasil todo' : regionLabel(v).split(' · ')[0]);

/* ---------- componentes ---------- */
function viewSwitch(follow = false) {
  const other = REGIONS.filter((r) => r.id !== ui.user.region)
    .map((r) => `<option value="${r.id}" ${String(ui.view) === String(r.id) ? 'selected' : ''}>${esc(r.name)}${r.states ? ' · ' + esc(r.states) : ''}</option>`).join('');
  const isOther = /^\d+$/.test(String(ui.view));
  if (follow) {
    return `<div class="vtabs v4">
    <button class="${ui.view === 'mine' ? 'on' : ''}" data-action="view" data-v="mine"><span>Minha região</span></button>
    <button class="${ui.view === 'brasil' ? 'on' : ''}" data-action="view" data-v="brasil"><span>Brasil todo</span></button>
    <button class="${ui.view === 'seguindo' ? 'on' : ''}" data-action="view" data-v="seguindo"><span>Seguindo</span></button>
    <label class="vmore ${isOther ? 'on' : ''}"><span>${isOther ? esc(viewName(ui.view)) : 'Região'} ▾</span><select data-action="view-select" aria-label="Ver outra região"><option value="">Outra região</option>${other}</select></label>
  </div>`;
  }
  return `<div class="vtabs">
    <button class="${ui.view === 'mine' ? 'on' : ''}" data-action="view" data-v="mine"><span>Minha região</span></button>
    <button class="${ui.view === 'brasil' ? 'on' : ''}" data-action="view" data-v="brasil"><span>Brasil todo</span></button>
    <label class="${isOther ? 'on' : ''}"><span>${isOther ? esc(viewName(ui.view)) : 'Região'} ▾</span><select data-action="view-select" aria-label="Ver outra região"><option value="">Outra região</option>${other}</select></label>
  </div>`;
}

const initials = (n) => String(n).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const isAnon = (n) => n === 'Profissional anônimo';
const imgUrl = (k) => `/api/img/${encodeURIComponent(k)}`;
const INVITE = () => `Estou no UniRad, a rede dos técnicos e tecnólogos em radiologia, por piso, jornada e salário em dia. Entre com seu CRTR: ${location.origin}`;
const hue = (n) => { let h = 0; for (const ch of String(n)) h = (h * 31 + ch.charCodeAt(0)) % 997; return h % 6; };
const avatar = (n, key, cls = '') => (isAnon(n) ? `<div class="avatar ${cls}">${ic('user', 18)}</div>` : key ? `<img class="avatar ${cls}" src="${imgUrl(key)}" alt="" loading="lazy" decoding="async">` : `<div class="avatar ini av${hue(n)} ${cls}">${esc(initials(n))}</div>`);

const avBtn = (n, key, uid, cls = '') => (uid && !isAnon(n) && Store.mode === 'api' ? `<button class="avbtn" data-action="avatar-tap" data-id="${uid}" data-src="${key ? esc(imgUrl(key)) : ''}" aria-label="${key ? 'Ampliar foto de ' : 'Ver perfil de '}${esc(n)}">${avatar(n, key, cls)}</button>` : avatar(n, key, cls));

function pollHtml(p) {
  const pl = p.poll;
  if (!pl) return '';
  const voted = pl.voted !== null && pl.voted !== undefined;
  return `<div class="poll">${pl.options.map((o, i) => {
    const pct = pl.total ? Math.round((o.n / pl.total) * 100) : 0;
    return voted
      ? `<button class="opt res ${pl.voted === i ? 'mine' : ''}" data-action="vote" data-id="${p.id}" data-i="${i}" aria-label="${pl.voted === i ? 'Remover meu voto' : 'Votar'}"><span>${esc(o.t)}</span><b>${pct}%</b></button>`
      : `<button class="opt" data-action="vote" data-id="${p.id}" data-i="${i}">${esc(o.t)}</button>`;
  }).join('')}<div class="muted small">${pl.total} ${pl.total === 1 ? 'voto' : 'votos'}${voted ? ' · toque na sua escolha para tirar o voto' : ' · escolha uma opção'}</div></div>`;
}

const findPost = (fn) => (ui.posts || []).find(fn) || (ui.myPosts || []).find(fn) || (ui.mySaved || []).find(fn);
const vbadge = (v) => (v ? `<span class="vchk" title="CRTR verificado" aria-label="CRTR verificado">${ic('check', 13)}</span>` : '');
function postCard(p) {
  return `<article class="post">
    <div class="pcol">${avBtn(p.author, p.authorAvatar, p.authorId)}</div>
    <div class="pmain">
      ${p.sharedBy ? `<div class="rehead">${ic('repeat', 15)}<button class="linkname" data-action="view-user" data-id="${p.sharedBy.id}">${esc(p.sharedBy.name)}</button> compartilhou</div>` : ''}
      <div class="phead">
        <div class="pwho"><span class="name">${p.authorId ? `<button class="linkname" data-action="view-user" data-id="${p.authorId}">${esc(p.author)}</button>` : esc(p.author)}${vbadge(p.authorVerified)}</span>
          <span class="muted small"> · ${esc(regionLabel(p.region).split(' · ')[0])} · ${ago(p.t)}</span>
          ${p.sample ? '<span class="tag">exemplo</span>' : ''}${p.mine && isAnon(p.author) ? '<span class="tag you">só você sabe</span>' : ''}</div>
        <button class="more" data-action="menu-post" data-id="${p.id}" aria-label="Mais opções">${ic('dots', 20)}</button>
      </div>
      ${p.cat !== 'geral' ? `<span class="chip c-${p.cat}">${CATS[p.cat]}</span>` : ''}
      <p class="body">${richText(p.text)}</p>
      ${p.image ? `<button class="pimgwrap" data-action="zoom" data-src="${esc(imgUrl(p.image))}" aria-label="Ampliar foto"><img class="pimg" src="${imgUrl(p.image)}" alt="Foto da publicação" loading="lazy" decoding="async"></button>` : ''}
      ${pollHtml(p)}
      ${p.place || p.salary ? `<div class="meta">${p.place ? `<span>${ic('briefcase', 14)} ${esc(p.place)}</span>` : ''}${p.salary ? `<span>Salário: ${esc(p.salary)}</span>` : ''}</div>` : ''}
      <div class="actions">
        <button class="act ${p.liked ? 'liked' : ''}" data-action="like" data-id="${p.id}" aria-label="Curtir">${ic('bolt', 21)}<span>${p.likes || ''}</span></button>
        <button class="act" data-action="open-comments" data-id="${p.id}" aria-label="Comentários">${ic('msg', 20)}<span>${p.comments.length || ''}</span></button>
        <button class="act ${p.reposted ? 'reposted' : ''}" data-action="share-post" data-id="${p.id}" aria-label="Compartilhar">${ic('repeat', 20)}<span>${p.reposts || ''}</span></button>
      </div>
    </div>
  </article>`;
}

function menuSheet() {
  const m = ui.menu;
  const it = (act, icon, label, cls = '') => `<button class="mi ${cls}" data-action="${act}">${ic(icon, 22)}<span>${label}</span></button>`;
  const items = m.mine
    ? (Store.mode === 'api' ? it('menu-edit', 'edit', 'Editar') : '') + it('menu-delete', 'trash', 'Apagar', 'danger')
    : it('menu-report', 'flag', 'Denunciar', 'danger');
  return `<div class="overlay" data-action="close-modal"><div class="sheet msheet" role="dialog" aria-label="Opções" data-stop="1" id="msheet"><div class="grab" id="grab"><i></i></div>${items}<button class="mi cancel" data-action="close-modal"><span>Cancelar</span></button></div></div>`;
}

const rxEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function threadNames(p) {
  const s = new Set();
  p.comments.forEach((c) => { if (!isAnon(c.author)) s.add(c.author); });
  if (!isAnon(p.author)) s.add(p.author);
  s.delete(ui.user.name);
  return [...s];
}
const URL_RX = /https?:\/\/[^\s<]+/gi;
function linkCard(raw) {
  let tail = ''; let u = raw;
  const m = u.match(/(?:[.,;:!?)\]]|&quot;|&#39;)+$/); if (m) { tail = m[0]; u = u.slice(0, -tail.length); }
  let url; try { url = new URL(u.replace(/&amp;/g, '&')); } catch { return raw; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return raw;
  const full = esc(url.href), host = esc(url.hostname.replace(/^www\./, ''));
  return `<span class="lk"><button type="button" class="lkmain" data-action="open-link" data-url="${full}">${ic('link', 18)}<span class="lkt"><b>${host}</b><span>${esc(url.href.replace(/^https?:\/\/(www\.)?/, ''))}</span></span></button><button type="button" class="lkcopy" data-action="copy-link" data-url="${full}" aria-label="Copiar link">${ic('copy', 18)}</button></span>${tail}`;
}
/* texto seguro: escapa, transforma links em cartões e (opcional) destaca @menções */
function richText(text, names) {
  const h = esc(text);
  const alt = names ? names.slice().sort((x, y) => y.length - x.length).map((n) => rxEsc(esc(n))).join('|') : null;
  const men = names ? new RegExp('@(' + (alt ? alt + '|' : '') + '[\\p{L}\\d_]+)', 'gu') : null;
  let out = '', last = 0, mt;
  const plain = (t) => (men ? t.replace(men, '<span class="mention">@$1</span>') : t);
  URL_RX.lastIndex = 0;
  while ((mt = URL_RX.exec(h))) { out += plain(h.slice(last, mt.index)) + linkCard(mt[0]); last = mt.index + mt[0].length; }
  return (out + plain(h.slice(last))).replace(/\n/g, '<br>');
}
function mentionHtml(text, names) { return richText(text, names); }
const SR_TABS = [['tudo', 'Tudo'], ['pessoas', 'Pessoas'], ['geral', 'Posts'], ['vagas', 'Vagas'], ['cursos', 'Cursos']];
function srResults() {
  const s = ui.sr; if (!s) return '';
  if (s.q.trim().length < 2) return emptyState('search', 'Busque no UniRad', 'Pessoas, posts, vagas e cursos. Digite pelo menos 2 letras.');
  if (s.busy && !s.res) return '<p class="muted small center pad8">Buscando…</p>';
  const r = s.res || { people: [], posts: [] };
  if (!r.people.length && !r.posts.length) return emptyState('search', 'Nada encontrado', 'Tente outra palavra ou outro nome.');
  const ppl = r.people.length ? `<div class="srh">Pessoas</div>${r.people.map((u) => `<button class="srp" data-action="view-user" data-id="${u.id}">${avatar(u.name, u.avatar, 'sm')}<span><b>${esc(u.name)}${vbadge(u.verified)}</b><small class="muted">${esc(u.role)} · ${esc(regionLabel(u.region).split(' · ')[0])}${u.workplace ? ' · ' + esc(u.workplace) : ''}</small></span></button>`).join('')}` : '';
  const pst = r.posts.length ? `<div class="srh">Posts</div>${r.posts.map((p) => `<div class="srpost"><div class="muted small">${esc(CAT_NAME[p.cat] || 'Post')} · ${esc(p.author)} · ${ago(p.t)}</div><div>${esc(p.text)}</div></div>`).join('')}` : '';
  return ppl + pst;
}
function modalSearch() {
  const s = ui.sr || { q: '', type: 'tudo' };
  return sheet('Buscar', `<div class="searchbar">${ic('search', 18)}<input id="srq" type="search" placeholder="Buscar pessoas, posts, vagas…" value="${esc(s.q)}" autocomplete="off" enterkeyhint="search"></div>
    <div class="srtabs utabs">${SR_TABS.map(([v, l]) => `<button class="${s.type === v ? 'on' : ''}" data-action="sr-type" data-v="${v}">${l}</button>`).join('')}</div>
    <div id="srres">${srResults()}</div>`);
}
let srT = null;
function runSearch(delay = 280) {
  const s = ui.sr; if (!s) return; clearTimeout(srT);
  const paint = () => { const o = document.getElementById('srres'); if (o && ui.modal === 'search') o.innerHTML = srResults(); };
  if (s.q.trim().length < 2) { s.res = null; return paint(); }
  srT = setTimeout(async () => {
    s.busy = true; const mine = s.q + '|' + s.type;
    try { const r = await Store.search(s.q.trim(), s.type); if (s.q + '|' + s.type === mine) s.res = r; } catch { s.res = { people: [], posts: [] }; }
    s.busy = false; paint();
  }, delay);
}
function modalInvite() {
  return sheet('Convidar colegas', `<div class="invcard"><img src="icons/og-square2.png" alt="UniRad" width="84" height="84"><div><b>Quanto mais colegas, mais força.</b><p>Chame quem trabalha com você. Só entra quem tem CRTR.</p></div></div>
    <a class="btn wa big" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${encodeURIComponent(INVITE())}">${ic('share', 20)} Enviar no WhatsApp</a>
    <button class="btn out" data-action="invite-share">Outras opções</button>
    <button class="btn out" data-action="copy-link" data-url="${esc(location.origin)}">${ic('copy', 18)} Copiar link</button>`);
}
function modalSharePost() {
  const p = ui.sharePost; if (!p) return '';
  const txt = `UniRad: ${String(p.text).slice(0, 140)}${p.text.length > 140 ? '…' : ''}\n${location.origin}`;
  return sheet('Compartilhar', `${!p.mine && Store.mode === 'api' ? `<button class="shrow" data-action="repost" data-id="${p.id}"><span class="shic gold">${ic('repeat', 20)}</span><span><b>${p.reposted ? 'Compartilhado no UniRad' : 'Compartilhar no UniRad'}</b><small class="muted">${p.reposted ? 'Toque para desfazer' : 'Aparece no feed de quem segue você'}</small></span></button>` : ''}
    <a class="shrow" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${encodeURIComponent(txt)}" data-action="close-modal"><span class="shic">${ic('share', 20)}</span><span><b>Enviar por WhatsApp</b></span></a>
    <button class="shrow" data-action="copy-link" data-url="${esc(location.origin)}"><span class="shic">${ic('copy', 20)}</span><span><b>Copiar link do app</b></span></button>`);
}
/* ---------- Painel do fundador ---------- */
const ADM_TABS = [['vis', 'Visão'], ['mod', 'Moderação'], ['usr', 'Usuários'], ['avi', 'Mais']];
function modalAdmin() {
  const A = ui.adm || (ui.adm = { tab: 'vis', f: 'pending', q: '' });
  const tabs = `<div class="utabs adm">${ADM_TABS.map(([k, l]) => `<button class="${A.tab === k ? 'on' : ''}" data-action="adm-tab" data-v="${k}">${l}${k === 'mod' && A.ov && A.ov.reports ? `<i class="cnt">${A.ov.reports}</i>` : ''}</button>`).join('')}</div>`;
  const load = '<p class="muted small center pad8">Carregando…</p>';
  const stat = (t, v, s, c) => `<div class="astat"><div class="muted small">${t}</div><div class="av" ${c ? `style="color:${c}"` : ''}>${v}</div>${s ? `<div class="small ok">${s}</div>` : ''}</div>`;
  let body = '';
  if (A.tab === 'vis') {
    const o = A.ov;
    if (!o) body = load; else {
      const mx = Math.max(1, ...o.series), tot = Math.max(1, ...o.regions.map((r) => r.n));
      body = `<div class="agrid">${stat('Usuários', o.users, o.newToday ? `+${o.newToday} hoje` : '')}${stat('Ativos (7 dias)', o.active7, o.users ? Math.round((o.active7 / o.users) * 100) + '%' : '')}${stat('Posts hoje', o.postsToday)}${stat('Relatos de atraso', o.delays, o.delaysToday ? `+${o.delaysToday} hoje` : '', '#c0392b')}${stat('Status ativos', o.stories)}${stat('A conferir', o.pending, 'novos CRTR', '#b26a00')}</div>
      <div class="acard"><b>Cadastros nos últimos 7 dias</b><div class="abars">${o.series.map((n) => `<div class="ab"><i style="height:${Math.max(4, Math.round((n / mx) * 46))}px"></i><small>${n}</small></div>`).join('')}</div></div>
      <div class="acard"><b>Usuários por região</b>${o.regions.map((r) => `<div class="areg"><span>${esc(regionLabel(r.region).split(' · ')[0])}</span><div class="atrk"><div style="width:${Math.round((r.n / tot) * 100)}%"></div></div><b>${r.n}</b></div>`).join('') || '<p class="muted small">Sem cadastros ainda.</p>'}</div>`;
    }
  } else if (A.tab === 'mod') {
    const r = A.rep;
    body = !r ? load : `<p class="muted small">${r.length ? `${r.length} ${r.length > 1 ? 'itens esperando' : 'item esperando'} decisão. Posts com 3 denúncias ficam ocultos até você decidir.` : 'Nada esperando decisão. Tudo em ordem.'}</p>${r.map((x) => `<div class="acard"><div class="arow"><span class="muted small">${x.anon ? 'Anônimo · ' : ''}${esc(x.author)} · ${esc(regionLabel(x.region).split(' · ')[0])}</span><b class="red small">${x.n} ${x.n > 1 ? 'denúncias' : 'denúncia'}${x.hidden ? ' · oculto' : ''}</b></div><p style="margin:8px 0 12px">${esc(x.text).slice(0, 400)}</p>${x.image ? `<img class="aimg" src="${imgUrl(x.image)}" alt="" loading="lazy">` : ''}<div class="arow gap8"><button class="btn out small" data-action="adm-keep" data-id="${x.id}">Manter</button><button class="btn small" data-action="adm-del" data-id="${x.id}">Apagar</button><button class="btn out small danger full" data-action="adm-del" data-id="${x.id}" data-suspend="1" ${x.suspended ? 'disabled' : ''}>${x.suspended ? 'Já suspenso' : 'Apagar e suspender'}</button></div></div>`).join('')}`;
  } else if (A.tab === 'usr') {
    const fl = [['pending', 'A conferir'], ['all', 'Todos'], ['suspended', 'Suspensos']];
    const us = A.us;
    body = `<input class="asearch" id="admq" type="search" placeholder="Buscar nome, CRTR ou e-mail…" value="${esc(A.q)}" autocomplete="off"><div class="chips">${fl.map(([v, l]) => `<button type="button" class="chip2 ${A.f === v ? 'on' : ''}" data-action="adm-f" data-v="${v}">${l}</button>`).join('')}</div>
      ${!us ? load : `<div class="acard flush" id="admlist">${us.map((u) => `<button class="aurow ${A.sel === u.id ? 'sel' : ''}" data-action="adm-sel" data-id="${u.id}">${avatar(u.name, '', 'sm')}<span class="aun"><b>${esc(u.name)}</b><small class="muted">CRTR ${esc(u.crtr)} · ${esc(regionLabel(u.region).split(' · ')[0])} · ${ago(u.t)}</small></span><span class="atag ${u.suspended ? 'bad' : u.verified ? 'good' : 'warn'}">${u.suspended ? 'Suspenso' : u.verified ? 'Verificado' : 'Conferir'}</span></button>${A.sel === u.id ? `<div class="aact"><p class="muted small">Confira o CRTR no site do conselho da região. ${u.seen ? 'Visto ' + ago(u.seen) + '.' : ''}</p><div class="arow gap8">${u.admin ? '<span class="muted small">Administrador</span>' : `<button class="btn small" data-action="adm-verify" data-id="${u.id}" data-on="${u.verified ? 0 : 1}">${u.verified ? 'Tirar selo' : 'Marcar verificado'}</button><button class="btn out small danger" data-action="adm-susp" data-id="${u.id}" data-on="${u.suspended ? 0 : 1}">${u.suspended ? 'Reativar' : 'Suspender'}</button>`}</div></div>` : ''}`).join('') || '<p class="muted small pad8">Ninguém encontrado.</p>'}</div>`}`;
  } else {
    const bk = A.bk, fmt = (t) => new Date(t).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    body = `<div class="acard"><b>Avisos oficiais</b><p class="muted small" style="margin:4px 0 10px">Aparecem no topo do feed de todos.</p><button class="btn" data-action="open-announce">Publicar aviso do UniRad</button></div>
      <div class="acard"><b>Backup do banco de dados</b><p class="muted small" style="margin:4px 0 10px">Uma cópia automática todo dia (guarda as últimas ${bk ? bk.keep : 14}). Fica no seu Cloudflare, sem senhas de sessão.</p>
      ${!bk ? '<p class="muted small">Carregando…</p>' : `<p class="small" style="margin:0 0 10px">${bk.last ? `Último backup: <b>${fmt(bk.last.t)}</b> · ${(bk.last.size / 1024).toFixed(0)} KB · ${bk.count} guardados` : 'Ainda não há backup. O primeiro roda de madrugada, ou toque abaixo.'}</p>`}
      <button class="btn out" data-action="adm-backup">Fazer backup agora</button></div>`;
  }
  return sheet('Painel do fundador', `${tabs}${body}`);
}
async function admLoad(tab) {
  const A = ui.adm; if (!A) return;
  try {
    if (tab === 'vis') A.ov = await Store.adminOverview();
    else if (tab === 'mod') { A.rep = (await Store.adminReports()).items; if (!A.ov) A.ov = await Store.adminOverview().catch(() => null); }
    else if (tab === 'usr') A.us = (await Store.adminUsers(A.q, A.f)).users;
    else if (tab === 'avi') A.bk = await Store.adminBackup();
  } catch (e) { toast(e.message); }
  if (ui.modal === 'admin') render();
}

function modalLink() {
  const u = ui.linkUrl || '';
  return sheet('Você vai sair do UniRad', `<p class="muted small">Abra só links de quem você confia. Nunca informe senha ou dados de cartão.</p>
    <div class="linkurl">${esc(u)}</div>
    <div class="row gap8"><button type="button" class="btn out" data-action="close-modal">Cancelar</button><a class="btn gold" style="flex:1;text-align:center;text-decoration:none" target="_blank" rel="noopener noreferrer nofollow" href="${esc(u)}" data-action="link-opened">Abrir link</a></div>
    <button type="button" class="linkbtn" style="width:100%;margin-top:6px" data-action="copy-link" data-url="${esc(u)}">Copiar link</button>`);
}
function commentsList(p) {
  const api = Store.mode === 'api';
  const names = threadNames(p).concat(ui.user.name);
  const tops = p.comments.filter((c) => !c.parent);
  const reps = (id) => p.comments.filter((c) => c.parent === id);
  const one = (c, isRep) => {
    const rs = isRep ? [] : reps(c.id);
    return `<div class="cmt ${isRep ? 'rep' : ''}">
      ${avBtn(c.author, c.avatar, c.authorId, isRep ? 'sm' : '')}
      <div class="cbody"><div class="cmeta">${c.authorId ? `<button class="cname" data-action="view-user" data-id="${c.authorId}"><b>${esc(c.author)}</b></button>` : `<b>${esc(c.author)}</b>`} <span class="muted">· ${ago(c.t)}</span></div>
        <div class="ctext">${mentionHtml(c.text, names)}</div>
        <div class="cacts">${api ? `<button data-action="reply" data-id="${c.id}" data-name="${esc(c.author)}">Responder</button>` : ''}${rs.length ? `<button data-action="toggle-replies" data-id="${c.id}">${ui.rep[c.id] ? 'Ocultar respostas' : `Ver ${rs.length} ${rs.length === 1 ? 'resposta' : 'respostas'}`}</button>` : ''}</div></div>
      <div class="ccol">${api ? `<button class="more cmore" data-action="menu-comment" data-pid="${p.id}" data-id="${c.id}" aria-label="Opções do comentário">${ic('dots', 18)}</button>` : ''}${api ? `<button class="clike ${c.liked ? 'liked' : ''}" data-action="like-comment" data-id="${c.id}" aria-label="Curtir comentário">${ic('bolt', 20)}<span>${c.likes || ''}</span></button>` : ''}</div>
    </div>${!isRep && ui.rep[c.id] ? rs.map((r) => one(r, true)).join('') : ''}`;
  };
  return tops.map((c) => one(c, false)).join('') || emptyState('msg', 'Sem comentários ainda', 'Seja o primeiro a comentar.');
}
function modalComments() {
  const p = findPost((x) => x.id === ui.cpost);
  if (!p) return '';
  return `<div class="overlay" id="cov" data-action="close-modal"><div class="sheet csheet" role="dialog" aria-label="Comentários" data-stop="1" id="csheet">
    <div class="grab" id="cgrab"><i></i></div><div class="ctitle">Comentários</div>
    <div class="clist" id="clist">${commentsList(p)}</div>
    <div class="mlist" id="mlist" hidden></div>
    <form class="cform" data-form="comment" data-id="${p.id}" novalidate>
      <div class="replybar" id="replybar" hidden></div>
      <div class="cinput">${avatar(ui.user.name, ui.user.avatar, 'sm')}
        <div class="cfield"><input name="t" id="cin" maxlength="300" placeholder="Adicione um comentário…" autocomplete="off" enterkeyhint="send"><button type="button" class="canon ${ui.cAnon ? 'on' : ''}" id="canon" data-action="toggle-canon">anônimo</button></div>
        <button class="csend" type="submit">Enviar</button></div></form></div></div>`;
}
function updateComments() {
  const p = findPost((x) => x.id === ui.cpost), l = document.getElementById('clist');
  if (!p || !l) return;
  l.innerHTML = commentsList(p);
  const cs = document.querySelector(`.act[data-action="open-comments"][data-id="${p.id}"] span`);
  if (cs) cs.textContent = p.comments.length || '';
}

function composer() {
  const api = Store.mode === 'api';
  return `<div class="composer"><div class="row gap8">
    ${avatar(ui.user.name, ui.user.avatar, ui.user.avatar ? '' : '')}
    <button class="fake" data-action="new-post">Compartilhe algo…</button>
    ${api ? `<button class="ghost" data-action="new-photo" aria-label="Postar foto">${ic('camera', 24)}</button><button class="ghost" data-action="new-poll" aria-label="Criar enquete">${ic('poll', 24)}</button>` : ''}
  </div></div>`;
}

function sheet(title, inner) {
  return `<div class="overlay" data-action="close-modal"><div class="sheet" role="dialog" aria-label="${esc(title)}" data-stop="1" id="gsheet">
    <div class="grab" id="grab"><i></i></div><div class="row between"><h3>${esc(title)}</h3><button class="ghost" data-action="close-modal" aria-label="Fechar">${ic('x')}</button></div>${inner}</div></div>`;
}

const TERMS = `<ul class="rules">
  <li><b>Nada de dados de pacientes:</b> não publique nomes, exames, laudos ou imagens. Isso é sigilo profissional e é protegido pela LGPD.</li>
  <li><b>Relate fatos, sem ofensa:</b> diga o que aconteceu (ex.: "salário de outubro atrasado"). Não xingue nem acuse sem prova.</li>
  <li><b>Documentos:</b> se mostrar contracheque ou comprovante, cubra dados que não sejam seus.</li>
  <li><b>Seu número do CRTR, e-mail e senha</b> ficam em sigilo e não aparecem para ninguém. Em posts anônimos, nem o seu nome aparece para os colegas.</li>
  <li><b>Anonimato entre os membros:</b> o sistema guarda internamente quem escreveu, só para conter abusos e permitir que você apague o que postou. Isso não é mostrado a ninguém na rede.</li>
  <li><b>Fotos e prints:</b> nada de imagens de pacientes, exames ou documentos de terceiros. Cubra nomes, CPF e dados pessoais antes de enviar.</li>
  <li>Posts denunciados por várias pessoas são ocultados.</li>
  <li>Você pode apagar sua conta e seus dados quando quiser, no Perfil.</li>
  <li>O UniRad é um espaço de união da categoria e não substitui orientação de advogado ou do CRTR.</li></ul>`;

const loadingBox = '<div class="skel" role="status" aria-label="Carregando">' + [0, 1, 2].map(() => '<div class="sk"><i></i><div><b></b><b class="w90"></b><b class="w70"></b></div></div>').join('') + '</div>';

/* ---------- telas ---------- */
let installEvt = null;
const standalone = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
const installBtn = (cls = 'btn out') => (standalone() ? '' : `<button class="${cls}" data-action="install">${ic('download', 18)} Instalar app</button>`);

function screenWelcome() {
  return `<main class="welcome">
    <div class="wlogo">${emblem({ size: 128, text: false })}</div>
    <h1>UniRad</h1>
    <p class="lead">${CONFIG.tagline}</p>
    <p class="muted center">A rede dos técnicos e tecnólogos em radiologia, por piso, jornada e salário em dia.</p>
    <ol class="wsteps">
      <li><span>1</span><div><b>Entre com seu CRTR</b><small>Só técnicos e tecnólogos de verdade</small></div></li>
      <li><span>2</span><div><b>Compare salário e jornada</b><small>Anônimo, se quiser, da sua região</small></div></li>
      <li><span>3</span><div><b>Una forças</b><small>Mural de atrasos, vagas e direitos</small></div></li>
    </ol>
    <button class="btn big" data-action="go-signup">Criar meu cadastro</button>
    ${Store.mode === 'api' ? '<button class="btn out" data-action="go-login">Já tenho conta</button>' : ''}
    ${installBtn('btn out slim')}
    ${Store.mode === 'demo' ? '<p class="muted small center">Versão de demonstração: os dados ficam só neste aparelho.</p>' : ''}
  </main>`;
}

const pw = (name, label, ph, ac, val = '') => `<label>${label} <i class="req">*</i><span class="pwbox"><input name="${name}" type="password" autocomplete="${ac}" required minlength="6" placeholder="${ph}" value="${esc(val)}"><button type="button" class="eye" data-action="toggle-pw" aria-label="Mostrar senha">${ic('eye', 22)}</button></span></label>`;

function screenLogin() {
  return `<main class="pad fit">
    <button class="ghost back" data-action="go-welcome">← Voltar</button>
    <div class="authlogo"><div class="wlogo">${emblem({ size: 76, text: false })}</div><div class="brand">UniRad</div></div>
    <h2>Entrar na sua conta</h2>
    <p class="muted">Use o e-mail e a senha do seu cadastro.</p>
    <form data-form="login" novalidate>
      <label>E-mail<input name="email" type="email" autocomplete="email" required placeholder="voce@email.com"></label>
      <label>Senha<span class="pwbox"><input name="password" type="password" autocomplete="current-password" required><button type="button" class="eye" data-action="toggle-pw" aria-label="Mostrar senha">${ic('eye', 22)}</button></span></label>
      <div class="error" id="formError" role="alert"></div>
      <button class="btn big" type="submit">Entrar</button>
    </form>
  </main>`;
}

function regionListHtml() {
  const q = norm(ui.regionQuery);
  const list = REGIONS.filter((r) => !q || norm(r.name + ' ' + r.states).includes(q) || String(r.id) === q.replace(/\D/g, ''));
  return list.map((r) => `<button type="button" class="reg ${ui.regionPick === r.id ? 'on' : ''}" data-action="pick-region" data-id="${r.id}"><b>${esc(r.name)}</b><span class="muted small">${esc(r.states || 'estados a confirmar')}</span></button>`).join('') || '<div class="muted small pad8">Nenhuma região encontrada.</div>';
}
const pickedHtml = () => (ui.regionPick ? `${ic('check', 18)} ${esc(regionLabel(ui.regionPick))}` : '');

function screenSignup() {
  const sd = ui.sd;
  if (ui.signupStep === 1) {
    return `<main class="pad fit">
    <button class="ghost back" data-action="go-welcome">← Voltar</button>
    <div class="authlogo"><div class="wlogo">${emblem({ size: 76, text: false })}</div><div class="brand">UniRad</div></div>
    <h2>Criar cadastro</h2>
    <p class="muted">Passo 1 de 2 · seus dados de acesso</p>
    <form data-form="signup1" novalidate>
      <label>Nome completo <i class="req">*</i><input name="name" autocomplete="name" required minlength="5" placeholder="Seu nome" value="${esc(sd.name || '')}"></label>
      <p class="muted small" style="margin-top:-4px">Depois você escolhe como seu nome aparece no app (só o primeiro nome, apelido…) em Perfil.</p>
      <label>E-mail <i class="req">*</i><input name="email" type="email" autocomplete="email" required placeholder="voce@email.com" value="${esc(sd.email || '')}"></label>
      ${pw('password', 'Senha', 'Mínimo 6 caracteres', 'new-password', sd.password || '')}
      ${pw('password2', 'Confirmar senha', 'Repita a senha', 'new-password', sd.password || '')}
      <div class="error" id="formError" role="alert"></div>
      <button class="btn big" type="submit">Continuar</button>
    </form>
  </main>`;
  }
  return `<main class="pad">
    <button class="ghost back" data-action="signup-back">← Voltar</button>
    <h2>Criar cadastro</h2>
    <p class="muted">Passo 2 de 2 · seu registro profissional</p>
    <form data-form="signup" novalidate>
      <label>Função <i class="req">*</i>
        <select name="role" id="roleSel" required><option value="">Selecione</option><option>Técnico em Radiologia</option><option>Tecnólogo em Radiologia</option></select></label>
      <div class="field">Número do CRTR <i class="req">*</i>
        <div class="crtrbox"><input name="crtr" id="crtrIn" inputmode="numeric" autocomplete="off" required maxlength="6" placeholder="00000" style="width:calc(5ch + 16px)" aria-label="Número do CRTR, só os números"><span id="crtrLetter">T</span></div>
        <div class="muted small">Só os números. A letra (T técnico, N tecnólogo) entra sozinha.</div></div>
      <div class="field">Região do seu CRTR <i class="req">*</i>
        <div class="search">${ic('search', 18)}<input id="regionSearch" value="${esc(ui.regionQuery)}" placeholder="Busque: 19, Amazonas, Pará…" autocomplete="off"></div>
        <div class="picked" id="picked">${pickedHtml()}</div>
        <div class="reglist short" id="reglist">${regionListHtml()}</div>
      </div>
      <p class="muted small">Seu perfil é visível para os colegas. Em cada post ou comentário você escolhe se quer publicar de forma anônima.</p>
      <label class="check"><input type="checkbox" name="terms" required><span>Li e aceito as <a href="#" data-action="show-terms">regras do UniRad</a> <i class="req">*</i></span></label>
      <div class="error" id="formError" role="alert"></div>
      <button class="btn big" type="submit">Criar cadastro</button>
    </form>
  </main>`;
}

const SHORTCUTS = [['tudo', 'users', 'Tudo'], ['vagas', 'briefcase', 'Vagas'], ['cursos', 'book', 'Cursos'], ['enquete', 'poll', 'Enquetes']];
function shortcuts() {
  return `<div class="pills" role="group" aria-label="Filtrar publicações">${SHORTCUTS.filter(([k]) => k !== 'enquete' || Store.mode === 'api').map(([k, i, l]) => `<button type="button" class="pill ${ui.cat === k ? 'on' : ''}" data-action="cat" data-c="${k}">${ic(i, 16)}<span>${k === 'tudo' ? 'Para você' : l}</span></button>`).join('')}</div>`;
}

/* ---------- Status (24 h) ---------- */
const storyList = () => { const st = ui.stories; if (!st) return []; return (st.mine.stories.length ? [st.mine] : []).concat(st.groups); };
function storyBar() {
  if (Store.mode !== 'api' || !ui.user) return '';
  const st = ui.stories, mine = st ? st.mine : { stories: [] }, off = mine.stories.length ? 1 : 0;
  const me = `<div class="stitem"><button class="stav ${mine.stories.length ? 'ring' : 'add'}" data-action="${mine.stories.length ? 'st-open' : 'new-story'}" data-g="0" aria-label="${mine.stories.length ? 'Ver seu status' : 'Criar status'}">${avatar(ui.user.name, ui.user.avatar)}${mine.stories.length ? '' : `<span class="stplus">${ic('plus', 14)}</span>`}</button>${mine.stories.length ? `<button class="stplus out" data-action="new-story" aria-label="Novo status">${ic('plus', 14)}</button>` : ''}<span class="stname">Seu status</span></div>`;
  const others = (st ? st.groups : []).map((g, i) => `<div class="stitem"><button class="stav ring ${g.seen ? 'seen' : ''}" data-action="st-open" data-g="${i + off}" aria-label="Status de ${esc(g.name)}">${g.anon ? `<div class="avatar anonst">${ic('user', 22)}</div>` : avatar(g.name, g.avatar)}</button><span class="stname ${g.seen ? 'muted' : 'b'}">${esc(g.anon ? 'Anônimo' : g.name.split(' ')[0])}</span></div>`).join('');
  return `<div class="stbar" role="group" aria-label="Status">${me}${others}</div>`;
}
function modalStory() {
  const list = storyList(), sv = ui.sv; if (!sv) return '';
  const g = list[sv.g], s = g && g.stories[sv.i]; if (!s) return '';
  const head = g.anon ? `<div class="avatar anonst">${ic('user', 18)}</div><div><b>Anônimo</b><small>${ago(s.t)}</small></div>`
    : `${avatar(g.name, g.avatar)}<div><b>${g.mine ? 'Seu status' : esc(g.name)}</b><small>${ago(s.t)}${g.mine && s.anon ? ' · anônimo' : ''}</small></div>`;
  const bars = g.stories.map((x, k) => `<i class="${k < sv.i ? 'done' : k === sv.i ? 'cur' : ''}"><b ${k === sv.i ? 'data-cur="1"' : ''}></b></i>`).join('');
  const body = s.image ? `<img class="stimg" src="${imgUrl(s.image)}" alt="" decoding="async">${s.text ? `<p class="stcap">${esc(s.text)}</p>` : ''}` : `<p class="sttext">${esc(s.text)}</p>`;
  const foot = s.mine ? `<button class="stbtn" data-action="st-views">${ic('eye', 18)} <span>${s.views || 0}</span>${s.zaps ? ` ${ic('bolt', 15)} <span>${s.zaps}</span>` : ''}</button><button class="stbtn ${sv.del ? 'danger' : ''}" data-action="st-del" aria-label="Apagar status">${ic('trash', 18)}${sv.del ? ' Toque de novo para apagar' : ''}</button>`
    : `<span class="stexp">Some em ${Math.max(1, Math.ceil((s.t + 86400000 - Date.now()) / 3600000))} h</span><button class="stzap ${s.zapped ? 'on' : ''}" data-action="st-zap" aria-label="Reagir com raio">${ic('bolt', 22)}</button>`;
  const panel = sv.panel ? `<div class="stpanel"><div class="grab"><i></i></div><b>Quem viu</b>${!sv.viewers ? '<p class="muted small">Carregando…</p>' : sv.viewers.map((v) => `<div class="stv-row">${avatar(v.name, v.avatar, 'sm')}<span>${esc(v.name)}</span>${v.zap ? `<span class="zp">${ic('bolt', 14)}</span>` : ''}<small class="muted">${ago(v.t)}</small></div>`).join('') || '<p class="muted small">Ninguém viu ainda.</p>'}<button class="btn out" data-action="st-views">Fechar</button></div>` : '';
  return `<div class="overlay stv" id="stv"><div class="stwrap sb${s.image ? 'x' : s.bg}"><div class="stprog">${bars}</div>
    <div class="sthead">${head}<button class="stx" data-action="close-modal" aria-label="Fechar">${ic('x', 22)}</button></div>
    <div class="stzone" id="stzone">${body}</div>
    <div class="stfoot">${foot}</div>${panel}</div></div>`;
}
function showStory(first) {
  const list = storyList(), sv = ui.sv; if (!sv) return;
  const g = list[sv.g], s = g && g.stories[sv.i]; if (!s) return closeModal();
  if (!s.mine && !s.seen) { s.seen = true; g.seen = g.stories.every((x) => x.seen); Store.viewStory(s.id).catch(() => {}); }
  sv.del = false;
  if (first) return;
  const ov = document.getElementById('stv'); if (!ov) return render();
  ov.outerHTML = modalStory(); bindStory();
}
function stNext() {
  const list = storyList(), sv = ui.sv; if (!sv) return;
  const g = list[sv.g];
  if (sv.i < g.stories.length - 1) { sv.i++; sv.panel = false; return showStory(); }
  if (sv.g < list.length - 1) { sv.g++; sv.i = 0; sv.panel = false; return showStory(); }
  closeModal();
}
function stPrev() {
  const list = storyList(), sv = ui.sv; if (!sv) return;
  if (sv.i > 0) { sv.i--; sv.panel = false; return showStory(); }
  if (sv.g > 0) { sv.g--; sv.i = list[sv.g].stories.length - 1; sv.panel = false; return showStory(); }
  sv.panel = false; showStory();
}
function bindStory() {
  const z = document.getElementById('stzone'), ov = document.getElementById('stv'); if (!z || !ov) return;
  const cur = ov.querySelector('[data-cur]');
  if (cur) cur.addEventListener('animationend', () => { if (ui.sv) stNext(); });
  if (ui.sv && ui.sv.panel) ov.classList.add('paused');
  const sp = ov.querySelector('.stpanel');
  if (sp) bindSwipeDown(sp, () => { if (!ui.sv) return; ui.sv.panel = false; const o = document.getElementById('stv'); if (o) { o.outerHTML = modalStory(); bindStory(); } }, 'button');
  let t0 = 0, x0 = 0, y0 = 0;
  z.addEventListener('pointerdown', (e) => { t0 = Date.now(); x0 = e.clientX; y0 = e.clientY; ov.classList.add('paused'); });
  const up = (e) => {
    if (!t0) return; const held = Date.now() - t0, dx = e.clientX - x0, dy = e.clientY - y0; t0 = 0;
    if (!(ui.sv && ui.sv.panel)) ov.classList.remove('paused');
    if (dy > 90 && Math.abs(dy) > Math.abs(dx)) return closeModal();
    if (held < 350 && Math.abs(dx) < 14 && Math.abs(dy) < 14) { if (x0 < window.innerWidth * 0.33) stPrev(); else stNext(); }
  };
  z.addEventListener('pointerup', up);
  z.addEventListener('pointercancel', () => { t0 = 0; if (!(ui.sv && ui.sv.panel)) ov.classList.remove('paused'); });
}
const STORY_BG_N = 48, RECENT_KEY = 'unirad-cores';
const recentBgs = () => { try { const r = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').filter((x) => Number.isInteger(x) && x >= 0 && x < STORY_BG_N); return [...new Set([...r, 0, 1, 2, 3])].slice(0, 4); } catch { return [0, 1, 2, 3]; } };
const pushRecentBg = (i) => { try { const r = [i, ...recentBgs().filter((x) => x !== i)].slice(0, 8); localStorage.setItem(RECENT_KEY, JSON.stringify(r)); } catch { /* sem histórico */ } };
let snStream = null;
function stopCam() { if (snStream) { snStream.getTracks().forEach((t) => t.stop()); snStream = null; } }
const SNI = {
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  back: '<polyline points="15 18 9 12 15 6"/>',
  flip: '<path d="M21 12a9 9 0 0 1-15.5 6.2M3 12a9 9 0 0 1 15.5-6.2"/><polyline points="18 2 19 6 15 7"/><polyline points="6 22 5 18 9 17"/>',
  img: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="9" r="1.5"/><path d="M21 16l-5-5-8 8"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
};
const sic = (n, z = 22) => `<svg viewBox="0 0 24 24" width="${z}" height="${z}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SNI[n]}</svg>`;
function modalStoryNew() {
  const n = ui.sn; if (!n) return '';
  const anon = `<button type="button" class="sn-anon ${n.anon ? 'on' : ''}" data-action="sn-anon" aria-pressed="${n.anon}">${sic('user', 16)} Anônimo<i></i></button>`;
  const modes = `<div class="sn-modes" role="group" aria-label="Tipo de status"><button class="${n.mode === 'foto' ? 'on' : ''}" data-action="sn-mode" data-v="foto">Foto</button><button class="${n.mode === 'texto' ? 'on' : ''}" data-action="sn-mode" data-v="texto">Texto</button></div>`;
  const files = '<input type="file" id="snFile" accept="image/*" hidden><input type="file" id="snCap" accept="image/*" capture="environment" hidden>';
  let frame, bar;
  if (n.mode === 'texto') {
    frame = `<div class="sn-frame sb${n.bg}"><button class="sn-gl tl" data-action="close-modal" aria-label="Fechar">${sic('x')}</button>${anon.replace('class="sn-anon', 'class="sn-anon tr')}<textarea id="sntext" maxlength="200" rows="5" placeholder="Digite seu status…">${esc(n.text)}</textarea></div>`;
    const rec = [n.bg, ...recentBgs().filter((x) => x !== n.bg)].slice(0, 4);
    bar = `<span class="sn-rec">Suas últimas cores</span><div class="sn-row"><div class="sn-dots">${rec.map((i) => `<button class="snc sb${i} ${n.bg === i ? 'on' : ''}" data-action="st-bg" data-v="${i}" aria-label="Cor ${i + 1}"></button>`).join('')}<button class="snc more" data-action="sn-pal" aria-label="Mais cores">${ic('plus', 16)}</button></div><button class="sn-pub" data-action="sn-pub">Publicar</button></div>${modes}`;
  } else if (n.blob) {
    frame = `<div class="sn-frame"><img class="sn-shot" src="${n.url}" alt="Sua foto"><button class="sn-gl tl" data-action="sn-redo" aria-label="Refazer">${sic('back')}</button>${anon.replace('class="sn-anon', 'class="sn-anon tr')}</div>`;
    bar = `<input class="sn-cap" id="sncap" maxlength="200" placeholder="Adicione uma legenda…" value="${esc(n.text)}"><div class="sn-row"><button class="sn-redo" data-action="sn-redo">Refazer</button><button class="sn-pub" data-action="sn-pub">Publicar status</button></div>`;
  } else {
    frame = `<div class="sn-frame cam ${n.facing === 'user' ? 'mir' : ''}">${n.camErr ? `<div class="sn-err"><p>Não consegui abrir a câmera aqui.</p><button class="btn" data-action="sn-native">Abrir câmera do celular</button></div>` : '<video id="snvideo" autoplay playsinline muted></video>'}<button class="sn-gl tl" data-action="close-modal" aria-label="Fechar">${sic('x')}</button><button class="sn-gl tr" data-action="sn-flip" aria-label="Virar câmera">${sic('flip')}</button><span class="sn-hint">Registre o plantão, o dia, o que quiser</span></div>`;
    bar = `<div class="sn-ctl"><button class="sn-gal" data-action="sn-gallery" aria-label="Escolher da galeria">${sic('img', 24)}</button><button class="sn-shut" data-action="sn-shoot" aria-label="Tirar foto"><i></i></button><span class="sn-gal ghost"></span></div>${modes}`;
  }
  const btn = (i) => `<button class="snc big sb${i} ${n.bg === i ? 'on' : ''}" data-action="sn-pick" data-v="${i}" aria-label="Cor ${i + 1}"></button>`;
  const pal = n.pal ? `<div class="sn-dim" data-action="sn-palx"></div><div class="sn-pal ${n.pal === 2 ? 'full' : ''}" id="snpal"><div class="sn-hd" id="snhd"><div class="grab"><i></i></div><div class="sn-palh"><b>Escolha uma cor</b><button class="stx dk" data-action="sn-palx" aria-label="Fechar">${ic('x', 20)}</button></div></div>${n.pal === 2
    ? `<div class="sn-all">${Array.from({ length: STORY_BG_N }, (_, i) => btn(i)).join('')}</div><p class="muted small center">Deslize para baixo para voltar</p>`
    : `<div class="sn-pages" id="snpages">${[0, 1].map((pg) => `<div class="sn-page">${Array.from({ length: 24 }, (_, k) => btn(pg * 24 + k)).join('')}</div>`).join('')}</div><div class="sn-pdots"><i class="on"></i><i></i></div><p class="muted small center">Deslize para o lado ou para cima</p>`}</div>` : '';
  return `<div class="overlay stv snew" id="snew">${frame}<div class="sn-bar">${bar}</div>${files}${pal}</div>`;
}
async function startCam() {
  const n = ui.sn; if (!n || n.mode !== 'foto' || n.blob || n.camErr) return;
  const v = document.getElementById('snvideo'); if (!v) return;
  stopCam();
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('sem câmera');
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: n.facing }, width: { ideal: 1280 } }, audio: false });
    if (ui.modal !== 'snew' || !ui.sn || ui.sn.blob) { stream.getTracks().forEach((t) => t.stop()); return; }
    snStream = stream; v.srcObject = stream;
  } catch { if (ui.sn) { ui.sn.camErr = true; snRender(); } }
}
function snRender() {
  const ov = document.getElementById('snew'); if (!ov) return;
  if (ui.sn && ui.sn.mode === 'texto') { const t = document.getElementById('sntext'); if (t) ui.sn.text = t.value; }
  if (ui.sn && ui.sn.blob) { const c = document.getElementById('sncap'); if (c) ui.sn.text = c.value; }
  ov.outerHTML = modalStoryNew(); bindSn();
}
function snSetBlob(blob) {
  const n = ui.sn; if (!n) return;
  if (n.url) URL.revokeObjectURL(n.url);
  n.blob = blob; n.url = URL.createObjectURL(blob); n.text = ''; stopCam(); snRender();
}
function bindSn() {
  const ov = document.getElementById('snew'); if (!ov) return;
  const fit = () => { if (window.visualViewport) ov.style.height = window.visualViewport.height + 'px'; };
  fit(); if (window.visualViewport && !ov.dataset.vv) { ov.dataset.vv = '1'; window.visualViewport.addEventListener('resize', fit); }
  const pick = async (inp) => { const f = inp.files && inp.files[0]; if (!f) return; try { snSetBlob(await processImage(f, 1280, 0.82)); } catch (e) { toast(e.message); } inp.value = ''; };
  const a = document.getElementById('snFile'), c = document.getElementById('snCap');
  if (a) a.addEventListener('change', () => pick(a)); if (c) c.addEventListener('change', () => pick(c));
  const t = document.getElementById('sntext'); if (t) t.addEventListener('input', () => { ui.sn.text = t.value; });
  const cp = document.getElementById('sncap'); if (cp) cp.addEventListener('input', () => { ui.sn.text = cp.value; });
  const fr = ov.querySelector('.sn-frame');
  if (fr) bindSwipeDown(fr, () => { if (ui.sn && ui.sn.pal) return; stopCam(); closeModal(); }, 'input, select, button');
  const pl = document.getElementById('snpal');
  if (pl) {
    let x0 = 0, y0 = 0, mode = null;
    pl.addEventListener('touchstart', (e) => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; mode = null; pl.style.transition = 'none'; }, { passive: true });
    pl.addEventListener('touchmove', (e) => {
      const t = e.touches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (!mode) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) <= Math.abs(dx)) mode = 'native';
        else if (ui.sn.pal === 2) { const all = pl.querySelector('.sn-all'); mode = dy > 0 && all && all.scrollTop <= 0 ? 'drag' : 'native'; }
        else mode = 'drag';
      }
      if (mode === 'drag') { e.preventDefault(); if (dy > 0) pl.style.transform = `translateY(${dy}px)`; }
    }, { passive: false });
    const end = (e) => {
      pl.style.transition = ''; pl.style.transform = '';
      const m = mode; mode = null; if (m !== 'drag') return;
      const dy = (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : y0) - y0;
      if (dy > 60) { ui.sn.pal = ui.sn.pal === 2 ? 1 : 0; snRender(); }
      else if (dy < -60 && ui.sn.pal === 1) { ui.sn.pal = 2; snRender(); }
    };
    pl.addEventListener('touchend', end); pl.addEventListener('touchcancel', () => { mode = null; pl.style.transform = ''; pl.style.transition = ''; });
  }
  const pg = document.getElementById('snpages');
  if (pg) pg.addEventListener('scroll', () => { const k = Math.round(pg.scrollLeft / pg.clientWidth); document.querySelectorAll('.sn-pdots i').forEach((d, j) => d.classList.toggle('on', j === k)); }, { passive: true });
  startCam();
}
async function loadStories() {
  if (Store.mode !== 'api' || !ui.user) return;
  try { ui.stories = await Store.stories(); if (ui.tab === 'inicio' && !ui.modal) { const old = document.querySelector('.stbar'); if (old) { const sc = old.scrollLeft; old.outerHTML = storyBar(); const nb = document.querySelector('.stbar'); if (nb) nb.scrollLeft = sc; } else render(); } } catch { /* sem status */ }
}

function screenHome() {
  return `<main class="feed">
    ${storyBar()}
    ${ui.announcement ? `<div class="annc"><div class="anh">${ic('flag', 14)} Aviso do UniRad · ${ago(ui.announcement.t)}</div><div>${richText(ui.announcement.text)}</div></div>` : ''}
    ${shortcuts()}
    ${viewSwitch(Store.mode === 'api')}
    ${composer()}
    ${!ui.posts ? loadingBox : ui.posts.map(postCard).join('') || (ui.view === 'seguindo' ? '<p class="muted center pad8">Você ainda não segue ninguém. Toque no nome de um colega e escolha Seguir para ver as publicações dele aqui.</p>' : '<p class="muted center pad8">Nada por aqui ainda. Seja o primeiro a publicar.</p>')}
    ${ui.more ? '<button class="btn out" data-action="load-more">Ver mais publicações</button>' : ''}
  </main>`;
}

const fmtMonth = (m) => { const [y, mo] = String(m || '').split('-'); return MES[Number(mo) - 1] ? `${MES[Number(mo) - 1]}/${y}` : ''; };
const pageHead = (t, s) => `<div class="phd"><h2>${t}</h2><p>${s}</p></div>`;
function screenDelays() {
  if (!ui.stats) return `<main class="pad">${viewSwitch()}${loadingBox}</main>`;
  const { members, national, delays } = ui.stats;
  const MARCOS = [100, 500, 1000, 5000, 10000, 50000];
  const meta = MARCOS.find((m) => national < m) || MARCOS[MARCOS.length - 1];
  const showBar = national >= 50;
  const pct = Math.min(100, Math.round((national / meta) * 100));
  const asub = Store.mode === 'api' ? `<div class="utabs"><button class="${ui.asub === 'aval' ? '' : 'on'}" data-action="asub" data-v="mural">Atrasos</button><button class="${ui.asub === 'aval' ? 'on' : ''}" data-action="asub" data-v="aval">Avaliações</button></div>` : '';
  if (ui.asub === 'aval' && Store.mode === 'api') return `<main class="pad">${pageHead('Atrasos', 'Relatos e avaliações da sua região')}${viewSwitch()}${asub}<button class="btn gold" data-action="pick-place" style="margin-bottom:10px">Avaliar um local</button>${avalSection()}</main>`;
  return `<main class="pad">
    ${pageHead('Atrasos', 'Relatos e avaliações da sua região')}
    ${viewSwitch()}
    ${asub}
    <section class="hero">
      <div class="small">Profissionais unidos · ${esc(viewName(ui.view))}</div>
      <div class="big-n">${members.toLocaleString('pt-BR')}</div>
      ${showBar ? `<div class="small">Próxima meta do Brasil: ${meta.toLocaleString('pt-BR')} (${national.toLocaleString('pt-BR')} hoje)</div>
      <div class="bar"><i style="width:${pct}%"></i></div>` : `<div class="small">Cada cadastro fortalece a categoria. <a href="#" data-action="invite" style="color:#fff;font-weight:700;display:inline-block;padding:8px 0">Convide seus colegas</a>.</div>`}
    </section>
    <h3 class="sec">Mural de atrasos</h3>
    <div class="grid2">
      <div class="stat red"><div class="small">Relatos</div><div class="n">${delays.total}</div></div>
      <div class="stat amber"><div class="small">Atraso médio</div><div class="n">${delays.avgDays ? delays.avgDays + ' dias' : '—'}</div></div>
    </div>
    <div class="row gap8"><button class="btn big" style="flex:1" data-action="new-delay">${ic('plus', 18)} Relatar atraso</button>${Store.mode === 'api' ? `<button class="btn big out" style="flex:1" data-action="pick-place">Avaliar local</button>` : ''}</div>

    ${delays.recent && delays.recent.length ? `<h3 class="sec">Relatos recentes</h3><div class="list">${delays.recent.map((r) => `<div class="lrow static"><span>${esc(r.type)}${r.days ? ` · ${r.days} dias` : ''}${r.months > 1 ? ` · ${r.months} meses` : ''}<br><span class="muted small">${ago(r.t)}</span></span><b class="redtxt">${esc(fmtMonth(r.month))}</b></div>`).join('')}</div>` : ''}
    ${delays.top.length ? `<div class="card"><div class="small muted">Locais mais citados</div>${delays.top.map((t) => `<div class="row between li"><span>${esc(t.hospital)}</span><b>${t.n} relatos</b></div>`).join('')}</div>`
      : `<p class="muted small">Locais aparecem aqui quando houver ao menos ${CONFIG.hideHospitalBelow} relatos sobre o mesmo, para proteger quem relata.</p>`}
  </main>`;
}

/* ---------- locais e empresas avaliados ---------- */
const KIND_NAME = { hospital: 'Hospital', upa: 'UPA', clinica: 'Clínica', outro: 'Outro' };
const TOPIC_META = [
  ['piso', 'Paga o piso salarial?', 'yn', ['Sim, paga', 'Não paga', 'Às vezes'], 'Não paga o piso salarial'],
  ['jornada', 'Cumpre a jornada?', 'yn', ['Cumpre', 'Não cumpre', 'Às vezes'], 'Não cumpre a jornada'],
  ['pagamento', 'Paga em dia?', 'yn', ['Em dia', 'Atrasa', 'Às vezes'], 'Atrasa o pagamento'],
  ['estrutura', 'Estrutura e equipamentos', 'scale'],
  ['protecao', 'Proteção: aventais e blindagem', 'scale'],
  ['dosimetro', 'Dosímetro e vistoria', 'scale'],
  ['ambiente', 'Ambiente e respeito', 'scale']
];
const PAYM = TOPIC_META.slice(0, 3), LOCM = TOPIC_META.slice(3);
const COEX = [
  ['desconto', 'Faz desconto no valor da nota?', 'yn', ['Não faz desconto', 'Faz desconto', 'Às vezes'], 'Faz desconto no valor da nota'],
  ['exigiu', 'Pediram para você virar sócio ou abrir empresa?', 'yn', ['Não pediram', 'Pediram', 'Mais ou menos'], 'Pediram para virar sócio ou abrir empresa']
];
const COM = [...PAYM, ...COEX];
const VINC = [[1, 'Carteira assinada (CLT)', 'CLT'], [2, 'Prestador de serviço (emito nota)', 'Prestador'], [3, 'Sócio da empresa (cotista)', 'Sócio'], [4, 'Outro', 'Outro']];
const WORDS = ['Péssimo', 'Ruim', 'Regular', 'Bom', 'Ótimo'];
const wordOf = (avg) => WORDS[Math.min(4, Math.max(0, Math.round(avg) - 1))];
const scoreCls = (v) => (v == null ? '' : v < 2.5 ? 'bad' : v >= 4 ? 'good' : 'mid');
const RING = { bad: '#e24b4a', mid: '#ef9f27', good: '#639922', '': '#c5cddb' };
const sigla = (n) => String(n).split(/\s+/).filter((w) => w.length > 1 || /\d/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
function ring(v, size = 48) {
  const c = 2 * Math.PI * 19, pct = v == null ? 0 : Math.max(0.05, v / 5), cls = scoreCls(v);
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 48 48" role="img" aria-label="${v == null ? 'Sem nota ainda' : 'Nota ' + String(v).replace('.', ',')}"><circle cx="24" cy="24" r="19" fill="none" stroke="#e7ecf4" stroke-width="5"/><circle cx="24" cy="24" r="19" fill="none" stroke="${RING[cls]}" stroke-width="5" stroke-dasharray="${(c * pct).toFixed(1)} ${c.toFixed(1)}" stroke-linecap="round" transform="rotate(-90 24 24)"/><text x="24" y="29" text-anchor="middle" font-size="${v == null ? 16 : 14}" font-weight="600" fill="#0b1f3a">${v == null ? '–' : String(v).replace('.', ',')}</text></svg>`;
}
const THEME_KEY = 'unirad-tema';
const getTheme = () => { try { return localStorage.getItem(THEME_KEY) || 'auto'; } catch { return 'auto'; } };
function applyTheme() {
  const t = getTheme(), dark = t === 'escuro' || (t === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', dark ? '#0a0f1a' : '#0b1f3a');
}
applyTheme();
if (window.matchMedia) { const mq = window.matchMedia('(prefers-color-scheme: dark)'); (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(() => { if (getTheme() === 'auto') applyTheme(); }); }
const normQ = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
function entityCard(kind, e) {
  const alert = e.crit ? `<span class="ptag bad">${e.crit} ${e.crit === 1 ? 'alerta' : 'alertas'}</span>` : e.geral != null ? '<span class="ptag good">Sem alertas</span>' : '<span class="ptag">Poucas respostas</span>';
  const meta = kind === 'place' ? `${KIND_NAME[e.kind] || ''} · ${e.raters} ${e.raters === 1 ? 'avaliação' : 'avaliações'}` : `Empresa · ${e.places} ${e.places === 1 ? 'local' : 'locais'} · ${e.raters} ${e.raters === 1 ? 'avaliação' : 'avaliações'}`;
  return `<button class="ecard" data-action="${kind === 'place' ? 'open-place' : 'open-company'}" data-id="${e.id}"><span class="sgl av${hue(e.name)}">${esc(sigla(e.name))}</span><span class="einfo"><b>${esc(e.name)}</b><span class="muted small">${meta}</span>${alert}</span>${ring(e.geral)}</button>`;
}
function entityList() {
  const comp = ui.atab === 'empresas', q = normQ(ui.aq || '');
  let list = (comp ? ui.companies : ui.places) || [];
  if (q) list = list.filter((e) => normQ(e.name).includes(q));
  if (ui.asort === 'alertas') list = list.filter((e) => e.crit > 0).sort((a, b) => b.crit - a.crit);
  else if (ui.asort === 'melhores') list = list.filter((e) => e.geral != null).sort((a, b) => b.geral - a.geral);
  return list.map((e) => entityCard(comp ? 'company' : 'place', e)).join('') || `<p class="muted small center pad8">${q ? 'Nada encontrado. Toque em "Avaliar" para cadastrar.' : comp ? 'Nenhuma empresa avaliada ainda.' : 'Nenhum local avaliado aqui ainda.'}</p>`;
}
function avalSection() {
  const comp = ui.atab === 'empresas';
  const sorts = [['mais', 'Mais avaliados'], ['alertas', 'Com alertas'], ['melhores', 'Melhores']].map(([v, l]) => `<button type="button" class="chip2 ${ui.asort === v ? 'on' : ''}" data-action="asort" data-v="${v}">${l}</button>`).join('');
  return `<div class="searchbar">${ic('search', 18)}<input id="aq" type="search" placeholder="Buscar hospital, UPA ou empresa" value="${esc(ui.aq || '')}" autocomplete="off" enterkeyhint="search"></div>
    <div class="segtabs"><button class="${comp ? '' : 'on'}" data-action="atab" data-v="locais">Locais</button><button class="${comp ? 'on' : ''}" data-action="atab" data-v="empresas">Empresas</button></div>
    <div class="chips" role="group" aria-label="Ordenar">${sorts}</div>
    <div id="alist">${entityList()}</div>`;
}
function psheet(label, inner) {
  return `<div class="overlay" data-action="close-modal"><div class="sheet psheet" role="dialog" aria-label="${esc(label)}" data-stop="1" id="gsheet"><div class="cover"></div><button class="ghost cclose" data-action="close-modal" aria-label="Fechar">${ic('x', 22)}</button>${inner}</div></div>`;
}
function topicBar(m, t) {
  if (!t || !t.visible) return `<div class="tp"><div class="tph"><span>${m[1]}</span><span class="muted small">poucas respostas</span></div></div>`;
  const yn = m[2] === 'yn';
  const val = yn ? (t.state === 'crit' ? m[3][1] : t.state === 'good' ? m[3][0] : m[3][2]) : wordOf(t.avg);
  const w = yn ? t.pctNao : Math.round((t.avg / 5) * 100);
  const cls = yn ? (t.state === 'crit' ? 'bad' : t.state === 'good' ? 'good' : 'mid') : scoreCls(t.avg);
  return `<div class="tp"><div class="tph"><span>${m[1]}</span><b class="${cls}">${val}</b></div><div class="tbar"><i class="${cls}" style="width:${Math.max(4, w)}%"></i></div><div class="muted small">${yn ? `${t.pctNao}% dizem que não · ` : ''}${t.n} ${t.n === 1 ? 'resposta' : 'respostas'}</div></div>`;
}
function alertBoxes(topics, metas) {
  const crit = metas.filter((m) => topics[m[0]] && topics[m[0]].state === 'crit');
  const good = metas.filter((m) => topics[m[0]] && topics[m[0]].state === 'good');
  const ct = (m) => { const t = topics[m[0]]; return m[2] === 'yn' ? `${m[4]} (${t.pctNao}%)` : `${m[1]}: ${wordOf(t.avg)}`; };
  const gt = (m) => { const t = topics[m[0]]; return m[2] === 'yn' ? `${m[1].replace('?', '')}: sim (${t.pctSim}%)` : `${m[1]}: ${wordOf(t.avg)}`; };
  return `${crit.length ? `<div class="critbox"><b>${crit.length} ${crit.length === 1 ? 'ponto crítico' : 'pontos críticos'}</b>${crit.map((m) => `<div>${esc(ct(m))}</div>`).join('')}</div>` : ''}${good.length ? `<div class="goodbox"><b>Pontos bons</b>${good.map((m) => `<div>${esc(gt(m))}</div>`).join('')}</div>` : ''}`;
}
function modalPlace() {
  const d = ui.place; if (!d) return psheet('Local', '<p class="muted small" style="margin-top:50px">Carregando…</p>');
  const { place, topics } = d, tab = ui.ptab || 'resumo';
  const direct = PAYM.filter((m) => topics[m[0]] && topics[m[0]].visible);
  const body = tab === 'empresas'
    ? (d.companies.length ? d.companies.map((c) => { const crit = COM.filter((m) => c.topics[m[0]] && c.topics[m[0]].state === 'crit').map((m) => m[4]); const good = PAYM.filter((m) => c.topics[m[0]] && c.topics[m[0]].state === 'good').length; return `<button class="ecard" data-action="open-company" data-id="${c.id}" data-place="${place.id}"><span class="sgl av${hue(c.name)}">${esc(sigla(c.name))}</span><span class="einfo"><b>${esc(c.name)}</b>${crit.length ? `<span class="small redtxt">${esc(crit.join(' · '))}</span>` : good ? '<span class="small goodtxt">Sem alertas de pagamento</span>' : '<span class="muted small">Poucas respostas</span>'}</span>${ring(c.geral)}</button>`; }).join('') : '<p class="muted small">Nenhuma empresa avaliada neste local ainda. Toque em "Avaliar" e informe quem contrata você.</p>')
    : tab === 'atrasos'
      ? (d.delays ? `<div class="stat red"><div class="small">Relatos sobre este local</div><div class="n">${d.delays.total}</div></div>${d.delays.avgDays ? `<p class="muted small">Atraso médio de salário: ${d.delays.avgDays} dias.</p>` : ''}` : '<p class="muted small">Ainda não há relatos suficientes sobre este local. Aparecem com 3 relatos ou mais, para proteger quem relata.</p>') + '<button class="btn out" data-action="new-delay">Relatar atraso</button>'
      : `${alertBoxes(topics, [...LOCM, ...PAYM])}<div class="tps">${LOCM.map((m) => topicBar(m, topics[m[0]])).join('')}${direct.length ? `<div class="usec">Contratação direta</div>${direct.map((m) => topicBar(m, topics[m[0]])).join('')}` : ''}</div>${place.geral == null ? '<p class="muted small">Cada assunto só aparece depois de 3 respostas, para proteger quem avalia.</p>' : ''}`;
  return psheet(place.name, `<div class="prow2"><span class="sgl big av${hue(place.name)}">${esc(sigla(place.name))}</span>${ring(place.geral, 58)}</div>
    <h3 class="ptitle">${esc(place.name)}</h3><div class="muted small">${KIND_NAME[place.kind] || ''} · ${place.raters} ${place.raters === 1 ? 'avaliação' : 'avaliações'} · ${d.companies.length} ${d.companies.length === 1 ? 'empresa contrata' : 'empresas contratam'} aqui</div>
    <div class="row gap8" style="margin:12px 0"><button class="btn gold" style="flex:1" data-action="rate-place" data-id="${place.id}">Avaliar</button><button class="btn out" style="flex:1" data-action="watch" data-kind="place" data-id="${place.id}">${d.watching ? 'Acompanhando' : 'Acompanhar'}</button></div>
    <div class="ptabs">${[['resumo', 'Resumo'], ['empresas', 'Empresas'], ['atrasos', 'Atrasos']].map(([v, l]) => `<button class="${tab === v ? 'on' : ''}" data-action="ptab" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="pbody">${body}</div>`);
}
function vinculoBar(v) {
  if (!v) return '';
  const cols = { 1: '#639922', 2: '#e24b4a', 3: '#ef9f27', 4: '#c5cddb' };
  return `<div class="tp"><div class="tph"><span>Como os profissionais são contratados</span></div><div class="vbar">${VINC.map(([k]) => (v[k] ? `<i style="width:${v[k]}%;background:${cols[k]}"></i>` : '')).join('')}</div><div class="vleg muted small">${VINC.filter(([k]) => v[k]).map(([k, , s]) => `<span><i style="background:${cols[k]}"></i>${s} ${v[k]}%</span>`).join('')}</div></div>`;
}
function modalCompany() {
  const d = ui.company; if (!d) return psheet('Empresa', '<p class="muted small" style="margin-top:50px">Carregando…</p>');
  const { company, topics } = d;
  return psheet(company.name, `<div class="prow2"><span class="sgl big av${hue(company.name)}">${esc(sigla(company.name))}</span>${ring(company.geral, 58)}</div>
    <h3 class="ptitle">${esc(company.name)}</h3><div class="muted small">Empresa terceirizada · atua em ${d.places.length} ${d.places.length === 1 ? 'local' : 'locais'} · ${company.raters} ${company.raters === 1 ? 'avaliação' : 'avaliações'}</div>
    <div class="row gap8" style="margin:12px 0"><button class="btn out" style="flex:1" data-action="watch" data-kind="company" data-id="${company.id}">${d.watching ? 'Acompanhando' : 'Acompanhar'}</button></div>
    ${alertBoxes(topics, COM)}${vinculoBar(d.vinculos)}<div class="tps">${COM.map((m) => topicBar(m, topics[m[0]])).join('')}</div>
    ${company.geral == null ? '<p class="muted small">Cada assunto só aparece depois de 3 respostas, para proteger quem avalia.</p>' : ''}
    <div class="usec">Onde atua</div>${d.places.map((pl) => `<button class="lrow" data-action="open-place" data-id="${pl.id}"><span><b>${esc(pl.name)}</b><br><span class="muted small">${KIND_NAME[pl.kind] || ''}</span></span>${ic('chev', 18)}</button>`).join('') || '<p class="muted small">Ainda sem locais.</p>'}`);
}
/* avaliar: primeiro escolhe o local e quem contrata, depois uma pergunta por tela */
function modalPick() {
  const rt = ui.rt, q = normQ(rt.pname || ''), cq = normQ(rt.cname || '');
  const psug = !rt.placeId && q.length >= 2 ? (ui.places || []).filter((p) => normQ(p.name).includes(q)).slice(0, 4) : [];
  const csug = rt.employer === 'company' && cq.length >= 2 ? (ui.companies || []).filter((c) => normQ(c.name).includes(cq)).slice(0, 4) : [];
  const sugRow = (act, e, extra = '') => `<button type="button" class="lrow" data-action="${act}" data-id="${e.id}">${`<span><b>${esc(e.name)}</b><br><span class="muted small">${extra} já avaliado</span></span>`}${ic('chev', 18)}</button>`;
  return sheet('Avaliar', `
    ${rt.placeId ? `<div class="muted small">Local</div><div class="fixedname">${esc(rt.pname)}</div>` : `<div class="muted small">Qual é o local?</div>
      <div class="chips" role="group" aria-label="Tipo do local">${['hospital', 'upa', 'clinica', 'outro'].map((v) => `<button type="button" class="chip2 ${rt.kind === v ? 'on' : ''}" data-action="pick-kind" data-v="${v}">${KIND_NAME[v]}</button>`).join('')}</div>
      <label>Nome do local<input id="pickName" maxlength="80" placeholder="Ex.: Hospital Santa Maria" value="${esc(rt.pname || '')}" autocomplete="off"></label>
      <div id="pickSug">${psug.map((p) => sugRow('pick-existing', p, KIND_NAME[p.kind] + ' ·')).join('')}</div>`}
    <div class="muted small" style="margin-top:10px">Quem contrata você?</div>
    <div class="chips" role="group" aria-label="Quem contrata"><button type="button" class="chip2 ${rt.employer === 'company' ? 'on' : ''}" data-action="pick-emp" data-v="company">Empresa terceirizada</button><button type="button" class="chip2 ${rt.employer === 'direct' ? 'on' : ''}" data-action="pick-emp" data-v="direct">O próprio local</button></div>
    ${rt.employer === 'company' ? `<label>Nome da empresa<input id="pickCo" maxlength="80" placeholder="Empresa para quem você presta serviço" value="${esc(rt.cname || '')}" autocomplete="off"></label><div id="pickCoSug">${csug.map((c) => sugRow('pick-co', c, 'Empresa ·')).join('')}</div>
      <div class="muted small" style="margin-top:10px">Como você é contratado?</div>
      <div class="chips" role="group" aria-label="Tipo de contratação">${VINC.map(([k, l]) => `<button type="button" class="chip2 ${rt.vinculo === k ? 'on' : ''}" data-action="pick-vinc" data-v="${k}">${l}</button>`).join('')}</div>` : ''}
    <p class="muted small">Você responde primeiro sobre ${rt.employer === 'company' ? 'a empresa' : 'a contratação'} (piso, jornada, pagamento${rt.employer === 'company' ? ', desconto na nota' : ''}) e depois sobre o local. É anônimo e dá para pular perguntas.</p>
    <div class="error" id="formError" role="alert"></div>
    <div class="row gap8 stickybtns"><button type="button" class="btn out" data-action="close-modal">Cancelar</button><button class="btn" style="flex:2" data-action="pick-go">Começar</button></div>`);
}
function modalRate() {
  const rt = ui.rt; if (!rt || !rt.steps) return sheet('Avaliar', '<p class="muted small">Carregando…</p>');
  const st = rt.steps[rt.i], n = rt.steps.length, m = st.m, v = (st.target === 'company' ? rt.mineC : rt.mineP)[m[0]];
  const opts = m[2] === 'yn'
    ? [[5, m[3][0], 'good'], [1, m[3][1], 'bad'], [3, m[3][2], 'mid']].map(([val, l, c]) => `<button type="button" class="ropt ${c} ${v === val ? 'on' : ''}" data-action="rstep" data-v="${val}">${l}</button>`).join('')
    : WORDS.map((w, i) => `<button type="button" class="ropt s${i + 1} ${v === i + 1 ? 'on' : ''}" data-action="rstep" data-v="${i + 1}">${w}</button>`).join('');
  const who = st.target === 'company' ? `Sobre ${rt.cname}` : st.target === 'direct' ? 'Sobre a contratação' : `Sobre ${rt.pname}`;
  return sheet('Avaliar', `<div class="prog">${rt.steps.map((_, i) => `<i class="${i <= rt.i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="muted small">${esc(who)} · ${rt.i + 1} de ${n}</div>
    <div class="rq">${m[1]}</div><div class="ropts">${opts}</div>
    <div class="row between rnav"><button class="linkbtn" data-action="rback" ${rt.i === 0 ? 'disabled' : ''}>Voltar</button><button class="linkbtn" data-action="rskip">${rt.i === n - 1 ? 'Concluir' : 'Pular'}</button></div>`);
}
const COUNCIL_META = [
  ['cresp', 'Responde quando você procura', 'scale'],
  ['cfisc', 'Fiscaliza hospitais e empresas', 'scale'],
  ['cconta', 'Presta contas à categoria', 'scale'],
  ['cdef', 'Defende piso e jornada', 'scale'],
  ['couve', 'Ouve a categoria', 'scale']
];
const councilName = (c) => (c.id === 'conter' ? 'CONTER' : `CRTR · ${regionLabel(c.region).split(' · ')[0]}`);
const councilSub = (c) => (c.id === 'conter' ? 'Conselho Nacional' : 'Conselho da sua região');
function councilCard(c) {
  return `<button class="ecard" data-action="open-council" data-id="${c.id}"><span class="sgl av${c.id === 'conter' ? 0 : 2}">${c.id === 'conter' ? 'CT' : 'CR'}</span><span class="einfo"><b>${esc(councilName(c))}</b><span class="muted small">${councilSub(c)} · ${c.raters} ${c.raters === 1 ? 'avaliação' : 'avaliações'}</span>${c.crit ? `<span class="ptag bad">${c.crit} ${c.crit === 1 ? 'alerta' : 'alertas'}</span>` : c.geral != null ? '<span class="ptag good">Sem alertas</span>' : '<span class="ptag">Poucas respostas</span>'}</span>${ring(c.geral)}</button>`;
}
const unionGoal = (n) => [100, 500, 1000, 5000, 10000].find((g) => n < g) || 10000;
function conselhoSection() {
  if (Store.mode !== 'api' || !ui.councils) return '';
  return `<h3 class="usec">Conselho: cobrar quem fiscaliza</h3>
    <p class="muted small">A nota é do órgão, nunca de uma pessoa. Cada assunto aparece com 3 respostas ou mais.</p>
    ${ui.councils.map(councilCard).join('')}
    <button class="btn out" data-action="open-demands" style="margin:2px 0 10px">Ver e fazer cobranças ao conselho</button>
    <div class="unioncard elec plain"><b>Eleições do conselho</b>
      <p>Data, local e candidatos devem ser conferidos só em fonte oficial. Compare as propostas e vote.</p>
      <a class="btn out" target="_blank" rel="noopener noreferrer" href="https://www.conter.gov.br" style="text-align:center;text-decoration:none">Ver no site do CONTER</a></div>`;
}
function modalCouncil() {
  const c = (ui.councils || []).find((x) => x.id === ui.councilSel);
  if (!c) return psheet('Conselho', '<p class="muted small" style="margin-top:50px">Carregando…</p>');
  return psheet(councilName(c), `<div class="prow2"><span class="sgl big av${c.id === 'conter' ? 0 : 2}">${c.id === 'conter' ? 'CT' : 'CR'}</span>${ring(c.geral, 58)}</div>
    <h3 class="ptitle">${esc(councilName(c))}</h3><div class="muted small">${councilSub(c)} · ${c.raters} ${c.raters === 1 ? 'avaliação' : 'avaliações'}</div>
    <div class="row gap8" style="margin:12px 0"><button class="btn gold" style="flex:1" data-action="rate-council" data-id="${c.id}">Avaliar</button><button class="btn out" style="flex:1" data-action="open-demands">Cobranças</button></div>
    ${alertBoxes(c.topics, COUNCIL_META)}<div class="tps">${COUNCIL_META.map((m) => topicBar(m, c.topics[m[0]])).join('')}</div>
    ${c.geral == null ? '<p class="muted small">Cada assunto só aparece depois de 3 respostas, para proteger quem avalia.</p>' : ''}`);
}
function modalDemands() {
  const list = ui.demands;
  const lbl = (d) => (d.body === 'conter' ? 'Para o CONTER' : 'Para o seu CRTR');
  return sheet('Cobranças ao conselho', `<p class="muted small">Cobre o órgão, nunca uma pessoa. Quanto mais colegas apoiam, mais forte fica o pedido. Ninguém vê quem apoiou.</p>
    <button class="btn gold" data-action="new-demand" style="margin-bottom:10px">Fazer uma cobrança</button>
    ${!list ? '<p class="muted small">Carregando…</p>' : list.map((d) => `<div class="dcard"><div class="muted small">${lbl(d)} · ${ago(d.t)}</div><p>${esc(d.text)}</p><div class="row between"><span><b>${d.n}</b> ${d.n === 1 ? 'colega apoia' : 'colegas apoiam'}</span><span>${d.mine ? `<button class="linkbtn" data-action="del-demand" data-id="${d.id}">Apagar</button>` : ''}<button class="chip2 ${d.sup ? 'on' : ''}" data-action="support-demand" data-id="${d.id}">${d.sup ? 'Você apoia' : 'Eu também'}</button></span></div></div>`).join('') || '<p class="muted small">Nenhuma cobrança ainda. Seja o primeiro.</p>'}`);
}
function modalDemandNew() {
  const dn = ui.dnew || { body: 'crtr', text: '' };
  return sheet('Fazer uma cobrança', `<div class="muted small">Cobrar quem?</div>
    <div class="chips" role="group" aria-label="Destino"><button type="button" class="chip2 ${dn.body === 'crtr' ? 'on' : ''}" data-action="dbody" data-v="crtr">Meu CRTR</button><button type="button" class="chip2 ${dn.body === 'conter' ? 'on' : ''}" data-action="dbody" data-v="conter">CONTER</button></div>
    <label>O que você quer cobrar?<textarea id="dtext" rows="4" maxlength="200" placeholder="Ex.: Fiscalizar empresas que obrigam o profissional a virar sócio">${esc(dn.text)}</textarea></label>
    <p class="muted small">Cobre o órgão. Não cite pessoas pelo nome nem coloque links. É anônimo.</p>
    <div class="error" id="formError" role="alert"></div>
    <div class="row gap8"><button type="button" class="btn out" data-action="close-modal">Cancelar</button><button class="btn" style="flex:2" data-action="send-demand">Publicar cobrança</button></div>`);
}
async function openPlace(id) { ui.place = null; ui.ptab = 'resumo'; openOver('place'); ui.place = await Store.place(id); if (ui.modal === 'place') render(); }
async function refreshLists() {
  try { const sc = scopeOf(ui.view === 'seguindo' ? 'mine' : ui.view); const [a, b] = await Promise.all([Store.places(sc), Store.companies()]); ui.places = a.places; ui.companies = b.companies; } catch { /* ignorado */ }
}
function buildSteps(rt) {
  const co = rt.employer === 'company', pay = (co ? COM : PAYM).map((m) => ({ m, target: co ? 'company' : 'direct' }));
  return [...pay, ...LOCM.map((m) => ({ m, target: 'place' }))];
}
async function finishRate() {
  if (ui.rt.council) { const cid = ui.rt.council; (ui.stk || []).pop(); popSilently(); ui.rt = null; try { ui.councils = (await Store.councils()).councils; } catch { /* ignorado */ } ui.councilSel = cid; ui.modal = 'council'; render(); toast('Avaliação salva. Obrigado!'); return; }
  const id = ui.rt.placeId; if (ui.rt.fromPlace) { (ui.stk || []).pop(); popSilently(); } ui.rt = null;
  await refreshLists();
  ui.place = await Store.place(id); ui.ptab = 'resumo'; ui.modal = 'place'; render(); toast('Avaliação salva. Obrigado!');
}

const SM = 1621; /* salário mínimo 2026 (Decreto 12.797/2025) */
function calcResult(sal, h) {
  if (!(sal > 0) || !(h > 0)) return '<p class="muted small center">Digite seu salário e sua carga semanal.</p>';
  const ref = SM * 2, hora = sal / (h * 4.345), brl = (n) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const jor = h > 24 ? `<div class="cres bad"><b>Jornada acima do limite</b><span>A lei fala em 24 h por semana. Você faz ${h} h: ${h - 24} h a mais.</span></div>` : '<div class="cres good"><b>Jornada dentro do limite</b><span>Até 24 h por semana, como a lei prevê.</span></div>';
  const pis = sal < ref ? `<div class="cres bad"><b>${brl(ref - sal)} abaixo da referência</b><span>Referência: 2 salários mínimos = ${brl(ref)}.</span></div>` : `<div class="cres good"><b>Na referência ou acima</b><span>Referência: 2 salários mínimos = ${brl(ref)}.</span></div>`;
  return `<div class="chora"><span>Sua hora vale</span><b>${brl(hora)}</b></div>${pis}${jor}<p class="muted small">Referência da Lei 7.394/85 (2 salários mínimos; jornada de 24 h). Há decisão do STF que mexeu na base de cálculo, então o valor devido pode ser outro. Confirme com o sindicato ou um advogado.</p>`;
}
function modalCalc() {
  const c = ui.calc || (ui.calc = { sal: '', h: '' });
  return sheet('Calculadora do piso', `<p class="muted small">Veja se o que você recebe bate com a lei.</p>
    <label>Seu salário por mês (R$)<input id="calcSal" inputmode="decimal" placeholder="Ex.: 2400" value="${esc(c.sal)}" autocomplete="off"></label>
    <label>Horas por semana<input id="calcH" inputmode="numeric" placeholder="Ex.: 36" value="${esc(c.h)}" autocomplete="off"></label>
    <div id="calcOut">${calcResult(Number(String(c.sal).replace(',', '.')), Number(c.h))}</div>
    <a class="btn wa" id="calcWa" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${encodeURIComponent('Faça a conta do seu piso no UniRad: ' + location.origin)}">${ic('share', 18)} Chamar colegas no WhatsApp</a>`);
}
const RIGHTS = [
  ['Jornada de trabalho', 'A Lei 7.394/1985 prevê jornada de 24 horas semanais para os profissionais das técnicas radiológicas. Se o seu contrato é diferente, anote horários e guarde comprovantes.'],
  ['Piso salarial', 'A mesma lei fala em salário mínimo profissional equivalente a 2 salários mínimos. Como esse piso é aplicado hoje é debatido na Justiça, então confirme com advogado trabalhista ou com o CRTR antes de cobrar.'],
  ['Adicional de risco e insalubridade', 'A lei prevê adicional de 40% sobre o vencimento. Verifique no seu contracheque se ele aparece.'],
  ['Salário atrasado: o que fazer', 'Guarde contracheques, extratos e mensagens. Registre o relato aqui no mural e procure orientação do CRTR, do Ministério Público do Trabalho ou de um advogado trabalhista.']
];
function screenRights() {
  return `<main class="pad">${pageHead('Direitos', 'Informativo geral, não é aconselhamento jurídico. Confira sempre o texto atual da lei.')}
    <button class="calccard" data-action="open-calc"><span class="shic gold">${ic('calc', 22)}</span><span><b>Calculadora do piso</b><small>Veja se seu salário e sua jornada batem com a lei</small></span>${ic('chev', 18)}</button>
    <div class="list">${RIGHTS.map(([t, b]) => `<details class="acc2"><summary><span>${esc(t)}</span>${ic('chev', 18)}</summary><p>${esc(b)}</p></details>`).join('')}</div>
    <div class="list"><a class="lrow" target="_blank" rel="noopener" href="https://www.conter.gov.br"><span>CONTER e CRTRs<br><span class="muted small">No site do CONTER você encontra o CRTR da sua região.</span></span>${ic('chev', 18)}</a></div>
    ${conselhoSection()}
    ${Store.mode === 'api' && ui.union ? `<div class="unioncard"><b>Um sindicato para a nossa categoria</b>
      <p><b>${ui.union.count}</b> ${ui.union.count === 1 ? 'profissional apoia' : 'profissionais apoiam'} · meta ${unionGoal(ui.union.count)}</p>
      <div class="ubar" role="progressbar" aria-valuemin="0" aria-valuemax="${unionGoal(ui.union.count)}" aria-valuenow="${ui.union.count}"><i style="width:${Math.max(2, Math.min(100, Math.round((ui.union.count / unionGoal(ui.union.count)) * 100)))}%"></i></div>
      <p class="small">${ui.union.mine ? 'Seu apoio já conta.' : 'Seu apoio conta.'} Ninguém vê seu nome.</p>
      <button class="btn ${ui.union.mine ? 'out' : 'gold'}" data-action="union">${ui.union.mine ? 'Apoiando (tocar para retirar)' : 'Quero apoiar'}</button></div>` : ''}
    <div class="unioncard how plain"><b>Como criar um sindicato</b>
      <p>Hoje não há sindicato da radiologia no Amazonas. Estes são os passos, resumidos:</p>
      <ol class="steps4">
        <li><span>1</span><div><b>Reunir a categoria.</b> Quanto mais gente apoiar, mais força. O contador acima ajuda.</div></li>
        <li><span>2</span><div><b>Assembleia de fundação.</b> Com aviso público no Diário Oficial da União e em jornal.</div></li>
        <li><span>3</span><div><b>Estatuto em cartório.</b> Define a categoria e a região de forma clara e é aprovado na assembleia.</div></li>
        <li><span>4</span><div><b>Registro no Ministério do Trabalho.</b> Só depois o sindicato representa a categoria e negocia piso.</div></li>
      </ol>
      <p class="small">Informativo geral, não é aconselhamento jurídico. O trâmite precisa de advogado trabalhista.</p>
      <a class="btn out" target="_blank" rel="noopener noreferrer" href="https://www.gov.br/trabalho-e-emprego/pt-br/servicos/sindicatos/cadastro-de-entidades/PORTARIAMTEN3.472de2023Consolidada.pdf" style="text-align:center;text-decoration:none">Ver regras no Ministério do Trabalho</a></div>
  </main>`;
}

function profileForm(u) {
  return `<form data-form="profile" novalidate>
      <label>Nome que aparece no app <i class="req">*</i><input name="dname" maxlength="40" required placeholder="Ex.: Deryck Bento" value="${esc(u.name)}"></label>
      <p class="muted small" style="margin-top:-4px">Pode ser só o primeiro nome, um apelido ou como preferir. Troca também nas suas publicações antigas (as anônimas continuam anônimas).</p>
      <p class="muted small">O resto é opcional. Só aparece para os outros membros quando você posta sem anonimato e alguém toca no seu nome. Seu CRTR, e-mail e senha nunca aparecem.</p>
      <label>Apresentação<input name="bio" maxlength="160" placeholder="Ex.: Técnico em radiologia há 8 anos, em Manaus" value="${esc(u.bio || '')}"></label>
      <label>Onde trabalha<input name="workplace" maxlength="80" placeholder="Ex.: Hospital Delfina" value="${esc(u.workplace || '')}"></label>
      <label>Capacitações<textarea name="trainings" rows="3" maxlength="500" placeholder="Cursos e treinamentos (tomografia, ressonância, radioproteção…)">${esc(u.trainings || '')}</textarea></label>
      <label>Experiências<textarea name="experience" rows="3" maxlength="500" placeholder="Onde já atuou e em quais áreas">${esc(u.experience || '')}</textarea></label>
      <div class="error" id="formError" role="alert"></div>
      <div class="row gap8 stickybtns"><button type="button" class="btn out" data-action="close-modal">Cancelar</button><button class="btn" style="flex:2" type="submit">Salvar</button></div>
    </form>`;
}
function modalEditProfile() { return sheet('Editar perfil', profileForm(ui.user)); }
async function loadMyPosts() {
  if (Store.mode !== 'api' || !ui.user) return;
  const id = ui.user.id;
  try {
    if (!ui.myPosts) { ui.myPosts = (await Store.userPosts(id)).posts; if (ui.tab === 'perfil') render(); }
  } catch { ui.myPosts = []; if (ui.tab === 'perfil') render(); }
}
function myPostsSection() {
  const list = ui.myPosts;
  if (!list) loadMyPosts();
  return `<h4 class="usec" style="margin:16px 4px 6px">Suas publicações</h4>
    <div class="myposts">${!list ? '<p class="muted small center pad8">Carregando…</p>' : list.map(postCard).join('') || '<p class="muted small center pad8">Suas publicações abertas aparecem aqui.</p>'}</div>`;
}
function screenProfile() {
  const u = ui.user, api = Store.mode === 'api';
  const row = (act, label, cls = '') => `<button class="lrow ${cls}" data-action="${act}"><span>${label}</span>${ic('chev', 18)}</button>`;
  return `<main class="prof">
    <section class="phero"><div class="pcover"></div>
      <div class="avwrap">${avatar(u.name, u.avatar, 'xl')}${api ? `<input type="file" id="avatarIn" accept="image/*" hidden><button class="avedit" data-action="change-avatar" aria-label="Trocar foto">${ic('camera', 16)}</button>` : ''}</div>
      <h2 class="pname">${esc(u.name)}${vbadge(u.verified)}</h2>
      <div class="muted">${esc(u.role)} · ${esc(regionLabel(u.region).split(' · ')[0])}</div>
      ${u.bio ? `<p class="pbio">${esc(u.bio)}</p>` : ''}
      ${u.workplace ? `<div class="pchips"><span class="pchip">${ic('pin', 14)} ${esc(u.workplace)}</span></div>` : ''}
      ${api && u.posts !== undefined ? `<div class="pstats"><div><b>${u.posts}</b><span>${u.posts === 1 ? 'post' : 'posts'}</span></div><div><b>${u.bolts}</b><span>${u.bolts === 1 ? 'raio' : 'raios'}</span></div></div>` : ''}
      <div class="prow"><button class="btn out" data-action="edit-profile">Editar perfil</button><button class="btn out" data-action="invite">Convidar</button></div>
    </section>
    ${api ? myPostsSection() : ''}
    <h4 class="usec" style="margin:18px 4px 6px">Configurações</h4>
    <div class="list">
      <div class="lrow themerow"><span>Aparência</span><div class="segtabs" role="group" aria-label="Aparência">${[['claro', 'Claro'], ['escuro', 'Escuro'], ['auto', 'Automático']].map(([v, l]) => `<button type="button" class="${getTheme() === v ? 'on' : ''}" data-action="theme" data-v="${v}">${l}</button>`).join('')}</div></div>
      <label class="lrow"><span>Começar posts como anônimo</span><input type="checkbox" class="sw" data-action="toggle-anon" ${u.anon ? 'checked' : ''}></label>
      ${api ? `<label class="lrow"><span>Perfil privado<small class="muted">Só quem você aprovar vê sua bio e publicações.</small></span><input type="checkbox" class="sw" data-action="toggle-private" ${u.private ? 'checked' : ''}></label>
      ${api && u.admin ? `<button class="lrow" data-action="open-admin"><span>Painel do fundador</span>${ic('chev', 18)}</button>` : ''}
      ${api && u.admin ? `<button class="lrow" data-action="open-announce"><span>Publicar aviso do UniRad</span>${ic('chev', 18)}</button>` : ''}
      ${pushSupported() ? `<label class="lrow"><span>Avisos no celular<small class="muted">${standalone() || !isIOS() ? 'Receba avisos mesmo com o app fechado.' : 'No iPhone, instale o app na tela inicial primeiro.'}</small></span><input type="checkbox" class="sw" data-action="toggle-push" ${ui.pushOn ? 'checked' : ''}></label>` : ''}
      <button class="lrow" data-action="open-followers"><span>Seguidores e pedidos${u.pending ? `<b class="badge">${u.pending}</b>` : ''}</span>${ic('chev', 18)}</button>` : ''}
      <a class="lrow" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(INVITE())}"><span>Convidar pelo WhatsApp</span>${ic('chev', 18)}</a>
      ${row('copy-link', 'Copiar link de convite')}
      ${standalone() ? '' : row('install', 'Instalar app')}
      ${row('show-terms', 'Regras do UniRad')}
      ${row('logout', 'Sair')}
      ${row('ask-delete', 'Apagar minha conta e meus dados', 'danger')}
    </div>
    ${Store.mode === 'demo' ? '<p class="muted small center">Modo demonstração: os dados ficam só neste aparelho.</p>' : ''}
  </main>`;
}

function followBtn(u) {
  if (u.me) return '<div class="muted small">Este é o seu perfil.</div>';
  const label = u.state === 'ok' ? 'Seguindo' : u.state === 'pending' ? 'Pedido enviado' : u.private ? 'Pedir para seguir' : 'Seguir';
  return `<button class="btn ${u.state === 'none' ? '' : 'out'}" id="ufollow" data-action="follow" data-id="${u.id}">${label}</button>`;
}
function modalUser() {
  const u = ui.viewUser;
  const blk = (t, v) => (v ? `<div class="ublk"><b>${t}</b><p>${esc(v).replace(/\n/g, '<br>')}</p></div>` : '');
  const big = u.avatar ? `<button class="pav" data-action="zoom" data-src="${esc(imgUrl(u.avatar))}" aria-label="Ampliar foto">${avatar(u.name, u.avatar, 'huge')}</button>` : avatar(u.name, '', 'huge');
  const who = `<div class="muted small">${esc(u.role)} · ${esc(regionLabel(u.region).split(' · ')[0])}</div>`;
  if (u.restricted) {
    return sheet(u.name, `<div class="uhero">${big}${who}
      <div class="ulock">${ic('lock', 18)} Este perfil é privado. ${u.state === 'pending' ? 'Seu pedido está esperando resposta.' : 'Peça para seguir para ver as publicações.'}</div>
      ${followBtn(u)}</div>`);
  }
  const has = u.bio || u.trainings || u.experience;
  const list = ui.userPosts === null ? '<p class="muted small">Carregando…</p>' : ui.userPosts.length
    ? ui.userPosts.map((p) => `<div class="upost"><div class="muted small">${esc(CAT_NAME[p.cat] || 'Publicação')} · ${ago(p.t)}</div><div>${esc(p.text).slice(0, 220)}${p.text.length > 220 ? '…' : ''}</div></div>`).join('')
    : emptyState('msg', 'Nada por aqui ainda', 'Quando essa pessoa publicar abertamente, aparece aqui.');
  return sheet(u.name, `<div class="uhero"><div class="pcover"></div>${big}${who}
    ${u.bio ? `<div class="ubio">${esc(u.bio)}</div>` : ''}${u.workplace ? `<div class="pchips"><span class="pchip">${ic('pin', 14)} ${esc(u.workplace)}</span></div>` : ''}
    <div class="ustats"><div><b>${u.posts}</b><span>posts</span></div><div><b id="ufollowers">${u.followers}</b><span>seguidores</span></div><div><b>${u.following}</b><span>seguindo</span></div></div>
    ${followBtn(u)}
  </div>
  ${u.trainings || u.experience ? `<details class="udet"><summary>Ver capacitações e experiências</summary>${blk('Capacitações', u.trainings)}${blk('Experiências', u.experience)}</details>` : ''}
  ${has ? '' : '<p class="muted small center">Esse profissional ainda não preencheu o perfil.</p>'}
  <h4 class="usec">Publicações</h4><div id="uposts">${list}</div>`);
}

const NIC = { zapstory: 'bolt', repost: 'repeat', like: 'bolt', clike: 'bolt', comment: 'msg', reply: 'msg', mention: 'msg', follow: 'users', request: 'users', approved: 'users' };
function modalNotifs() {
  const d = ui.notifs;
  const banner = pushSupported() && !ui.pushOn && (standalone() || !isIOS()) ? `<button class="btn out" data-action="enable-push" style="margin-bottom:8px">Ativar avisos no celular</button>` : '';
  if (!d) return sheet('Avisos', '<p class="muted small">Carregando…</p>');
  const row = (n) => `<${n.actorId ? 'button' : 'div'} class="nrow ${n.read ? '' : 'new'}" ${n.actorId ? `data-action="view-user" data-id="${n.actorId}"` : ''}><span class="nic">${ic(NIC[n.type] || 'bell', 18)}</span><span class="ntxt"><b>${esc(n.text)}</b>${n.snippet ? `<small class="muted">“${esc(n.snippet)}”</small>` : ''}<small class="muted">${ago(n.t)}</small></span>${n.read ? '' : '<i class="ndot"></i>'}</${n.actorId ? 'button' : 'div'}>`;
  return sheet('Avisos', `${banner}${d.items.map(row).join('') || emptyState('bell', 'Nenhum aviso ainda', 'Quando alguém curtir, comentar ou seguir você, aparece aqui.')}`);
}
function updateBell() {
  const b = document.getElementById('bbadge'); if (!b) return;
  const n = (ui.user && ui.user.unread) || 0;
  b.hidden = !n; b.textContent = n > 9 ? '9+' : String(n || '');
}
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const pushSupported = () => Store.mode === 'api' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const keyBytes = (k) => { const p = '='.repeat((4 - (k.length % 4)) % 4); const r = atob((k + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };
const isBrave = async () => { try { return !!(navigator.brave && (await navigator.brave.isBrave())); } catch { return false; } };
async function showPushHelp(subFail) { ui.pushHelp = { brave: await isBrave(), subFail: !!subFail }; if (ui.modal) openOver('pushhelp'); else openModal('pushhelp'); }
function modalPushHelp() {
  const h = ui.pushHelp || {};
  const li = (n, t) => `<li><span>${n}</span><div>${t}</div></li>`;
  const steps = h.brave
    ? (h.subFail ? [li(1, '<b>Ligue o push do Brave.</b> Menu ⋮ › Configurações › Privacidade e segurança › <i>Usar serviços do Google para mensagens push</i>.'), li(2, '<b>Volte aqui</b> e toque em tentar de novo.')]
      : [li(1, '<b>Permita no site.</b> Menu ⋮ › Configurações › Configurações do site › Notificações › UniRad › Permitir.'), li(2, '<b>Ligue o push do Brave.</b> Menu ⋮ › Configurações › Privacidade e segurança › <i>Usar serviços do Google para mensagens push</i>.'), li(3, '<b>Volte aqui</b> e toque em tentar de novo.')])
    : [li(1, '<b>Permita no site.</b> Toque no ícone ao lado do endereço › Configurações do site › Notificações › Permitir.'), li(2, 'Se não achar: Menu ⋮ › Configurações › Configurações do site › Notificações › UniRad.'), li(3, '<b>Volte aqui</b> e toque em tentar de novo.')];
  return sheet('Ativar avisos no celular', `<p class="muted small">${h.subFail ? 'O navegador não conseguiu registrar os avisos.' : 'O navegador bloqueou os avisos.'} Faça isto uma vez só${h.brave ? ' (no Brave)' : ''}:</p>
    <ol class="steps4">${steps.join('')}</ol>
    <button class="btn" data-action="push-retry">Já fiz, tentar de novo</button>`);
}
async function enablePush() {
  if (!pushSupported()) { toast('Este aparelho não aceita avisos.'); return false; }
  if (isIOS() && !standalone()) { toast('No iPhone, instale o app na tela inicial para receber avisos.'); return false; }
  const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (perm === 'denied') { await showPushHelp(false); return false; }
  if (perm !== 'granted') { toast('Toque em Permitir para receber avisos.'); return false; }
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes((await Store.pushKey()).key) });
    await Store.pushSub(sub.toJSON());
    ui.pushOn = true; toast('Avisos no celular ligados.'); return true;
  } catch { if (await isBrave()) await showPushHelp(true); else toast('Não foi possível ativar os avisos agora.'); return false; }
}
/* convite no momento certo: depois que a pessoa curte, comenta ou segue */
function maybeAskPush() {
  try {
    if (ui.paShown || ui.pushOn || !pushSupported() || Notification.permission !== 'default' || (isIOS() && !standalone())) return;
    const last = Number(localStorage.getItem('unirad-push-ask') || 0);
    if (Date.now() - last < 14 * 86400000) return;
    ui.paShown = true;
    const d = document.createElement('div'); d.className = 'pushask'; d.setAttribute('role', 'dialog');
    d.innerHTML = `<div class="pa-ic">${ic('bell', 22)}</div><div class="pa-tx"><b>Quer ser avisado quando responderem?</b><span>Você recebe um aviso no celular, mesmo com o app fechado.</span></div><div class="pa-bt"><button class="btn small" data-action="pa-yes">Ativar</button><button class="btn out small" data-action="pa-no">Agora não</button></div>`;
    setTimeout(() => document.body.appendChild(d), 900);
    setTimeout(() => d.remove(), 20000);
  } catch { /* sem convite */ }
}
async function disablePush() {
  try { const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription(); if (sub) { await Store.pushUnsub(sub.endpoint); await sub.unsubscribe(); } } catch { /* ignorado */ }
  ui.pushOn = false; toast('Avisos no celular desligados.');
}
async function initPush() {
  if (!pushSupported() || Notification.permission !== 'granted') return;
  try { const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription(); if (sub) { await Store.pushSub(sub.toJSON()); ui.pushOn = true; } } catch { /* ignorado */ }
}
async function pollUnread() {
  if (!ui.user || document.hidden || Store.mode !== 'api') return;
  try { const r = await Store.unread(); if (ui.user) { ui.user.unread = r.unread; updateBell(); } } catch { /* ignorado */ }
}
setInterval(pollUnread, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) pollUnread(); });

function modalAnnounce() {
  return sheet('Aviso do UniRad', `<form data-form="announce" novalidate><p class="muted small">Aparece fixo no topo do Início para todos e vira um aviso no sino. Substitui o aviso atual.</p>
    <label>Texto do aviso<textarea name="text" rows="4" maxlength="300" required placeholder="Ex.: Reunião da categoria sábado, 10h."></textarea></label>
    <div class="error" id="formError" role="alert"></div>
    <div class="row gap8 stickybtns"><button type="button" class="btn out" data-action="close-modal">Cancelar</button><button class="btn" style="flex:2" type="submit">Publicar aviso</button></div></form>
    ${ui.announcement ? '<button class="btn out" data-action="remove-announce" style="margin-top:10px">Remover aviso atual</button>' : ''}`);
}
function modalFollowers() {
  const d = ui.fol;
  const row = (r, btns) => `<div class="frow">${avatar(r.name, r.avatar, 'sm')}<button class="fname" data-action="view-user" data-id="${r.id}">${esc(r.name)}</button>${btns}</div>`;
  if (!d) return sheet('Seguidores e pedidos', '<p class="muted small">Carregando…</p>');
  return sheet('Seguidores e pedidos', `<h4 class="usec">Pedidos (${d.requests.length})</h4>
    ${d.requests.map((r) => row(r, `<button class="btn sm" data-action="req" data-act="approve" data-id="${r.id}">Aprovar</button><button class="btn out sm" data-action="req" data-act="decline" data-id="${r.id}">Recusar</button>`)).join('') || '<p class="muted small">Nenhum pedido no momento.</p>'}
    <h4 class="usec">Seguidores (${d.followers.length})</h4>
    ${d.followers.map((r) => row(r, `<button class="btn out sm" data-action="req" data-act="remove" data-id="${r.id}">Remover</button>`)).join('') || '<p class="muted small">Ninguém segue você ainda.</p>'}`);
}

const MESES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
function delayCalHtml() {
  const now = new Date(), cy = now.getFullYear(), cm = now.getMonth();
  const y = ui.dy;
  const grid = MESES_CURTO.map((l, i) => {
    const key = `${y}-${String(i + 1).padStart(2, '0')}`;
    const future = y > cy || (y === cy && i > cm);
    const on = key in ui.dsel;
    return `<button type="button" class="mcell ${on ? 'on' : ''}" data-action="toggle-month" data-m="${key}" ${future ? 'disabled' : ''} aria-pressed="${on}">${l}</button>`;
  }).join('');
  const keys = Object.keys(ui.dsel).sort().reverse();
  const rows = keys.map((k) => { const [yy, mm] = k.split('-'); const lbl = `${MESES_CURTO[Number(mm) - 1]}/${yy}`; return `<div class="drow" data-m="${k}"><span>${lbl}</span><input type="number" min="0" max="31" inputmode="numeric" placeholder="dias de atraso" value="${ui.dsel[k] || ''}" aria-label="Dias de atraso em ${lbl}"></div>`; }).join('');
  return { grid, rows, y, canNext: y < cy };
}
function modalDelay() {
  const c = delayCalHtml();
  return sheet('Relatar atraso', `<form data-form="delay" novalidate>
    <label>Hospital ou clínica <i class="req">*</i><input name="hospital" required maxlength="80" placeholder="Nome do local"></label>
    <label>O que aconteceu <i class="req">*</i><select name="type">${DELAY_TYPES.map((t) => `<option>${esc(t)}</option>`).join('')}</select></label>
    <div class="field">Meses em atraso <i class="req">*</i> <span class="muted small">(toque nos meses e depois informe os dias)</span>
      <div class="yearbar"><button type="button" data-action="dyear" data-d="-1" aria-label="Ano anterior">${ic('chev', 20)}</button><b id="dyear">${c.y}</b><button type="button" data-action="dyear" data-d="1" id="dnext" aria-label="Próximo ano" ${c.canNext ? '' : 'disabled'}>${ic('chev', 20)}</button></div>
      <div class="mgrid" id="mgrid">${c.grid}</div></div>
    <div id="drows">${c.rows}</div>
    <p class="muted small">Seu relato aparece só somado aos outros, sem seu nome. Relate só fatos e nada de dados de pacientes.</p>
    <div class="error" id="formError" role="alert"></div>
    <div class="row gap8 stickybtns"><button type="button" class="btn out" data-action="close-modal">Cancelar</button><button class="btn" style="flex:2" type="submit">Enviar relato</button></div></form>`);
}
function updateDelayCal() {
  const c = delayCalHtml();
  const g = document.getElementById('mgrid'); if (!g) return;
  g.innerHTML = c.grid; document.getElementById('dyear').textContent = c.y; document.getElementById('dnext').disabled = !c.canNext;
  const r = document.getElementById('drows'), keep = r.querySelector('input:focus');
  r.innerHTML = c.rows;
  if (keep) { /* mantém o foco no campo ativo quando possível */ }
}

function modalPost() {
  const c = ui.postCat;
  return sheet(c === 'enquete' ? 'Nova enquete' : 'Nova publicação', `<form data-form="post" novalidate>
    <div class="chips" role="group" aria-label="Tipo">${[['geral', 'Geral'], ['vagas', 'Vaga'], ['cursos', 'Curso'], ['enquete', 'Enquete'], ['aviso', 'Aviso']].map(([v, l]) => `<button type="button" class="chip2 ${c === v ? 'on' : ''}" data-action="chip" data-for="catSel" data-v="${v}">${l}</button>`).join('')}</div>
    <select name="cat" id="catSel" hidden><option value="geral" ${c === 'geral' ? 'selected' : ''}>Geral</option><option value="vagas" ${c === 'vagas' ? 'selected' : ''}>Vaga</option><option value="cursos" ${c === 'cursos' ? 'selected' : ''}>Curso / capacitação</option>${Store.mode === 'api' ? `<option value="enquete" ${c === 'enquete' ? 'selected' : ''}>Enquete</option><option value="aviso" ${c === 'aviso' ? 'selected' : ''}>Aviso</option>` : ''}</select>
    <label><span id="textLabel">${c === 'enquete' ? 'Pergunta' : 'Texto'}</span> <i class="req">*</i><textarea name="text" required maxlength="800" rows="4" placeholder="Escreva aqui"></textarea></label>
    <div id="vagaExtra" ${c === 'vagas' ? '' : 'hidden'}>
      <label>Local<input name="place" maxlength="80" placeholder="Hospital ou clínica"></label>
      <label>Salário<input name="salary" maxlength="30" placeholder="Ex.: R$ 3.500"></label>
    </div>
    <div id="pollExtra" ${c === 'enquete' ? '' : 'hidden'}>
      ${[1, 2, 3, 4].map((n) => `<label>Opção ${n}${n < 3 ? ' <i class="req">*</i>' : ' <span class="muted small">(opcional)</span>'}<input name="poll${n}" maxlength="40" placeholder="Resposta ${n}"></label>`).join('')}
    </div>
    ${Store.mode === 'api' ? `<div class="photobox"><input type="file" id="photoIn" accept="image/*" hidden>
      <button type="button" class="photobtn" data-action="pick-photo" id="photoBtn">${ic('camera', 20)} Adicionar foto ou print</button>
      <div id="photoPrev" class="photoprev" hidden><img id="photoImg" alt="Prévia da foto"><button type="button" class="prevx" data-action="rm-photo" aria-label="Remover foto">${ic('x', 18)}</button></div></div>` : ''}
    <div class="chips" role="group" aria-label="Onde aparece"><button type="button" class="chip2 on" data-action="chip" data-for="scopeSel" data-v="regiao">Minha região</button><button type="button" class="chip2" data-action="chip" data-for="scopeSel" data-v="brasil">Brasil todo</button></div>
    <select name="scope" id="scopeSel" hidden><option value="regiao">Só na minha região</option><option value="brasil">Brasil todo</option></select>
    <label class="anonbox"><span class="anontxt"><b>Publicar como anônimo</b><span class="muted small" id="anonHint"></span></span><input type="checkbox" class="sw" name="anon" id="anonChk" ${ui.user.anon ? 'checked' : ''}></label>
    <p class="muted small">Não publique dados de pacientes ou exames. Em prints, cubra nomes, CPF e dados pessoais antes de enviar.</p>
    <div class="error" id="formError" role="alert"></div>
    <div class="row gap8 stickybtns"><button type="button" class="btn out" data-action="close-modal">Cancelar</button><button class="btn" style="flex:2" type="submit">Publicar</button></div></form>`);
}

function modalInstall() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return sheet('Instalar o UniRad', ios
    ? '<ol class="steps"><li>Toque no botão <b>Compartilhar</b> do Safari (o quadrado com seta).</li><li>Escolha <b>Adicionar à Tela de Início</b>.</li><li>Toque em <b>Adicionar</b>.</li></ol>'
    : '<ol class="steps"><li>Toque nos <b>três pontinhos</b> do navegador.</li><li>Escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</li><li>Confirme.</li></ol>');
}

function modalDeleteAccount() {
  return sheet('Apagar minha conta', `<form data-form="delete" novalidate>
    <p>Isso apaga sua conta, suas publicações, comentários e relatos. Não dá para desfazer.</p>
    ${Store.mode === 'api' ? `<label>Digite sua senha<span class="pwbox"><input name="password" type="password" autocomplete="current-password" required><button type="button" class="eye" data-action="toggle-pw" aria-label="Mostrar senha">${ic('eye', 22)}</button></span></label>` : ''}
    <div class="error" id="formError" role="alert"></div>
    <button class="btn big danger" type="submit">Apagar tudo</button></form>`);
}

/* ---------- render ---------- */
function nav() {
  const t = (k, i, l) => `<button class="${ui.tab === k ? 'on' : ''}" data-action="tab" data-t="${k}" aria-label="${l}">${ic(i, 26)}<span>${l}</span></button>`;
  return `<nav class="nav">${t('inicio', 'home', 'Início')}${t('atrasos', 'alert', 'Atrasos')}<button class="navplus" data-action="new-post" aria-label="Nova publicação">${ic('plus', 26)}</button>${t('direitos', 'shield', 'Direitos')}${t('perfil', 'user', 'Perfil')}</nav>`;
}
function header() {
  return `<header class="top"><div class="row gap8">${logo(30)}<b class="brand">UniRad</b></div><div class="row gap8">${Store.mode === 'api' ? `<button class="ghost bell" data-action="open-search" aria-label="Buscar">${ic('search', 24)}</button>` : ''}<button class="ghost bell" data-action="quick-theme" aria-label="${document.documentElement.dataset.theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}">${ic(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon', 24)}</button>${Store.mode === 'api' ? `<button class="ghost bell" data-action="open-notifs" aria-label="Avisos">${ic('bell', 24)}<span class="bbadge" id="bbadge" ${ui.user.unread ? '' : 'hidden'}>${ui.user.unread > 9 ? '9+' : ui.user.unread || ''}</span></button>` : ''}<button class="ghost" data-action="invite" aria-label="Convidar colegas">${ic('share', 22)}</button></div></header>`;
}
/* ---- botão voltar do celular: volta uma tela dentro do app ---- */
const pushH = () => { try { history.pushState({ u: 1 }, ''); } catch { /* ignorado */ } };
const popSilently = () => { ui.skipPop = 1; history.back(); };
function openModal(m) { ui.modal = m; pushH(); render(); }
function openOver(m) { (ui.stk = ui.stk || []).push(ui.modal); openModal(m); }
function backModal() { if (ui.modal === 'zoom' || ui.modal === 'user' || ui.modal === 'place' || ui.modal === 'company' || ui.modal === 'pick' || ui.modal === 'rate' || ui.modal === 'link' || ui.modal === 'council' || ui.modal === 'demands' || ui.modal === 'dnew') return (ui.stk || []).pop() || null; return (ui.modal === 'menu' || ui.modal === 'edit') && ui.menu && ui.menu.kind === 'comment' && ui.cpost ? 'comments' : null; }
function closeModal() { if (ui.modal) { ui.modal = backModal(); if (!ui.modal) ui.stk = []; popSilently(); } render(); }
function openRootModal(html) { document.getElementById('modalRoot').innerHTML = html; ui.rootModal = true; pushH(); }
function closeRootModal() { document.getElementById('modalRoot').innerHTML = ''; if (ui.rootModal) { ui.rootModal = false; popSilently(); } }
window.addEventListener('popstate', () => {
  if (ui.skipPop) { ui.skipPop = 0; return; }
  if (ui.rootModal) { document.getElementById('modalRoot').innerHTML = ''; ui.rootModal = false; return; }
  if (ui.modal) { ui.modal = backModal(); if (!ui.modal) ui.stk = []; return render(); }
  if (!ui.user) {
    if (ui.screen === 'signup' && ui.signupStep === 2) ui.signupStep = 1;
    else if (ui.screen !== 'welcome') ui.screen = 'welcome';
    else return;
    return render();
  }
  if (ui.tab !== 'inicio') { ui.tab = 'inicio'; window.scrollTo(0, 0); refresh(); }
});

function render() {
  document.body.classList.toggle('dark-welcome', !ui.user);
  document.body.classList.toggle('noscroll', ui.modal === 'story' || ui.modal === 'snew' || ui.modal === 'notifs' || ui.modal === 'place' || ui.modal === 'council' || ui.modal === 'company' || ui.modal === 'comments' || ui.modal === 'menu' || ui.modal === 'user' || ui.modal === 'zoom');
  if (!ui.user) {
    $app.innerHTML = ui.screen === 'signup' ? screenSignup() : ui.screen === 'login' ? screenLogin() : screenWelcome();
    bindSignup();
    return;
  }
  const body = { inicio: screenHome, atrasos: screenDelays, direitos: screenRights, perfil: screenProfile }[ui.tab]();
  const modal = ui.modal === 'delay' ? modalDelay() : ui.modal === 'post' ? modalPost() : ui.modal === 'terms' ? sheet('Regras do UniRad', TERMS) : ui.modal === 'delete' ? modalDeleteAccount() : ui.modal === 'install' ? modalInstall() : ui.modal === 'user' && ui.viewUser ? modalUser() : ui.modal === 'followers' ? modalFollowers() : ui.modal === 'notifs' ? modalNotifs() : ui.modal === 'place' ? modalPlace() : ui.modal === 'company' ? modalCompany() : ui.modal === 'rate' ? modalRate() : ui.modal === 'pick' ? modalPick() : ui.modal === 'announce' ? modalAnnounce() : ui.modal === 'council' ? modalCouncil() : ui.modal === 'demands' ? modalDemands() : ui.modal === 'dnew' ? modalDemandNew() : ui.modal === 'link' ? modalLink() : ui.modal === 'sharepost' ? modalSharePost() : ui.modal === 'story' ? modalStory() : ui.modal === 'pushhelp' ? modalPushHelp() : ui.modal === 'search' ? modalSearch() : ui.modal === 'invite' ? modalInvite() : ui.modal === 'calc' ? modalCalc() : ui.modal === 'admin' ? modalAdmin() : ui.modal === 'snew' ? modalStoryNew() : ui.modal === 'edit' && ui.editPost ? sheet(ui.editPost.type === 'comment' ? 'Editar comentário' : 'Editar publicação', `<form data-form="edit" data-type="${ui.editPost.type}" data-id="${ui.editPost.id}" novalidate><label>Texto<textarea name="text" rows="${ui.editPost.type === 'comment' ? 3 : 6}" maxlength="${ui.editPost.type === 'comment' ? 300 : 800}" required>${esc(ui.editPost.text)}</textarea></label>${ui.editPost.type === 'comment' ? '' : '<p class="muted small">Só o texto pode ser editado. Foto e enquete continuam como estão.</p>'}<div class="error" id="formError" role="alert"></div><div class="row gap8"><button type="button" class="btn out" data-action="close-modal">Cancelar</button><button class="btn" type="submit">Salvar</button></div></form>`) : ui.modal === 'comments' ? modalComments() : ui.modal === 'editprofile' ? modalEditProfile() : ui.modal === 'menu' && ui.menu ? menuSheet() : ui.modal === 'zoom' ? `<div class="overlay zoom" data-action="close-modal"><img src="${esc(ui.zoomSrc)}" alt="Foto ampliada">${ui.zoomUid ? `<button class="zprof" data-action="zoom-profile" data-id="${ui.zoomUid}">Ver perfil</button>` : ''}<button class="zclose" data-action="close-modal" aria-label="Fechar">${ic('x', 26)}</button></div>` : '';
  $app.innerHTML = `<div class="shell">${nav()}<div class="col">${header()}${body}</div></div>${modal}`;
  if (ui.modal && ui.modal !== ui.prevModal) { const ov = $app.querySelector('.overlay:not(.zoom):not(.stv)'); if (ov) ov.classList.add('enter'); }
  ui.prevModal = ui.modal;
  if (ui.modal !== 'snew') stopCam();
  bindModal();
}

/* Carrega os dados da tela atual no servidor e redesenha. */
async function refresh({ quiet = false } = {}) {
  if (!ui.user) return;
  const seq = ++ui.seq;
  if (!quiet) { ui.stats = null; ui.posts = null; render(); }
  const scope = scopeOf(ui.view);
  try {
    if (ui.tab === 'inicio') {
      const posts = await Store.posts({ scope, cat: ui.cat });
      if (seq !== ui.seq) return;
      ui.posts = posts.posts; ui.more = posts.more; if (posts.announcement !== undefined) ui.announcement = posts.announcement;
      if (!quiet || !ui.stories) loadStories();
    } else if (ui.tab === 'atrasos') {
      const [stats, pl, co] = await Promise.all([Store.stats(scope), Store.places(scope).catch(() => ({ places: [] })), Store.companies().catch(() => ({ companies: [] }))]);
      if (seq !== ui.seq) return;
      ui.stats = stats; ui.places = pl.places; ui.companies = co.companies;
    } else if (ui.tab === 'perfil') {
      ui.myPosts = null; ui.mySaved = null; render(); return;
    } else if (ui.tab === 'direitos') {
      render();
      if (Store.mode === 'api') { try { const [u, cn] = await Promise.all([Store.union(), Store.councils().catch(() => ({ councils: [] }))]); ui.union = u; ui.councils = cn.councils; if (ui.tab === 'direitos') render(); } catch { /* ignorado */ } }
      return;
    } else { return render(); }
  } catch (e) {
    if (seq !== ui.seq) return;
    if (/Entre para continuar/.test(e.message)) { ui.user = null; ui.screen = 'login'; return render(); }
    ui.stats = ui.stats || { members: 0, national: 0, delays: { total: 0, avgDays: 0, top: [] } };
    ui.posts = ui.posts || [];
    toast(e.message);
  }
  render();
}

function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.className = 'show';
  clearTimeout(toast.h); toast.h = setTimeout(() => { t.className = ''; }, 3500);
}

function bindSignup() {
  const s = document.getElementById('regionSearch');
  if (s) s.addEventListener('input', (e) => { ui.regionQuery = e.target.value; document.getElementById('reglist').innerHTML = regionListHtml(); });
  const c = document.getElementById('crtrIn'), r = document.getElementById('roleSel'), l = document.getElementById('crtrLetter');
  if (c && r && l) {
    const sync = () => { c.value = c.value.replace(/\D/g, '').slice(0, 6); const n = Math.max(5, c.value.length); c.style.width = `calc(${n}ch + ${n * 2}px + 6px)`; l.textContent = r.value.startsWith('Tecnólogo') ? 'N' : 'T'; };
    c.addEventListener('input', sync); r.addEventListener('change', sync); sync();
  }
}
/* fotos: reduz e re-codifica no celular (isso remove dados EXIF) */
async function processImage(file, max, q) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); }); }
  const w0 = bmp.width || bmp.naturalWidth, h0 = bmp.height || bmp.naturalHeight;
  let scale = Math.min(1, max / Math.max(w0, h0));
  for (let round = 0; round < 3; round++) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w0 * scale)); c.height = Math.max(1, Math.round(h0 * scale));
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(bmp, 0, 0, c.width, c.height);
    for (let qq = q; qq >= 0.5; qq -= 0.1) {
      const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', qq));
      if (blob && blob.size <= 1400000) return blob;
    }
    scale *= 0.75;
  }
  throw new Error('Não consegui reduzir essa foto. Tente outra.');
}
function showPhotoPrev() {
  const img = document.getElementById('photoImg');
  if (!img || !ui.photoBlob) return;
  img.src = URL.createObjectURL(ui.photoBlob);
  document.getElementById('photoPrev').hidden = false; document.getElementById('photoBtn').hidden = true;
}
/* Deslizar para baixo em qualquer ponto fecha (padrão do app). ignore = seletor de onde não vale. */
function bindSwipeDown(el, onClose, ignore = 'input, select') {
  if (!el || el.dataset.swd) return; el.dataset.swd = '1';
  let y0 = null, x0 = 0, active = false;
  el.addEventListener('touchstart', (e) => { const ta = e.target.closest('textarea'); if (e.touches.length !== 1 || e.target.closest(ignore) || (ta && ta.scrollHeight > ta.clientHeight + 2)) { y0 = null; return; } y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; active = false; }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (y0 === null) return; const dy = e.touches[0].clientY - y0, dx = e.touches[0].clientX - x0;
    if (!active) { if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) { y0 = null; return; } if (dy > 10) active = true; else return; }
    e.preventDefault(); el.style.transition = 'none'; el.style.transform = `translateY(${Math.max(0, dy)}px)`; el.style.opacity = String(Math.max(0.4, 1 - dy / 500));
  }, { passive: false });
  const end = (e) => {
    if (!active) { y0 = null; return; }
    const dy = (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : y0) - y0; y0 = null; active = false;
    el.style.transition = 'transform .2s, opacity .2s';
    if (dy > 100) { el.style.transform = 'translateY(100%)'; el.style.opacity = '0'; setTimeout(onClose, 150); } else { el.style.transform = ''; el.style.opacity = ''; }
  };
  el.addEventListener('touchend', end); el.addEventListener('touchcancel', () => { y0 = null; active = false; el.style.transform = ''; el.style.opacity = ''; });
}
function bindSheetDrag(sid, scrollId) {
  const s = document.getElementById(sid); if (!s) return;
  const sc = scrollId ? document.getElementById(scrollId) : s;
  let y0 = null, dy = 0, active = false;
  s.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1 || e.target.closest('.cform, .mlist, input, textarea, select')) { y0 = null; return; }
    y0 = e.touches[0].clientY; dy = 0; active = false; s.style.transition = 'none';
  }, { passive: true });
  s.addEventListener('touchmove', (e) => {
    if (y0 === null) return;
    const d = e.touches[0].clientY - y0;
    if (!active) {
      const scrolled = sc && sc.contains(e.target) && sc.scrollTop > 0;
      if (d > 8 && !scrolled) active = true;
      else if (d < -8 || scrolled) { y0 = null; return; }
      else return;
    }
    dy = d; e.preventDefault(); s.style.transform = `translateY(${Math.max(0, d)}px)`;
  }, { passive: false });
  const end = () => {
    if (!active) { y0 = null; return; }
    const d = dy; y0 = null; active = false; s.style.transition = 'transform .2s';
    if (d > 90) { s.style.transform = 'translateY(100%)'; setTimeout(closeModal, 150); } else s.style.transform = '';
  };
  s.addEventListener('touchend', end); s.addEventListener('touchcancel', end);
}
function fitSheet() {
  const ov = document.getElementById('cov'), s = document.getElementById('csheet'), v = window.visualViewport;
  if (!ov || !v) return;
  if (v.height < window.innerHeight - 60) {
    /* navegador que não encolhe a página com o teclado: ajusta na mão */
    ov.style.top = v.offsetTop + 'px'; ov.style.height = v.height + 'px'; ov.style.bottom = 'auto';
    if (s) s.style.height = Math.round(v.height - 6) + 'px';
  } else {
    ov.style.top = ''; ov.style.height = ''; ov.style.bottom = '';
    if (s) s.style.height = window.innerHeight < window.screen.height * 0.7 ? 'calc(100% - 6px)' : '';
  }
}
if (window.visualViewport) { window.visualViewport.addEventListener('resize', fitSheet); window.visualViewport.addEventListener('scroll', fitSheet); }
function bindModal() {
  if (ui.modal === 'story') bindStory();
  if (ui.modal === 'snew') bindSn();
  if (ui.modal === 'zoom') bindSwipeDown($app.querySelector('.overlay.zoom'), closeModal);
  bindSheetDrag('msheet'); bindSheetDrag('csheet', 'clist'); bindSheetDrag('gsheet'); fitSheet();
  const pin = document.getElementById('photoIn');
  if (pin) {
    pin.addEventListener('change', async () => {
      const f = pin.files && pin.files[0]; if (!f) return;
      try { ui.photoBlob = await processImage(f, 1600, 0.85); showPhotoPrev(); } catch (e) { toast(e.message); }
      pin.value = '';
    });
    showPhotoPrev();
  }
  const ac = document.getElementById('anonChk');
  if (ac) {
    const hint = () => { if (document.getElementById('catSel') && document.getElementById('catSel').value === 'aviso') { ac.checked = false; ac.disabled = true; document.getElementById('anonHint').textContent = 'Avisos sempre mostram seu nome.'; return; } ac.disabled = false; document.getElementById('anonHint').textContent = ac.checked ? 'Aparece como "Profissional anônimo". Os colegas não saberão que foi você.' : `Aparece com seu nome: ${ui.user.name}`; };
    ac.addEventListener('change', hint); hint();
  }
  const c = document.getElementById('catSel');
  if (c) c.addEventListener('change', () => {
    document.getElementById('vagaExtra').hidden = c.value !== 'vagas';
    document.getElementById('pollExtra').hidden = c.value !== 'enquete';
    document.getElementById('textLabel').textContent = c.value === 'enquete' ? 'Pergunta' : 'Texto';
    if (ac) ac.dispatchEvent(new Event('change'));
  });
}
const err = (m) => { const e = document.getElementById('formError'); if (e) e.textContent = m; };
const busy = (f, on) => { const b = f.querySelector('button[type=submit]'); if (b) { b.disabled = on; b.style.opacity = on ? '.6' : ''; } };

/* ---------- eventos ---------- */
document.addEventListener('click', async (ev) => {
  const el = ev.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  try {
    if (a === 'close-modal') {
      if (ev.target.closest('[data-stop]') && !ev.target.closest('button[data-action="close-modal"]')) return;
      if (!ui.user) { closeRootModal(); return; }
      return closeModal();
    }
    if (a === 'zoom-profile') { const id = el.dataset.id; ui.zoomUid = null; ui.stk = ui.stk || []; const u = await Store.getUser(id); if (!u) return; ui.viewUser = u; ui.userPosts = null; ui.modal = 'user'; render(); if (u.restricted) return; Store.userPosts(id).then((r) => { if (ui.viewUser && ui.viewUser.id === id) { ui.userPosts = r.posts; if (ui.modal === 'user') render(); } }).catch(() => { ui.userPosts = []; }); return; }
    if (a === 'show-terms') { ev.preventDefault(); if (!ui.user) { openRootModal(sheet('Regras do UniRad', TERMS)); return; } return openModal('terms'); }
    if (a === 'view-user' || (a === 'avatar-tap' && !el.dataset.src)) {
      const id = el.dataset.id;
      const u = await Store.getUser(id); if (!u) return;
      ui.viewUser = u; ui.userPosts = null; openOver('user');
      if (u.restricted) return;
      Store.userPosts(id).then((r) => { if (ui.viewUser && ui.viewUser.id === id) { ui.userPosts = r.posts; if (ui.modal === 'user') render(); } }).catch(() => { ui.userPosts = []; });
      return;
    }
    if (a === 'avatar-tap') { ui.zoomSrc = el.dataset.src; ui.zoomUid = el.dataset.id; return openOver('zoom'); }
    if (a === 'follow') {
      const u = ui.viewUser; if (!u || u.id !== el.dataset.id) return;
      const prev = { state: u.state, followers: u.followers };
      const next = u.state !== 'none' ? 'none' : u.private ? 'pending' : 'ok';
      if (prev.state === 'ok') u.followers -= 1; if (next === 'ok') u.followers += 1;
      u.state = next; render();
      try { await Store.follow(u.id); maybeAskPush(); } catch (e) { u.state = prev.state; u.followers = prev.followers; render(); toast(e.message); return; }
      if (ui.tab === 'inicio' && ui.view === 'seguindo') refresh({ quiet: true });
      return;
    }
    if (a === 'quick-theme') { const next = document.documentElement.dataset.theme === 'dark' ? 'claro' : 'escuro'; try { localStorage.setItem(THEME_KEY, next); } catch { /* ignorado */ } applyTheme(); return render(); }
    if (a === 'theme') { try { localStorage.setItem(THEME_KEY, el.dataset.v); } catch { /* ignorado */ } applyTheme(); return render(); }
    if (a === 'asort') { ui.asort = el.dataset.v; return render(); }
    if (a === 'atab') { ui.atab = el.dataset.v; return render(); }
    if (a === 'asub') { ui.asub = el.dataset.v; return render(); }
    if (a === 'pick-place') { ui.rt = { placeId: null, pname: '', kind: 'hospital', employer: 'company', cname: '', companyId: null, vinculo: null }; openModal('pick'); return; }
    if (a === 'pick-kind') { const inp = document.getElementById('pickName'); if (inp) ui.rt.pname = inp.value; ui.rt.kind = el.dataset.v; return render(); }
    if (a === 'pick-emp') { const i1 = document.getElementById('pickName'), i2 = document.getElementById('pickCo'); if (i1) ui.rt.pname = i1.value; if (i2) ui.rt.cname = i2.value; ui.rt.employer = el.dataset.v; return render(); }
    if (a === 'pick-vinc') { const i1 = document.getElementById('pickName'), i2 = document.getElementById('pickCo'); if (i1) ui.rt.pname = i1.value; if (i2) ui.rt.cname = i2.value; const k = Number(el.dataset.v); ui.rt.vinculo = ui.rt.vinculo === k ? null : k; return render(); }
    if (a === 'pick-existing') { const pl = (ui.places || []).find((x) => x.id === el.dataset.id); if (pl) { ui.rt.placeId = pl.id; ui.rt.pname = pl.name; ui.rt.kind = pl.kind; } return render(); }
    if (a === 'pick-co') { const c = (ui.companies || []).find((x) => x.id === el.dataset.id); if (c) { ui.rt.companyId = c.id; ui.rt.cname = c.name; } return render(); }
    if (a === 'pick-go') {
      const rt = ui.rt, i1 = document.getElementById('pickName'), i2 = document.getElementById('pickCo');
      if (i1) rt.pname = i1.value; if (i2) rt.cname = i2.value;
      const pname = String(rt.pname || '').trim().replace(/\s+/g, ' '), cname = String(rt.cname || '').trim().replace(/\s+/g, ' ');
      if (!rt.placeId && pname.length < 3) return err('Digite o nome do local.');
      if (rt.employer === 'company' && cname.length < 3) return err('Digite o nome da empresa ou escolha "O próprio local".');
      if (!rt.placeId) rt.placeId = await Store.createPlace(pname, rt.kind);
      if (rt.employer === 'company') rt.companyId = await Store.createCompany(cname);
      const [pd, cd] = await Promise.all([Store.place(rt.placeId), rt.employer === 'company' ? Store.company(rt.companyId, rt.placeId) : null]);
      rt.pname = pd.place.name; rt.mineP = pd.mine || {}; rt.mineC = cd ? cd.mine || {} : {};
      if (cd && rt.vinculo) { await Store.rateCompany(rt.companyId, rt.placeId, 'vinculo', rt.vinculo); rt.mineC.vinculo = rt.vinculo; }
      rt.steps = buildSteps(rt); rt.i = 0; ui.modal = 'rate'; return render();
    }
    if (a === 'open-place') { return openPlace(el.dataset.id); }
    if (a === 'open-company') { ui.company = null; openOver('company'); ui.company = await Store.company(el.dataset.id, el.dataset.place || ''); if (ui.modal === 'company') render(); return; }
    if (a === 'ptab') { ui.ptab = el.dataset.v; return render(); }
    if (a === 'watch') {
      const d = el.dataset.kind === 'company' ? ui.company : ui.place;
      const r = await Store.watch(el.dataset.kind, el.dataset.id); d.watching = r.watching; render();
      toast(r.watching ? 'Você vai receber avisos de novas avaliações.' : 'Você deixou de acompanhar.'); return;
    }
    if (a === 'rate-place') {
      const d = ui.place;
      ui.rt = { placeId: d.place.id, pname: d.place.name, kind: d.place.kind, employer: 'company', cname: d.myCompany ? d.myCompany.name : '', companyId: d.myCompany ? d.myCompany.id : null, vinculo: null };
      ui.rt.fromPlace = true; return openOver('pick');
    }
    if (a === 'rstep' || a === 'rskip' || a === 'rback') {
      const rt = ui.rt; if (!rt || rt.lock) return;
      const st = rt.steps[rt.i], mine = st.target === 'company' ? rt.mineC : rt.mineP;
      const go = () => { rt.lock = false; if (rt.i >= rt.steps.length - 1) { finishRate().catch((e) => toast(e.message)); } else { rt.i += 1; render(); } };
      if (a === 'rback') { if (rt.i > 0) { rt.i -= 1; render(); } return; }
      if (a === 'rskip') { return go(); }
      const val = Number(el.dataset.v), same = mine[st.m[0]] === val, prev = mine[st.m[0]];
      if (same) delete mine[st.m[0]]; else mine[st.m[0]] = val;
      render(); rt.lock = true;
      const call = st.target === 'company' ? Store.rateCompany(rt.companyId, rt.placeId, st.m[0], same ? null : val) : st.target === 'council' ? Store.rateCouncil(rt.council, st.m[0], same ? null : val) : Store.ratePlace(rt.placeId, st.m[0], same ? null : val);
      try { await call; } catch (e) { if (prev === undefined) delete mine[st.m[0]]; else mine[st.m[0]] = prev; rt.lock = false; render(); toast(e.message); return; }
      if (same) { rt.lock = false; return; }
      setTimeout(go, 220); return;
    }
    if (a === 'open-council') { ui.councilSel = el.dataset.id; return openOver('council'); }
    if (a === 'rate-council') {
      const c = ui.councils.find((x) => x.id === el.dataset.id);
      ui.rt = { council: c.id, pname: councilName(c), mineP: { ...c.mine }, mineC: {}, steps: COUNCIL_META.map((m) => ({ m, target: 'council' })), i: 0 };
      return openOver('rate');
    }
    if (a === 'open-demands') { ui.demands = null; openOver('demands'); try { ui.demands = (await Store.demands()).demands; } catch (e) { toast(e.message); } if (ui.modal === 'demands') render(); return; }
    if (a === 'new-demand') { ui.dnew = { body: 'crtr', text: '' }; return openOver('dnew'); }
    if (a === 'dbody') { const t = document.getElementById('dtext'); if (t) ui.dnew.text = t.value; ui.dnew.body = el.dataset.v; return render(); }
    if (a === 'send-demand') {
      const t = document.getElementById('dtext'); ui.dnew.text = t ? t.value : '';
      try { await Store.createDemand(ui.dnew.body, ui.dnew.text); } catch (e) { return err(e.message); }
      ui.demands = null; closeModal(); try { ui.demands = (await Store.demands()).demands; } catch { /* ignorado */ } render(); toast('Cobrança publicada.'); return;
    }
    if (a === 'support-demand') {
      const d = ui.demands.find((x) => x.id === el.dataset.id); if (!d) return;
      try { const r = await Store.supportDemand(d.id); d.sup = r.sup; d.n = r.n; render(); } catch (e) { toast(e.message); } return;
    }
    if (a === 'del-demand') { try { await Store.deleteDemand(el.dataset.id); ui.demands = ui.demands.filter((x) => x.id !== el.dataset.id); render(); toast('Cobrança apagada.'); } catch (e) { toast(e.message); } return; }
    if (a === 'new-story') { ui.sn = { mode: 'foto', bg: recentBgs()[0], anon: !!(ui.user && ui.user.anon), text: '', blob: null, url: null, facing: 'environment', camErr: false }; return openModal('snew'); }
    if (a === 'st-bg') { ui.sn.bg = Number(el.dataset.v); snRender(); return; }
    if (a === 'sn-pal') { ui.sn.pal = 1; snRender(); return; }
    if (a === 'sn-palx') { ui.sn.pal = 0; snRender(); return; }
    if (a === 'sn-pick') { ui.sn.bg = Number(el.dataset.v); pushRecentBg(ui.sn.bg); ui.sn.pal = 0; snRender(); return; }
    if (a === 'sn-anon') { ui.sn.anon = !ui.sn.anon; snRender(); return; }
    if (a === 'sn-mode') { if (ui.sn.mode === el.dataset.v) return; ui.sn.mode = el.dataset.v; ui.sn.blob = null; stopCam(); snRender(); return; }
    if (a === 'sn-flip') { ui.sn.facing = ui.sn.facing === 'user' ? 'environment' : 'user'; stopCam(); snRender(); return; }
    if (a === 'sn-gallery') { const i = document.getElementById('snFile'); if (i) i.click(); return; }
    if (a === 'sn-native') { const i = document.getElementById('snCap'); if (i) i.click(); return; }
    if (a === 'sn-redo') { if (ui.sn.url) URL.revokeObjectURL(ui.sn.url); ui.sn.blob = null; ui.sn.url = null; ui.sn.text = ''; snRender(); return; }
    if (a === 'sn-shoot') {
      const v = document.getElementById('snvideo');
      if (!v || !snStream || !v.videoWidth) { const i = document.getElementById('snCap'); if (i) i.click(); return; }
      const sc = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight)), cv = document.createElement('canvas');
      cv.width = Math.round(v.videoWidth * sc); cv.height = Math.round(v.videoHeight * sc);
      cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
      cv.toBlob((bl) => { if (bl) snSetBlob(bl); else toast('Não consegui tirar a foto.'); }, 'image/jpeg', 0.82);
      return;
    }
    if (a === 'sn-pub') {
      const n = ui.sn; if (n.busy) return;
      const tx = document.getElementById(n.mode === 'texto' ? 'sntext' : 'sncap'); if (tx) n.text = tx.value;
      const text = String(n.text || '').trim();
      if (n.mode === 'texto' && text.length < 2) return toast('Escreva algo no status.');
      if (n.mode === 'foto' && !n.blob) return toast('Tire ou escolha uma foto.');
      n.busy = true; el.disabled = true; el.style.opacity = '.6';
      try {
        const image = n.mode === 'foto' ? await Store.upload(n.blob) : null;
        await Store.createStory({ text, bg: n.mode === 'texto' ? n.bg : 0, image, anon: n.anon });
        if (n.mode === 'texto') pushRecentBg(n.bg);
      } catch (e) { n.busy = false; el.disabled = false; el.style.opacity = ''; return toast(e.message); }
      if (n.url) URL.revokeObjectURL(n.url);
      ui.sn = null; stopCam(); closeModal(); toast('Status publicado.'); loadStories(); return;
    }
    if (a === 'st-open') { ui.sv = { g: Number(el.dataset.g), i: 0 }; const g = storyList()[ui.sv.g]; if (!g) { ui.sv = null; return; } if (!g.mine) { const k = g.stories.findIndex((x) => !x.seen); ui.sv.i = k < 0 ? 0 : k; } showStory(true); return openModal('story'); }
    if (a === 'st-zap') { const s = storyList()[ui.sv.g].stories[ui.sv.i]; s.zapped = !s.zapped; el.classList.toggle('on', s.zapped); try { const r = await Store.zapStory(s.id); s.zapped = r.zapped; el.classList.toggle('on', s.zapped); } catch (e) { s.zapped = !s.zapped; el.classList.toggle('on', s.zapped); toast(e.message); } return; }
    if (a === 'st-views') {
      const sv = ui.sv; sv.panel = !sv.panel; sv.viewers = null; const s = storyList()[sv.g].stories[sv.i];
      const ov = document.getElementById('stv'); ov.outerHTML = modalStory(); bindStory();
      if (sv.panel) { try { const r = await Store.storyViews(s.id); if (ui.sv === sv && sv.panel) { sv.viewers = r.views; const o2 = document.getElementById('stv'); if (o2) { o2.outerHTML = modalStory(); bindStory(); } } } catch (e) { toast(e.message); } }
      return;
    }
    if (a === 'st-del') {
      const sv = ui.sv; if (!sv.del) { sv.del = true; const ov = document.getElementById('stv'); ov.outerHTML = modalStory(); bindStory(); return; }
      const g = storyList()[sv.g], s = g.stories[sv.i];
      try { await Store.deleteStory(s.id); } catch (e) { return toast(e.message); }
      g.stories.splice(sv.i, 1);
      if (!g.stories.length) { closeModal(); loadStories(); return toast('Status apagado.'); }
      if (sv.i >= g.stories.length) sv.i = g.stories.length - 1;
      sv.del = false; showStory(); return toast('Status apagado.');
    }
    if (a === 'open-admin') { ui.adm = { tab: 'vis', f: 'pending', q: '' }; openModal('admin'); admLoad('vis'); admLoad('mod'); return; }
    if (a === 'adm-tab') { ui.adm.tab = el.dataset.v; render(); admLoad(el.dataset.v); return; }
    if (a === 'adm-backup') { el.disabled = true; el.textContent = 'Fazendo backup…'; try { await Store.adminBackupNow(); toast('Backup feito.'); } catch (e) { toast(e.message); } admLoad('avi'); return; }
    if (a === 'adm-f') { ui.adm.f = el.dataset.v; ui.adm.us = null; ui.adm.sel = null; render(); admLoad('usr'); return; }
    if (a === 'adm-sel') { ui.adm.sel = ui.adm.sel === el.dataset.id ? null : el.dataset.id; render(); return; }
    if (a === 'adm-keep') { try { await Store.adminKeep(el.dataset.id); ui.adm.rep = ui.adm.rep.filter((x) => x.id !== el.dataset.id); if (ui.adm.ov) ui.adm.ov.reports = ui.adm.rep.length; render(); toast('Post mantido.'); } catch (e) { toast(e.message); } return; }
    if (a === 'adm-del') {
      if (!el.dataset.sure) { el.dataset.sure = '1'; el.textContent = 'Toque de novo para confirmar'; return; }
      try { await Store.adminDelete(el.dataset.id, !!el.dataset.suspend); ui.adm.rep = ui.adm.rep.filter((x) => x.id !== el.dataset.id); if (ui.adm.ov) ui.adm.ov.reports = ui.adm.rep.length; render(); toast(el.dataset.suspend ? 'Apagado e autor suspenso.' : 'Post apagado.'); refresh({ quiet: true }); } catch (e) { toast(e.message); }
      return;
    }
    if (a === 'adm-verify') { try { await Store.adminVerify(el.dataset.id, el.dataset.on === '1'); admLoad('usr'); toast(el.dataset.on === '1' ? 'CRTR verificado.' : 'Selo removido.'); } catch (e) { toast(e.message); } return; }
    if (a === 'adm-susp') {
      if (el.dataset.on === '1' && !el.dataset.sure) { el.dataset.sure = '1'; el.textContent = 'Toque de novo para suspender'; return; }
      try { await Store.adminSuspend(el.dataset.id, el.dataset.on === '1'); ui.adm.sel = null; admLoad('usr'); toast(el.dataset.on === '1' ? 'Usuário suspenso.' : 'Usuário reativado.'); } catch (e) { toast(e.message); } return;
    }
    if (a === 'share-post') { const p = findPost((x) => x.id === el.dataset.id); if (!p) return; ui.sharePost = p; return openModal('sharepost'); }
    if (a === 'repost') {
      const p = ui.sharePost; if (!p) return;
      try {
        const r = await Store.repost(p.id);
        for (const arr of [ui.posts, ui.myPosts, ui.mySaved, ui.userPosts]) for (const x of arr || []) if (x.id === p.id) { x.reposted = r.reposted; x.reposts = r.reposts; }
        closeModal(); toast(r.reposted ? 'Compartilhado com quem segue você.' : 'Compartilhamento desfeito.');
      } catch (e) { toast(e.message); }
      return;
    }
    if (a === 'open-link') { ui.linkUrl = el.dataset.url; return openOver('link'); }
    if (a === 'link-opened') { return closeModal(); }
    if (a === 'copy-link') {
      const u = el.dataset.url;
      try { await navigator.clipboard.writeText(u); } catch { const t = document.createElement('textarea'); t.value = u; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch { /* ignorado */ } t.remove(); }
      toast('Link copiado'); return;
    }
    if (a === 'union') { try { await Store.toggleUnion(); ui.union = await Store.union(); render(); } catch (e) { toast(e.message); } return; }
    if (a === 'open-announce') { openModal('announce'); return; }
    if (a === 'remove-announce') { if (confirm('Remover o aviso atual?')) { await Store.removeAnnounce(); ui.announcement = null; closeModal(); toast('Aviso removido.'); refresh({ quiet: true }); } return; }
    if (a === 'open-notifs') {
      ui.notifs = null; openModal('notifs');
      try { ui.notifs = await Store.notifs(); } catch (e) { toast(e.message); return; }
      if (ui.modal === 'notifs') render();
      if (ui.user.unread) { ui.user.unread = 0; updateBell(); Store.readNotifs().catch(() => {}); }
      return;
    }
    if (a === 'pa-yes') { document.querySelector('.pushask')?.remove(); try { localStorage.setItem('unirad-push-ask', String(Date.now())); } catch { /* ok */ } if (await enablePush()) render(); return; }
    if (a === 'pa-no') { document.querySelector('.pushask')?.remove(); try { localStorage.setItem('unirad-push-ask', String(Date.now())); } catch { /* ok */ } return; }
    if (a === 'push-retry') { if (await enablePush()) { closeModal(); render(); } return; }
    if (a === 'enable-push') { if (await enablePush()) render(); return; }
    if (a === 'open-followers') { ui.fol = null; openModal('followers'); try { ui.fol = await Store.requests(); } catch (e) { toast(e.message); } if (ui.modal === 'followers') render(); return; }
    if (a === 'req') {
      const id = el.dataset.id, act = el.dataset.act;
      try { await Store.answerRequest(id, act); } catch (e) { return toast(e.message); }
      if (ui.fol) {
        const r = ui.fol.requests.find((x) => x.id === id);
        ui.fol.requests = ui.fol.requests.filter((x) => x.id !== id);
        if (act === 'approve' && r) ui.fol.followers.unshift(r);
        if (act === 'remove') ui.fol.followers = ui.fol.followers.filter((x) => x.id !== id);
        if (act !== 'remove') ui.user.pending = ui.fol.requests.length;
      }
      return render();
    }
    if (a === 'toggle-pw') {
      const inp = el.parentElement.querySelector('input'); const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password'; el.innerHTML = ic(show ? 'eyeoff' : 'eye', 22); el.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha'); return;
    }
    if (a === 'go-signup') { ui.screen = 'signup'; ui.signupStep = 1; pushH(); return render(); }
    if (a === 'signup-back') { history.back(); return; }
    if (a === 'install') {
      if (installEvt) { installEvt.prompt(); try { await installEvt.userChoice; } catch { /* ignorado */ } installEvt = null; return render(); }
      if (!ui.user) { openRootModal(modalInstall()); return; }
      return openModal('install');
    }
    if (a === 'toggle-month') {
      const k = el.dataset.m;
      if (k in ui.dsel) delete ui.dsel[k]; else ui.dsel[k] = 0;
      updateDelayCal();
      if (k in ui.dsel) { const inp = document.querySelector(`.drow[data-m="${k}"] input`); if (inp) inp.focus(); }
      return;
    }
    if (a === 'dyear') { ui.dy = Math.min(new Date().getFullYear(), ui.dy + Number(el.dataset.d)); if (ui.dy < 2000) ui.dy = 2000; updateDelayCal(); return; }
    if (a === 'vote') {
      const p = findPost((x) => x.id === el.dataset.id); const i = Number(el.dataset.i);
      if (p && p.poll) {
        const pl = p.poll;
        if (pl.voted !== null && pl.voted !== undefined) { pl.options[pl.voted].n--; pl.total--; }
        if (pl.voted === i) pl.voted = null; else { pl.options[i].n++; pl.total++; pl.voted = i; }
        render();
      }
      try { await Store.vote(el.dataset.id, i); } catch (e) { toast(e.message); }
      return refresh({ quiet: true });
    }
    if (a === 'copy-link') { try { await navigator.clipboard.writeText(location.origin); toast('Link copiado.'); } catch { toast(location.origin); } return; }
    if (a === 'open-calc') return openModal('calc');
    if (a === 'open-search') { ui.sr = { q: '', type: 'tudo', res: null, busy: false }; return openModal('search'); }
    if (a === 'sr-type') { ui.sr.type = el.dataset.v; document.querySelectorAll('.srtabs button').forEach((b) => b.classList.toggle('on', b.dataset.v === ui.sr.type)); return runSearch(0); }
    if (a === 'invite') { ev.preventDefault(); return openModal('invite'); }
    if (a === 'invite-share') {
      if (navigator.share) { try { await navigator.share({ title: 'UniRad', text: INVITE() }); } catch { /* cancelado */ } return; }
      try { await navigator.clipboard.writeText(INVITE()); toast('Convite copiado. Cole no WhatsApp.'); } catch { toast(location.origin); }
      return;
    }
    if (a === 'share') {
      const data = { title: 'UniRad', text: 'UniRad: a força da radiologia unida. Entre com seu CRTR.', url: location.origin };
      if (navigator.share) { try { await navigator.share(data); } catch { /* cancelado */ } return; }
      try { await navigator.clipboard.writeText(data.url); toast('Link copiado.'); } catch { toast(data.url); }
      return;
    }
    if (a === 'load-more') {
      const last = ui.posts[ui.posts.length - 1];
      const r = await Store.posts({ scope: scopeOf(ui.view), cat: ui.cat, before: last && last.t });
      ui.posts = ui.posts.concat(r.posts); ui.more = r.more; return render();
    }
    if (a === 'go-login') { ui.screen = 'login'; pushH(); return render(); }
    if (a === 'go-welcome') { history.back(); return; }
    if (a === 'pick-region') { ui.regionPick = Number(el.dataset.id); document.getElementById('picked').innerHTML = pickedHtml(); document.getElementById('reglist').innerHTML = regionListHtml(); return; }
    if (a === 'tab') {
      const t = el.dataset.t; if (t === ui.tab) { window.scrollTo(0, 0); return; }
      if (ui.tab === 'inicio') pushH(); else if (t === 'inicio') popSilently();
      if (t === 'atrasos' && ui.view === 'seguindo') ui.view = 'mine';
      ui.tab = t; window.scrollTo(0, 0); return refresh();
    }
    if (a === 'view') { ui.view = el.dataset.v; return refresh(); }
    if (a === 'cat') { ui.cat = el.dataset.c; return refresh({ quiet: true }); }
    if (a === 'new-delay') { ui.dsel = {}; ui.dy = new Date().getFullYear(); return openModal('delay'); }
    if (a === 'new-post') { ui.postCat = 'geral'; ui.photoBlob = null; return openModal('post'); }
    if (a === 'new-poll') { ui.postCat = 'enquete'; ui.photoBlob = null; return openModal('post'); }
    if (a === 'edit-profile') return openModal('editprofile');
    if (a === 'chip') { const sel = document.getElementById(el.dataset.for); sel.value = el.dataset.v; sel.dispatchEvent(new Event('change')); el.parentElement.querySelectorAll('.chip2').forEach((b) => b.classList.toggle('on', b === el)); return; }
    if (a === 'menu-post') { const p = findPost((x) => x.id === el.dataset.id); if (p) { ui.menu = { kind: 'post', id: p.id, mine: !!p.mine, text: p.text }; openModal('menu'); } return; }
    if (a === 'menu-comment') { const p = findPost((x) => x.id === el.dataset.pid); const c = p && p.comments.find((x) => x.id === el.dataset.id); if (c) { ui.menu = { kind: 'comment', id: c.id, mine: !!c.mine, text: c.text }; openModal('menu'); } return; }
    if (a === 'menu-edit') { const m = ui.menu; ui.editPost = { type: m.kind, id: m.id, text: m.text }; ui.modal = 'edit'; return render(); }
    if (a === 'menu-report') { const m = ui.menu; closeModal(); if (confirm(m.kind === 'comment' ? 'Denunciar este comentário por ofensa ou dados de paciente?' : 'Denunciar esta publicação por ofensa ou dados de paciente?')) { await (m.kind === 'comment' ? Store.reportComment(m.id) : Store.report(m.id)); toast('Denúncia enviada. Obrigado.'); refresh({ quiet: true }); } return; }
    if (a === 'menu-delete') {
      const m = ui.menu; closeModal();
      if (confirm(m.kind === 'comment' ? 'Apagar seu comentário?' : 'Apagar sua publicação?')) { await (m.kind === 'comment' ? Store.deleteComment(m.id) : Store.deletePost(m.id)); refresh({ quiet: true }); }
      return;
    }
    if (a === 'new-photo') { ui.postCat = 'geral'; ui.photoBlob = null; openModal('post'); const pi = document.getElementById('photoIn'); if (pi) pi.click(); return; }
    if (a === 'pick-photo') { document.getElementById('photoIn').click(); return; }
    if (a === 'rm-photo') { ui.photoBlob = null; document.getElementById('photoPrev').hidden = true; document.getElementById('photoBtn').hidden = false; return; }
    if (a === 'zoom') { ui.zoomSrc = el.dataset.src; ui.zoomUid = null; return ui.modal ? openOver('zoom') : openModal('zoom'); }
    if (a === 'change-avatar') { document.getElementById('avatarIn').click(); return; }
    if (a === 'remove-avatar') { await Store.saveProfile({ avatar: '' }); ui.user.avatar = ''; return render(); }
    if (a === 'ask-delete') return openModal('delete');
    if (a === 'like') {
      const p = findPost((x) => x.id === el.dataset.id); if (!p) return;
      if (el.dataset.busy) return;
      const flip = () => { p.liked = !p.liked; p.likes = Math.max(0, p.likes + (p.liked ? 1 : -1)); el.classList.toggle('liked', p.liked); el.querySelector('span').textContent = p.likes || ''; };
      flip(); el.classList.remove('pop'); void el.offsetWidth; if (p.liked) el.classList.add('pop');
      el.dataset.busy = '1';
      try { await Store.toggleLike(p.id); if (p.liked) maybeAskPush(); } catch (e) { flip(); toast(e.message); } finally { delete el.dataset.busy; }
      return;
    }
    if (a === 'open-comments') {
      ui.cpost = el.dataset.id; ui.cAnon = !!ui.user.anon; ui.replyTo = null; ui.rep = {};
      openModal('comments'); const ci = document.getElementById('cin'); if (ci) ci.focus(); return;
    }
    if (a === 'reply') {
      ui.replyTo = { id: el.dataset.id, name: el.dataset.name };
      const rb = document.getElementById('replybar'), ci = document.getElementById('cin');
      rb.innerHTML = `<span>Respondendo a <b>${esc(el.dataset.name)}</b></span><button type="button" data-action="cancel-reply" aria-label="Cancelar resposta">${ic('x', 16)}</button>`; rb.hidden = false;
      ci.value = isAnon(el.dataset.name) ? '' : `@${el.dataset.name} `; ci.focus(); ci.setSelectionRange(ci.value.length, ci.value.length); return;
    }
    if (a === 'cancel-reply') { ui.replyTo = null; document.getElementById('replybar').hidden = true; return; }
    if (a === 'toggle-replies') { ui.rep[el.dataset.id] = !ui.rep[el.dataset.id]; return updateComments(); }
    if (a === 'toggle-canon') { ui.cAnon = !ui.cAnon; el.classList.toggle('on', ui.cAnon); const ci = document.getElementById('cin'); if (ci) ci.focus(); return; }
    if (a === 'like-comment') {
      const p = findPost((x) => x.id === ui.cpost); const c = p && p.comments.find((x) => x.id === el.dataset.id); if (!c) return;
      const flip = () => { c.liked = !c.liked; c.likes = Math.max(0, (c.likes || 0) + (c.liked ? 1 : -1)); };
      flip(); updateComments();
      try { await Store.likeComment(c.id); } catch (e) { flip(); updateComments(); toast(e.message); }
      return;
    }
    if (a === 'pick-mention') {
      const ci = document.getElementById('cin'), pos = ci.selectionStart, v = ci.value;
      const before = v.slice(0, pos).replace(/@([^\s@]*)$/, '@' + el.dataset.name + ' ');
      ci.value = before + v.slice(pos); ci.setSelectionRange(before.length, before.length);
      document.getElementById('mlist').hidden = true; ci.focus(); return;
    }
    if (a === 'report') { if (confirm('Denunciar esta publicação por ofensa ou dados de paciente?')) { await Store.report(el.dataset.id); toast('Denúncia enviada. Obrigado.'); refresh({ quiet: true }); } return; }
    if (a === 'delete-post') { if (confirm('Apagar sua publicação?')) { await Store.deletePost(el.dataset.id); refresh({ quiet: true }); } return; }
    if (a === 'logout') { await Store.logout(); resetSession(); return render(); }
  } catch (e) { toast(e.message); }
});

function resetSession() {
  ui.user = null; ui.screen = 'welcome'; ui.regionPick = null; ui.regionQuery = ''; ui.modal = null; ui.tab = 'inicio'; ui.view = 'mine'; ui.stats = null; ui.posts = null;
}

document.addEventListener('change', async (ev) => {
  const el = ev.target;
  if (el.dataset.action === 'view-select' && el.value) { ui.view = Number(el.value); refresh(); }
  if (el.id === 'avatarIn' && el.files && el.files[0]) {
    try {
      const blob = await processImage(el.files[0], 512, 0.85);
      const key = await Store.upload(blob);
      await Store.saveProfile({ avatar: key }); ui.user.avatar = key; toast('Foto atualizada.'); render();
    } catch (e) { toast(e.message); }
    el.value = ''; return;
  }
  if (el.dataset.action === 'toggle-push') {
    if (el.checked) { if (!(await enablePush())) el.checked = false; } else await disablePush();
  }
  if (el.dataset.action === 'toggle-private') {
    try { await Store.setPrivate(el.checked); ui.user.private = el.checked; if (!el.checked) ui.user.pending = 0; toast(el.checked ? 'Perfil privado ligado.' : 'Perfil público de novo.'); render(); } catch (e) { el.checked = !el.checked; toast(e.message); }
  }
  if (el.dataset.action === 'toggle-anon') {
    try { await Store.setAnon(el.checked); ui.user.anon = el.checked; } catch (e) { el.checked = !el.checked; toast(e.message); }
  }
});

document.addEventListener('submit', async (ev) => {
  const f = ev.target.closest('form[data-form]');
  if (!f) return;
  ev.preventDefault();
  const kind = f.dataset.form;
  const d = new FormData(f);
  err('');
  try {
    if (kind === 'signup1') {
      const name = String(d.get('name') || '').trim();
      const email = String(d.get('email') || '').trim();
      const password = String(d.get('password') || '');
      if (name.length < 5) return err('Digite seu nome completo.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err('Digite um e-mail válido.');
      if (password.length < 6) return err('A senha precisa ter pelo menos 6 caracteres.');
      if (password !== String(d.get('password2') || '')) return err('As senhas não são iguais. Digite de novo.');
      ui.sd = { name, email, password }; ui.signupStep = 2; pushH(); window.scrollTo(0, 0);
      return render();
    }
    if (kind === 'signup') {
      const { name, email, password } = ui.sd;
      const digits = String(d.get('crtr') || '').replace(/\D/g, '');
      const crtr = digits.padStart(5, '0') + (String(d.get('role')).startsWith('Tecnólogo') ? 'N' : 'T');
      if (digits.length < 3 || digits.length > 6) return err('Digite o número do CRTR (só os números).');
      if (!d.get('role')) return err('Escolha sua função.');
      if (!ui.regionPick) return err('Escolha a região do seu CRTR.');
      if (!d.get('terms')) return err('Aceite as regras para continuar.');
      busy(f, true);
      try { ui.user = await Store.signup({ name, email, password, crtr, role: String(d.get('role')), region: ui.regionPick, anon: !!d.get('anon') }); }
      finally { busy(f, false); }
      ui.tab = 'inicio'; ui.view = 'mine'; ui.sd = {}; window.scrollTo(0, 0);
      return refresh();
    }
    if (kind === 'login') {
      busy(f, true);
      try { ui.user = await Store.login(String(d.get('email') || '').trim(), String(d.get('password') || '')); }
      finally { busy(f, false); }
      ui.tab = 'inicio'; ui.view = 'mine';
      return refresh();
    }
    if (kind === 'delay') {
      const hospital = String(d.get('hospital') || '').trim();
      if (!hospital) return err('Informe o hospital ou a clínica.');
      const items = Object.entries(ui.dsel).map(([month, days]) => ({ month, days: Math.max(0, Math.min(31, Number(days) || 0)) }));
      if (!items.length) return err('Marque pelo menos um mês em atraso.');
      busy(f, true);
      try { await Store.addDelay({ hospital, type: String(d.get('type')), items }); }
      finally { busy(f, false); }
      if (ui.modal) { ui.modal = null; popSilently(); } toast('Relato enviado.');
      return refresh();
    }
    if (kind === 'post') {
      const text = String(d.get('text') || '').trim();
      if (text.length < 3) return err('Escreva algo na publicação.');
      const cat = String(d.get('cat'));
      const poll = cat === 'enquete' ? [1, 2, 3, 4].map((n) => String(d.get('poll' + n) || '').trim()).filter(Boolean) : null;
      if (cat === 'enquete' && poll.length < 2) return err('A enquete precisa de pelo menos 2 opções.');
      busy(f, true);
      try {
        const image = ui.photoBlob ? await Store.upload(ui.photoBlob) : null;
        ui.photoBlob = null;
        await Store.addPost({ cat, poll, image, scope: String(d.get('scope')), anon: !!d.get('anon'), text, place: cat === 'vagas' ? String(d.get('place') || '').trim() : '', salary: cat === 'vagas' ? String(d.get('salary') || '').trim() : '' });
      } finally { busy(f, false); }
      if (ui.modal) { ui.modal = null; popSilently(); }
      ui.cat = 'tudo'; ui.view = ui.view === 'brasil' || /^\d+$/.test(String(ui.view)) ? ui.view : 'mine';
      return refresh();
    }
    if (kind === 'profile') {
      const dn = String(d.get('dname') || '').trim().replace(/\s+/g, ' ');
      if (dn.length < 2) return err('Digite o nome que vai aparecer (mínimo 2 letras).');
      const p = { name: dn, bio: String(d.get('bio') || '').trim(), trainings: String(d.get('trainings') || '').trim(), experience: String(d.get('experience') || '').trim(), workplace: String(d.get('workplace') || '').trim() };
      busy(f, true);
      try { await Store.saveProfile(p); } finally { busy(f, false); }
      Object.assign(ui.user, p); toast('Perfil salvo.'); if (ui.modal === 'editprofile') closeModal();
      return refresh({ quiet: true });
    }
    if (kind === 'announce') {
      const t = String(d.get('text') || '').trim();
      if (t.length < 3) return err('Escreva o aviso.');
      busy(f, true);
      try { await Store.announce(t); } finally { busy(f, false); }
      ui.announcement = { text: t, t: Date.now() }; closeModal(); toast('Aviso publicado.'); return refresh({ quiet: true });
    }
    if (kind === 'edit') {
      const t = String(d.get('text') || '').trim();
      if (t.length < 3) return err('Escreva algo na publicação.');
      busy(f, true);
      try { await (f.dataset.type === 'comment' ? Store.editComment(f.dataset.id, t) : Store.editPost(f.dataset.id, t)); } finally { busy(f, false); }
      closeModal(); toast('Editado.'); return refresh({ quiet: true });
    }
    if (kind === 'comment') {
      const inp = document.getElementById('cin'), t = inp.value.trim(); if (!t) return;
      const p = findPost((x) => x.id === f.dataset.id); if (!p) return;
      const parent = ui.replyTo ? ui.replyTo.id : null, btn = f.querySelector('.csend');
      btn.disabled = true;
      try { await Store.addComment(p.id, t, ui.cAnon, parent); maybeAskPush(); } finally { btn.disabled = false; }
      inp.value = ''; if (parent) ui.rep[parent] = true; ui.replyTo = null; document.getElementById('replybar').hidden = true;
      const r = await Store.posts({ scope: scopeOf(ui.view), cat: ui.cat });
      const np = r.posts.find((x) => x.id === p.id); if (np) p.comments = np.comments;
      updateComments();
      const l = document.getElementById('clist'); if (l) l.scrollTop = l.scrollHeight;
      inp.focus(); return;
    }
    if (kind === 'delete') {
      busy(f, true);
      try { await Store.deleteAccount(String(d.get('password') || '')); }
      finally { busy(f, false); }
      resetSession(); toast('Conta apagada.');
      return render();
    }
  } catch (e) { err(e.message); toast(e.message); }
});

window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; if (!ui.user) render(); });
window.addEventListener('appinstalled', () => { installEvt = null; render(); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});

function showSplash() {
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const el = document.createElement('div');
  el.className = 'splash';
  el.innerHTML = emblem({ size: 300, text: true, anim: !reduce }) + '<div class="sname">UniRad</div><div class="stag">' + CONFIG.tagline + '</div>';
  if (reduce) el.querySelectorAll('.sname,.stag').forEach((n) => { n.style.opacity = 1; n.style.animation = 'none'; });
  document.body.appendChild(el);
  const svg = el.querySelector('svg');
  if (!reduce) startSmil(svg);
  let done = false;
  const close = () => { if (done) return; done = true; el.classList.add('out'); setTimeout(() => el.remove(), 400); };
  el.addEventListener('click', close);
  setTimeout(close, reduce ? 700 : 3000);
}

(async function start() {
  showSplash();
  Store = await connect();
  try { ui.user = await Store.init(); } catch { ui.user = null; }
  if (ui.user) { await refresh(); initPush(); } else render();
})();

/* menções: digitar @ mostra as pessoas da conversa */
document.addEventListener('input', (ev) => {
  if (ev.target.id !== 'cin') return;
  const ml = document.getElementById('mlist'), p = findPost((x) => x.id === ui.cpost); if (!ml || !p) return;
  const ci = ev.target, m = ci.value.slice(0, ci.selectionStart).match(/(^|\s)@([^\s@]*)$/);
  if (!m) { ml.hidden = true; return; }
  const q = m[2].toLowerCase(), list = threadNames(p).filter((n) => n.toLowerCase().includes(q)).slice(0, 5);
  if (!list.length) { ml.hidden = true; return; }
  ml.innerHTML = list.map((n) => `<button type="button" class="mrow" data-action="pick-mention" data-name="${esc(n)}">${avatar(n, null, 'sm')}<span>${esc(n)}</span></button>`).join('');
  ml.hidden = false;
});
document.addEventListener('input', (ev) => {
  if (ev.target.id === 'srq' && ui.sr) { ui.sr.q = ev.target.value; ui.sr.res = null; runSearch(); return; }
  if (ev.target.id === 'calcSal' || ev.target.id === 'calcH') {
    const c = ui.calc || (ui.calc = {});
    c.sal = document.getElementById('calcSal').value; c.h = document.getElementById('calcH').value;
    const o = document.getElementById('calcOut'); if (o) o.innerHTML = calcResult(Number(String(c.sal).replace(',', '.')), Number(c.h));
  }
});
let admT = null;
document.addEventListener('input', (ev) => {
  if (ev.target.id !== 'admq' || !ui.adm) return;
  ui.adm.q = ev.target.value; clearTimeout(admT);
  admT = setTimeout(async () => { try { ui.adm.us = (await Store.adminUsers(ui.adm.q, ui.adm.f)).users; const l = document.getElementById('admlist'); if (ui.modal === 'admin' && l) { const keep = ev.target.selectionStart; render(); const i = document.getElementById('admq'); if (i) { i.focus(); i.setSelectionRange(keep, keep); } } } catch (e) { toast(e.message); } }, 350);
});
document.addEventListener('input', (ev) => {
  const id = ev.target.id;
  if (id === 'aq') { ui.aq = ev.target.value; const l = document.getElementById('alist'); if (l) l.innerHTML = entityList(); return; }
  if (id !== 'pickName' && id !== 'pickCo') return;
  const rt = ui.rt; if (!rt) return;
  if (id === 'pickName') { rt.pname = ev.target.value; rt.placeId = null; const q = normQ(rt.pname), box = document.getElementById('pickSug'); if (box) box.innerHTML = (q.length >= 2 ? (ui.places || []).filter((p) => normQ(p.name).includes(q)).slice(0, 4) : []).map((p) => `<button type="button" class="lrow" data-action="pick-existing" data-id="${p.id}"><span><b>${esc(p.name)}</b><br><span class="muted small">${KIND_NAME[p.kind] || ''} · já avaliado</span></span>${ic('chev', 18)}</button>`).join(''); }
  else { rt.cname = ev.target.value; rt.companyId = null; const q = normQ(rt.cname), box = document.getElementById('pickCoSug'); if (box) box.innerHTML = (q.length >= 2 ? (ui.companies || []).filter((c) => normQ(c.name).includes(q)).slice(0, 4) : []).map((c) => `<button type="button" class="lrow" data-action="pick-co" data-id="${c.id}"><span><b>${esc(c.name)}</b><br><span class="muted small">Empresa · já avaliada</span></span>${ic('chev', 18)}</button>`).join(''); }
});
document.addEventListener('pointerdown', (ev) => { if (ev.target.closest('#mlist')) ev.preventDefault(); });

/* cabeçalho esconde ao descer e volta ao subir */
let lastY = 0;
window.addEventListener('scroll', () => {
  if (!ui.user || ui.modal) return;
  const y = window.scrollY, d = y - lastY;
  if (Math.abs(d) < 8) return;
  document.body.classList.toggle('hh', d > 0 && y > 120);
  lastY = y;
}, { passive: true });

/* puxar para atualizar */
(() => {
  const ind = document.createElement('div');
  ind.className = 'ptr'; ind.setAttribute('aria-hidden', 'true'); ind.innerHTML = '<i></i>';
  document.body.appendChild(ind);
  let y0 = null, pull = 0, busy = false;
  const reset = () => { ind.style.transition = 'transform .2s, opacity .2s'; ind.style.transform = 'translate(-50%,-50px)'; ind.style.opacity = 0; ind.classList.remove('spin'); y0 = null; pull = 0; };
  document.addEventListener('touchstart', (e) => {
    if (busy || e.touches.length !== 1 || window.scrollY > 0 || !ui.user || ui.modal || (ui.tab !== 'inicio' && ui.tab !== 'atrasos')) { y0 = null; return; }
    y0 = e.touches[0].clientY; ind.style.transition = 'none';
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (y0 === null) return;
    const d = e.touches[0].clientY - y0;
    if (d <= 0) { y0 = null; reset(); return; }
    pull = Math.min(d * 0.5, 90);
    ind.style.transform = `translate(-50%,${pull - 50}px)`; ind.style.opacity = Math.min(1, pull / 60);
  }, { passive: true });
  document.addEventListener('touchend', async () => {
    if (y0 === null) return;
    if (pull >= 60) {
      busy = true; ind.classList.add('spin'); ind.style.transform = 'translate(-50%,16px)';
      try { await refresh({ quiet: true }); } catch { /* sem rede */ }
      busy = false;
    }
    reset();
  });
})();

document.addEventListener('input', (ev) => {
  const row = ev.target.closest && ev.target.closest('.drow');
  if (row && ev.target.tagName === 'INPUT') ui.dsel[row.dataset.m] = Math.max(0, Math.min(31, Number(ev.target.value) || 0));
});
