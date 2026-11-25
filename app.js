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
const ic = (n, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
const CATS = { geral: 'Geral', vagas: 'Vagas', cursos: 'Cursos', enquete: 'Enquete' };

const CAT_NAME = { geral: 'Geral', vagas: 'Vaga', cursos: 'Curso', enquete: 'Enquete', direitos: 'Direitos' };
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
    <label class="vmore ${isOther ? 'on' : ''}"><span>${isOther ? esc(viewName(ui.view)) + ' ▾' : '▾'}</span><select data-action="view-select" aria-label="Ver outra região"><option value="">Outra região</option>${other}</select></label>
  </div>`;
  }
  return `<div class="vtabs">
    <button class="${ui.view === 'mine' ? 'on' : ''}" data-action="view" data-v="mine"><span>Minha região</span></button>
    <button class="${ui.view === 'brasil' ? 'on' : ''}" data-action="view" data-v="brasil"><span>Brasil todo</span></button>
    <label class="${isOther ? 'on' : ''}"><span>${isOther ? esc(viewName(ui.view)) : 'Outra região'} ▾</span><select data-action="view-select" aria-label="Ver outra região"><option value="">Outra região</option>${other}</select></label>
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

function postCard(p) {
  return `<article class="post">
    <div class="pcol">${avBtn(p.author, p.authorAvatar, p.authorId)}</div>
    <div class="pmain">
      <div class="phead">
        <div class="pwho"><span class="name">${p.authorId ? `<button class="linkname" data-action="view-user" data-id="${p.authorId}">${esc(p.author)}</button>` : esc(p.author)}</span>
          <span class="muted small"> · ${esc(regionLabel(p.region).split(' · ')[0])} · ${ago(p.t)}</span>
          ${p.sample ? '<span class="tag">exemplo</span>' : ''}${p.mine && isAnon(p.author) ? '<span class="tag you">só você sabe</span>' : ''}</div>
        <button class="more" data-action="menu-post" data-id="${p.id}" aria-label="Mais opções">${ic('dots', 20)}</button>
      </div>
      ${p.cat !== 'geral' ? `<span class="chip c-${p.cat}">${CATS[p.cat]}</span>` : ''}
      <p class="body">${esc(p.text).replace(/\n/g, '<br>')}</p>
      ${p.image ? `<button class="pimgwrap" data-action="zoom" data-src="${esc(imgUrl(p.image))}" aria-label="Ampliar foto"><img class="pimg" src="${imgUrl(p.image)}" alt="Foto da publicação" loading="lazy" decoding="async"></button>` : ''}
      ${pollHtml(p)}
      ${p.place || p.salary ? `<div class="meta">${p.place ? `<span>${ic('briefcase', 14)} ${esc(p.place)}</span>` : ''}${p.salary ? `<span>Salário: ${esc(p.salary)}</span>` : ''}</div>` : ''}
      <div class="actions">
        <button class="act ${p.liked ? 'liked' : ''}" data-action="like" data-id="${p.id}" aria-label="Curtir">${ic('bolt', 21)}<span>${p.likes || ''}</span></button>
        <button class="act" data-action="open-comments" data-id="${p.id}" aria-label="Comentários">${ic('msg', 20)}<span>${p.comments.length || ''}</span></button>
        <button class="act" data-action="share" data-id="${p.id}" aria-label="Compartilhar">${ic('share', 20)}</button>
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
function mentionHtml(text, names) {
  const h = esc(text).replace(/\n/g, '<br>');
  const alt = names.slice().sort((x, y) => y.length - x.length).map((n) => rxEsc(esc(n))).join('|');
  return h.replace(new RegExp('@(' + (alt ? alt + '|' : '') + '[\\p{L}\\d_]+)', 'gu'), '<span class="mention">@$1</span>');
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
      <div class="ccol">${c.mine && api ? `<button class="more cmore" data-action="menu-comment" data-pid="${p.id}" data-id="${c.id}" aria-label="Opções do comentário">${ic('dots', 18)}</button>` : ''}${api ? `<button class="clike ${c.liked ? 'liked' : ''}" data-action="like-comment" data-id="${c.id}" aria-label="Curtir comentário">${ic('bolt', 20)}<span>${c.likes || ''}</span></button>` : ''}</div>
    </div>${!isRep && ui.rep[c.id] ? rs.map((r) => one(r, true)).join('') : ''}`;
  };
  return tops.map((c) => one(c, false)).join('') || '<div class="muted center pad8">Seja o primeiro a comentar.</div>';
}
function modalComments() {
  const p = (ui.posts || []).find((x) => x.id === ui.cpost);
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
  const p = (ui.posts || []).find((x) => x.id === ui.cpost), l = document.getElementById('clist');
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
  return `<div class="overlay" data-action="close-modal"><div class="sheet" role="dialog" aria-label="${esc(title)}" data-stop="1">
    <div class="row between"><h3>${esc(title)}</h3><button class="ghost" data-action="close-modal" aria-label="Fechar">${ic('x')}</button></div>${inner}</div></div>`;
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
    <ul class="points">
      <li>${ic('check', 20)} Só quem tem CRTR entra</li>
      <li>${ic('check', 20)} Relatos anônimos se quiser</li>
      <li>${ic('check', 20)} Sua região e o Brasil todo</li>
    </ul>
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
  return `<div class="stories">${SHORTCUTS.filter(([k]) => k !== 'enquete' || Store.mode === 'api').map(([k, i, l]) => {
    const on = k === 'atrasos' ? false : ui.cat === k;
    return `<button class="story s-${k} ${on ? 'on' : ''}" data-action="${k === 'atrasos' ? 'tab' : 'cat'}" ${k === 'atrasos' ? 'data-t="atrasos"' : `data-c="${k}"`}><span class="ring"><span class="in">${ic(i, 22)}</span></span><span class="lbl">${l}</span></button>`;
  }).join('')}</div>`;
}

function screenHome() {
  return `<main class="feed">
    ${shortcuts()}
    ${viewSwitch(Store.mode === 'api')}
    ${composer()}
    ${!ui.posts ? loadingBox : ui.posts.map(postCard).join('') || (ui.view === 'seguindo' ? '<p class="muted center pad8">Você ainda não segue ninguém. Toque no nome de um colega e escolha Seguir para ver as publicações dele aqui.</p>' : '<p class="muted center pad8">Nada por aqui ainda. Seja o primeiro a publicar.</p>')}
    ${ui.more ? '<button class="btn out" data-action="load-more">Ver mais publicações</button>' : ''}
  </main>`;
}

const fmtMonth = (m) => { const [y, mo] = String(m || '').split('-'); return MES[Number(mo) - 1] ? `${MES[Number(mo) - 1]}/${y}` : ''; };
function screenDelays() {
  if (!ui.stats) return `<main class="pad">${viewSwitch()}${loadingBox}</main>`;
  const { members, national, delays } = ui.stats;
  const MARCOS = [100, 500, 1000, 5000, 10000, 50000];
  const meta = MARCOS.find((m) => national < m) || MARCOS[MARCOS.length - 1];
  const showBar = national >= 50;
  const pct = Math.min(100, Math.round((national / meta) * 100));
  return `<main class="pad">
    ${viewSwitch()}
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
    <button class="btn big" data-action="new-delay">${ic('plus', 18)} Relatar atraso</button>
    ${delays.recent && delays.recent.length ? `<h3 class="sec">Relatos recentes</h3><div class="list">${delays.recent.map((r) => `<div class="lrow static"><span>${esc(r.type)}${r.days ? ` · ${r.days} dias` : ''}${r.months > 1 ? ` · ${r.months} meses` : ''}<br><span class="muted small">${ago(r.t)}</span></span><b class="redtxt">${esc(fmtMonth(r.month))}</b></div>`).join('')}</div>` : ''}
    ${delays.top.length ? `<div class="card"><div class="small muted">Locais mais citados</div>${delays.top.map((t) => `<div class="row between li"><span>${esc(t.hospital)}</span><b>${t.n} relatos</b></div>`).join('')}</div>`
      : `<p class="muted small">Locais aparecem aqui quando houver ao menos ${CONFIG.hideHospitalBelow} relatos sobre o mesmo, para proteger quem relata.</p>`}
  </main>`;
}

const RIGHTS = [
  ['Jornada de trabalho', 'A Lei 7.394/1985 prevê jornada de 24 horas semanais para os profissionais das técnicas radiológicas. Se o seu contrato é diferente, anote horários e guarde comprovantes.'],
  ['Piso salarial', 'A mesma lei fala em salário mínimo profissional equivalente a 2 salários mínimos. Como esse piso é aplicado hoje é debatido na Justiça, então confirme com advogado trabalhista ou com o CRTR antes de cobrar.'],
  ['Adicional de risco e insalubridade', 'A lei prevê adicional de 40% sobre o vencimento. Verifique no seu contracheque se ele aparece.'],
  ['Salário atrasado: o que fazer', 'Guarde contracheques, extratos e mensagens. Registre o relato aqui no mural e procure orientação do CRTR, do Ministério Público do Trabalho ou de um advogado trabalhista.']
];
function screenRights() {
  return `<main class="pad"><h2>Direitos</h2>
    <p class="muted small">Informativo geral, não é aconselhamento jurídico. Confira sempre o texto atual da lei.</p>
    <div class="list">${RIGHTS.map(([t, b]) => `<details class="acc2"><summary><span>${esc(t)}</span>${ic('chev', 18)}</summary><p>${esc(b)}</p></details>`).join('')}</div>
  </main>`;
}

function profileForm(u) {
  return `<form data-form="profile" novalidate>
      <label>Nome que aparece no app <i class="req">*</i><input name="dname" maxlength="40" required placeholder="Ex.: Deryck Bento" value="${esc(u.name)}"></label>
      <p class="muted small" style="margin-top:-4px">Pode ser só o primeiro nome, um apelido ou como preferir. Troca também nas suas publicações antigas (as anônimas continuam anônimas).</p>
      <p class="muted small">O resto é opcional. Só aparece para os outros membros quando você posta sem anonimato e alguém toca no seu nome. Seu CRTR, e-mail e senha nunca aparecem.</p>
      <label>Apresentação<input name="bio" maxlength="160" placeholder="Ex.: Técnico em radiologia há 8 anos, em Manaus" value="${esc(u.bio || '')}"></label>
      <label>Capacitações<textarea name="trainings" rows="3" maxlength="500" placeholder="Cursos e treinamentos (tomografia, ressonância, radioproteção…)">${esc(u.trainings || '')}</textarea></label>
      <label>Experiências<textarea name="experience" rows="3" maxlength="500" placeholder="Onde já atuou e em quais áreas">${esc(u.experience || '')}</textarea></label>
      <div class="error" id="formError" role="alert"></div>
      <div class="row gap8 stickybtns"><button type="button" class="btn out" data-action="close-modal">Cancelar</button><button class="btn" style="flex:2" type="submit">Salvar</button></div>
    </form>`;
}
function modalEditProfile() { return sheet('Editar perfil', profileForm(ui.user)); }
function screenProfile() {
  const u = ui.user, api = Store.mode === 'api';
  const row = (act, label, cls = '') => `<button class="lrow ${cls}" data-action="${act}"><span>${label}</span>${ic('chev', 18)}</button>`;
  return `<main class="prof">
    <section class="phero">
      <div class="avwrap">${avatar(u.name, u.avatar, 'xl')}${api ? `<input type="file" id="avatarIn" accept="image/*" hidden><button class="avedit" data-action="change-avatar" aria-label="Trocar foto">${ic('camera', 16)}</button>` : ''}</div>
      <h2 class="pname">${esc(u.name)}</h2>
      <div class="muted">${esc(u.role)} · ${esc(regionLabel(u.region).split(' · ')[0])}</div>
      ${u.bio ? `<p class="pbio">${esc(u.bio)}</p>` : ''}
      ${api && u.posts !== undefined ? `<div class="pstats"><div><b>${u.posts}</b><span>${u.posts === 1 ? 'post' : 'posts'}</span></div><div><b>${u.bolts}</b><span>${u.bolts === 1 ? 'raio' : 'raios'}</span></div></div>` : ''}
      <div class="prow"><button class="btn out" data-action="edit-profile">Editar perfil</button><button class="btn out" data-action="invite">Convidar</button></div>
    </section>
    <div class="list">
      <label class="lrow"><span>Começar posts como anônimo</span><input type="checkbox" class="sw" data-action="toggle-anon" ${u.anon ? 'checked' : ''}></label>
      ${api ? `<label class="lrow"><span>Perfil privado<small class="muted">Só quem você aprovar vê sua bio e publicações.</small></span><input type="checkbox" class="sw" data-action="toggle-private" ${u.private ? 'checked' : ''}></label>
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
    : '<p class="muted small">Nenhuma publicação aberta ainda.</p>';
  return sheet(u.name, `<div class="uhero">${big}${who}
    ${u.bio ? `<div class="ubio">${esc(u.bio)}</div>` : ''}
    <div class="ustats"><div><b>${u.posts}</b><span>posts</span></div><div><b id="ufollowers">${u.followers}</b><span>seguidores</span></div><div><b>${u.following}</b><span>seguindo</span></div></div>
    ${followBtn(u)}
  </div>
  ${u.trainings || u.experience ? `<details class="udet"><summary>Ver capacitações e experiências</summary>${blk('Capacitações', u.trainings)}${blk('Experiências', u.experience)}</details>` : ''}
  ${has ? '' : '<p class="muted small center">Esse profissional ainda não preencheu o perfil.</p>'}
  <h4 class="usec">Publicações</h4><div id="uposts">${list}</div>`);
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
    <div class="chips" role="group" aria-label="Tipo">${[['geral', 'Geral'], ['vagas', 'Vaga'], ['cursos', 'Curso'], ['enquete', 'Enquete']].map(([v, l]) => `<button type="button" class="chip2 ${c === v ? 'on' : ''}" data-action="chip" data-for="catSel" data-v="${v}">${l}</button>`).join('')}</div>
    <select name="cat" id="catSel" hidden><option value="geral" ${c === 'geral' ? 'selected' : ''}>Geral</option><option value="vagas" ${c === 'vagas' ? 'selected' : ''}>Vaga</option><option value="cursos" ${c === 'cursos' ? 'selected' : ''}>Curso / capacitação</option>${Store.mode === 'api' ? `<option value="enquete" ${c === 'enquete' ? 'selected' : ''}>Enquete</option>` : ''}</select>
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
  return `<header class="top"><div class="row gap8">${logo(30)}<b class="brand">UniRad</b></div><button class="ghost" data-action="invite" aria-label="Convidar colegas">${ic('share', 22)}</button></header>`;
}
/* ---- botão voltar do celular: volta uma tela dentro do app ---- */
const pushH = () => { try { history.pushState({ u: 1 }, ''); } catch { /* ignorado */ } };
const popSilently = () => { ui.skipPop = 1; history.back(); };
function openModal(m) { ui.modal = m; pushH(); render(); }
function openOver(m) { (ui.stk = ui.stk || []).push(ui.modal); openModal(m); }
function backModal() { if (ui.modal === 'zoom' || ui.modal === 'user') return (ui.stk || []).pop() || null; return (ui.modal === 'menu' || ui.modal === 'edit') && ui.menu && ui.menu.kind === 'comment' && ui.cpost ? 'comments' : null; }
function closeModal() { if (ui.modal) { ui.modal = backModal(); popSilently(); } render(); }
function openRootModal(html) { document.getElementById('modalRoot').innerHTML = html; ui.rootModal = true; pushH(); }
function closeRootModal() { document.getElementById('modalRoot').innerHTML = ''; if (ui.rootModal) { ui.rootModal = false; popSilently(); } }
window.addEventListener('popstate', () => {
  if (ui.skipPop) { ui.skipPop = 0; return; }
  if (ui.rootModal) { document.getElementById('modalRoot').innerHTML = ''; ui.rootModal = false; return; }
  if (ui.modal) { ui.modal = backModal(); return render(); }
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
  document.body.classList.toggle('noscroll', ui.modal === 'comments' || ui.modal === 'menu' || ui.modal === 'user' || ui.modal === 'zoom');
  if (!ui.user) {
    $app.innerHTML = ui.screen === 'signup' ? screenSignup() : ui.screen === 'login' ? screenLogin() : screenWelcome();
    bindSignup();
    return;
  }
  const body = { inicio: screenHome, atrasos: screenDelays, direitos: screenRights, perfil: screenProfile }[ui.tab]();
  const modal = ui.modal === 'delay' ? modalDelay() : ui.modal === 'post' ? modalPost() : ui.modal === 'terms' ? sheet('Regras do UniRad', TERMS) : ui.modal === 'delete' ? modalDeleteAccount() : ui.modal === 'install' ? modalInstall() : ui.modal === 'user' && ui.viewUser ? modalUser() : ui.modal === 'followers' ? modalFollowers() : ui.modal === 'edit' && ui.editPost ? sheet(ui.editPost.type === 'comment' ? 'Editar comentário' : 'Editar publicação', `<form data-form="edit" data-type="${ui.editPost.type}" data-id="${ui.editPost.id}" novalidate><label>Texto<textarea name="text" rows="${ui.editPost.type === 'comment' ? 3 : 6}" maxlength="${ui.editPost.type === 'comment' ? 300 : 800}" required>${esc(ui.editPost.text)}</textarea></label>${ui.editPost.type === 'comment' ? '' : '<p class="muted small">Só o texto pode ser editado. Foto e enquete continuam como estão.</p>'}<div class="error" id="formError" role="alert"></div><div class="row gap8"><button type="button" class="btn out" data-action="close-modal">Cancelar</button><button class="btn" type="submit">Salvar</button></div></form>`) : ui.modal === 'comments' ? modalComments() : ui.modal === 'editprofile' ? modalEditProfile() : ui.modal === 'menu' && ui.menu ? menuSheet() : ui.modal === 'zoom' ? `<div class="overlay zoom" data-action="close-modal"><img src="${esc(ui.zoomSrc)}" alt="Foto ampliada">${ui.zoomUid ? `<button class="zprof" data-action="zoom-profile" data-id="${ui.zoomUid}">Ver perfil</button>` : ''}<button class="zclose" data-action="close-modal" aria-label="Fechar">${ic('x', 26)}</button></div>` : '';
  $app.innerHTML = `<div class="shell">${nav()}<div class="col">${header()}${body}</div></div>${modal}`;
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
      ui.posts = posts.posts; ui.more = posts.more;
    } else if (ui.tab === 'atrasos') {
      const stats = await Store.stats(scope);
      if (seq !== ui.seq) return;
      ui.stats = stats;
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
function bindSheetDrag(sid, scrollId) {
  const s = document.getElementById(sid); if (!s) return;
  const sc = scrollId ? document.getElementById(scrollId) : null;
  let y0 = null, dy = 0, active = false;
  s.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1 || e.target.closest('.cform, .mlist')) { y0 = null; return; }
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
  bindSheetDrag('msheet'); bindSheetDrag('csheet', 'clist'); fitSheet();
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
    const hint = () => { document.getElementById('anonHint').textContent = ac.checked ? 'Aparece como "Profissional anônimo". Os colegas não saberão que foi você.' : `Aparece com seu nome: ${ui.user.name}`; };
    ac.addEventListener('change', hint); hint();
  }
  const c = document.getElementById('catSel');
  if (c) c.addEventListener('change', () => {
    document.getElementById('vagaExtra').hidden = c.value !== 'vagas';
    document.getElementById('pollExtra').hidden = c.value !== 'enquete';
    document.getElementById('textLabel').textContent = c.value === 'enquete' ? 'Pergunta' : 'Texto';
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
      try { await Store.follow(u.id); } catch (e) { u.state = prev.state; u.followers = prev.followers; render(); toast(e.message); return; }
      if (ui.tab === 'inicio' && ui.view === 'seguindo') refresh({ quiet: true });
      return;
    }
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
      const p = (ui.posts || []).find((x) => x.id === el.dataset.id); const i = Number(el.dataset.i);
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
    if (a === 'invite') {
      ev.preventDefault();
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
    if (a === 'menu-post') { const p = (ui.posts || []).find((x) => x.id === el.dataset.id); if (p) { ui.menu = { kind: 'post', id: p.id, mine: !!p.mine, text: p.text }; openModal('menu'); } return; }
    if (a === 'menu-comment') { const p = (ui.posts || []).find((x) => x.id === el.dataset.pid); const c = p && p.comments.find((x) => x.id === el.dataset.id); if (c) { ui.menu = { kind: 'comment', id: c.id, mine: true, text: c.text }; openModal('menu'); } return; }
    if (a === 'menu-edit') { const m = ui.menu; ui.editPost = { type: m.kind, id: m.id, text: m.text }; ui.modal = 'edit'; return render(); }
    if (a === 'menu-report') { const m = ui.menu; closeModal(); if (confirm('Denunciar esta publicação por ofensa ou dados de paciente?')) { await Store.report(m.id); toast('Denúncia enviada. Obrigado.'); refresh({ quiet: true }); } return; }
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
      const p = (ui.posts || []).find((x) => x.id === el.dataset.id); if (!p) return;
      if (el.dataset.busy) return;
      const flip = () => { p.liked = !p.liked; p.likes = Math.max(0, p.likes + (p.liked ? 1 : -1)); el.classList.toggle('liked', p.liked); el.querySelector('span').textContent = p.likes || ''; };
      flip(); el.classList.remove('pop'); void el.offsetWidth; if (p.liked) el.classList.add('pop');
      el.dataset.busy = '1';
      try { await Store.toggleLike(p.id); } catch (e) { flip(); toast(e.message); } finally { delete el.dataset.busy; }
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
      const p = (ui.posts || []).find((x) => x.id === ui.cpost); const c = p && p.comments.find((x) => x.id === el.dataset.id); if (!c) return;
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
      const p = { name: dn, bio: String(d.get('bio') || '').trim(), trainings: String(d.get('trainings') || '').trim(), experience: String(d.get('experience') || '').trim() };
      busy(f, true);
      try { await Store.saveProfile(p); } finally { busy(f, false); }
      Object.assign(ui.user, p); toast('Perfil salvo.'); if (ui.modal === 'editprofile') closeModal();
      return refresh({ quiet: true });
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
      const p = (ui.posts || []).find((x) => x.id === f.dataset.id); if (!p) return;
      const parent = ui.replyTo ? ui.replyTo.id : null, btn = f.querySelector('.csend');
      btn.disabled = true;
      try { await Store.addComment(p.id, t, ui.cAnon, parent); } finally { btn.disabled = false; }
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
  let seen = false;
  try { seen = !!localStorage.getItem('unirad_seen'); localStorage.setItem('unirad_seen', '1'); } catch { /* sem armazenamento */ }
  const reduce = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || seen;
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
  setTimeout(close, reduce ? 700 : 4700);
}

(async function start() {
  showSplash();
  Store = await connect();
  try { ui.user = await Store.init(); } catch { ui.user = null; }
  if (ui.user) await refresh(); else render();
})();

/* menções: digitar @ mostra as pessoas da conversa */
document.addEventListener('input', (ev) => {
  if (ev.target.id !== 'cin') return;
  const ml = document.getElementById('mlist'), p = (ui.posts || []).find((x) => x.id === ui.cpost); if (!ml || !p) return;
  const ci = ev.target, m = ci.value.slice(0, ci.selectionStart).match(/(^|\s)@([^\s@]*)$/);
  if (!m) { ml.hidden = true; return; }
  const q = m[2].toLowerCase(), list = threadNames(p).filter((n) => n.toLowerCase().includes(q)).slice(0, 5);
  if (!list.length) { ml.hidden = true; return; }
  ml.innerHTML = list.map((n) => `<button type="button" class="mrow" data-action="pick-mention" data-name="${esc(n)}">${avatar(n, null, 'sm')}<span>${esc(n)}</span></button>`).join('');
  ml.hidden = false;
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
