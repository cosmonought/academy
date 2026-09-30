(() => {\nconst discipline = document.querySelector('[data-academy-discipline]');

if (discipline) {
  const words = [
    'Philosophy', 'History of Science', 'Psychoanalysis', 'Sociology',
    'Literary Theory', 'Art History', 'Law', 'Performance Studies',
    'Economics', 'Museology', 'Critical Theory', 'Religion',
    'Visual Studies', 'Politics', 'History of Technology',
    'Anthropology', 'Governance', 'Spirituality', 'Social Theory',
    'Science', 'Ethics', 'Civics', 'Design', 'Thought'
  ];

  // The permanent hero is deliberately stable. The disciplinary overflow is a
  // short first-visit overture rather than motion the layout must accommodate.
  discipline.innerHTML = '<span class="tw-word-base">Thought</span><span class="tw-word-fill">Thought</span>';
  const finalFill = discipline.querySelector('.tw-word-fill');
  if (finalFill) finalFill.style.clipPath = 'inset(0 0 0 0)';

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const INTRO_KEY = 'academy-intro-seen-v2';
  let seen = false;
  try { seen = localStorage.getItem(INTRO_KEY) === '1'; } catch (_) {}
  if (seen || motionPreference.matches) return;

  const splash = document.createElement('section');
  splash.className = 'academy-intro-splash';
    splash.innerHTML = `
    <div class="academy-intro-stage">
      <p class="academy-intro-kicker" aria-hidden="true">Neta DAO Academy</p>
      <p class="academy-intro-prefix" aria-hidden="true">The home of Web3 and</p>
      <p class="academy-intro-word" aria-hidden="true"><span data-intro-word data-word="Philosophy">Philosophy</span></p>
      <div class="academy-intro-residue" aria-hidden="true"></div>
      <button type="button" class="academy-intro-skip">Skip intro</button>
    </div>`;
  document.body.appendChild(splash);
  document.body.classList.add('academy-intro-open');

  const wordEl = splash.querySelector('[data-intro-word]');
  const residue = splash.querySelector('.academy-intro-residue');
  const skip = splash.querySelector('.academy-intro-skip');
  let cancelled = false;

  const remember = () => {
    try { localStorage.setItem(INTRO_KEY, '1'); } catch (_) {}
  };
  const finish = () => {
    if (cancelled) return;
    cancelled = true;
    remember();
    splash.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 420, easing: 'ease', fill: 'forwards'
    }).finished.catch(() => {}).then(() => {
      splash.remove();
      document.body.classList.remove('academy-intro-open');
    });
  };

  function addResidue(index) {
    if (index < 2 || index % 2) return;
    const splat = document.createElement('i');
    splat.className = 'academy-intro-splat';
    const width = 36 + ((index * 29) % 112);
    const height = Math.round(width * (.55 + ((index % 5) * .12)));
    const left = 8 + ((index * 37) % 82);
    const top = 18 + ((index * 23) % 62);
    splat.style.width = width + 'px';
    splat.style.height = height + 'px';
    splat.style.left = `calc(${left}% - ${Math.round(width/2)}px)`;
    splat.style.top = `calc(${top}% - ${Math.round(height/2)}px)`;
    residue.appendChild(splat);
  }

  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  async function run() {
    await wait(260);
    for (let index = 0; index < words.length && !cancelled; index += 1) {
      const word = words[index];
      wordEl.textContent = word;
      wordEl.dataset.word = word;
      addResidue(index);
      const duration = index === words.length - 1
        ? 650
        : Math.max(70, Math.round(420 * Math.pow(.885, index) + 40));
      wordEl.animate(
        [{ opacity:.15, transform:'translateY(7px) scale(.985)' }, { opacity:1, transform:'translateY(0) scale(1)' }],
        { duration:Math.min(260, duration), easing:'cubic-bezier(.2,.8,.2,1)' }
      );
      await wait(duration);
    }
    if (!cancelled) {
      wordEl.textContent = 'Thought';
      wordEl.dataset.word = 'Thought';
      await wait(900);
      finish();
    }
  }

  skip.addEventListener('click', finish);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !cancelled) finish();
  });
  motionPreference.addEventListener('change', (event) => {
    if (event.matches && !cancelled) finish();
  }, { once:true });

  run();
}
\n})();\n