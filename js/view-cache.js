// This browser's last copy of a signed-in page's data (Profile, Admin), so a return visit draws at once and the page
// refreshes it behind. Each copy names the account it belongs to. The copies are dropped on sign-out, and whenever a
// page finds no one, or a different account, signed in; a copy older than MAX_AGE is ignored. Never the only source:
// every page re-reads the database as soon as sign-in is confirmed.
const PREFIX = 'nda-view:';
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;

export function readView(name) {
  try {
    const raw = localStorage.getItem(PREFIX + name);
    if (!raw) return null;
    const view = JSON.parse(raw);
    if (!view || typeof view.uid !== 'string' || Date.now() - (view.at || 0) > MAX_AGE) return null;
    return view;   // { uid, at, data }
  } catch { return null; }
}

export function writeView(name, uid, data) {
  try { localStorage.setItem(PREFIX + name, JSON.stringify({ uid, at: Date.now(), data })); } catch { /* storage full or blocked: draw from the network only */ }
}

export function clearViews() {
  try { Object.keys(localStorage).filter(key => key.startsWith(PREFIX)).forEach(key => localStorage.removeItem(key)); } catch { /* nothing to clear */ }
}

// Drop every copy that isn't this account's (or all of them when no one is signed in).
export function keepViewsFor(uid) {
  try {
    for (const key of Object.keys(localStorage).filter(k => k.startsWith(PREFIX))) {
      let owner = null;
      try { owner = JSON.parse(localStorage.getItem(key))?.uid; } catch { /* unreadable: drop it */ }
      if (!uid || owner !== uid) localStorage.removeItem(key);
    }
  } catch { /* storage blocked */ }
}
