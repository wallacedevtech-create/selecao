/* AES Talent — Painel RH */
document.addEventListener('DOMContentLoaded', () => {
  initStorage();

  let activeCandidateId = null;
  let page = 1;
  const PAGE_SIZE = 10;
  const $ = id => document.getElementById(id);

  /* ---------- Login ---------- */
  const loginScreen = $('login-screen');
  if (localStorage.getItem(STORAGE_KEYS.RH_LOGGED) === 'true') loginScreen.style.display = 'none';

  $('login-form').addEventListener('submit', e => {
    e.preventDefault();
    if ($('login-email').value.trim() === 'rh@aes.com' && $('login-pass').value.trim() === 'aes2026') {
      localStorage.setItem(STORAGE_KEYS.RH_LOGGED, 'true');
      loginScreen.style.display = 'none';
      toast('Sessão autenticada. Bem-vindo(a) ao painel RH.');
    } else {
      $('login-error').textContent = 'Credenciais inválidas. Use rh@aes.com / aes2026.';
    }
  });
  $('btn-logout').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEYS.RH_LOGGED);
    location.reload();
  });

  /* ---------- Navegação ---------- */
  function showTab(id) {
    document.querySelectorAll('.side-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
    document.querySelectorAll('.tab-view').forEach(v => v.classList.toggle('show', v.id === id));
    refreshAll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  document.querySelectorAll('.side-btn').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => showTab(b.dataset.goto)));

  $('btn-reset-demo').addEventListener('click', () => {
    if (!confirm('Restaurar todos os dados fictícios para o estado inicial?')) return;
    resetDemoData();
    page = 1;
    populateFilters();
    refreshAll();
    toast('Dados de demonstração restaurados.');
  });

  /* ---------- Filtros / selects ---------- */
  const fSearch = $('f-search'), fSector = $('f-sector'), fJob = $('f-job'), fStage = $('f-stage');

  function populateFilters() {
    const jobs = getJobs();
    fSector.innerHTML = '<option value="">Todas as áreas</option>' + SECTORS.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
    fJob.innerHTML = '<option value="">Todas as vagas</option>' + jobs.map(j => `<option value="${esc(j.id)}">${esc(j.title)}</option>`).join('');
    fStage.innerHTML = '<option value="">Todas as etapas</option>' + STAGES.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
    $('m-stage').innerHTML = STAGES.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
    $('k-job').innerHTML = '<option value="">Todas as vagas</option>' + jobs.map(j => `<option value="${esc(j.id)}">${esc(j.title)}</option>`).join('');
    $('nj-sector').innerHTML = SECTORS.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
  }
  populateFilters();

  /* ---------- Dashboard ---------- */
  const ICONS = {
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 13h18"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    check: '<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="M22 4L12 14l-3-3"/>'
  };
  const kpi = (icon, label, value, sub, color) =>
    `<div class="card kpi" style="--kc:${color}"><div class="ico"><svg viewBox="0 0 24 24">${ICONS[icon]}</svg></div><small>${label}</small><strong>${value}</strong><div class="sub">${sub}</div></div>`;

  function donut(segments, total) {
    const r = 54, C = 2 * Math.PI * r;
    let acc = 0;
    const arcs = segments.filter(s => s.value > 0).map(s => {
      const len = (s.value / total) * C;
      const el = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${s.color}" stroke-width="18" stroke-dasharray="${len - 2} ${C - len + 2}" stroke-dashoffset="${-acc}" />`;
      acc += len;
      return el;
    }).join('');
    return `
      <div class="donut-wrap">
        <svg width="150" height="150" viewBox="0 0 140 140" style="flex-shrink:0;transform:rotate(-90deg)">
          <circle cx="70" cy="70" r="${r}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="18"/>${arcs}
          <g style="transform:rotate(90deg);transform-origin:70px 70px"><text x="70" y="68" text-anchor="middle" fill="#fff" font-size="26" font-family="Fraunces,serif" font-weight="600">${total}</text><text x="70" y="86" text-anchor="middle" fill="#8ea0bf" font-size="9" letter-spacing="1.5">CANDIDATOS</text></g>
        </svg>
        <div class="donut-legend">${segments.map(s => `<div><i style="background:${s.color}"></i>${esc(s.label)}<b>${s.value}</b></div>`).join('')}</div>
      </div>`;
  }

  function renderDashboard() {
    const cands = getCandidates();
    const interviews = getInterviews();
    const jobs = getJobs();
    const avg = cands.length ? Math.round(cands.reduce((a, b) => a + b.score, 0) / cands.length) : 0;
    const hired = cands.filter(c => c.stage === 'Contratado').length;
    const rate = cands.length ? ((hired / cands.length) * 100).toFixed(1).replace('.', ',') : '0';

    $('dash-date').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('nav-count-cands').textContent = cands.length;
    $('nav-count-jobs').textContent = jobs.length;

    $('kpi-cards').innerHTML =
      kpi('users', 'Total de candidatos', cands.length, `${cands.filter(c => c.stage === 'Triagem').length} aguardando triagem`, '#19d3bd') +
      kpi('brief', 'Vagas ativas', jobs.length, `${SECTORS.length} setores`, '#5b9dff') +
      kpi('target', 'Aderência média', `${avg}%`, 'indicativa, nunca eliminatória', '#e6c27a') +
      kpi('check', 'Contratados', hired, `${rate}% de conversão · ${interviews.length} entrevistas`, '#8b7bff');

    const counts = STAGES.map(s => cands.filter(c => c.stage === s).length);
    const max = Math.max(...counts, 1);
    $('funnel-total').textContent = `${cands.length} no processo`;
    $('funnel-bars').innerHTML = STAGES.map((s, i) => `
      <div class="funnel-row">
        <div class="funnel-label"><span>${esc(s)}</span><strong>${counts[i]}</strong></div>
        <div class="funnel-track"><div class="funnel-fill" style="width:${Math.round((counts[i] / max) * 100)}%;background:linear-gradient(90deg,${STAGE_COLORS[s]}88,${STAGE_COLORS[s]})"></div></div>
      </div>`).join('');

    // Siuan resumo
    const level = localStorage.getItem(STORAGE_KEYS.SIUAN_LEVEL) || '1';
    $('dash-siuan-badge').textContent = `Autonomia nível ${level}`;
    const tri = cands.filter(c => c.stage === 'Triagem');
    const top = [...cands].sort((a, b) => b.score - a.score)[0];
    const heavy = [...jobs].map(j => ({ j, n: tri.filter(c => c.jobId === j.id).length })).sort((a, b) => b.n - a.n)[0];
    $('dash-siuan-summary').innerHTML = `
      <p>• Há <strong>${tri.length} candidato(s)</strong> aguardando revisão humana na Triagem.</p>
      <p>• Maior aderência documental: <strong>${top ? `${esc(top.name)} (${top.score}% · ${esc(getJobById(top.jobId).title)})` : 'N/A'}</strong>.</p>
      ${heavy && heavy.n ? `<p>• Maior fila de triagem: <strong>${esc(heavy.j.title)}</strong> (${heavy.n}).</p>` : ''}
      <p style="color:#8ea0bf;font-size:.8rem"><em>Governança: métricas baseadas apenas em competências declaradas versus requisitos da vaga.</em></p>`;

    // Donut por setor
    const segs = SECTORS.map(s => ({ label: s, color: SECTOR_COLORS[s], value: cands.filter(c => getJobById(c.jobId).sector === s).length }));
    $('donut-sector').innerHTML = cands.length ? donut(segs, cands.length) : '<div class="empty">Sem dados.</div>';

    // Ranking
    $('top-cands').innerHTML = [...cands].sort((a, b) => b.score - a.score).slice(0, 5).map(c => `
      <div class="rank-item" data-open="${esc(c.id)}">${avatarHtml(c.name)}
        <div class="who"><b>${esc(c.name)}</b><small>${esc(getJobById(c.jobId).title)}</small></div>
        <span class="badge" style="color:${scoreColor(c.score)}">${c.score}%</span>
      </div>`).join('') || '<div class="empty">Sem candidatos.</div>';

    $('next-interviews').innerHTML = [...interviews].sort((a, b) => a.datetime.localeCompare(b.datetime)).slice(0, 4).map(i => `
      <div class="rank-item">${avatarHtml(i.candidateName)}
        <div class="who"><b>${esc(i.candidateName)}</b><small>${esc(i.datetime)} · ${esc(i.mode)}</small></div>
      </div>`).join('') || '<div class="empty">Nenhuma entrevista agendada.</div>';
  }

  document.addEventListener('click', e => {
    const r = e.target.closest('[data-open]');
    if (r) openCandidateModal(r.dataset.open);
  });

  /* ---------- Candidatos ---------- */
  function getFilteredCandidates() {
    const q = fSearch.value.trim().toLowerCase();
    return getCandidates().filter(c => {
      const j = getJobById(c.jobId);
      return (!q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || (c.skills || '').toLowerCase().includes(q)) &&
        (!fSector.value || j.sector === fSector.value) &&
        (!fJob.value || c.jobId === fJob.value) &&
        (!fStage.value || c.stage === fStage.value);
    });
  }

  function renderCandidatesTable() {
    const rows = getFilteredCandidates();
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    page = Math.min(page, pages);
    const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    $('cands-sub').textContent = `${rows.length} candidato(s) encontrados`;
    $('pager-info').textContent = rows.length ? `Mostrando ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + slice.length} de ${rows.length} · página ${page}/${pages}` : '';
    $('pg-prev').disabled = page <= 1;
    $('pg-next').disabled = page >= pages;

    $('candidates-tbody').innerHTML = slice.length ? slice.map(c => {
      const j = getJobById(c.jobId);
      return `
        <tr>
          <td><code>${esc(c.id)}</code></td>
          <td><div class="cell-person">${avatarHtml(c.name)}<div><b>${esc(c.name)}</b><small>${esc(c.email)}</small></div></div></td>
          <td>${esc(j.title)}<br><span class="badge blue" style="margin-top:4px">${esc(j.sector)}</span></td>
          <td><div class="score"><b>${c.score}%</b><div class="bar"><i style="width:${c.score}%;background:${scoreColor(c.score)}"></i></div></div></td>
          <td>${stageBadge(c.stage)}</td>
          <td><button class="btn btn-outline btn-sm" data-open="${esc(c.id)}">Abrir ficha</button></td>
        </tr>`;
    }).join('') : `<tr><td colspan="6" class="empty">Nenhum candidato encontrado com os filtros atuais.</td></tr>`;
  }

  [fSearch, fSector, fJob, fStage].forEach(el => el.addEventListener('input', () => { page = 1; renderCandidatesTable(); }));
  $('pg-prev').addEventListener('click', () => { page--; renderCandidatesTable(); });
  $('pg-next').addEventListener('click', () => { page++; renderCandidatesTable(); });

  function openCandidateModal(id) {
    const c = getCandidates().find(x => x.id === id);
    if (!c) return;
    activeCandidateId = id;
    const j = getJobById(c.jobId);
    $('m-title').textContent = c.name;
    $('m-details').innerHTML = `
      <div style="display:flex;gap:14px;align-items:center;margin-bottom:18px"><span class="mini-av" style="width:56px;height:56px;font-size:1.1rem;background:${avatarBg(c.name)}">${esc(initials(c.name))}</span>
        <div><code>${esc(c.id)}</code> ${stageBadge(c.stage)}<div style="color:#8ea0bf;font-size:.85rem;margin-top:4px">Inscrito em ${esc(c.date)}</div></div></div>
      <div class="detail-grid">
        <div class="detail full"><small>Vaga</small><span>${esc(j.title)} · ${esc(j.sector)} · ${esc(j.model)}</span></div>
        <div class="detail"><small>E-mail</small><span>${esc(c.email)}</span></div>
        <div class="detail"><small>Telefone</small><span>${esc(c.phone)}</span></div>
        <div class="detail full"><small>Evidências / competências</small><span>${esc(c.skills)}</span></div>
        <div class="detail"><small>Currículo</small><span>${esc(c.resume)}</span></div>
        <div class="detail"><small>Aderência técnica (indicativa)</small><span style="color:${scoreColor(c.score)};font-weight:700">${c.score}%</span></div>
      </div>`;
    $('m-stage').value = c.stage;
    $('m-notes').value = c.notes || '';
    $('cand-modal').classList.add('open');
  }
  window.openCandidateModal = openCandidateModal;

  const closeCand = () => $('cand-modal').classList.remove('open');
  $('m-close').addEventListener('click', closeCand);
  $('cand-modal').addEventListener('click', e => { if (e.target.id === 'cand-modal') closeCand(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeCand(); $('job-modal').classList.remove('open'); } });

  $('m-save').addEventListener('click', () => {
    const list = getCandidates();
    const c = list.find(x => x.id === activeCandidateId);
    if (c) {
      c.stage = $('m-stage').value;
      c.notes = $('m-notes').value;
      saveCandidates(list);
      toast('Ficha atualizada.');
    }
    closeCand();
    refreshAll();
  });
  $('m-delete').addEventListener('click', () => {
    if (!confirm('Deseja realmente excluir esta candidatura?')) return;
    saveCandidates(getCandidates().filter(c => c.id !== activeCandidateId));
    closeCand();
    refreshAll();
    toast('Candidatura excluída.');
  });

  $('btn-export-csv').addEventListener('click', () => {
    const q = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const header = ['Protocolo', 'Nome', 'Email', 'Telefone', 'Vaga', 'Setor', 'Etapa', 'Aderencia', 'Skills', 'Data'];
    const lines = [header.map(q).join(';')].concat(getFilteredCandidates().map(c => {
      const j = getJobById(c.jobId);
      return [c.id, c.name, c.email, c.phone, j.title, j.sector, c.stage, `${c.score}%`, c.skills, c.date].map(q).join(';');
    }));
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'aes_talent_candidatos.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Exportação CSV gerada.');
  });

  /* ---------- Kanban (com drag & drop) ---------- */
  const KANBAN_LIMIT = 12;
  function renderKanban() {
    const jobId = $('k-job').value;
    const cands = getCandidates().filter(c => !jobId || c.jobId === jobId).sort((a, b) => b.score - a.score);
    $('kanban-board').innerHTML = STAGES.map((stage, si) => {
      const col = cands.filter(c => c.stage === stage);
      return `
        <div class="kcol" data-stage="${esc(stage)}">
          <h4><span>${esc(stage)}</span><span>${col.length}</span></h4>
          <div class="stripe" style="background:${STAGE_COLORS[stage]}"></div>
          ${col.slice(0, KANBAN_LIMIT).map(c => `
            <div class="kcard" draggable="true" data-id="${esc(c.id)}">
              <div class="top">${avatarHtml(c.name)}<div style="min-width:0"><b>${esc(c.name)}</b><code style="font-size:.68rem">${esc(c.id)}</code></div></div>
              <small>${esc(getJobById(c.jobId).title)}</small>
              <div class="foot">
                <span class="badge" style="color:${scoreColor(c.score)}">${c.score}%</span>
                <div class="arrows">
                  ${si > 0 ? `<button class="btn btn-outline btn-sm" data-move="${esc(c.id)}" data-dir="-1" title="Voltar etapa">←</button>` : ''}
                  <button class="btn btn-outline btn-sm" data-open="${esc(c.id)}" title="Abrir ficha">⋯</button>
                  ${si < STAGES.length - 1 ? `<button class="btn btn-primary btn-sm" data-move="${esc(c.id)}" data-dir="1" title="Avançar etapa">→</button>` : ''}
                </div>
              </div>
            </div>`).join('')}
          ${col.length > KANBAN_LIMIT ? `<div class="more-note">+ ${col.length - KANBAN_LIMIT} candidatos (filtre por vaga)</div>` : ''}
          ${!col.length ? '<div class="more-note">Sem candidatos</div>' : ''}
        </div>`;
    }).join('');
  }
  $('k-job').addEventListener('input', renderKanban);

  function moveCandidate(id, stage) {
    const list = getCandidates();
    const c = list.find(x => x.id === id);
    if (!c || c.stage === stage || !STAGES.includes(stage)) return;
    c.stage = stage;
    saveCandidates(list);
    refreshAll();
    toast(`${c.name} movido(a) para ${stage}.`);
  }

  const board = $('kanban-board');
  board.addEventListener('click', e => {
    const b = e.target.closest('[data-move]');
    if (!b) return;
    const c = getCandidates().find(x => x.id === b.dataset.move);
    if (!c) return;
    const idx = STAGES.indexOf(c.stage) + Number(b.dataset.dir);
    if (idx >= 0 && idx < STAGES.length) moveCandidate(c.id, STAGES[idx]);
  });
  let dragId = null;
  board.addEventListener('dragstart', e => {
    const k = e.target.closest('.kcard');
    if (!k) return;
    dragId = k.dataset.id;
    k.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragId);
  });
  board.addEventListener('dragend', () => { dragId = null; board.querySelectorAll('.dragging,.over').forEach(el => el.classList.remove('dragging', 'over')); });
  board.addEventListener('dragover', e => { const col = e.target.closest('.kcol'); if (col) { e.preventDefault(); col.classList.add('over'); } });
  board.addEventListener('dragleave', e => { const col = e.target.closest('.kcol'); if (col && !col.contains(e.relatedTarget)) col.classList.remove('over'); });
  board.addEventListener('drop', e => {
    const col = e.target.closest('.kcol');
    if (!col || !dragId) return;
    e.preventDefault();
    moveCandidate(dragId, col.dataset.stage);
  });

  /* ---------- Vagas ---------- */
  function renderRhJobs() {
    const cands = getCandidates();
    $('rh-jobs').innerHTML = getJobs().map(j => {
      const mine = cands.filter(c => c.jobId === j.id);
      return `
        <div class="card hover job-admin">
          <div style="display:flex;justify-content:space-between;align-items:center"><code>${esc(j.id)}</code><div class="meta"><span class="badge" style="color:${SECTOR_COLORS[j.sector] || '#19d3bd'}">${esc(j.sector)}</span><span class="badge blue">${esc(j.model)}</span></div></div>
          <h3>${esc(j.title)}</h3>
          <div class="sal">${esc(j.salary)}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">${(j.reqs || []).map(r => `<span class="badge" style="text-transform:none;letter-spacing:0;font-weight:500">${esc(r)}</span>`).join('')}</div>
          <div class="cnt"><span>Inscritos<br><small>${mine.filter(c => c.stage === 'Contratado').length} contratado(s)</small></span><b>${mine.length}</b></div>
        </div>`;
    }).join('');
  }

  const jobModal = $('job-modal');
  $('btn-open-new-job').addEventListener('click', () => jobModal.classList.add('open'));
  $('job-close').addEventListener('click', () => jobModal.classList.remove('open'));
  jobModal.addEventListener('click', e => { if (e.target === jobModal) jobModal.classList.remove('open'); });
  $('new-job-form').addEventListener('submit', e => {
    e.preventDefault();
    const jobs = getJobs();
    let n = jobs.length + 1;
    while (jobs.some(j => j.id === `V${String(n).padStart(2, '0')}`)) n++;
    const id = `V${String(n).padStart(2, '0')}`;
    jobs.push({
      id,
      title: $('nj-title').value.trim(),
      sector: $('nj-sector').value,
      salary: $('nj-salary').value.trim(),
      model: $('nj-model').value,
      reqs: $('nj-reqs').value.split(',').map(s => s.trim()).filter(Boolean)
    });
    saveJobs(jobs);
    jobModal.classList.remove('open');
    e.target.reset();
    populateFilters();
    refreshAll();
    toast(`Vaga ${id} publicada no portal de carreiras.`);
  });

  /* ---------- Entrevistas ---------- */
  function renderInterviews() {
    const list = [...getInterviews()].sort((a, b) => a.datetime.localeCompare(b.datetime));
    $('interviews-list').innerHTML = list.length ? list.map(i => `
      <div class="card hover">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span class="badge violet">${esc(i.datetime)}</span><small style="color:var(--teal)">${esc(i.mode)}</small></div>
        <div class="cell-person">${avatarHtml(i.candidateName)}<div><b>${esc(i.candidateName)}</b><small>${esc(i.jobTitle)}</small></div></div>
        <p style="font-size:.84rem;margin-top:12px">Entrevistador(a): <strong style="color:#fff">${esc(i.interviewer)}</strong></p>
      </div>`).join('') : '<div class="empty">Nenhuma entrevista agendada.</div>';
  }

  function nextSlot(taken) {
    const d = new Date();
    for (let step = 0; step < 60; step++) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      for (const h of [9, 10, 11, 14, 15, 16]) {
        const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(h).padStart(2, '0')}:00`;
        if (!taken.has(s)) return s;
      }
    }
    return '2026-12-01 10:00';
  }

  $('btn-siuan-schedule').addEventListener('click', () => {
    const cands = getCandidates();
    const interviews = getInterviews();
    const target = cands
      .filter(c => c.stage === 'Entrevista RH' && !interviews.some(i => i.candidateId === c.id))
      .sort((a, b) => b.score - a.score)[0] || cands.find(c => !interviews.some(i => i.candidateId === c.id) && c.stage !== 'Contratado');
    if (!target) { toast('Não há candidatos elegíveis para agendamento.', 'err'); return; }

    const job = getJobById(target.jobId);
    const slot = nextSlot(new Set(interviews.map(i => i.datetime)));
    if (!confirm(`Siuan sugere entrevista com ${target.name} (${job.title}) em ${slot}.\n\nConfirmar agendamento?`)) return;

    let n = interviews.length + 1;
    while (interviews.some(i => i.id === `INT-${String(n).padStart(2, '0')}`)) n++;
    interviews.unshift({
      id: `INT-${String(n).padStart(2, '0')}`,
      candidateId: target.id,
      candidateName: target.name,
      jobTitle: job.title,
      datetime: slot,
      interviewer: `Gestor ${job.sector} + RH`,
      mode: job.model === 'Presencial' ? 'Presencial - Sede AES' : 'Online (Meet)'
    });
    saveInterviews(interviews);
    $('schedule-feedback').innerHTML = `
      <div class="siuan-box"><div class="siuan-head" style="margin:0"><div class="siuan-orb"></div><div><b>Agendamento sugerido pela Siuan · confirmado pelo RH</b>
      <small>Horário reservado para ${esc(target.name)} (${esc(job.title)}) em ${esc(slot)}.</small></div></div></div>`;
    renderInterviews();
    renderDashboard();
    toast('Entrevista agendada.');
  });

  /* ---------- Agente Siuan ---------- */
  const chatLog = $('siuan-chat-log');
  const savedLevel = localStorage.getItem(STORAGE_KEYS.SIUAN_LEVEL) || '1';
  const LEVEL_NOTE = {
    '1': 'Nível 1 (informativo): apenas dados, sem recomendações.',
    '2': 'Nível 2 (sugestivo): recomendações para decisão do RH.',
    '3': 'Nível 3 (copiloto ativo): ações preparadas, sempre confirmadas por um analista.'
  };
  document.querySelectorAll('input[name="siuan-level"]').forEach(r => {
    r.checked = r.value === savedLevel;
    r.addEventListener('change', () => {
      localStorage.setItem(STORAGE_KEYS.SIUAN_LEVEL, r.value);
      renderDashboard();
      addMsg('bot', `Autonomia alterada. <small>${LEVEL_NOTE[r.value]}</small>`);
    });
  });

  function addMsg(who, html) {
    chatLog.insertAdjacentHTML('beforeend', `<div class="msg ${who}">${html}</div>`);
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  addMsg('bot', `Olá! Sou a <strong>Siuan</strong>, operando no <strong>nível ${savedLevel}</strong>. Escolha uma consulta acima para analisar o banco atual.`);

  const PROMPT_LABELS = { evidencias: 'Analisar evidências de TI', gargalos: 'Identificar gargalos do funil', roteiro: 'Gerar roteiro de entrevista', etica: 'Auditoria ética & LGPD' };

  document.querySelectorAll('.siuan-prompt').forEach(btn => btn.addEventListener('click', () => {
    const cands = getCandidates();
    const level = Number(localStorage.getItem(STORAGE_KEYS.SIUAN_LEVEL) || '1');
    const q = btn.dataset.q;
    let answer = '';

    if (q === 'evidencias') {
      const ti = cands.filter(c => getJobById(c.jobId).sector === 'TI').sort((a, b) => b.score - a.score);
      answer = `<strong>Evidências do setor TI · ${ti.length} perfis</strong><br>` +
        ti.slice(0, 5).map(c => `• <strong>${esc(c.name)}</strong> (${esc(getJobById(c.jobId).title)}): <em>${esc(c.skills)}</em> · aderência documental ${c.score}%`).join('<br>') +
        `<br><small>Exibindo os 5 maiores de ${ti.length}.</small>` +
        (level >= 2 ? `<br><small>Sugestão: validar a profundidade prática dessas competências na entrevista técnica.</small>` : '');
    } else if (q === 'gargalos') {
      const tri = cands.filter(c => c.stage === 'Triagem');
      const byJob = getJobs().map(j => ({ j, n: tri.filter(c => c.jobId === j.id).length })).filter(x => x.n).sort((a, b) => b.n - a.n).slice(0, 3);
      answer = `<strong>Diagnóstico de fluxo</strong><br>${tri.length} candidatura(s) em Triagem. Maiores filas: ` +
        (byJob.map(x => `<strong>${esc(x.j.title)}</strong> (${x.n})`).join(', ') || 'nenhuma') + '.' +
        (level >= 2 ? `<br><small>Sugestão: priorizar a revisão humana dessas filas para manter o SLA de resposta em até 48h.</small>` : '') +
        (level >= 3 ? `<br><small>Ação preparada: abrir o Kanban filtrado pela vaga com maior fila (aguarda confirmação).</small>` : '');
    } else if (q === 'roteiro') {
      answer = `<strong>Roteiro estruturado por competências</strong><br>1. Peça um exemplo concreto de entrega com as ferramentas citadas no currículo.<br>2. Explore resolução de problemas sob restrição de prazo.<br>3. Investigue trabalho em equipe e comunicação com áreas não técnicas.<br>4. Alinhe expectativas de modelo de trabalho e faixa salarial.<br>5. Encerre com perguntas do candidato.`;
    } else {
      answer = `<strong>Auditoria ética &amp; LGPD</strong><br>✓ 0 reprovações automáticas executadas.<br>✓ 100% das pontuações derivam da correspondência entre requisitos e competências declaradas.<br>✓ Nenhum dado sensível coletado ou inferido.<br>✓ ${cands.length} registros revisáveis por analista humano.`;
    }
    addMsg('me', esc(PROMPT_LABELS[q]));
    setTimeout(() => addMsg('bot', answer), 350);
  }));

  /* ---------- Relatórios ---------- */
  function renderReports() {
    const cands = getCandidates();
    $('sector-report').innerHTML = SECTORS.map(sec => {
      const n = cands.filter(c => getJobById(c.jobId).sector === sec).length;
      const pct = cands.length ? Math.round((n / cands.length) * 100) : 0;
      return `<div class="funnel-row"><div class="funnel-label"><span>${esc(sec)}</span><span><strong>${n}</strong> · ${pct}%</span></div>
        <div class="funnel-track"><div class="funnel-fill" style="width:${pct}%;background:linear-gradient(90deg,${SECTOR_COLORS[sec]}88,${SECTOR_COLORS[sec]})"></div></div></div>`;
    }).join('');

    $('matrix-head').innerHTML = `<tr><th>Setor</th>${STAGES.map(s => `<th>${esc(s)}</th>`).join('')}<th>Total</th></tr>`;
    $('matrix-body').innerHTML = SECTORS.map(sec => {
      const inSec = cands.filter(c => getJobById(c.jobId).sector === sec);
      return `<tr><td><strong style="color:#fff">${esc(sec)}</strong></td>${STAGES.map(s => `<td>${inSec.filter(c => c.stage === s).length}</td>`).join('')}<td><strong>${inSec.length}</strong></td></tr>`;
    }).join('');
  }

  /* ---------- Orquestração ---------- */
  function refreshAll() {
    renderDashboard();
    renderCandidatesTable();
    renderKanban();
    renderRhJobs();
    renderInterviews();
    renderReports();
  }
  refreshAll();
});
