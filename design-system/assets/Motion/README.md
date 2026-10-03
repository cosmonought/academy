# Motion

The homepage film (THOUGHT):

- `pigment-loop-ink.webm`, `pigment-loop-ink.mp4` — THOUGHT's fill on Paper: a 6-second seamless loop of the pigment film over black, highlights held below `paper` for the `lighten` key. 1280×720, 24fps, silent. List the WebM first.
- `pigment-loop-cream.webm`, `pigment-loop-cream.mp4` — the same loop with the black keyed to the cream `ink` (`#e5ddcb`), shadows lifted above the Night ground; THOUGHT's fill on Night.
- `pigment-poster-ink.webp`, `pigment-poster-cream.webp` — first frame of each loop; posters and the reduced-motion state.

The wash (a panel's hover and focus):

- `pigment-wash-paper.webm`, `pigment-wash-paper.mp4` — the THOUGHT loop blurred into a soft field the way the wash still is (the black filled in from the paint around it, 40% strength), at half speed (a 12-second loop), over white. 480×270, 24fps, silent; multiplied on Paper. Every frame keeps `ink` at 9:1 or more.
- `pigment-wash-night.webm`, `pigment-wash-night.mp4` — the same field over black, screened on Night; every frame keeps the cream `ink` at 8:1 or more.
- Set them as `--nda-wash-film-webm` and `--nda-wash-film-mp4` (strings; the Night pair under `[data-theme="dark"]`). `NDA.wash()` plays them; `assets/Imagery/pigment-wash.webp` shows underneath while they load.

The kinetic film (the intro only):

- `pigment-kinetic.webm`, `pigment-kinetic.mp4` — the kinetic pigment film over black (10 s, 960×540, 24fps, silent): a small blue flower that bursts and floods the frame. Not used by the current intro (its burst is drawn in code); kept for a filmed burst or for re-cuts.
- `pigment-kinetic-cream.webm`, `pigment-kinetic-cream.mp4` — the same film with the black keyed to the cream `ink` (`#e5ddcb`); runs under the intro's type at 0.83× speed (`darken`, inside the window's `lighten` group), masked so it stains only a few words (PHILOSOPHY and PSYCHOANALYSIS at the start, from 3.8 s into the film) and ends in a band through THOUGHT; the rest of the type is cream. The intro's burst (the spot, splashes and shards) is drawn in code, not filmed.
- `pigment-kinetic-poster-cream.webp` — its first frame (the flower on cream), the letters' poster.
- `intro-fill.webm`, `intro-fill.mp4` — what the intro shows in its letters, cut from the cream film so it plays straight through: 2.97–6.62 s, then 2.82–9.96 s, both at 0.83× speed (13 s, 960×540, 24fps, a keyframe every second, silent). The intro starts it at 0 with its clock and never seeks it mid-sequence. List the WebM first.
- `intro-bloom.webm`, `intro-bloom.mp4` — the bloom at the intro's reveal: the kinetic film's burst (1.6–3 s) over black at twice speed, warped by a boiling turbulence, blurred outward while it explodes, recoloured electric blue on its left, with a glow, the frame's edges fallen off to black (960×540, 24fps, 0.7 s, silent). Screened behind the type. List the WebM first.
- `intro-phone.mp4`, `intro-phone-poster.webp` — the whole intro rendered at full quality for phones held upright, which can't paint the live one smoothly: frame by frame on its own clock at 402 px wide (3x), the stage 87.5% of the width and centred, with no grain and no buttons (they stay live over it), from the first frame to where the exit sweep starts (1206×2820, 60fps, 11 s, H.264 High 5.1, silent), and its first frame as the poster. `NDA.intro` plays it from `.nda-intro__film`'s `data-src`; re-render it (`tools/introfilm`) whenever the score, the fonts or the films in it change.
- `intro-ribbon.webp` — the intro's ribbon (5.6–6.7 s), lifted out of the intro concept film frame by frame: 27 frames at 24fps, each cut into its pieces (the ribbon in front of the letters, and the paint the film shows inside its letters), packed into one 2048×1642 image with transparency, at the film's own size (1280×720 frames). `NDA.intro` holds the table of where each piece sits and plays them on its clock: the front pieces over the type, the inside pieces in the window (in `darken`), so they show only in our letters. Never shown on its own. If it is re-cut, its table in the bundle (`RIBBON.frames`) must be rewritten with it.
- `intro-sound.webm`, `intro-sound.mp4` — the intro's soundtrack: the intro concept film's own audio (stereo, 48 kHz), its ending let ring out to 11.9 s (the film cuts it at 10 s while the last hit is still ringing: a reverb tail grown from its last moments carries the decay on at the rate it already has, high frequencies kept as low as the ending's, then a soft fade). Opus 128 kbps in WebM, AAC 160 kbps in MP4; list the WebM first. `NDA.intro` plays it with the score.
- `pigment-kinetic-poster.webp` — a late frame of the ink cut (diagonal pink and blue streaks). A still of the film; the intro no longer uses it.

Sources, as supplied:

- `pigment-source.mp4` — the original pigment film (10 s, with audio). Re-cut the homepage loops from this.
- `pigment-kinetic-source.mp4` — the kinetic pigment film extracted from the intro concept (10 s, with audio). Re-cut the kinetic files from this.
- `intro-concept.mp4` — the intro concept film (10 s, with its soundtrack). Reference for IntroSequence, not for publishing: its garbled words are not part of the design. Only its ribbon and its soundtrack are used, lifted out as `intro-ribbon.webp` and `intro-sound`.
