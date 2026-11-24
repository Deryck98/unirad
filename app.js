import { CONFIG, REGIONS, DELAY_TYPES, regionLabel, Store } from './data.js';

const $app = document.getElementById('app');
const ui = { tab: 'inicio', view: 'mine', cat: 'tudo', modal: null, open: {}, regionQuery: '', regionPick: null, anonDefault: true };

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
const TREFOIL = 'M50,50 L30.00,15.36 A40,40 0 0 1 70.00,15.36 Z M50,50 L90.00,50.00 A40,40 0 0 1 70.00,84.64 Z M50,50 L30.00,84.64 A40,40 0 0 1 10.00,50.00 Z';
const logo = (s = 36) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="22" fill="#0b1f3a"/><path d="${TREFOIL}" fill="#f5b301"/><circle cx="50" cy="50" r="9" fill="#0b1f3a"/><circle cx="50" cy="50" r="5.5" fill="#f5b301"/></svg>`;
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
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'
};
const ic = (n, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
const CATS = { geral: 'Geral', vagas: 'Vagas', cursos: 'Cursos' };

const scopeOf = (v) => (v === 'mine' ? Store.user.region : v === 'brasil' ? 'brasil' : Number(v));
const viewName = (v) => (v === 'mine' ? regionLabel(Store.user.region).split(' · ')[0] : v === 'brasil' ? 'Brasil todo' : regionLabel(v).split(' · ')[0]);
const authorName = (anon) => (anon ? 'Profissional anônimo' : Store.user.name);

/* ---------- componentes ---------- */
function viewSwitch() {
  const other = REGIONS.filter((r) => r.id !== Store.user.region)
    .map((r) => `<option value="${r.id}" ${String(ui.view) === String(r.id) ? 'selected' : ''}>${esc(r.name)}${r.states ? ' · ' + esc(r.states) : ''}</option>`).join('');
  const isOther = typeof ui.view === 'number' || /^\d+$/.test(String(ui.view));
  return `<div class="switch">
    <button class="seg ${ui.view === 'mine' ? 'on' : ''}" data-action="view" data-v="mine">Minha região</button>
    <button class="seg ${ui.view === 'brasil' ? 'on' : ''}" data-action="view" data-v="brasil">Brasil todo</button>
    <select class="seg sel ${isOther ? 'on' : ''}" data-action="view-select" aria-label="Ver outra região"><option value="">Outra região</option>${other}</select>
  </div>`;
}

function postCard(p) {
  const liked = p.likedBy.includes(Store.user.id);
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
      <button class="ghost ${liked ? 'liked' : ''}" data-action="like" data-id="${p.id}" aria-label="Curtir">${ic('heart', 18)} ${p.likes}</button>
      <button class="ghost" data-action="toggle-comments" data-id="${p.id}" aria-label="Comentários">${ic('msg', 18)} ${p.comments.length}</button>
      <button class="ghost right" data-action="report" data-id="${p.id}" aria-label="Denunciar">${ic('flag', 16)}</button>
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
  <li><b>Seu número do CRTR</b> é usado só para confirmar que você é da categoria e não aparece para ninguém.</li>
  <li>Posts denunciados várias vezes são ocultados até revisão.</li>
  <li>O UniRad é um espaço de união da categoria e não substitui orientação de advogado ou do CRTR.</li></ul>`;

/* ---------- telas ---------- */
function screenWelcome() {
  return `<main class="welcome">
    <div class="wlogo">${logo(84)}</div>
    <h1>UniRad</h1>
    <p class="lead">${CONFIG.tagline}</p>
    <p class="muted center">A rede dos técnicos e tecnólogos em radiologia. Aqui a gente se une, mostra a realidade da categoria e luta por piso, jornada e salário em dia.</p>
    <ul class="points">
      <li>${ic('check', 20)} Só quem tem CRTR entra</li>
      <li>${ic('check', 20)} Relatos de atraso, anônimos se quiser</li>
      <li>${ic('check', 20)} Sua região e o Brasil todo</li>
    </ul>
    <button class="btn big" data-action="go-signup">Entrar no UniRad</button>
    ${CONFIG.demo ? '<p class="muted small center">Versão de demonstração: os dados ficam só neste aparelho.</p>' : ''}
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
      <label>Nome completo<input name="name" autocomplete="name" required minlength="5" placeholder="Seu nome"></label>
      <label>Número do CRTR<input name="crtr" inputmode="numeric" required placeholder="Ex.: 12345" maxlength="12"></label>
      <label>Função
        <select name="role" required><option value="">Selecione</option><option>Técnico em Radiologia</option><option>Tecnólogo em Radiologia</option></select></label>
      <div class="field">Região do seu CRTR
        <div class="search">${ic('search', 18)}<input id="regionSearch" value="${esc(ui.regionQuery)}" placeholder="Busque: 19, Amazonas, Pará…" autocomplete="off"></div>
        <div class="picked" id="picked">${pickedHtml()}</div>
        <div class="reglist" id="reglist">${regionListHtml()}</div>
      </div>
      <label class="check"><input type="checkbox" name="anon" ${ui.anonDefault ? 'checked' : ''}><span>Postar como anônimo por padrão <span class="muted small">(você escolhe em cada post)</span></span></label>
      <label class="check"><input type="checkbox" name="terms" required><span>Li e aceito as <a href="#" data-action="show-terms">regras do UniRad</a></span></label>
      <div class="error" id="formError" role="alert"></div>
      <button class="btn big" type="submit">Criar cadastro</button>
    </form>
  </main>`;
}

function screenHome() {
  const s = scopeOf(ui.view);
  const delays = Store.delays(s);
  const total = delays.length;
  const withDays = delays.filter((d) => d.type === 'Salário atrasado' && d.days > 0);
  const avg = withDays.length ? Math.round(withDays.reduce((a, d) => a + d.days, 0) / withDays.length) : 0;
  const byHosp = {};
  delays.forEach((d) => { const k = d.hospital.trim(); if (k) byHosp[k] = (byHosp[k] || 0) + 1; });
  const top = Object.entries(byHosp).filter(([, n]) => n >= CONFIG.hideHospitalBelow).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const members = Store.memberCount(s === 'brasil' ? null : s);
  const nat = Store.memberCount(null);
  const pct = Math.min(100, Math.round((nat / CONFIG.goalMembers) * 100));
  const recent = Store.posts({ scope: s }).slice(0, 2);
  return `<main class="pad">
    ${viewSwitch()}
    <section class="hero">
      <div class="small">Profissionais unidos · ${esc(viewName(ui.view))}</div>
      <div class="big-n">${members.toLocaleString('pt-BR')}</div>
      <div class="small">Meta do Brasil: ${CONFIG.goalMembers.toLocaleString('pt-BR')} (${nat.toLocaleString('pt-BR')} hoje)</div>
      <div class="bar"><i style="width:${pct}%"></i></div>
    </section>
    <h3 class="sec">Mural de atrasos</h3>
    <div class="grid2">
      <div class="stat red"><div class="small">Relatos</div><div class="n">${total}</div></div>
      <div class="stat amber"><div class="small">Atraso médio</div><div class="n">${avg ? avg + ' dias' : '—'}</div></div>
    </div>
    ${top.length ? `<div class="card"><div class="small muted">Locais mais citados</div>${top.map(([h, n]) => `<div class="row between li"><span>${esc(h)}</span><b>${n} relatos</b></div>`).join('')}</div>`
      : `<p class="muted small">Locais aparecem aqui quando houver ao menos ${CONFIG.hideHospitalBelow} relatos sobre o mesmo, para proteger quem relata.</p>`}
    <button class="btn big" data-action="new-delay">${ic('plus', 18)} Relatar atraso</button>
    <h3 class="sec">Na comunidade</h3>
    ${recent.map(postCard).join('') || '<p class="muted">Ainda não há publicações aqui.</p>'}
  </main>`;
}

function screenFeed() {
  const s = scopeOf(ui.view);
  const posts = Store.posts({ scope: s, cat: ui.cat });
  return `<main class="pad">
    ${viewSwitch()}
    <div class="chips">${['tudo', 'geral', 'vagas', 'cursos'].map((c) => `<button class="chip btnchip ${ui.cat === c ? 'on' : ''}" data-action="cat" data-c="${c}">${c === 'tudo' ? 'Tudo' : CATS[c]}</button>`).join('')}</div>
    <button class="btn big" data-action="new-post">${ic('plus', 18)} Nova publicação</button>
    ${posts.map(postCard).join('') || '<p class="muted center pad8">Nada por aqui ainda. Seja o primeiro a publicar.</p>'}
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
  const u = Store.user;
  return `<main class="pad"><h2>Perfil</h2>
    <div class="card"><div class="row gap8"><div class="avatar big">${ic('user', 26)}</div>
      <div><div class="name">${esc(u.name)}</div><div class="muted small">${esc(u.role)}</div></div></div>
      <div class="row between li"><span class="muted">Região</span><b>${esc(regionLabel(u.region))}</b></div>
      <div class="row between li"><span class="muted">Status</span>${u.verified ? `<span class="ok">${ic('check', 16)} CRTR informado</span>` : '<span class="warn">Em análise</span>'}</div>
      <label class="check"><input type="checkbox" data-action="toggle-anon" ${u.anon ? 'checked' : ''}><span>Postar como anônimo por padrão</span></label>
    </div>
    <p class="muted small">Seu número do CRTR não aparece para ninguém.</p>
    <button class="btn out" data-action="show-terms">Ver regras do UniRad</button>
    <button class="btn out danger" data-action="logout">Sair e apagar meus dados deste aparelho</button>
    ${CONFIG.demo ? '<p class="muted small center">Modo demonstração: os dados ficam só neste aparelho.</p>' : ''}
  </main>`;
}

function modalDelay() {
  const months = [];
  const d = new Date();
  for (let i = 0; i < 4; i++) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); months.push(x); }
  const mname = (x) => x.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return sheet('Relatar atraso', `<form data-form="delay" novalidate>
    <label>Hospital ou clínica<input name="hospital" required maxlength="80" placeholder="Nome do local"></label>
    <label>O que aconteceu<select name="type">${DELAY_TYPES.map((t) => `<option>${esc(t)}</option>`).join('')}</select></label>
    <label>Mês de referência<select name="month">${months.map((x) => `<option value="${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}">${esc(mname(x))}</option>`).join('')}</select></label>
    <label>Dias de atraso (se souber)<input name="days" type="number" min="0" max="365" inputmode="numeric" placeholder="0"></label>
    <label class="check"><input type="checkbox" name="anon" ${Store.user.anon ? 'checked' : ''}><span>Relatar como anônimo</span></label>
    <p class="muted small">Relate só fatos. Nada de dados de pacientes.</p>
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
    <label class="check"><input type="checkbox" name="anon" ${Store.user.anon ? 'checked' : ''}><span>Publicar como anônimo</span></label>
    <p class="muted small">Não publique dados de pacientes, exames ou imagens.</p>
    <div class="error" id="formError" role="alert"></div>
    <button class="btn big" type="submit">Publicar</button></form>`);
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
  if (!Store.user) {
    $app.innerHTML = ui.screen === 'signup' ? screenSignup() : screenWelcome();
    bindSignup();
    return;
  }
  const body = { inicio: screenHome, comunidade: screenFeed, direitos: screenRights, perfil: screenProfile }[ui.tab]();
  const modal = ui.modal === 'delay' ? modalDelay() : ui.modal === 'post' ? modalPost() : ui.modal === 'terms' ? sheet('Regras do UniRad', TERMS) : '';
  $app.innerHTML = `<div class="shell">${nav()}<div class="col">${header()}${body}</div></div>${modal}`;
  bindModal();
}

function bindSignup() {
  const s = document.getElementById('regionSearch');
  if (s) s.addEventListener('input', (e) => { ui.regionQuery = e.target.value; document.getElementById('reglist').innerHTML = regionListHtml(); });
}
function bindModal() {
  const c = document.getElementById('catSel');
  if (c) c.addEventListener('change', () => { document.getElementById('vagaExtra').hidden = c.value !== 'vagas'; });
}
const err = (m) => { const e = document.getElementById('formError'); if (e) e.textContent = m; };

/* ---------- eventos ---------- */
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if (a === 'close-modal') { if (ev.target.closest('[data-stop]') && el.dataset.action === 'close-modal' && !ev.target.closest('button[data-action="close-modal"]')) return; if (!Store.user) { document.getElementById('modalRoot').innerHTML = ''; return; } ui.modal = null; return render(); }
  if (a === 'show-terms') { ev.preventDefault(); if (!Store.user) { document.getElementById('modalRoot').innerHTML = sheet('Regras do UniRad', TERMS); return; } ui.modal = 'terms'; return render(); }
  if (a === 'go-signup') { ui.screen = 'signup'; return render(); }
  if (a === 'go-welcome') { ui.screen = 'welcome'; return render(); }
  if (a === 'pick-region') { ui.regionPick = Number(el.dataset.id); document.getElementById('picked').innerHTML = pickedHtml(); document.getElementById('reglist').innerHTML = regionListHtml(); return; }
  if (a === 'tab') { ui.tab = el.dataset.t; render(); window.scrollTo(0, 0); return; }
  if (a === 'view') { ui.view = el.dataset.v; return render(); }
  if (a === 'cat') { ui.cat = el.dataset.c; return render(); }
  if (a === 'new-delay') { ui.modal = 'delay'; return render(); }
  if (a === 'new-post') { ui.modal = 'post'; return render(); }
  if (a === 'like') { Store.toggleLike(el.dataset.id); return render(); }
  if (a === 'toggle-comments') { ui.open[el.dataset.id] = !ui.open[el.dataset.id]; return render(); }
  if (a === 'report') { if (confirm('Denunciar esta publicação por ofensa ou dados de paciente?')) { Store.report(el.dataset.id); render(); } return; }
  if (a === 'logout') { if (confirm('Sair e apagar seus dados deste aparelho?')) { Store.reset(); Store.logout(); ui.screen = 'welcome'; ui.regionPick = null; ui.regionQuery = ''; render(); } return; }
});
document.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.dataset.action === 'view-select') { if (el.value) { ui.view = Number(el.value); render(); } }
  if (el.dataset.action === 'toggle-anon') { Store.updateUser({ anon: el.checked }); }
});
document.addEventListener('submit', (ev) => {
  const f = ev.target.closest('form[data-form]');
  if (!f) return;
  ev.preventDefault();
  const kind = f.dataset.form;
  const d = new FormData(f);
  if (kind === 'signup') {
    const name = String(d.get('name') || '').trim();
    const crtr = String(d.get('crtr') || '').trim();
    if (name.length < 5) return err('Digite seu nome completo.');
    if (!/^[0-9A-Za-z.\-\/]{3,12}$/.test(crtr)) return err('Digite o número do CRTR (só números, 3 a 12 caracteres).');
    if (!d.get('role')) return err('Escolha sua função.');
    if (!ui.regionPick) return err('Escolha a região do seu CRTR.');
    if (!d.get('terms')) return err('Aceite as regras para continuar.');
    Store.signup({ name, crtr, role: String(d.get('role')), region: ui.regionPick, anon: !!d.get('anon') });
    ui.tab = 'inicio'; ui.view = 'mine';
    render(); window.scrollTo(0, 0); return;
  }
  if (kind === 'delay') {
    const hospital = String(d.get('hospital') || '').trim();
    if (!hospital) return err('Informe o hospital ou a clínica.');
    Store.addDelay({ region: Store.user.region, hospital, type: String(d.get('type')), month: String(d.get('month')), days: Math.max(0, Number(d.get('days')) || 0), anon: !!d.get('anon') });
    ui.modal = null; return render();
  }
  if (kind === 'post') {
    const text = String(d.get('text') || '').trim();
    if (text.length < 3) return err('Escreva algo na publicação.');
    const cat = String(d.get('cat'));
    const anon = !!d.get('anon');
    Store.addPost({ cat, scope: String(d.get('scope')), region: Store.user.region, anon, author: authorName(anon), text, place: cat === 'vagas' ? String(d.get('place') || '').trim() : '', salary: cat === 'vagas' ? String(d.get('salary') || '').trim() : '' });
    ui.modal = null; ui.tab = 'comunidade'; return render();
  }
  if (kind === 'comment') {
    const t = String(d.get('t') || '').trim(); if (!t) return;
    Store.addComment(f.dataset.id, t, authorName(Store.user.anon));
    return render();
  }
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
render();
