const discipline = document.querySelector('[data-academy-discipline]');

if (discipline) {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const words = [
    'Philosophy', 'History of Science', 'Psychoanalysis', 'Sociology',
    'Literary Theory', 'Art History', 'Law', 'Performance Studies',
    'Economics', 'Museology', 'Critical Theory', 'Religion',
    'Visual Studies', 'Politics', 'History of Technology',
    'Anthropology', 'Governance', 'Spirituality', 'Social Theory',
    'Science', 'Ethics', 'Civics', 'Design', 'Thought'
  ];
  const finalIndex = words.length - 1;
  const fadeInDuration = 190;
  const holdDuration = 450;
  const fadeOutDuration = 125;
  const finalFadeDuration = 280;
  const sequenceStartDelay = 250;
  let cancelled = false;

  const finishImmediately = () => {
    cancelled = true;
    discipline.getAnimations().forEach((animation) => animation.cancel());
    discipline.style.opacity = '1';
    discipline.style.backgroundSize = '100% 100%';
    discipline.style.backgroundPosition = '0% 0%';
    discipline.textContent = 'Thought';
  };

  const animateFill = async (duration) => {
    const animation = discipline.animate([
      { opacity: 0, backgroundSize: '230% 100%', backgroundPosition: '100% 0%' },
      { opacity: 1, backgroundSize: '145% 100%', backgroundPosition: '48% 0%', offset: .62 },
      { opacity: 1, backgroundSize: '100% 100%', backgroundPosition: '0% 0%' }
    ], {
      duration,
      easing: 'cubic-bezier(.18, .72, .28, 1)',
      fill: 'forwards'
    });
    try {
      await animation.finished;
    } catch {
      // Reduced motion can cancel a transition in progress.
    }
    animation.cancel();
    discipline.style.opacity = '1';
    discipline.style.backgroundSize = '100% 100%';
    discipline.style.backgroundPosition = '0% 0%';
    return !cancelled;
  };

  const animateFadeOut = async () => {
    const animation = discipline.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: fadeOutDuration,
      easing: 'cubic-bezier(.2, .65, .3, 1)',
      fill: 'forwards'
    });
    try {
      await animation.finished;
    } catch {
      // Reduced motion can cancel a transition in progress.
    }
    animation.cancel();
    return !cancelled;
  };

  const playSequence = async () => {
    for (let index = 0; index <= finalIndex && !cancelled; index += 1) {
      discipline.textContent = words[index];
      discipline.style.opacity = '0';
      const duration = index === finalIndex ? finalFadeDuration : fadeInDuration;
      if (!await animateFill(duration)) return;

      if (index < finalIndex) {
        await new Promise((resolve) => window.setTimeout(resolve, holdDuration));
        if (cancelled || !await animateFadeOut()) return;
        discipline.style.opacity = '0';
      }
    }
  };

  finishImmediately();
  if (!motionPreference.matches && typeof discipline.animate === 'function') {
    cancelled = false;
    discipline.style.opacity = '0';
    motionPreference.addEventListener('change', (event) => {
      if (event.matches) finishImmediately();
    }, { once: true });
    window.setTimeout(() => {
      if (!cancelled) playSequence();
    }, sequenceStartDelay);
  }
}
