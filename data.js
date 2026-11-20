/* =========================================================
   AES Talent — camada de dados (localStorage) e utilitários
   ========================================================= */
const STORAGE_KEYS = {
  CANDIDATES: 'aes_talent_candidates_v3',
  JOBS: 'aes_talent_jobs_v3',
  INTERVIEWS: 'aes_talent_interviews_v3',
  SIUAN_LEVEL: 'aes_siuan_autonomy_v3',
  RH_LOGGED: 'aes_rh_logged_in_v3'
};

const STAGES = ['Triagem', 'Entrevista RH', 'Avaliação Técnica', 'Proposta', 'Contratado'];
const STAGE_COLORS = { 'Triagem': '#5b9dff', 'Entrevista RH': '#8b7bff', 'Avaliação Técnica': '#e6c27a', 'Proposta': '#f08a5d', 'Contratado': '#19d3bd' };
const SECTORS = ['TI', 'RH', 'Administrativo', 'Facilities/Limpeza', 'Manutenção'];
const SECTOR_COLORS = { 'TI': '#19d3bd', 'RH': '#8b7bff', 'Administrativo': '#5b9dff', 'Facilities/Limpeza': '#e6c27a', 'Manutenção': '#f08a5d' };

const INITIAL_JOBS = [
  { id: 'V01', title: 'Desenvolvedor(a) Full Stack Pleno', sector: 'TI', salary: 'R$ 7.500 - R$ 9.500', model: 'Híbrido', reqs: ['Node.js', 'React', 'SQL', 'APIs REST'] },
  { id: 'V02', title: 'Analista de Segurança da Informação', sector: 'TI', salary: 'R$ 8.200 - R$ 10.500', model: 'Remoto', reqs: ['LGPD', 'IAM', 'Redes', 'SIEM'] },
  { id: 'V03', title: 'Engenheiro(a) de Dados Júnior', sector: 'TI', salary: 'R$ 5.200 - R$ 6.800', model: 'Híbrido', reqs: ['Python', 'SQL', 'ETL', 'Cloud'] },
  { id: 'V04', title: 'Business Partner de RH', sector: 'RH', salary: 'R$ 6.000 - R$ 7.800', model: 'Presencial', reqs: ['People Analytics', 'R&S', 'Clima'] },
  { id: 'V05', title: 'Analista de Treinamento & Cultura', sector: 'RH', salary: 'R$ 4.300 - R$ 5.400', model: 'Híbrido', reqs: ['Onboarding', 'LMS', 'Comunicação'] },
  { id: 'V06', title: 'Assistente Administrativo Financeiro', sector: 'Administrativo', salary: 'R$ 2.900 - R$ 3.600', model: 'Presencial', reqs: ['Excel', 'Contas a Pagar', 'ERP'] },
  { id: 'V07', title: 'Analista de Compras e Contratos', sector: 'Administrativo', salary: 'R$ 4.500 - R$ 5.600', model: 'Híbrido', reqs: ['Negociação', 'Fornecedores', 'SLA'] },
  { id: 'V08', title: 'Auxiliar de Serviços Gerais', sector: 'Facilities/Limpeza', salary: 'R$ 1.950 - R$ 2.300', model: 'Presencial', reqs: ['Organização', 'Protocolos de Higiene'] },
  { id: 'V09', title: 'Líder de Conservação e Copa', sector: 'Facilities/Limpeza', salary: 'R$ 2.400 - R$ 2.900', model: 'Presencial', reqs: ['Gestão de Insumos', 'Checklist'] },
  { id: 'V10', title: 'Técnico(a) de Manutenção Predial', sector: 'Manutenção', salary: 'R$ 3.400 - R$ 4.200', model: 'Presencial', reqs: ['Elétrica Básica', 'Climatização', 'NR-10'] }
];

/* ---------- Utilitários ---------- */
function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  return ((parts[0] || '?')[0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#19d3bd,#5b9dff)', 'linear-gradient(135deg,#8b7bff,#5b9dff)',
  'linear-gradient(135deg,#e6c27a,#f08a5d)', 'linear-gradient(135deg,#19d3bd,#8bf0a4)',
  'linear-gradient(135deg,#5b9dff,#8b7bff)', 'linear-gradient(135deg,#f08a5d,#e6c27a)'
];
function avatarBg(seed) {
  let h = 0;
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}
function avatarHtml(name, cls = 'mini-av') {
  return `<span class="${cls}" style="background:${avatarBg(name)}">${esc(initials(name))}</span>`;
}

function scoreColor(s) { return s >= 90 ? '#19d3bd' : s >= 80 ? '#5b9dff' : '#e6c27a'; }

function stageBadge(stage) {
  const cls = { 'Triagem': 'blue', 'Entrevista RH': 'violet', 'Avaliação Técnica': 'gold', 'Proposta': 'gold', 'Contratado': 'ok' }[stage] || '';
  return `<span class="badge ${cls}">${esc(stage)}</span>`;
}

function toast(message, type = '') {
  let root = document.getElementById('toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toast-root';
    document.body.appendChild(root);
  }
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 320); }, 3600);
}

function readJSON(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
}

/* ---------- Geração da base de demonstração ---------- */
function generateMassiveCandidates() {
  const baseList = [
    { id: 'AES-101', name: 'Mariana Costa', email: 'mariana.costa@exemplo.com', phone: '(11) 98812-3401', jobId: 'V01', stage: 'Avaliação Técnica', score: 92, skills: 'Node.js, React, PostgreSQL, Docker', resume: 'CV_Mariana_Costa.pdf', notes: 'Excelente arquitetura no teste prático.', date: '2026-11-12' },
    { id: 'AES-102', name: 'Carlos Eduardo Lima', email: 'carlos.lima@exemplo.com', phone: '(11) 97745-1190', jobId: 'V02', stage: 'Entrevista RH', score: 88, skills: 'ISO 27001, LGPD, AWS Security', resume: 'Carlos_Sec_CV.pdf', notes: 'Boa vivência em governança e auditoria.', date: '2026-11-14' },
    { id: 'AES-103', name: 'Fernanda Alves', email: 'fernanda.rh@exemplo.com', phone: '(11) 99120-8877', jobId: 'V04', stage: 'Proposta', score: 95, skills: 'R&S Tech, Indicadores RH, D&I', resume: 'Fernanda_Alves_BP.pdf', notes: 'Aprovada pela diretoria. Carta-proposta enviada.', date: '2026-11-10' },
    { id: 'AES-104', name: 'Roberto Nascimento', email: 'roberto.adm@exemplo.com', phone: '(11) 96543-2210', jobId: 'V06', stage: 'Triagem', score: 79, skills: 'Excel Avançado, SAP, Conciliação', resume: 'Roberto_Adm.pdf', notes: 'Aguardando validação inicial do RH.', date: '2026-11-17' },
    { id: 'AES-105', name: 'Sônia Maria Pereira', email: 'sonia.facilities@exemplo.com', phone: '(11) 95432-9981', jobId: 'V08', stage: 'Contratado', score: 90, skills: 'Conservação Corporativa, EPIs', resume: 'Sonia_Pereira_CV.pdf', notes: 'Documentação validada para início imediato.', date: '2026-11-05' },
    { id: 'AES-106', name: 'Lucas Mendes', email: 'lucas.manut@exemplo.com', phone: '(11) 98111-4432', jobId: 'V10', stage: 'Entrevista RH', score: 84, skills: 'NR-10, Refrigeração, Preventiva', resume: 'Lucas_Tecnico.pdf', notes: 'Certificação NR-10 ativa comprovada.', date: '2026-11-16' },
    { id: 'AES-107', name: 'Beatriz Nogueira', email: 'bia.dados@exemplo.com', phone: '(11) 99234-5566', jobId: 'V03', stage: 'Triagem', score: 86, skills: 'Python, SQL, BigQuery, Airflow', resume: 'Beatriz_Dados.pdf', notes: 'Portfólio sólido em pipelines analíticos.', date: '2026-11-18' }
  ];

  const names = ['Ana', 'Bruno', 'Carla', 'Daniel', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Karina', 'Leonardo', 'Marcela', 'Nicolas', 'Olívia', 'Pedro', 'Rafaela', 'Samuel', 'Tatiane', 'Vinícius', 'Yasmin', 'Rodrigo'];
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Gomes', 'Martins', 'Araújo', 'Barbosa', 'Ribeiro', 'Carvalho', 'Teixeira', 'Moreira', 'Cardoso', 'Rocha'];
  const notes = ['Perfil aderente aos requisitos da vaga.', 'Boa comunicação na pré-triagem.', 'Experiência relevante comprovada em currículo.', 'Aguardando retorno de documentação.', 'Disponibilidade imediata informada.', 'Referências positivas registradas.'];
  const used = new Set(baseList.map(c => c.name));
  let counter = 108;

  INITIAL_JOBS.forEach(job => {
    for (let i = 1; i <= 16; i++) {
      let n = counter * 3 + i, full;
      do {
        full = `${names[n % names.length]} ${lastNames[(n * 7 + i) % lastNames.length]}`;
        n++;
      } while (used.has(full));
      used.add(full);
      const [first, last] = full.split(' ');
      const slug = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      baseList.push({
        id: `AES-${counter}`,
        name: full,
        email: `${slug(first)}.${slug(last)}${counter}@exemplo.com`,
        phone: `(64) 9${String(1000 + ((counter * 37) % 8999))}-${String(1000 + ((counter * 73) % 8999))}`,
        jobId: job.id,
        stage: STAGES[(counter + i * 2) % STAGES.length],
        score: 72 + ((counter * 7) % 26),
        skills: job.reqs.join(', '),
        resume: `CV_${slug(first)}_${slug(last)}.pdf`,
        notes: notes[counter % notes.length],
        date: `2026-11-${String(((i * 3 + counter) % 19) + 1).padStart(2, '0')}`
      });
      counter++;
    }
  });
  return baseList;
}

/* ---------- Armazenamento ---------- */
var JOBS_DATA = [...INITIAL_JOBS];

function initStorage() {
  let jobs = readJSON(STORAGE_KEYS.JOBS);
  if (!Array.isArray(jobs) || !jobs.length) {
    jobs = [...INITIAL_JOBS];
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  }
  JOBS_DATA = jobs;

  const cands = readJSON(STORAGE_KEYS.CANDIDATES);
  if (!Array.isArray(cands) || !cands.length) {
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(generateMassiveCandidates()));
  }

  const ints = readJSON(STORAGE_KEYS.INTERVIEWS);
  if (!Array.isArray(ints) || !ints.length) {
    localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify([
      { id: 'INT-01', candidateId: 'AES-101', candidateName: 'Mariana Costa', jobTitle: 'Desenvolvedor(a) Full Stack Pleno', datetime: '2026-11-20 10:00', interviewer: 'Camila (RH)', mode: 'Online (Meet)' },
      { id: 'INT-02', candidateId: 'AES-102', candidateName: 'Carlos Eduardo Lima', jobTitle: 'Analista de Segurança da Informação', datetime: '2026-11-20 14:30', interviewer: 'Rafael (CTO) + RH', mode: 'Online (Meet)' },
      { id: 'INT-03', candidateId: 'AES-106', candidateName: 'Lucas Mendes', jobTitle: 'Técnico(a) de Manutenção Predial', datetime: '2026-11-21 09:00', interviewer: 'Bruno (Infra) + RH', mode: 'Presencial - Sede AES' }
    ]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SIUAN_LEVEL)) localStorage.setItem(STORAGE_KEYS.SIUAN_LEVEL, '1');
}

function getJobs() { initStorage(); return JOBS_DATA; }
function saveJobs(list) { JOBS_DATA = list; localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(list)); }
function getCandidates() { initStorage(); return readJSON(STORAGE_KEYS.CANDIDATES) || []; }
function saveCandidates(list) { localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(list)); }
function getInterviews() { initStorage(); return readJSON(STORAGE_KEYS.INTERVIEWS) || []; }
function saveInterviews(list) { localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify(list)); }

function getJobById(jobId) {
  return getJobs().find(j => j.id === jobId) || { id: jobId, title: 'Vaga personalizada / externa', sector: 'Geral', salary: 'A combinar', model: 'Híbrido', reqs: [] };
}

function uniqueProtocol() {
  const used = new Set(getCandidates().map(c => c.id));
  let n = 300 + used.size;
  while (used.has(`AES-${n}`)) n++;
  return `AES-${n}`;
}

function resetDemoData() {
  Object.values(STORAGE_KEYS).forEach(k => { if (k !== STORAGE_KEYS.RH_LOGGED) localStorage.removeItem(k); });
  initStorage();
}

/* ---------- Marca ---------- */
function renderBrandLogo() {
  return `
    <svg class="brand-mark" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs><linearGradient id="bg${Math.random().toString(36).slice(2, 6)}" x1="0" y1="0" x2="48" y2="48"><stop stop-color="#19d3bd"/><stop offset="1" stop-color="#5b9dff"/></linearGradient></defs>
      <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="#0a1f40" stroke="rgba(255,255,255,.14)"/>
      <path d="M13 35L24 12l11 23h-6.4L24 24.8 19.4 35H13z" fill="#fff"/>
      <path d="M20 35l4-8.6 2.6 5.6-1.4 3H20z" fill="#19d3bd"/>
      <circle cx="36" cy="14" r="3" fill="#19d3bd"/>
    </svg>
    <span>AES<b> Talent</b></span>`;
}

initStorage();
