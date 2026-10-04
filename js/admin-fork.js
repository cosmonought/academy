// Admin → Fork: registrations of interest from fork.netadao.org/submit.html.
// The journal's form posts to forkInterests (public create-only, Admin-read; see firebase-rules-latest.json).
// Until that rule is deployed, the form falls back to the general interestSignups list with
// source "fork.netadao.org"; those entries are shown here too and kept out of Inquiries.
import { auth, db, onAuthStateChanged, ADMIN_EMAIL } from './academy-auth.js?v=27';
import { ref, get } from 'https://www.gstatic.com/firebasejs/12.17.0/firebase-database.js';
import { readView, writeView } from './view-cache.js';

const SOURCE = 'fork.netadao.org';
const INTERESTS = { submitting: 'Submitting work', editorial: 'Editorial board', reviewing: 'Peer reviewing', updates: 'General updates only' };
const el = id => document.getElementById(id);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = n => String(n).padStart(2, '0');
const when = ms => { if (typeof ms !== 'number') return ''; const d = new Date(ms); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} · ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`; };
let generation = 0, emails = [];

async function list(path, keep) {
  try { const snap = await get(ref(db, path)); return Object.values(snap.val() || {}).filter(r => r && typeof r === 'object' && keep(r)); }
  catch (error) { if (error?.code !== 'PERMISSION_DENIED' && !/permission/i.test(error?.message || '')) console.warn(`Could not read ${path}:`, error); return null; }
}

function cell(tr, text) { const td = document.createElement('td'); td.textContent = text; tr.append(td); }

async function load() {
  const request = ++generation, uid = auth.currentUser?.uid;
  if (!el('forkTableBody').children.length) el('forkStatusLine').textContent = 'Loading…';
  const [own, early] = await Promise.all([list('forkInterests', () => true), list('interestSignups', r => r.source === SOURCE)]);
  if (request !== generation) return;
  if (own === null && early === null) { el('forkStatusLine').textContent = 'Could not load Fork registrations. Please try again.'; return; }
  const rows = [...(own || []), ...(early || [])].sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
  render(rows, own !== null);
  if (uid) writeView('admin-fork', uid, { rows, ruleLive: own !== null });
}

function render(rows, ruleLive) {
  const status = el('forkStatusLine'), body = el('forkTableBody');
  body.replaceChildren(); emails = [];
  for (const r of rows) {
    const tr = document.createElement('tr');
    cell(tr, r.name || ''); cell(tr, r.email || ''); cell(tr, INTERESTS[r.interest] || r.interest || '—'); cell(tr, r.area || '—'); cell(tr, when(r.submittedAt));
    body.append(tr);
    if (r.email && !emails.includes(r.email)) emails.push(r.email);
  }
  const counts = Object.entries(INTERESTS).map(([key, label]) => [label, rows.filter(r => r.interest === key).length]).filter(([, n]) => n);
  status.textContent = rows.length
    ? `${rows.length} registration${rows.length === 1 ? '' : 's'}` + (counts.length ? ' · ' + counts.map(([label, n]) => `${n} ${label.toLowerCase()}`).join(' · ') : '') + '.'
    : 'No registrations yet.';
  el('forkCopyBtn').disabled = !emails.length;
  el('forkRuleNote').hidden = ruleLive;   // the forkInterests rule isn't live yet: entries arrive through the general list
}

// before sign-in is confirmed: this browser's last copy (Admin shows it, inert, until sign-in confirms the account)
{
  const cached = readView('admin-fork');
  if (cached?.data?.rows) render(cached.data.rows, cached.data.ruleLive !== false);
}

el('forkRefreshBtn').addEventListener('click', load);
el('forkCopyBtn').addEventListener('click', async () => {
  const note = el('forkCopyStatus');
  try { await navigator.clipboard.writeText(emails.join(', ')); note.textContent = `${emails.length} address${emails.length === 1 ? '' : 'es'} copied.`; }
  catch { note.textContent = 'Could not copy. Select the addresses in the table instead.'; }
});
onAuthStateChanged(auth, user => {
  generation++;
  if (user?.email === ADMIN_EMAIL && user.emailVerified) load();
  else { el('forkTableBody').replaceChildren(); emails = []; }
});
