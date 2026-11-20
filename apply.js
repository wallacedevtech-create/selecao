/* AES Talent — portal público de vagas */
document.addEventListener('DOMContentLoaded', () => {
  const jobSelect = document.getElementById('cand-job');
  const jobsListEl = document.getElementById('jobs-list');
  const chipsEl = document.getElementById('sector-chips');
  const searchEl = document.getElementById('job-search');
  const countEl = document.getElementById('jobs-count');

  let sector = 'TODOS';
  const urlSector = new URLSearchParams(window.location.search).get('setor');
  if (urlSector && SECTORS.includes(urlSector)) sector = urlSector;

  jobSelect.innerHTML = getJobs().map(j => `<option value="${esc(j.id)}">[${esc(j.sector)}] ${esc(j.title)}</option>`).join('');

  function renderChips() {
    chipsEl.innerHTML = ['TODOS', ...SECTORS].map(s =>
      `<button type="button" class="chip ${s === sector ? 'active' : ''}" data-s="${esc(s)}">${s === 'TODOS' ? 'Todos' : esc(s)}</button>`).join('');
  }
  chipsEl.addEventListener('click', e => {
    const b = e.target.closest('.chip');
    if (!b) return;
    sector = b.dataset.s;
    renderChips();
    renderJobs();
  });

  function renderJobs() {
    const q = searchEl.value.trim().toLowerCase();
    const jobs = getJobs().filter(j =>
      (sector === 'TODOS' || j.sector === sector) &&
      (!q || (j.title + ' ' + j.sector + ' ' + (j.reqs || []).join(' ')).toLowerCase().includes(q)));

    countEl.textContent = `${jobs.length} ${jobs.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}`;

    if (!jobs.length) {
      jobsListEl.innerHTML = `<div class="card" style="grid-column:1/-1;text-align:center;color:var(--ink-3)">Nenhuma vaga corresponde à busca. Tente outro termo ou setor.</div>`;
      return;
    }

    jobsListEl.innerHTML = jobs.map(job => `
      <article class="card hover job">
        <div class="job-top">
          <span class="badge">${esc(job.sector)}</span>
          <span class="badge blue">${esc(job.model)}</span>
        </div>
        <h3>${esc(job.title)}</h3>
        <div class="salary">${esc(job.salary)}</div>
        <div class="tags">${(job.reqs || []).map(r => `<span class="tag">${esc(r)}</span>`).join('')}</div>
        <div class="spacer"></div>
        <button class="btn btn-dark btn-block" data-apply="${esc(job.id)}">Candidatar-se a esta vaga</button>
      </article>`).join('');
  }

  jobsListEl.addEventListener('click', e => {
    const b = e.target.closest('[data-apply]');
    if (!b) return;
    jobSelect.value = b.dataset.apply;
    document.getElementById('apply-section').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => document.getElementById('cand-name').focus({ preventScroll: true }), 500);
  });

  searchEl.addEventListener('input', renderJobs);
  renderChips();
  renderJobs();

  // Upload simulado
  const fileInput = document.getElementById('cand-file');
  fileInput.addEventListener('change', () => {
    const f = fileInput.files[0];
    document.getElementById('file-feedback').textContent = f ? `✓ Arquivo anexado (simulado): ${f.name}` : '';
  });

  // Candidatura
  document.getElementById('apply-form').addEventListener('submit', e => {
    e.preventDefault();
    const list = getCandidates();
    const protocol = uniqueProtocol();
    const file = fileInput.files[0];
    const email = document.getElementById('cand-email').value.trim();
    const jobId = jobSelect.value;

    if (list.some(c => c.email.toLowerCase() === email.toLowerCase() && c.jobId === jobId)) {
      toast('Já existe uma candidatura deste e-mail para esta vaga.', 'err');
      return;
    }

    // Aderência = correspondência entre competências informadas e requisitos da vaga
    const job = getJobById(jobId);
    const skills = document.getElementById('cand-skills').value.trim();
    const typed = skills.toLowerCase();
    const hits = (job.reqs || []).filter(r => typed.includes(r.toLowerCase())).length;
    const score = Math.min(98, 70 + Math.round((hits / Math.max((job.reqs || []).length, 1)) * 24) + Math.floor(Math.random() * 4));

    list.unshift({
      id: protocol,
      name: document.getElementById('cand-name').value.trim(),
      email,
      phone: document.getElementById('cand-phone').value.trim(),
      jobId,
      stage: 'Triagem',
      score,
      skills,
      resume: file ? file.name : 'Curriculo_Web_Form.pdf',
      notes: 'Inscrição efetuada via Portal Público de Vagas.',
      date: new Date().toISOString().slice(0, 10)
    });
    saveCandidates(list);

    document.getElementById('apply-result').innerHTML = `
      <div class="result-ok">
        <div class="ck"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></div>
        <div>
          <strong>Candidatura registrada com sucesso!</strong>
          <p style="font-size:.88rem;margin-top:4px;color:var(--ink-2)">Seu protocolo é <span class="protocol">${esc(protocol)}</span>. Guarde-o para acompanhar o andamento.</p>
        </div>
      </div>`;
    toast(`Candidatura ${protocol} registrada.`);
    e.target.reset();
    document.getElementById('file-feedback').textContent = '';
  });

  // Consulta de protocolo
  function lookup() {
    const q = document.getElementById('lookup-query').value.trim().toLowerCase();
    const resEl = document.getElementById('lookup-result');
    if (!q) return;

    const matches = getCandidates().filter(c => c.id.toLowerCase() === q || c.email.toLowerCase() === q);
    if (!matches.length) {
      resEl.innerHTML = `<div class="lookup-card" style="border-color:#f3b4b4;background:#fff5f5;color:#9b2c2c;font-size:.9rem">Nenhuma inscrição encontrada para “${esc(q)}”.</div>`;
      return;
    }

    resEl.innerHTML = matches.map(c => {
      const job = getJobById(c.jobId);
      const idx = STAGES.indexOf(c.stage);
      return `
        <div class="lookup-card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px">
            <strong>${esc(c.name)}</strong><span class="badge">${esc(c.stage)}</span>
          </div>
          <p style="font-size:.86rem;color:var(--ink-2)">Vaga: <strong>${esc(job.title)}</strong> · ${esc(job.sector)}</p>
          <p style="font-size:.78rem;color:var(--ink-3);margin-top:2px">Protocolo ${esc(c.id)} · ${esc(c.date)} · ${esc(c.resume)}</p>
          <div class="progress">${STAGES.map((s, i) => `<i class="${i <= idx ? 'on' : ''}"></i>`).join('')}</div>
          <div class="progress-labels">${STAGES.map(s => `<span>${esc(s.split(' ')[0])}</span>`).join('')}</div>
        </div>`;
    }).join('');
  }
  document.getElementById('btn-lookup').addEventListener('click', lookup);
  document.getElementById('lookup-query').addEventListener('keydown', e => { if (e.key === 'Enter') lookup(); });
});
