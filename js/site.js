// Shared public-page navigation and keyboard interaction.
(() => {

  // Compact live Academy radio player, shared across every site nav.
  const navInner = document.querySelector('.site-nav .nav-inner');
  if (navInner && !navInner.querySelector('.nav-radio')) {
    const STREAM_URL = 'https://stream.rcs.revma.com/fg_on_the_road.mp3';
    const VOLUME_KEY = 'academy-radio-volume';
    const player = document.createElement('div');
    player.className = 'nav-radio';
    player.setAttribute('role', 'group');
    player.setAttribute('aria-label', 'Academy radio');
    player.innerHTML = `
      <button class="nav-radio-button" type="button" aria-label="Play Academy radio" aria-pressed="false" title="Play Academy radio">
        <span class="nav-radio-icon" aria-hidden="true"></span>
      </button>
      <input class="nav-radio-volume" type="range" min="0" max="100" step="5" aria-label="Academy radio volume">
    `;

    const firstNavControl = navInner.querySelector('.nav-links, .nav-hamburger');
    navInner.insertBefore(player, firstNavControl);

    const button = player.querySelector('.nav-radio-button');
    const volumeControl = player.querySelector('.nav-radio-volume');
    const audio = new Audio();
    audio.preload = 'none';

    let volume = 0.7;
    try {
      const storedVolume = Number(localStorage.getItem(VOLUME_KEY));
      if (Number.isFinite(storedVolume) && storedVolume >= 0 && storedVolume <= 1) volume = storedVolume;
    } catch (_) {
      // Storage can be unavailable in privacy-restricted browsing contexts.
    }

    audio.volume = volume;
    volumeControl.value = String(Math.round(volume * 100));

    let playing = false;
    let starting = false;
    let playbackRequest = 0;

    const renderPlaybackState = () => {
      const active = playing || starting;
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', active ? 'Stop Academy radio' : 'Play Academy radio');
      button.title = active ? 'Stop Academy radio' : 'Play Academy radio';
    };

    const stop = () => {
      playbackRequest += 1;
      starting = false;
      playing = false;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      renderPlaybackState();
    };

    const start = async () => {
      const request = ++playbackRequest;
      starting = true;
      renderPlaybackState();
      audio.src = STREAM_URL;
      audio.volume = Number(volumeControl.value) / 100;

      try {
        await audio.play();
        if (request !== playbackRequest) return;
        starting = false;
        playing = true;
        renderPlaybackState();
      } catch (error) {
        if (request !== playbackRequest) return;
        console.warn('Academy radio playback unavailable:', error);
        stop();
      }
    };

    button.addEventListener('click', () => {
      if (playing || starting) stop();
      else start();
    });

    volumeControl.addEventListener('input', () => {
      const nextVolume = Number(volumeControl.value) / 100;
      audio.volume = nextVolume;
      try {
        localStorage.setItem(VOLUME_KEY, String(nextVolume));
      } catch (_) {
        // Volume still works for the current page when storage is unavailable.
      }
    });

    audio.addEventListener('error', () => {
      if (playing || starting) stop();
    });
  }

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


  // One universal Academy colophon. Existing page-specific footer markup is
  // replaced in place; shell pages without a footer receive the same component.
  const legacyFooter = document.querySelector('.site-footer');
  const shellPage = document.querySelector('.site-nav');
  const footer = legacyFooter || (shellPage ? document.createElement('footer') : null);
  if (footer) {
    footer.className = 'site-footer';
    footer.setAttribute('data-site-footer', '');
    footer.innerHTML = `
      <div class="footer-shell">
        <div class="footer-primary">
          <div class="footer-identity">
            <p class="footer-brand">NETA DAO ACADEMY</p>
            <p class="footer-tagline">An educational subDAO of Neta DAO</p>
          </div>
          <nav class="footer-social" aria-label="Neta DAO Academy social and external links">
            <a class="footer-icon-link" href="https://x.com/NetaDAO_Academy" target="_blank" rel="noopener noreferrer" aria-label="Neta DAO Academy on X">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z"/></svg>
            </a>
            <a class="footer-icon-link" href="https://discord.com/invite/gvjC86WXC2" target="_blank" rel="noopener noreferrer" aria-label="Neta DAO Academy Discord">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515c-.074.127-.158.298-.217.432a18.27 18.27 0 0 0-5.487 0 4.64 4.64 0 0 0-.218-.432A19.736 19.736 0 0 0 4.625 4.37 20.02 20.02 0 0 0 1 18.855a19.9 19.9 0 0 0 5.993 3.03 14.62 14.62 0 0 0 1.226-1.994 12.7 12.7 0 0 1-1.93-.934c.162-.12.32-.246.474-.373a14.18 14.18 0 0 0 12.281 0c.155.127.313.252.475.373-.616.366-1.265.68-1.93.934a14.49 14.49 0 0 0 1.225 1.994 19.87 19.87 0 0 0 5.994-3.03A20.03 20.03 0 0 0 20.317 4.37ZM8.02 15.332c-1.17 0-2.128-1.065-2.128-2.366S6.85 10.6 8.02 10.6c1.18 0 2.147 1.075 2.128 2.366 0 1.301-.947 2.366-2.128 2.366Zm7.974 0c-1.17 0-2.128-1.065-2.128-2.366s.958-2.366 2.128-2.366c1.18 0 2.147 1.075 2.128 2.366 0 1.301-.947 2.366-2.128 2.366Z"/></svg>
            </a>
            <a class="footer-icon-link" href="https://netadao.org" target="_blank" rel="noopener noreferrer" aria-label="Neta DAO website">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 3h7v7h-2V6.41l-8.29 8.3-1.42-1.42L17.59 5H14V3Z"/><path fill="currentColor" d="M5 5h6v2H5v12h12v-6h2v8H3V5h2Z"/></svg>
            </a>
          </nav>
        </div>
        <div class="footer-meta">
          <p class="footer-copy">© Neta DAO Academy</p>
          <p class="footer-legal">The materials presented on this site are for informational purposes only and should not be construed as financial advice.</p>
        </div>
      </div>`;
    if (!legacyFooter) document.body.appendChild(footer);
  }
})();

// Time-based gathering navigation; independent of broadcast availability.
import('/js/screening-banner.js?v=3').catch(error => console.warn('Screening announcement unavailable:', error));

import('/js/local-navigation.js?v=1').catch(error => console.warn('Local navigation unavailable:', error));
