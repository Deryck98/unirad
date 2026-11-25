import { CONFIG, REGIONS, DELAY_TYPES, regionLabel } from './data.js';
import { connect } from './store.js';
import { emblem, startSmil } from './emblem.js';

const $app = document.getElementById('app');
let Store = null;
const ui = { tab: 'inicio', view: 'mine', cat: 'tudo', modal: null, open: {}, regionQuery: '', regionPick: null, anonDefault: true, user: null, screen: 'welcome', stats: null, posts: null, loading: false, seq: 0 };

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
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'
};
const ic = (n, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
const CATS = { geral: 'Geral', vagas: 'Vagas', cursos: 'Cursos' };

const scopeOf = (v) => (v === 'mine' ? ui.user.region : v === 'brasil' ? 'brasil' : Number(v));
const viewName = (v) => (v === 'mine' ? regionLabel(ui.user.region).split(' · ')[0] : v === 'brasil' ? 'Brasil todo' : regionLabel(v).split(' · ')[0]);

/* ---------- componentes ---------- */
function viewSwitch() {
  const other = REGIONS.filter((r) => r.id !== ui.user.region)
    .map((r) => `<option value="${r.id}" ${String(ui.view) === String(r.id) ? 'selected' : ''}>${esc(r.name)}${r.states ? ' · ' + esc(r.states) : ''}</option>`).join('');
  const isOther = /^\d+$/.test(String(ui.view));
  return `<div class="switch">
    <button class="seg ${ui.view === 'mine' ? 'on' : ''}" data-action="view" data-v="mine">Minha região</button>
    <button class="seg ${ui.view === 'brasil' ? 'on' : ''}" data-action="view" data-v="brasil">Brasil todo</button>
    <select class="seg sel ${isOther ? 'on' : ''}" data-action="view-select" aria-label="Ver outra região"><option value="">Outra região</option>${other}</select>
  </div>`;
}

function postCard(p) {
  const open = ui.open[p.id];
  return `<article class="card post">
    <div class="row between">
      <div class="row gap8"><div class="avatar">${ic('user', 16)}</div>
        <div><div class="name">${esc(p.author)}${p.sample ? ' <span class="tag">exemplo</span>' : ''}</div>
        <div class="muted small">${esc(regionLabel(p.region).split(' · ')[0])} · ${ago(p.t)}</div></div></div>
      <span class="chip c-${p.cat}">${CATS[p.cat]}</span>
    </div>
    <p class="body">${esc(p.text).replace(/\n/g, '<br>')}</p>
    ${p.place || p.salary ? `<div class="meta">${p.place ? `<span>${ic('briefcase', 14)} ${esc(p.place)}</span>` : ''}${p.salary ? `<span>Salário: ${esc(p.salary)}</span>` : ''}</div>` : ''}
    <div class="row gap16 act">
      <button class="ghost ${p.liked ? 'liked' : ''}" data-action="like" data-id="${p.id}" aria-label="Curtir">${ic('heart', 18)} ${p.likes}</button>
      <button class="ghost" data-action="toggle-comments" data-id="${p.id}" aria-label="Comentários">${ic('msg', 18)} ${p.comments.length}</button>
      ${p.mine ? `<button class="ghost right" data-action="delete-post" data-id="${p.id}" aria-label="Apagar minha publicação">${ic('x', 18)}</button>` : `<button class="ghost right" data-action="report" data-id="${p.id}" aria-label="Denunciar">${ic('flag', 16)}</button>`}
    </div>
    ${open ? `<div class="comments">${p.comments.map((c) => `<div class="cm"><b>${esc(c.author)}</b> <span class="muted small">${ago(c.t)}</span><div>${esc(c.text)}</div></div>`).join('') || '<div class="muted small">Seja o primeiro a comentar.</div>'}
      <form class="row gap8" data-form="comment" data-id="${p.id}"><input name="t" maxlength="300" placeholder="Escreva um comentário" required autocomplete="off"><button class="btn small" type="submit">Enviar</button></form></div>` : ''}
  </article>`;
}

function sheet(title, inner) {
  return `<div class="overlay" data-action="close-modal"><div class="sheet" role="dialog" aria-label="${esc(title)}" data-stop="1">
    <div class="row between"><h3>${esc(title)}</h3><button class="ghost" data-action="close-modal" aria-label="Fechar">${ic('x')}</button></div>${inner}</div></div>`;
}

const TERMS = `<ul class="rules">
  <li><b>Nada de dados de pacientes:</b> não publique nomes, exames, laudos ou imagens. Isso é sigilo profissional e é protegido pela LGPD.</li>
  <li><b>Relate fatos, sem ofensa:</b> diga o que aconteceu (ex.: "salário de outubro atrasado"). Não xingue nem acuse sem prova.</li>
  <li><b>Documentos:</b> se mostrar contracheque ou comprovante, cubra dados que não sejam seus.</li>
  <li><b>Seu número do CRTR, e-mail e senha</b> ficam em sigilo e não aparecem para ninguém. Em posts anônimos, nem o seu nome aparece.</li>
  <li>Posts denunciados por várias pessoas são ocultados.</li>
  <li>Você pode apagar sua conta e seus dados quando quiser, no Perfil.</li>
  <li>O UniRad é um espaço de união da categoria e não substitui orientação de advogado ou do CRTR.</li></ul>`;

const loadingBox = '<div class="center muted pad8" role="status">Carregando…</div>';

/* ---------- telas ---------- */
function screenWelcome() {
  return `<main class="welcome">
    <div class="wlogo">${emblem({ size: 170, text: false })}</div>
    <h1>UniRad</h1>
    <p class="lead">${CONFIG.tagline}</p>
    <p class="muted center">A rede dos técnicos e tecnólogos em radiologia. Aqui a gente se une, mostra a realidade da categoria e luta por piso, jornada e salário em dia.</p>
    <ul class="points">
      <li>${ic('check', 20)} Só quem tem CRTR entra</li>
      <li>${ic('check', 20)} Relatos de atraso, anônimos se quiser</li>
      <li>${ic('check', 20)} Sua região e o Brasil todo</li>
    </ul>
    <button class="btn big" data-action="go-signup">Criar meu cadastro</button>
    ${Store.mode === 'api' ? '<button class="btn out" data-action="go-login">Já tenho conta</button>' : ''}
    ${Store.mode === 'demo' ? '<p class="muted small center">Versão de demonstração: os dados ficam só neste aparelho.</p>' : ''}
  </main>`;
}

function screenLogin() {
  return `<main class="pad">
    <button class="ghost back" data-action="go-welcome">← Voltar</button>
    <h2>Entrar</h2>
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
  return `<main class="pad">
    <button class="ghost back" data-action="go-welcome">← Voltar</button>
    <h2>Criar cadastro</h2>
    <p class="muted">Só profissionais da radiologia. Leva 1 minuto.</p>
    <form data-form="signup" novalidate>
      <label>Nome completo <i class="req">*</i><input name="name" autocomplete="name" required minlength="5" placeholder="Seu nome"></label>
      <label>E-mail <i class="req">*</i><input name="email" type="email" autocomplete="email" required placeholder="voce@email.com"></label>
      <label>Senha <i class="req">*</i><span class="pwbox"><input name="password" type="password" autocomplete="new-password" required minlength="6" placeholder="Mínimo 6 caracteres"><button type="button" class="eye" data-action="toggle-pw" aria-label="Mostrar senha">${ic('eye', 22)}</button></span></label>
      <label>Confirmar senha <i class="req">*</i><span class="pwbox"><input name="password2" type="password" autocomplete="new-password" required minlength="6" placeholder="Repita a senha"><button type="button" class="eye" data-action="toggle-pw" aria-label="Mostrar senha">${ic('eye', 22)}</button></span></label>
      <label>Função <i class="req">*</i>
        <select name="role" id="roleSel" required><option value="">Selecione</option><option>Técnico em Radiologia</option><option>Tecnólogo em Radiologia</option></select></label>
      <div class="field">Número do CRTR <i class="req">*</i>
        <div class="crtrbox"><input name="crtr" id="crtrIn" inputmode="numeric" autocomplete="off" required maxlength="6" placeholder="00000" style="width:calc(5ch + 16px)" aria-label="Número do CRTR, só os números"><span id="crtrLetter">T</span></div>
        <div class="muted small">Digite só os números. A letra (T para técnico, N para tecnólogo) entra sozinha.</div></div>
      <div class="field">Região do seu CRTR <i class="req">*</i>
        <div class="search">${ic('search', 18)}<input id="regionSearch" value="${esc(ui.regionQuery)}" placeholder="Busque: 19, Amazonas, Pará…" autocomplete="off"></div>
        <div class="picked" id="picked">${pickedHtml()}</div>
        <div class="reglist" id="reglist">${regionListHtml()}</div>
      </div>
      <label class="check"><input type="checkbox" name="anon" ${ui.anonDefault ? 'checked' : ''}><span>Postar como anônimo por padrão <span class="muted small">(você escolhe em cada post)</span></span></label>
      <label class="check"><input type="checkbox" name="terms" required><span>Li e aceito as <a href="#" data-action="show-terms">regras do UniRad</a> <i class="req">*</i></span></label>
      <div class="error" id="formError" role="alert"></div>
      <button class="btn big" type="submit">Criar cadastro</button>
    </form>
  </main>`;
}

function screenHome() {
  if (!ui.stats || !ui.posts) return `<main class="pad">${viewSwitch()}${loadingBox}</main>`;
  const { members, national, delays } = ui.stats;
  const pct = Math.min(100, Math.round((national / CONFIG.goalMembers) * 100));
  const recent = ui.posts.slice(0, 2);
  return `<main class="pad">
    ${viewSwitch()}
    <section class="hero">
      <div class="small">Profissionais unidos · ${esc(viewName(ui.view))}</div>
      <div class="big-n">${members.toLocaleString('pt-BR')}</div>
      <div class="small">Meta do Brasil: ${CONFIG.goalMembers.toLocaleString('pt-BR')} (${national.toLocaleString('pt-BR')} hoje)</div>
      <div class="bar"><i style="width:${pct}%"></i></div>
    </section>
    <h3 class="sec">Mural de atrasos</h3>
    <div class="grid2">
      <div class="stat red"><div class="small">Relatos</div><div class="n">${delays.total}</div></div>
      <div class="stat amber"><div class="small">Atraso médio</div><div class="n">${delays.avgDays ? delays.avgDays + ' dias' : '—'}</div></div>
    </div>
    ${delays.top.length ? `<div class="card"><div class="small muted">Locais mais citados</div>${delays.top.map((t) => `<div class="row between li"><span>${esc(t.hospital)}</span><b>${t.n} relatos</b></div>`).join('')}</div>`
      : `<p class="muted small">Locais aparecem aqui quando houver ao menos ${CONFIG.hideHospitalBelow} relatos sobre o mesmo, para proteger quem relata.</p>`}
    <button class="btn big" data-action="new-delay">${ic('plus', 18)} Relatar atraso</button>
    <h3 class="sec">Na comunidade</h3>
    ${recent.map(postCard).join('') || '<p class="muted">Ainda não há publicações aqui. Seja o primeiro.</p>'}
  </main>`;
}

function screenFeed() {
  return `<main class="pad">
    ${viewSwitch()}
    <div class="chips">${['tudo', 'geral', 'vagas', 'cursos'].map((c) => `<button class="chip btnchip ${ui.cat === c ? 'on' : ''}" data-action="cat" data-c="${c}">${c === 'tudo' ? 'Tudo' : CATS[c]}</button>`).join('')}</div>
    <button class="btn big" data-action="new-post">${ic('plus', 18)} Nova publicação</button>
    ${!ui.posts ? loadingBox : ui.posts.map(postCard).join('') || '<p class="muted center pad8">Nada por aqui ainda. Seja o primeiro a publicar.</p>'}
  </main>`;
}

const RIGHTS = [
  ['Jornada de trabalho', 'A Lei 7.394/1985 prevê jornada de 24 horas semanais para os profissionais das técnicas radiológicas. Se o seu contrato é diferente, anote horários e guarde comprovantes.'],
  ['Piso salarial', 'A mesma lei fala em salário mínimo profissional equivalente a 2 salários mínimos. Como esse piso é aplicado hoje é debatido na Justiça, então confirme com advogado trabalhista ou com o CRTR antes de cobrar.'],
  ['Adicional de risco e insalubridade', 'A lei prevê adicional de 40% sobre o vencimento. Verifique no seu contracheque se ele aparece.'],
  ['Salário atrasado: o que fazer', 'Guarde contracheques, extratos e mensagens. Registre o relato aqui no mural e procure orientação do CRTR, do Ministério Público do Trabalho ou de um advogado trabalhista.'],
  ['Outras profissões na área', 'Esse tema está em debate entre os conselhos das categorias. Esta seção será escrita junto com o CRTR e com um advogado, para ficar correta e sem risco.']
];
function screenRights() {
  return `<main class="pad"><h2>Direitos</h2>
    <p class="muted small">Informativo geral, não é aconselhamento jurídico. Confira sempre o texto atual da lei.</p>
    ${RIGHTS.map(([t, b]) => `<details class="card acc"><summary>${esc(t)}</summary><p>${esc(b)}</p></details>`).join('')}
  </main>`;
}

function screenProfile() {
  const u = ui.user;
  return `<main class="pad"><h2>Perfil</h2>
    <div class="card"><div class="row gap8"><div class="avatar big">${ic('user', 26)}</div>
      <div><div class="name">${esc(u.name)}</div><div class="muted small">${esc(u.role)}</div></div></div>
      <div class="row between li"><span class="muted">Região</span><b>${esc(regionLabel(u.region))}</b></div>
      <label class="check"><input type="checkbox" data-action="toggle-anon" ${u.anon ? 'checked' : ''}><span>Postar como anônimo por padrão</span></label>
    </div>
    <p class="muted small">Seu número do CRTR, e-mail e senha não aparecem para ninguém.</p>
    <button class="btn out" data-action="show-terms">Ver regras do UniRad</button>
    <button class="btn out" data-action="logout">Sair</button>
    <button class="btn out danger" data-action="ask-delete">Apagar minha conta e meus dados</button>
    ${Store.mode === 'demo' ? '<p class="muted small center">Modo demonstração: os dados ficam só neste aparelho.</p>' : ''}
  </main>`;
}

function modalDelay() {
  const months = [];
  const d = new Date();
  for (let i = 0; i < 4; i++) months.push(new Date(d.getFullYear(), d.getMonth() - i, 1));
  const mname = (x) => x.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return sheet('Relatar atraso', `<form data-form="delay" novalidate>
    <label>Hospital ou clínica<input name="hospital" required maxlength="80" placeholder="Nome do local"></label>
    <label>O que aconteceu<select name="type">${DELAY_TYPES.map((t) => `<option>${esc(t)}</option>`).join('')}</select></label>
    <label>Mês de referência<select name="month">${months.map((x) => `<option value="${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}">${esc(mname(x))}</option>`).join('')}</select></label>
    <label>Dias de atraso (se souber)<input name="days" type="number" min="0" max="365" inputmode="numeric" placeholder="0"></label>
    <p class="muted small">Seu relato aparece só somado aos outros, sem seu nome. Relate só fatos e nada de dados de pacientes.</p>
    <div class="error" id="formError" role="alert"></div>
    <button class="btn big" type="submit">Enviar relato</button></form>`);
}

function modalPost() {
  return sheet('Nova publicação', `<form data-form="post" novalidate>
    <label>Tipo<select name="cat" id="catSel"><option value="geral">Geral</option><option value="vagas">Vaga</option><option value="cursos">Curso / capacitação</option></select></label>
    <label>Texto<textarea name="text" required maxlength="800" rows="4" placeholder="Escreva aqui"></textarea></label>
    <div id="vagaExtra" hidden>
      <label>Local<input name="place" maxlength="80" placeholder="Hospital ou clínica"></label>
      <label>Salário<input name="salary" maxlength="30" placeholder="Ex.: R$ 3.500"></label>
    </div>
    <label>Onde aparece<select name="scope"><option value="regiao">Só na minha região</option><option value="brasil">Brasil todo</option></select></label>
    <label class="check"><input type="checkbox" name="anon" ${ui.user.anon ? 'checked' : ''}><span>Publicar como anônimo</span></label>
    <p class="muted small">Não publique dados de pacientes, exames ou imagens.</p>
    <div class="error" id="formError" role="alert"></div>
    <button class="btn big" type="submit">Publicar</button></form>`);
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
  const items = [['inicio', 'home', 'Início'], ['comunidade', 'users', 'Comunidade'], ['direitos', 'shield', 'Direitos'], ['perfil', 'user', 'Perfil']];
  return `<nav class="nav">${items.map(([k, i, l]) => `<button class="${ui.tab === k ? 'on' : ''}" data-action="tab" data-t="${k}" aria-label="${l}">${ic(i)}<span>${l}</span></button>`).join('')}</nav>`;
}
function header() {
  return `<header class="top"><div class="row gap8">${logo(34)}<div><b>UniRad</b><div class="small dim">${CONFIG.tagline}</div></div></div></header>`;
}

function render() {
  document.body.classList.toggle('dark-welcome', !ui.user && ui.screen === 'welcome');
  if (!ui.user) {
    $app.innerHTML = ui.screen === 'signup' ? screenSignup() : ui.screen === 'login' ? screenLogin() : screenWelcome();
    bindSignup();
    return;
  }
  const body = { inicio: screenHome, comunidade: screenFeed, direitos: screenRights, perfil: screenProfile }[ui.tab]();
  const modal = ui.modal === 'delay' ? modalDelay() : ui.modal === 'post' ? modalPost() : ui.modal === 'terms' ? sheet('Regras do UniRad', TERMS) : ui.modal === 'delete' ? modalDeleteAccount() : '';
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
      const [stats, posts] = await Promise.all([Store.stats(scope), Store.posts({ scope, cat: 'tudo' })]);
      if (seq !== ui.seq) return;
      ui.stats = stats; ui.posts = posts;
    } else if (ui.tab === 'comunidade') {
      const posts = await Store.posts({ scope, cat: ui.cat });
      if (seq !== ui.seq) return;
      ui.posts = posts;
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
function bindModal() {
  const c = document.getElementById('catSel');
  if (c) c.addEventListener('change', () => { document.getElementById('vagaExtra').hidden = c.value !== 'vagas'; });
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
      if (!ui.user) { document.getElementById('modalRoot').innerHTML = ''; return; }
      ui.modal = null; return render();
    }
    if (a === 'show-terms') { ev.preventDefault(); if (!ui.user) { document.getElementById('modalRoot').innerHTML = sheet('Regras do UniRad', TERMS); return; } ui.modal = 'terms'; return render(); }
    if (a === 'toggle-pw') {
      const inp = el.parentElement.querySelector('input'); const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password'; el.innerHTML = ic(show ? 'eyeoff' : 'eye', 22); el.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha'); return;
    }
    if (a === 'go-signup') { ui.screen = 'signup'; return render(); }
    if (a === 'go-login') { ui.screen = 'login'; return render(); }
    if (a === 'go-welcome') { ui.screen = 'welcome'; return render(); }
    if (a === 'pick-region') { ui.regionPick = Number(el.dataset.id); document.getElementById('picked').innerHTML = pickedHtml(); document.getElementById('reglist').innerHTML = regionListHtml(); return; }
    if (a === 'tab') { ui.tab = el.dataset.t; ui.modal = null; window.scrollTo(0, 0); return refresh(); }
    if (a === 'view') { ui.view = el.dataset.v; return refresh(); }
    if (a === 'cat') { ui.cat = el.dataset.c; return refresh({ quiet: true }); }
    if (a === 'new-delay') { ui.modal = 'delay'; return render(); }
    if (a === 'new-post') { ui.modal = 'post'; return render(); }
    if (a === 'ask-delete') { ui.modal = 'delete'; return render(); }
    if (a === 'like') { await Store.toggleLike(el.dataset.id); return refresh({ quiet: true }); }
    if (a === 'toggle-comments') { ui.open[el.dataset.id] = !ui.open[el.dataset.id]; return render(); }
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
    if (kind === 'signup') {
      const name = String(d.get('name') || '').trim();
      const email = String(d.get('email') || '').trim();
      const password = String(d.get('password') || '');
      const digits = String(d.get('crtr') || '').replace(/\D/g, '');
      const crtr = digits.padStart(5, '0') + (String(d.get('role')).startsWith('Tecnólogo') ? 'N' : 'T');
      if (name.length < 5) return err('Digite seu nome completo.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err('Digite um e-mail válido.');
      if (password.length < 6) return err('A senha precisa ter pelo menos 6 caracteres.');
      if (password !== String(d.get('password2') || '')) return err('As senhas não são iguais. Digite de novo.');
      if (digits.length < 3 || digits.length > 6) return err('Digite o número do CRTR (só os números).');
      if (!d.get('role')) return err('Escolha sua função.');
      if (!ui.regionPick) return err('Escolha a região do seu CRTR.');
      if (!d.get('terms')) return err('Aceite as regras para continuar.');
      busy(f, true);
      try { ui.user = await Store.signup({ name, email, password, crtr, role: String(d.get('role')), region: ui.regionPick, anon: !!d.get('anon') }); }
      finally { busy(f, false); }
      ui.tab = 'inicio'; ui.view = 'mine'; window.scrollTo(0, 0);
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
      busy(f, true);
      try { await Store.addDelay({ hospital, type: String(d.get('type')), month: String(d.get('month')), days: Math.max(0, Number(d.get('days')) || 0) }); }
      finally { busy(f, false); }
      ui.modal = null; toast('Relato enviado.');
      return refresh();
    }
    if (kind === 'post') {
      const text = String(d.get('text') || '').trim();
      if (text.length < 3) return err('Escreva algo na publicação.');
      const cat = String(d.get('cat'));
      busy(f, true);
      try {
        await Store.addPost({ cat, scope: String(d.get('scope')), anon: !!d.get('anon'), text, place: cat === 'vagas' ? String(d.get('place') || '').trim() : '', salary: cat === 'vagas' ? String(d.get('salary') || '').trim() : '' });
      } finally { busy(f, false); }
      ui.modal = null; ui.tab = 'comunidade'; ui.cat = 'tudo';
      return refresh();
    }
    if (kind === 'comment') {
      const t = String(d.get('t') || '').trim(); if (!t) return;
      await Store.addComment(f.dataset.id, t, ui.user.anon);
      return refresh({ quiet: true });
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

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});

function showSplash() {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = document.createElement('div');
  el.className = 'splash';
  el.innerHTML = emblem({ size: 300, text: true, anim: !reduce }) + '<div class="sname">UniRad</div><div class="stag">' + CONFIG.tagline + '</div>';
  if (reduce) el.querySelectorAll('.sname,.stag').forEach((n) => { n.style.opacity = 1; n.style.animation = 'none'; });
  document.body.appendChild(el);
  const svg = el.querySelector('svg');
  if (!reduce) startSmil(svg);
  let done = false;
  const close = () => { if (done) return; done = true; el.classList.add('out'); setTimeout(() => el.remove(), 500); };
  el.addEventListener('click', close);
  setTimeout(close, reduce ? 1200 : 4700);
}

(async function start() {
  showSplash();
  Store = await connect();
  try { ui.user = await Store.init(); } catch { ui.user = null; }
  if (ui.user) await refresh(); else render();
})();
