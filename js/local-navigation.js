// Keep the seminar index below the masthead and any screening announcement.
const rail = document.querySelector('.section-nav');
if (rail) {
  const masthead = document.querySelector('.site-nav');
  const links = [...rail.querySelectorAll('a[href^="#"]')];
  const sections = links.map(link => ({ link, target: document.getElementById(link.hash.slice(1)) })).filter(item => item.target);
  const measure = () => {
    document.documentElement.style.setProperty('--section-nav-height', rail.getBoundingClientRect().height + 'px');
    if (masthead) document.documentElement.style.setProperty('--academy-nav-height', masthead.getBoundingClientRect().height + 'px');
  };
  const resize = new ResizeObserver(measure);
  resize.observe(rail);
  if (masthead) resize.observe(masthead);
  measure();
  let queued = false;
  const update = () => {
    queued = false;
    const bottom = rail.getBoundingClientRect().bottom + 24;
    const active = sections.filter(item => item.target.getBoundingClientRect().top <= bottom).at(-1);
    for (const item of sections) {
      if (item === active) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    }
  };
  addEventListener('scroll', () => {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  addEventListener('hashchange', update);
  update();
}
