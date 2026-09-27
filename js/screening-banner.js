import { bannerState } from './seminar-now.js?v=3';
import { createScreeningBanner } from './screening-banner-view.js?v=2';

if (document.querySelector('.site-nav') && !['/cinema.html', '/admin.html', '/account.html', '/set-password.html'].includes(location.pathname)) {
  const view = createScreeningBanner();
  const tick = () => view.render(bannerState(Date.now()));
  setInterval(tick, 1000);
  document.addEventListener('visibilitychange', tick);
  tick();
}
