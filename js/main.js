/* ============================================================
   NETA DAO — Shared JavaScript
   - Mobile nav toggle
   - Scroll reveal
   - DAO DAO governance proposal loader
   ============================================================ */

// ── Mobile nav ──────────────────────────────────────────────
const hamburger = document.querySelector('.nav-hamburger');
const navLinks  = document.querySelector('.nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// ── Scroll reveal ────────────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => observer.observe(el));
}

// ── DAO DAO Governance Loader ────────────────────────────────
const DAO_ADDRESS = 'juno1c5v6jkmre5xa9vf9aas6yxewc7aqmjy0rlkkyk4d88pnwuhclyhsrhhns6';
const INDEXER_BASE = 'https://indexer.daodao.zone/juno-1';

async function loadProposals(containerSelector, limit = 10) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = '<p class="proposals-loading">Loading proposals from chain…</p>';

  try {
    // Fetch proposal modules first
    const modulesRes = await fetch(
      `${INDEXER_BASE}/contract/${DAO_ADDRESS}/daoCore/activeProposalModules`
    );
    if (!modulesRes.ok) throw new Error('Could not fetch proposal modules');
    const modules = await modulesRes.json();

    let allProposals = [];

    for (const mod of modules) {
      const propRes = await fetch(
        `${INDEXER_BASE}/contract/${mod.address}/daoProposalSingle/proposals?limit=${limit}&order=desc`
      );
      if (!propRes.ok) continue;
      const data = await propRes.json();
      const proposals = Array.isArray(data) ? data : (data.proposals || []);
      allProposals = allProposals.concat(proposals.map(p => ({
        ...p,
        moduleAddress: mod.address,
        modulePrefix: mod.prefix || ''
      })));
    }

    if (!allProposals.length) {
      container.innerHTML = '<p class="proposals-loading">No proposals found on-chain.</p>';
      return;
    }

    // Sort by id desc
    allProposals.sort((a, b) => (b.id || 0) - (a.id || 0));
    const shown = allProposals.slice(0, limit);

    container.innerHTML = shown.map(p => {
      const status = p.proposal?.status || p.status || 'unknown';
      const title  = p.proposal?.title || p.title || 'Untitled Proposal';
      const id     = p.id ?? '—';
      const prefix = p.modulePrefix || '';
      const date   = p.proposal?.start_height
        ? `Block ${p.proposal.start_height}`
        : (p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', {year:'numeric',month:'short',day:'numeric'}) : '');

      const badgeClass = {
        passed:   'badge-passed',
        rejected: 'badge-failed',
        failed:   'badge-failed',
        open:     'badge-open',
        voting_open: 'badge-open',
        executed: 'badge-executed',
      }[status.toLowerCase()] || 'badge-open';

      const daoLink = `https://daodao.zone/dao/${DAO_ADDRESS}/proposals/${prefix}${id}`;

      return `
        <a href="${daoLink}" target="_blank" rel="noopener" class="proposal-item">
          <span class="proposal-num">${prefix}${id}</span>
          <span>
            <div class="proposal-title">${escHtml(title)}</div>
            <div class="proposal-meta">${date}</div>
          </span>
          <span class="badge ${badgeClass}">${status.replace(/_/g,' ')}</span>
        </a>`;
    }).join('');

  } catch (err) {
    console.error('Proposal load error:', err);
    container.innerHTML = `
      <p class="proposals-loading">
        Could not load live proposals. 
        <a href="https://daodao.zone/dao/${DAO_ADDRESS}/proposals" 
           target="_blank" rel="noopener" 
           style="color:var(--blue)">View on DAO DAO ↗</a>
      </p>`;
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// Export for use on specific pages
window.NetaDAO = { loadProposals };
