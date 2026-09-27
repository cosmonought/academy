const discipline = document.querySelector('[data-academy-discipline]');
const liquid = document.querySelector('[data-academy-liquid]');
const academyMark = document.querySelector('.academy-hero-mark');

if (discipline && liquid && academyMark) {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const words = [
    'Philosophy', 'History of Science', 'Psychoanalysis', 'Sociology',
    'Literary Theory', 'Art History', 'Law', 'Performance Studies',
    'Economics', 'Museology', 'Critical Theory', 'Religion',
    'Visual Studies', 'Politics', 'History of Technology',
    'Anthropology', 'Governance', 'Spirituality', 'Social Theory',
    'Science', 'Ethics', 'Civics', 'Design', 'Thought'
  ];
  let timer;

  const finalState = () => {
    window.clearTimeout(timer);
    academyMark.classList.remove('is-animating');
    liquid.style.transition = 'none';
    liquid.style.transform = '';
    discipline.textContent = 'Thought';
    discipline.style.backgroundImage = 'linear-gradient(90deg, #C9338A 0%, #5B8EF0 100%)';
  };

  if (!motionPreference.matches) {
    const mix = (start, end, amount) => Math.round(start + (end - start) * amount);
    const setColor = (index) => {
      const amount = index / (words.length - 1);
      const pink = [mix(242, 201, amount), mix(240, 51, amount), mix(235, 138, amount)];
      const blue = [mix(242, 91, amount), mix(240, 142, amount), mix(235, 240, amount)];
      discipline.style.backgroundImage = `linear-gradient(90deg, rgb(${pink.join(',')}) 0%, rgb(${blue.join(',')}) 100%)`;
    };
    const typeSpeed = (index) => index === words.length - 1 ? 55 : 22;
    const deleteSpeed = () => 13;

    let index = 0;
    liquid.style.transform = 'translateY(210px)';
    academyMark.classList.add('is-animating');

    const fillForWord = (wordIndex) => {
      const completion = wordIndex / (words.length - 1);
      const offset = 210 * (1 - completion);
      liquid.style.transitionDuration = `${wordIndex === words.length - 1 ? 760 : 480}ms`;
      liquid.style.transform = `translateY(${offset}px)`;
    };
    const typeWord = (word, position = 0) => {
      discipline.textContent = word.slice(0, position + 1);
      if (position + 1 < word.length) {
        timer = window.setTimeout(() => typeWord(word, position + 1), typeSpeed(index));
      } else if (index < words.length - 1) {
        timer = window.setTimeout(() => deleteWord(word, word.length), 360);
      }
    };
    const deleteWord = (word, length) => {
      discipline.textContent = word.slice(0, length - 1);
      if (length > 1) {
        timer = window.setTimeout(() => deleteWord(word, length - 1), deleteSpeed(index));
      } else {
        index += 1;
        setColor(index);
        fillForWord(index);
        timer = window.setTimeout(() => typeWord(words[index]), 0);
      }
    };

    timer = window.setTimeout(() => {
      setColor(index);
      fillForWord(index);
      typeWord(words[index]);
    }, 250);
    motionPreference.addEventListener('change', (event) => {
      if (event.matches) finalState();
    }, { once: true });
  }
}
