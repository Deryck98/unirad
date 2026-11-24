/* UniRad - dados fixos e camada de armazenamento.
   MODO DEMONSTRAÇÃO: tudo fica salvo só neste aparelho (localStorage).
   Para virar produção, troque o objeto `Store` por chamadas a um backend (ex.: Supabase). */

export const CONFIG = {
  appName: 'UniRad',
  tagline: 'A força da radiologia unida',
  demo: true,
  goalMembers: 5000,
  hideHospitalBelow: 3 // só mostra "hospitais mais citados" com pelo menos N relatos
};

/* Regiões do CRTR. Confirmadas: 1,2,3,4,5,6,8,10,14,16,17,18,19.
   Marcadas com `check: true` ainda precisam ter os estados conferidos no site do CONTER. */
export const REGIONS = [
  { id: 1,  name: '1ª Região',  states: 'Distrito Federal' },
  { id: 2,  name: '2ª Região',  states: 'Ceará' },
  { id: 3,  name: '3ª Região',  states: 'Minas Gerais' },
  { id: 4,  name: '4ª Região',  states: 'Rio de Janeiro' },
  { id: 5,  name: '5ª Região',  states: 'São Paulo' },
  { id: 6,  name: '6ª Região',  states: 'Rio Grande do Sul' },
  { id: 7,  name: '7ª Região',  states: '', check: true },
  { id: 8,  name: '8ª Região',  states: 'Bahia, Alagoas e Sergipe' },
  { id: 9,  name: '9ª Região',  states: '', check: true },
  { id: 10, name: '10ª Região', states: 'Paraná' },
  { id: 11, name: '11ª Região', states: '', check: true },
  { id: 12, name: '12ª Região', states: '', check: true },
  { id: 13, name: '13ª Região', states: '', check: true },
  { id: 14, name: '14ª Região', states: 'Pará e Amapá' },
  { id: 15, name: '15ª Região', states: '', check: true },
  { id: 16, name: '16ª Região', states: 'Rio Grande do Norte e Paraíba' },
  { id: 17, name: '17ª Região', states: 'Maranhão e Piauí' },
  { id: 18, name: '18ª Região', states: 'Rondônia e Acre' },
  { id: 19, name: '19ª Região', states: 'Amazonas e Roraima' }
];

export const regionLabel = (id) => {
  const r = REGIONS.find((x) => x.id === Number(id));
  if (!r) return 'Região não informada';
  return r.states ? `${r.name} · ${r.states}` : r.name;
};

export const DELAY_TYPES = [
  'Salário atrasado',
  'Pagamento abaixo do piso',
  'Hora extra / plantão sem pagar',
  'Adicional não pago',
  'Outro'
];

const KEY = 'unirad_v1';
const now = () => Date.now();
const uid = () => Math.random().toString(36).slice(2, 10) + now().toString(36);

function seed() {
  const h = 3600 * 1000;
  return {
    user: null,
    members: [],
    posts: [
      { id: uid(), sample: true, cat: 'geral', scope: 'brasil', region: 19, anon: true, author: 'Técnico anônimo', text: 'Alguém sabe se o pagamento de dezembro vai sair no prazo nos hospitais grandes? Vamos nos organizar e trocar informação aqui.', likes: 32, likedBy: [], comments: [{ id: uid(), author: 'Técnica anônima', text: 'Aqui também está na dúvida. Vamos registrar no mural.', t: now() - 1 * h }], reports: 0, t: now() - 2 * h },
      { id: uid(), sample: true, cat: 'vagas', scope: 'regiao', region: 19, anon: false, author: 'Exemplo de vaga', text: 'Vaga de técnico em radiologia, plantão 12x36. Salário informado na vaga. Interessados, chamar no contato.', place: 'Clínica de exemplo', salary: 'R$ 3.500', likes: 9, likedBy: [], comments: [], reports: 0, t: now() - 5 * h },
      { id: uid(), sample: true, cat: 'cursos', scope: 'brasil', region: 5, anon: false, author: 'Exemplo de curso', text: 'Curso online de radioproteção e atualização em tomografia. Alguém já fez? Vale a pena?', likes: 14, likedBy: [], comments: [], reports: 0, t: now() - 26 * h }
    ],
    delays: [
      { id: uid(), sample: true, region: 19, hospital: 'Hospital de exemplo A', type: 'Salário atrasado', month: '2026-10', days: 20, anon: true, t: now() - 30 * h },
      { id: uid(), sample: true, region: 19, hospital: 'Hospital de exemplo A', type: 'Salário atrasado', month: '2026-10', days: 15, anon: true, t: now() - 28 * h },
      { id: uid(), sample: true, region: 19, hospital: 'Hospital de exemplo A', type: 'Salário atrasado', month: '2026-11', days: 5, anon: true, t: now() - 20 * h },
      { id: uid(), sample: true, region: 19, hospital: 'Clínica de exemplo B', type: 'Pagamento abaixo do piso', month: '2026-11', days: 0, anon: true, t: now() - 10 * h }
    ],
    demoMembers: { 19: 214, 5: 180, 3: 96, 4: 88 }
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* storage indisponível */ }
  return seed();
}

let db = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* ignora */ } };

export const LocalStore = {
  get user() { return db.user; },
  signup(data) {
    const user = { id: uid(), ...data, verified: CONFIG.demo, createdAt: now() };
    db.user = user;
    db.members.push({ id: user.id, region: user.region });
    save();
    return user;
  },
  logout() { db.user = null; save(); },
  updateUser(patch) { db.user = { ...db.user, ...patch }; save(); },
  memberCount(regionId) {
    const demo = Object.entries(db.demoMembers || {});
    const real = db.members.length;
    if (regionId == null) return demo.reduce((s, [, v]) => s + v, 0) + real;
    return (db.demoMembers?.[regionId] || 0) + db.members.filter((m) => m.region === regionId).length;
  },
  posts({ scope, cat }) {
    return db.posts
      .filter((p) => p.reports < 3)
      .filter((p) => (scope === 'brasil' ? p.scope === 'brasil' : p.region === scope))
      .filter((p) => (cat && cat !== 'tudo' ? p.cat === cat : true))
      .sort((a, b) => b.t - a.t);
  },
  addPost(p) {
    db.posts.unshift({ id: uid(), likes: 0, likedBy: [], comments: [], reports: 0, t: now(), ...p });
    save();
  },
  toggleLike(id) {
    const p = db.posts.find((x) => x.id === id); if (!p || !db.user) return;
    const i = p.likedBy.indexOf(db.user.id);
    if (i >= 0) { p.likedBy.splice(i, 1); p.likes = Math.max(0, p.likes - 1); }
    else { p.likedBy.push(db.user.id); p.likes += 1; }
    save();
  },
  addComment(id, text, author) {
    const p = db.posts.find((x) => x.id === id); if (!p) return;
    p.comments.push({ id: uid(), author, text, t: now() });
    save();
  },
  report(id) {
    const p = db.posts.find((x) => x.id === id); if (!p) return;
    p.reports += 1; save();
  },
  delays(scope) {
    return db.delays.filter((d) => (scope === 'brasil' ? true : d.region === scope));
  },
  addDelay(d) { db.delays.unshift({ id: uid(), t: now(), ...d }); save(); },
  reset() { db = seed(); save(); }
};
