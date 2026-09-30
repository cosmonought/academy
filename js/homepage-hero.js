const SEEN_KEY = 'academy-home-intro-v2';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const words = [
  'Philosophy', 'History of Science', 'Psychoanalysis', 'Sociology',
  'Literary Theory', 'Art History', 'Law', 'Performance Studies',
  'Economics', 'Museology', 'Critical Theory', 'Religion',
  'Visual Studies', 'Politics', 'History of Technology',
  'Anthropology', 'Governance', 'Spirituality', 'Social Theory',
  'Science', 'Ethics', 'Civics', 'Design', 'Thought'
];

function hasSeenIntro() {
  try { return localStorage.getItem(SEEN_KEY) === '1'; }
  catch (_) { return false; }
}
function rememberIntro() {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch (_) {}
}

if (!reducedMotion.matches && !hasSeenIntro()) {
  const splash = document.createElement('div');
  splash.className = 'academy-intro-splash';
  splash.innerHTML = `
    <canvas class="academy-intro-canvas" aria-hidden="true"></canvas>
    <div class="academy-intro-copy" aria-hidden="true">
      <div class="academy-intro-brand">Neta DAO <span>Academy</span></div>
      <div class="academy-intro-line">The home of Web3 and</div>
      <div class="academy-intro-word" data-intro-word>Philosophy</div>
    </div>
    <button type="button" class="academy-intro-skip">Skip intro</button>
  `;
  document.body.prepend(splash);
  document.documentElement.classList.add('academy-intro-running');

  const canvas = splash.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const wordNode = splash.querySelector('[data-intro-word]');
  const skip = splash.querySelector('.academy-intro-skip');
  let stopped = false;
  let timer = null;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize, { passive: true });

  // Deterministic pseudo-random generator keeps the residue authored rather
  // than changing chaotically on every visit.
  const randomFor = seed => {
    let x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  function paintResidue(index) {
    const rect = wordNode.getBoundingClientRect();
    const count = 5 + Math.floor(index / 4);
    for (let i = 0; i < count; i += 1) {
      const r1 = randomFor(index * 17 + i * 3 + 1);
      const r2 = randomFor(index * 23 + i * 5 + 2);
      const r3 = randomFor(index * 29 + i * 7 + 3);
      const x = rect.left + rect.width * (.08 + r1 * .84);
      const y = rect.top + rect.height * (.12 + r2 * .76);
      const radius = 7 + r3 * (15 + index * .7);
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const towardPink = randomFor(index * 31 + i) > .48;
      gradient.addColorStop(0, towardPink ? 'rgba(201,51,138,.22)' : 'rgba(91,142,240,.22)');
      gradient.addColorStop(.48, towardPink ? 'rgba(201,51,138,.13)' : 'rgba(91,142,240,.13)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x, y, radius * (1.05 + r1), radius * (.45 + r2 * .55), r3 * Math.PI, 0, Math.PI * 2);
      ctx.fill();

      // A few tiny overspill dots keep the edge irregular instead of reading
      // like a level meter.
      if (i % 2 === 0) {
        ctx.fillStyle = towardPink ? 'rgba(201,51,138,.19)' : 'rgba(91,142,240,.19)';
        ctx.beginPath();
        ctx.arc(x + (r1 - .5) * radius * 2.6, y + (r2 - .5) * radius * 2, 1.5 + r3 * 3.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const wait = ms => new Promise(resolve => { timer = setTimeout(resolve, ms); });

  async function run() {
    // 24 words compress from ~320ms each toward ~90ms, yielding a little
    // under six seconds including the final hold/fade.
    for (let i = 0; i < words.length && !stopped; i += 1) {
      const word = words[i];
      wordNode.textContent = word;
      wordNode.dataset.word = word;
      const duration = Math.max(90, 320 - i * 10);
      const pulse = wordNode.animate([
        { opacity: .18, transform: 'translateY(6px) scale(.985)', filter: 'blur(1.2px)' },
        { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)' }
      ], {
        duration: Math.min(210, Math.max(90, duration * .72)),
        easing: 'cubic-bezier(.18,.72,.28,1)',
        fill: 'both'
      });
      paintResidue(i);
      await wait(i === words.length - 1 ? 720 : duration);
      try { pulse.cancel(); } catch (_) {}
    }
    if (!stopped) finish();
  }

  function finish() {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    rememberIntro();
    splash.classList.add('is-leaving');
    setTimeout(() => {
      splash.remove();
      document.documentElement.classList.remove('academy-intro-running');
      removeEventListener('resize', resize);
    }, 520);
  }

  skip.addEventListener('click', finish);
  reducedMotion.addEventListener('change', event => { if (event.matches) finish(); }, { once: true });
  run();
}
