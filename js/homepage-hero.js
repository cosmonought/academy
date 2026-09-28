const discipline = document.querySelector('[data-academy-discipline]');
const wordFill = document.querySelector('[data-academy-word-fill]');
const surface = document.querySelector('[data-academy-surface]');

if (discipline && wordFill && surface) {
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
  const sequenceDuration = finalIndex * (fadeInDuration + holdDuration + fadeOutDuration) + finalFadeDuration;
  const masterDuration = sequenceStartDelay + sequenceDuration;
  const initialFillAdvance = 0.08;
  const earlyFillDuration = 500;
  let liquidFrame = 0;
  let cancelled = false;

  const surfacePath = (level, elapsed, amplitude = 1) => {
    const points = [];
    const segments = 24;
    const rocking = Math.sin(elapsed * 0.00058) * 0.006 * amplitude;

    for (let index = 0; index <= segments; index += 1) {
      const x = index / segments;
      const primary = Math.sin(x * Math.PI * 2 * 1.15 + elapsed * 0.00043) * 0.022;
      const secondary = Math.sin(x * Math.PI * 2 * 2.35 - elapsed * 0.00061) * 0.009;
      points.push({ x, y: level + rocking + amplitude * (primary + secondary) });
    }

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let index = 0; index < segments; index += 1) {
      const current = points[index];
      const next = points[index + 1];
      const middleX = (current.x + next.x) / 2;
      const middleY = (current.y + next.y) / 2;
      path += ` Q ${current.x} ${current.y} ${middleX} ${middleY}`;
    }
    path += ` L 1 ${points[segments].y} L 1 1 L 0 1 Z`;
    return path;
  };

  const setDisciplineColor = (index) => {
    const mix = (start, end, amount) => Math.round(start + (end - start) * amount);
    const amount = index / finalIndex;
    const pink = [mix(242, 201, amount), mix(240, 51, amount), mix(235, 138, amount)];
    const blue = [mix(242, 91, amount), mix(240, 142, amount), mix(235, 240, amount)];
    discipline.style.backgroundImage = `linear-gradient(90deg, rgb(${pink.join(',')}) 0%, rgb(${blue.join(',')}) 100%)`;
  };

  const finishImmediately = () => {
    cancelled = true;
    window.cancelAnimationFrame(liquidFrame);
    discipline.getAnimations().forEach((animation) => animation.cancel());
    surface.setAttribute('d', surfacePath(-0.08, 0, 0));
    discipline.style.opacity = '1';
    discipline.textContent = 'Thought';
    setDisciplineColor(finalIndex);
  };

  if (!motionPreference.matches && typeof window.requestAnimationFrame === 'function' && typeof discipline.animate === 'function') {
    const fillStartedAt = performance.now();
    const initialLevel = 0.84;
    const finalLevel = -0.04;
    surface.setAttribute('d', surfacePath(initialLevel, 0, 1));
    discipline.style.opacity = '0';

    const animateLiquid = (now) => {
      if (cancelled) return;
      const elapsed = Math.min(now - fillStartedAt, masterDuration);
      const remainingProgress = Math.max(0, (elapsed - earlyFillDuration) / (masterDuration - earlyFillDuration));
      const fillProgress = elapsed < earlyFillDuration
        ? initialFillAdvance * (elapsed / earlyFillDuration)
        : initialFillAdvance + (1 - initialFillAdvance) * Math.pow(remainingProgress, 1.7);
      const level = initialLevel + (finalLevel - initialLevel) * fillProgress;
      surface.setAttribute('d', surfacePath(level, elapsed, progress < 1 ? 1 : 0));

      if (progress < 1) {
        liquidFrame = window.requestAnimationFrame(animateLiquid);
      } else {
        surface.setAttribute('d', surfacePath(-0.08, elapsed, 0));
      }
    };
    liquidFrame = window.requestAnimationFrame(animateLiquid);

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

    const playSequence = async () => {
      for (let index = 0; index <= finalIndex && !cancelled; index += 1) {
        discipline.textContent = words[index];
        setDisciplineColor(index);
        discipline.style.opacity = '0';
        const duration = index === finalIndex ? finalFadeDuration : fadeInDuration;
        if (!await animateOpacity(0, 1, duration)) return;
        discipline.style.opacity = '1';

        if (index < finalIndex) {
          await new Promise((resolve) => window.setTimeout(resolve, holdDuration));
          if (cancelled || !await animateOpacity(1, 0, fadeOutDuration)) return;
          discipline.style.opacity = '0';
        } else {
          surface.setAttribute('d', surfacePath(-0.08, masterDuration, 0));
        }
      }
    };

    motionPreference.addEventListener('change', (event) => {
      if (event.matches) finishImmediately();
    }, { once: true });
    window.setTimeout(() => {
      if (!cancelled) playSequence();
    }, sequenceStartDelay);
  }
}
