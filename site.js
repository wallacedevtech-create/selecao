/* AES — comportamentos do site público */
document.addEventListener('DOMContentLoaded', () => {
  initStorage();

  // Marca
  document.querySelectorAll('[data-brand]').forEach(el => { el.innerHTML = renderBrandLogo(); });

  // Navbar: fundo sólido ao rolar + menu mobile
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('solid', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => links.classList.toggle('open'));
      links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
    }
  }

  // Revelação ao rolar
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // Contadores animados
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const co = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target, end = +el.dataset.count, dur = 1400, t0 = performance.now();
        const tick = now => {
          const p = Math.min((now - t0) / dur, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        co.unobserve(el);
      });
    }, { threshold: .5 });
    counters.forEach(c => co.observe(c));
  }

  // Resumo de vagas por setor (dados reais do localStorage)
  const sectorsEl = document.getElementById('sectors-overview');
  if (sectorsEl) {
    const info = {
      'TI': ['Engenharia de software, dados e segurança cibernética para produtos críticos.', 'M8 9l-4 3 4 3M16 9l4 3-4 3M13.5 6l-3 12'],
      'RH': ['Gestão de pessoas, cultura organizacional e People Analytics.', 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8'],
      'Administrativo': ['Operações financeiras, suprimentos, contratos e suporte corporativo.', 'M3 7h18v13H3zM8 7V4h8v3M3 13h18'],
      'Facilities/Limpeza': ['Bem-estar, conservação e excelência no ambiente de trabalho.', 'M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2 8 12.7 4 8.8 9.5 8z'],
      'Manutenção': ['Infraestrutura predial, elétrica, climatização e prevenção.', 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z']
    };
    sectorsEl.innerHTML = Object.entries(info).map(([sector, [desc, icon]], i) => {
      const count = getJobs().filter(j => j.sector === sector).length;
      return `
        <a class="card hover reveal" data-d="${i % 3}" href="candidaturas.html?setor=${encodeURIComponent(sector)}" style="display:block">
          <div class="icon-box"><svg viewBox="0 0 24 24"><path d="${icon}"/></svg></div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px">
            <h3 style="margin:0">${esc(sector)}</h3><span class="badge">${count} ${count === 1 ? 'vaga' : 'vagas'}</span>
          </div>
          <p>${esc(desc)}</p>
          <span style="display:inline-block;margin-top:14px;font-size:.86rem;font-weight:600;color:var(--teal-700)">Ver oportunidades →</span>
        </a>`;
    }).join('');
    sectorsEl.querySelectorAll('.reveal').forEach(el => requestAnimationFrame(() => el.classList.add('in')));
  }
  const openCount = document.querySelectorAll('[data-open-jobs]');
  openCount.forEach(el => { el.textContent = getJobs().length; });

  // Formulário de contato
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      toast('Mensagem protocolada. Nossa equipe retornará em breve.');
      form.reset();
    });
  }
});
