const discipline = document.querySelector('[data-academy-discipline]');
const bloom = document.querySelector('.tw-bloom');

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

  const setDisciplineColor = (index) => {
    const mix = (start, end, amount) => Math.round(start + (end - start) * amount);
    const amount = index / finalIndex;
    const blue = [mix(220, 91, amount), mix(224, 142, amount), mix(239, 240, amount)];
    const pink = [mix(237, 201, amount), mix(207, 51, amount), mix(223, 138, amount)];
    const gradient = `linear-gradient(90deg, rgb(${blue.join(',')}) 0%, rgb(${pink.join(',')}) 100%)`;
    discipline.style.setProperty('--discipline-gradient', gradient);
    discipline.parentElement.style.setProperty('--discipline-gradient', gradient);
  };

  const finishImmediately = () => {
    cancelled = true;
    discipline.getAnimations().forEach((animation) => animation.cancel());
    bloom?.getAnimations().forEach((animation) => animation.cancel());
    discipline.style.opacity = '1';
    discipline.textContent = 'Thought';
    bloom?.style.setProperty('opacity', '0');
    setDisciplineColor(finalIndex);
  };

  const animateOpacity = async (from, to, duration) => {
    const animation = discipline.animate([{ opacity: from }, { opacity: to }], {
      duration,
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

  const triggerBloom = (index) => {
    if (!bloom || typeof bloom.animate !== 'function') return;
    bloom.getAnimations().forEach((animation) => animation.cancel());
    const progress = index / finalIndex;
    const peakOpacity = .16 + progress * .20;
    const peakScale = 1.02 + progress * .10;
    const duration = index === finalIndex ? 680 : 480 + progress * 100;
    const animation = bloom.animate([
      { opacity: 0, transform: 'translate(0, 0) scale(.86)' },
      { opacity: peakOpacity, transform: `translate(${-3 - progress * 4}px, ${2 + progress * 2}px) scale(${peakScale})`, offset: .3 },
      { opacity: 0, transform: `translate(${4 + progress * 5}px, ${-2 - progress * 3}px) scale(${peakScale + .08})` }
    ], {
      duration,
      easing: 'cubic-bezier(.18, .72, .28, 1)'
    });
    animation.finished.finally(() => bloom.style.opacity = '0');
  };

  const playSequence = async () => {
    for (let index = 0; index <= finalIndex && !cancelled; index += 1) {
      discipline.textContent = words[index];
      setDisciplineColor(index);
      triggerBloom(index);
      discipline.style.opacity = '0';
      const duration = index === finalIndex ? finalFadeDuration : fadeInDuration;
      if (!await animateOpacity(0, 1, duration)) return;
      discipline.style.opacity = '1';

      if (index < finalIndex) {
        await new Promise((resolve) => window.setTimeout(resolve, holdDuration));
        if (cancelled || !await animateOpacity(1, 0, fadeOutDuration)) return;
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
