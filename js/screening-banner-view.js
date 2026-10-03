// Rendering can be previewed without touching the broadcast or authentication.
export function createScreeningBanner(root = document) {
  // The design system's header (.nda-header) takes the system's banner (nda-banner); older pages keep theirs.
  const nav = root.querySelector('.nda-header') || root.querySelector('.site-nav');
  const designHeader = nav.classList.contains('nda-header');
  const bar = root.createElement('aside');
  bar.className = designHeader ? 'nda-banner' : 'screening-banner'; bar.hidden = true;
  bar.setAttribute('aria-label', 'Screening announcement');
  const copy = root.createElement('p');
  copy.setAttribute('role', 'status');
  const badge = root.createElement('strong');
  const detail = root.createElement('span');
  copy.append(badge, detail);
  const action = root.createElement('a');
  action.href = '/cinema.html'; action.textContent = 'Open Cinema →';
  if (designHeader) { action.className = 'nda-banner__action'; copy.insertBefore(root.createTextNode(' '), detail); }
  bar.append(copy, action);
  nav.after(bar);
  const measure = () => {
    root.documentElement.style.setProperty('--academy-nav-height', nav.getBoundingClientRect().height + 'px');
    root.documentElement.style.setProperty('--screening-banner-height', (bar.hidden ? 0 : bar.getBoundingClientRect().height) + 'px');
  };
  const observer = new ResizeObserver(measure);
  observer.observe(bar); observer.observe(nav);
  return {
    render(state) {
      bar.hidden = !state;
      if (state) {
        if (badge.textContent !== state.label) badge.textContent = state.label;
        const message = 'Sex, and/or Love · 10 p.m.–2 a.m. Eastern';
        if (detail.textContent !== message) detail.textContent = message;
      }
      measure();
    }
  };
}
