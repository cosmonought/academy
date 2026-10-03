# IntroSequence

The first-visit overture, rebuilt live from the intro concept film, laid out from its measurements and timed against it. "Neta DAO Academy" never moves. "The home of Web3 and" shivers where PHILOSOPHY knocks it, is pushed up under the first line at the burst, and wipes back in as THOUGHT comes in. It opens on a still, the statement over PHILOSOPHY with the paint moving in its letters, for a second; then HISTORY OF SCIENCE slides up under PHILOSOPHY, set to the statement's width like the lines above it, so the opening stays one justified block; after a hold SOCIOLOGY pushes the stack up, PHILOSOPHY is squashed away under the second line and HISTORY OF SCIENCE turns into PSYCHOANALYSIS at the head of the list, and the disciplines run in three rows and then four, each at its own size, width and weight, sharing one box so that a big word squashes the others and a row coming or going lets them stretch: unevenly paced scrolls, peels, twists, rolls, three shivers, a travelling pinch and tugs between neighbours, with holds where the film holds. As in the film the type is mostly cream: the kinetic pigment flows across PHILOSOPHY and PSYCHOANALYSIS at the start and settles in a band through THOUGHT; once, the film's own satin ribbon of paint flicks through the rows, in front of the letters and, for a moment, inside them. At the burst a plum spot of light blooms on the wall behind the rows and everything is thrown out of it at once: a few small splashes of thin paint and flat shards of pink, blue and pigment that tumble and hang in the air, lit plum by the spot and casting soft shadows on the wall; the frame breathes. THOUGHT is peeled in by a right-angled edge, like _|, whose corner runs from the top of THOU to the lower right (the tops of THOU first, the last T last), as the rows smear away and an unstable nucleus of paint, going off just before, explodes in the middle of the page into a glowing magenta and blue membrane almost to its edges and fades; after a hold, a hairline white bar sweeps across to the homepage.

## Use
- Homepage, first visit only, on the Night theme (`data-theme="dark"` on the section), over the page. The preview loops it over the homepage hero, so you can see where the bar lands.
- The second line reads "the home of Web3 and", without the hero's "is", as the film has it; the homepage hero keeps "is".
- The window runs from just under the first line to the screen's edge, so the last frame is the statement at intro size.
- The type is mostly cream, as in the film: the kinetic film shows only through its mask (a stain at the start, the letters around the thread, a band through THOUGHT). Don't let it flood every word again; if the film is replaced, check where the stain and the band fall on it.
- Skip intro (top right) and Escape send the bar across at once; so does leaving the tab. It remembers itself in `localStorage` (`academy-intro-seen-v6`; `data-storage-key="none"` disables that).
- Sound: the concept film's soundtrack (`intro-sound`) plays with the score where the browser allows sound unasked (the visitor has been active on the site, e.g. the radio is on); otherwise Sound on (beside Skip intro) starts it from where the score is, and Sound off stops it. While it plays, Neta DAO Radio is lowered under it (`NetaDAORadio.duck`, if the radio is on the page) and brought back up after. Its last ring plays on under the homepage for about a second after the sweep. `data-muted` on the section (or `{ sound: false }`) leaves it off until the button is pressed.
- Under `prefers-reduced-motion` it never appears. It shows the dark ground until its fonts are in, holds the first frame while its films load (up to 4 s; 2.5 s lite), then plays. On a phone held upright the film's first frame shows until the film starts.

## Score (about 12s)
Times are the score's, after a 1s opening still (`{ hold: ms }` changes it).

| Time | What happens |
| --- | --- |
| (1s before) | The still: "Neta DAO Academy / the home of Web3 and / PHILOSOPHY", the pigment flowing across PHILOSOPHY |
| 0–0.35s | HISTORY OF SCIENCE, justified to the statement's width, slides up from the bottom edge under it; the sound starts |
| 0.35–1.2s | Hold |
| 1.3–2.2s | The push: HISTORY OF SCIENCE leans into italic; SOCIOLOGY comes up from the edge and pushes the stack, HISTORY OF SCIENCE rising into PHILOSOPHY's place and turning into PSYCHOANALYSIS, which heads the list; PHILOSOPHY is squashed to a sliver under the second line (which shivers) and then gone; LITERARY THEORY comes up behind |
| 2.2–2.75s | Hold; SOCIOLOGY and LITERARY THEORY tug at the line between them |
| 2.75–3.2s | ART HISTORY, small, peels over PSYCHOANALYSIS and the rows below stretch; SOCIOLOGY shivers into LAW, big, and they squash; the stain drains away: the rows are cream until the reveal |
| 3.2–3.9s | The burst: the plum spot blooms on the wall, the splashes and shards fly out of it together and the camera kicks; ART HISTORY rises into the second line's place and pushes it up under the first line; LITERARY THEORY blurs into PERFORMANCE STUDIES; ECONOMICS grows in, squashed, from the bottom: four rows |
| 3.95–4.45s | A quick cascade of rolls: CRITICAL THEORY, RELIGION, VISUAL STUDIES, POLITICS, each taking or giving room as it lands |
| 4.5–5.2s | POLITICS is squashed out and the rows above stretch into its room; HISTORY OF TECHNOLOGY grows in and pushes them back, a pinch through it; RELIGION leans into italic |
| 5.2–6.1s | All four change at once: ANTHROPOLOGY peels in, RELIGION twists into GOVERNANCE, VISUAL STUDIES shivers into SPIRITUALITY, HISTORY OF TECHNOLOGY rolls into SOCIAL THEORY; from 5.6 s the ribbon (the film's own, frame by frame) flicks through the rows: a thin arc, an S that folds over itself, a billowing fold; the rows ripple |
| 6.1–6.95s | The ribbon shrinks to a blade, gone by 6.7 s; the last scroll (ECOLOGY grows in); GOVERNANCE shivers into ETHICS · DESIGN, the biggest row, and the others squeeze; SPIRITUALITY twists into CIVICS; ETHICS leans |
| 6.95–7.8s | Hold: ETHICS · DESIGN and CIVICS tug at the line between them, twice, and SOCIAL THEORY and ECOLOGY once |
| 7.8–8.6s | An unstable nucleus of paint explodes in the middle of the page and blooms into a glowing membrane, electric blue and magenta, almost to the screen's edges, and fades; the second line wipes back in from the left; THOUGHT is peeled in by a right-angled edge (_|) whose corner runs from the top of THOU to the lower right, fast and then slower, each letter unfolding flat as it is uncovered, the pigment coming up in a band through it, through pink and grey smoke; the disciplines smear away over it, cream, the bottom row lingering |
| 8.6–10s | Hold |
| 10–10.9s | The exit: a 2px white bar sweeps left to right and the page shows behind it |

## You provide
- The discipline list (`.nda-intro__list`), in order: the score uses the first twenty-two, PHILOSOPHY first. Each place in the score has its own size, width and weight (on Archivo's width and weight axes), so a word you swap in takes that place's setting. Real disciplines only, each under 20 characters so rows fit.
- The fonts: NDA Display (Bold, Heavy) for the statement and THOUGHT, the Archivo variable font for the disciplines; `--font-display-widths` names it.
- Film paths: `intro-fill` (in the letters, WebM first: the cream kinetic film cut and slowed for the intro, so it plays straight through on the clock and never seeks mid-sequence) with `pigment-kinetic-poster-cream.webp`, and `intro-bloom` (the bloom, behind the type, WebM first). The ribbon: `intro-ribbon.webp` as the `.nda-intro__ribbon` image (never shown itself; `NDA.intro` plays its frames). The sound: `intro-sound` as the `.nda-intro__sound` audio (WebM first), with the `.nda-intro__sound-toggle` button. The burst (the spot, splashes, shards and their shadows) is drawn in code.
- The phone film: `intro-phone` as `.nda-intro__film`'s `data-src`, with `intro-phone-poster` as its `data-poster` (nothing loads until it is used). It is the whole intro rendered at full quality; a phone held upright plays it in place of the live stage, since one film is all it has to paint. The live version's films wait with `preload="none"` until it is sure to run, so a phone playing the film, or a visitor who has already seen the intro, never loads them. The grain, Sound on, Skip and the exit sweep stay live over it. Where it can't play (Low Power Mode, an error), the live version runs. Re-render it with `tools/introfilm.mjs` whenever the score, the fonts or the films in it change.
- Other tablets, touch screens and small machines run the live version lite: the same score with no blur on the moving letters and shards, no shadows on the wall, no warp in the rows and fewer shards flying out. `data-lite` forces it; `data-lite="off"` keeps the full version everywhere (rendering uses this).
- Optionally `NDA.intro(el, { onDone })` to move focus to the hero afterwards. The returned state has `seek(ms)`, `now()`, `pause()`, `play()` and `skip()` for review tools, and `duration` (ms, the still included).

## Markup
```html
<section class="nda-intro" data-theme="dark" data-nda-intro aria-label="Introduction" hidden>
  <div class="nda-intro__sheet">
    <video class="nda-intro__film" data-src="/ds/media/intro-phone.mp4" data-poster="/ds/media/intro-phone-poster.webp" muted playsinline preload="none" aria-hidden="true"></video>
    <div class="nda-intro__camera">
      <div class="nda-intro__breath">
        <div class="nda-intro__stage">
          <video class="nda-intro__bloom" muted playsinline preload="none" aria-hidden="true">
            <source src="/ds/media/intro-bloom.webm" type="video/webm"><source src="/ds/media/intro-bloom.mp4" type="video/mp4">
          </video>
          <div class="nda-intro__burst" aria-hidden="true"></div>
          <p class="nda-intro__statement">
            <span class="nda-intro__line" data-nda-fit style="--nda-fit: 6.536">Neta DAO Academy</span>
            <span class="nda-intro__line" data-nda-fit style="--nda-fit: 7.904">the home of Web3 and</span>
            <span class="nda-intro__line nda-intro__line--word">
              <span class="nda-visually-hidden">Thought</span>
              <span class="nda-intro__window" aria-hidden="true">
                <span class="nda-intro__rows"></span>
                <span class="nda-intro__thought">Thought</span>
                <video class="nda-intro__fill" poster="/ds/media/pigment-kinetic-poster-cream.webp" muted playsinline preload="none">
                  <source src="/ds/media/intro-fill.webm" type="video/webm"><source src="/ds/media/intro-fill.mp4" type="video/mp4">
                </video>
              </span>
            </span>
          </p>
          <div class="nda-intro__debris" aria-hidden="true"></div>
          <img class="nda-intro__ribbon" src="/ds/media/intro-ribbon.webp" alt="" aria-hidden="true">
          <ol class="nda-intro__list" hidden>
            <li>Philosophy</li>
            <li>History of Science</li>
            <li>Psychoanalysis</li>
            <li>Sociology</li>
            <li>Literary Theory</li>
            <li>Art History</li>
            <li>Law</li>
            <li>Performance Studies</li>
            <li>Economics</li>
            <li>Critical Theory</li>
            <li>Religion</li>
            <li>Visual Studies</li>
            <li>Politics</li>
            <li>History of Technology</li>
            <li>Anthropology</li>
            <li>Governance</li>
            <li>Spirituality</li>
            <li>Social Theory</li>
            <li>Ecology</li>
            <li>Ethics</li>
            <li>Design</li>
            <li>Civics</li>
          </ol>
        </div>
      </div>
    </div>
    <span class="nda-intro__grain" aria-hidden="true"></span>
    <div class="nda-intro__controls">
      <button class="nda-intro__sound-toggle" type="button" aria-pressed="false" hidden>Sound on</button>
      <button class="nda-intro__skip" type="button">Skip intro</button>
    </div>
    <audio class="nda-intro__sound" preload="auto">
      <source src="/ds/media/intro-sound.webm" type="audio/webm"><source src="/ds/media/intro-sound.mp4" type="audio/mp4">
    </audio>
  </div>
  <span class="nda-intro__wipe" aria-hidden="true"></span>
  <svg class="nda-intro__fx" aria-hidden="true" focusable="false">
    <filter id="nda-intro-warp" x="-4%" y="-12%" width="108%" height="124%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.009 0.022" numOctaves="2" seed="3"/>
      <feDisplacementMap in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </svg>
</section>
```

## Don't
- Don't move the first line, add words that aren't disciplines, play it on every visit, or keep the overlay up after it ends.
- Don't play the sound over the radio at full: duck it, as the intro does, or leave the sound off.
