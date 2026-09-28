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
  const fadeInDuration = 560;
  const holdDuration = 520;
  const fadeOutDuration = 150;
  const finalFadeDuration = 680;
  const sequenceStartDelay = 250;
  let cancelled = false;

  const wordMarkup = (word) => `<span class="tw-word-base">${word}</span><span class="tw-word-fill">${word}</span>`;

  const setWord = (word) => {
    discipline.innerHTML = wordMarkup(word);
    return discipline.querySelector('.tw-word-fill');
  };

  const settledClip = (fill) => `inset(${100 - fill}% 0 0 0)`;
  const waveClip = (fill, surge, amplitude) => {
    const boundary = Math.max(0, Math.min(100, 100 - fill - surge));
    const point = (offset) => Math.max(0, Math.min(100, boundary + offset));
    return `polygon(0 ${point(amplitude * .35)}%, 12% ${point(-amplitude)}%, 27% ${point(amplitude * .55)}%, 43% ${point(-amplitude * .65)}%, 61% ${point(amplitude)}%, 78% ${point(-amplitude * .45)}%, 100% ${point(amplitude * .7)}%, 100% 100%, 0 100%)`;
  };

  const finishImmediately = () => {
    cancelled = true;
    discipline.getAnimations().forEach((animation) => animation.cancel());
    discipline.style.opacity = '1';
    const fill = setWord('Thought');
    fill.style.clipPath = settledClip(100);
    fill.style.backgroundPosition = '0% 0%';
  };

  const animateFill = async (fill, previousFill, duration, isFinal) => {
    const wordFill = discipline.querySelector('.tw-word-fill');
    const overshoot = isFinal ? 14 : 12;
    const animation = wordFill.animate([
      { clipPath: waveClip(previousFill, 0, 1), backgroundPosition: '0% 0%' },
      { clipPath: waveClip(fill, overshoot, 8), backgroundPosition: '55% 0%', offset: .24 },
      { clipPath: waveClip(fill, -4, 6), backgroundPosition: '-42% 0%', offset: .5 },
      { clipPath: waveClip(fill, 3, 3), backgroundPosition: '18% 0%', offset: .74 },
      { clipPath: settledClip(fill), backgroundPosition: '0% 0%' }
    ], {
      duration,
      easing: 'cubic-bezier(.22, .7, .28, 1)',
      fill: 'forwards'
    });
    try {
      await animation.finished;
    } catch {
      // Reduced motion can cancel a transition in progress.
    }
    animation.cancel();
    wordFill.style.clipPath = settledClip(fill);
    wordFill.style.backgroundPosition = '0% 0%';
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
    let previousFill = 0;
    for (let index = 0; index <= finalIndex && !cancelled; index += 1) {
      const isFinal = index === finalIndex;
      const fill = isFinal ? 100 : Math.round(((index + 1) / (finalIndex + 1)) * 100);
      setWord(words[index]);
      discipline.style.opacity = '0';
      const opacityAnimation = discipline.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: isFinal ? finalFadeDuration : fadeInDuration,
        easing: 'cubic-bezier(.18, .72, .28, 1)',
        fill: 'forwards'
      });
      const duration = isFinal ? finalFadeDuration : fadeInDuration;
      const fillComplete = animateFill(fill, previousFill, duration, isFinal);
      try { await opacityAnimation.finished; } catch { /* Cancelled for reduced motion. */ }
      opacityAnimation.cancel();
      discipline.style.opacity = '1';
      if (!await fillComplete) return;
      previousFill = fill;

      if (!isFinal) {
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
