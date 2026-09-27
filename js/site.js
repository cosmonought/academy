// Shared public-page navigation and keyboard interaction.
(() => {
  const menu = document.querySelector('.nav-links');
  const toggle = document.querySelector('.nav-hamburger');
  if (menu && toggle) {
    const setOpen = (open) => {
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.classList.contains('open')) {
        setOpen(false);
        toggle.focus();
      }
    });
    matchMedia('(min-width: 761px)').addEventListener('change', () => setOpen(false));
  }

  // Existing disclosure content contains rich markup, so retain its structure
  // while exposing the same activation and state to keyboard users.
  document.querySelectorAll('.collapsible-header, .roadmap-unit[onclick]').forEach((control) => {
    control.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        control.click();
      }
    });
  });
})();

// Time-based gathering navigation; independent of broadcast availability.
import('/js/screening-banner.js?v=3').catch(error => console.warn('Screening announcement unavailable:', error));

import('/js/local-navigation.js?v=1').catch(error => console.warn('Local navigation unavailable:', error));
