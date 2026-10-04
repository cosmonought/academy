/* @ds-bundle: {"format":4,"namespace":"NDA","components":[{"name":"SiteHeader"},{"name":"HeroStatement"},{"name":"LiquidWord"},{"name":"ProgramPanel"},{"name":"AccessTile"},{"name":"JournalPanel"},{"name":"ForkMark"},{"name":"SiteFooter"},{"name":"IntroSequence"},{"name":"Wordmark"},{"name":"IndexRule"},{"name":"SectionHeading"},{"name":"TagList"},{"name":"CircleLink"},{"name":"Button"},{"name":"TextLink"},{"name":"RadioControl"},{"name":"StatusBadge"},{"name":"SessionRow"},{"name":"ScreeningBanner"},{"name":"Field"}]} */
/* Neta DAO Academy: vanilla enhancers for the HTML/CSS components (no framework).
   window.NDA.enhance(root) wires every [data-nda-*] element under root; each helper
   is idempotent and can be called on its own. */
(function () {
  'use strict';
  var NDA = window.NDA = window.NDA || {};
  var noop = function () {};
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reducedMotion() { return !!(motionQuery && motionQuery.matches); }
  function onMotionChange(fn) {
    if (!motionQuery) return;
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', fn);
    else if (motionQuery.addListener) motionQuery.addListener(fn);
  }
  function fontsReady() {
    return document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  }
  function each(root, selector, fn) {
    var list = (root || document).querySelectorAll(selector);
    for (var i = 0; i < list.length; i++) fn(list[i]);
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---- fit: size a display line so it spans its container ----------------
     Measures the text's width in ems and stores it as --nda-fit; the CSS turns
     that into font-size: calc(100cqi / var(--nda-fit)). */
  function measureFit(el) {
    var cs = getComputedStyle(el), fs = parseFloat(cs.fontSize);
    if (!fs) return;
    var range = document.createRange();
    range.selectNodeContents(el);
    var width = range.getBoundingClientRect().width;
    if (!width) return;
    // letter-spacing is added after the last letter too; a negative value leaves the ink that much wider
    var ls = parseFloat(cs.letterSpacing) || 0;
    el.style.setProperty('--nda-fit', ((width - Math.min(0, ls)) / fs * 1.002).toFixed(3));
    if (el.parentElement && el.parentElement.__ndaGaps) scheduleGaps(el.parentElement);
  }
  NDA.fit = function (el) {
    measureFit(el);
    fontsReady().then(function () { measureFit(el); });
    if (document.fonts && document.fonts.addEventListener && !el.__ndaFit) {
      document.fonts.addEventListener('loadingdone', function () { measureFit(el); });
    }
    el.__ndaFit = true;
  };

  /* ---- lineGaps: hold every gap in a stacked statement to --nda-line-gap ----------
     The CSS spaces the lines by the font's metrics; browsers round ascent and leading
     to whole pixels at each size, which can leave two gaps a pixel or two apart. This
     measures each line's real baseline and cap top and nudges the next line. */
  var capRatios = {};
  function capRatio(el) {
    var cs = getComputedStyle(el), font = cs.fontWeight + ' 100px ' + cs.fontFamily;
    if (capRatios[font]) return capRatios[font];
    var c = document.createElement('canvas').getContext('2d');
    c.font = font;
    var m = c.measureText('H'), r = m.actualBoundingBoxAscent ? m.actualBoundingBoxAscent / 100 : 0.7;
    // remember it only once the face itself has loaded, not a fallback's
    try { if (document.fonts && document.fonts.check(font, 'H')) capRatios[font] = r; } catch (e) {}
    return r;
  }
  function probeIn(host) {
    var p = host.querySelector(':scope > .nda-baseline');
    if (!p) { p = document.createElement('span'); p.className = 'nda-baseline'; p.setAttribute('aria-hidden', 'true'); host.appendChild(p); }
    return p;
  }
  function lineMetrics(line) {
    var host = line.querySelector('.nda-liquid__word') || (line.querySelector('.nda-intro__window') ? null : line);
    if (!host) return null;
    var base = probeIn(host).getBoundingClientRect().bottom;
    var scale = parseFloat(getComputedStyle(line).getPropertyValue('--nda-s')) || 1;
    return { base: base, cap: base - capRatio(host) * parseFloat(getComputedStyle(host).fontSize) * scale };
  }
  NDA.lineGaps = function (title) {
    if (!title.isConnected || !title.offsetParent) return;
    var lines = [].filter.call(title.children, function (n) { return /__line(\s|$)/.test(n.className); });
    if (lines.length < 2) return;
    var ruler = title.querySelector(':scope > .nda-gap-ruler');
    if (!ruler) { ruler = document.createElement('span'); ruler.className = 'nda-gap-ruler'; ruler.setAttribute('aria-hidden', 'true'); title.appendChild(ruler); }
    var want = ruler.getBoundingClientRect().width;
    for (var i = 1; i < lines.length; i++) {
      var a = lineMetrics(lines[i - 1]), b = lineMetrics(lines[i]);
      if (!a || !b) continue;
      var old = parseFloat(lines[i].style.getPropertyValue('--nda-nudge')) || 0;
      var next = old + (want - (b.cap - a.base));
      if (Math.abs(next - old) > 0.2) lines[i].style.setProperty('--nda-nudge', next.toFixed(2) + 'px');
    }
  };
  // a gap pass after anything that can move the lines: fonts, fits, resizes; two passes settle the rounding
  function scheduleGaps(title) {
    if (title.__ndaGapsQueued) return;
    title.__ndaGapsQueued = true;
    var go = function () { title.__ndaGapsQueued = false; NDA.lineGaps(title); NDA.lineGaps(title); };
    if (window.requestAnimationFrame) requestAnimationFrame(go); else setTimeout(go, 16);
  }
  function watchGaps(title) {
    if (title.__ndaGaps) return;
    title.__ndaGaps = true;
    var run = function () { scheduleGaps(title); };
    fontsReady().then(run);
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', run);
    window.addEventListener('load', run);
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(run);
      ro.observe(title);
      [].forEach.call(title.children, function (c) { ro.observe(c); });
    }
  }

  /* ---- LiquidWord: plays the pigment loop only when visible and allowed ---- */
  NDA.liquidWord = function (el) {
    if (el.__ndaLiquid) return el.__ndaLiquid;
    var video = el.querySelector('video');
    if (!video) return null;
    video.muted = true; video.loop = true; video.playsInline = true;
    video.setAttribute('muted', ''); video.setAttribute('playsinline', '');
    var visible = true;
    // Night grounds need the cream cut of the film: swap sources by theme.
    // Each <source> (or the <video> itself) keeps its Paper file in src and
    // its Night file in data-src-dark.
    var targets = video.querySelectorAll('source').length ? [].slice.call(video.querySelectorAll('source')) : [video];
    targets.forEach(function (t) { if (!t.hasAttribute('data-src-light') && t.getAttribute('src')) t.setAttribute('data-src-light', t.getAttribute('src')); });
    if (!video.hasAttribute('data-poster-light') && video.getAttribute('poster')) video.setAttribute('data-poster-light', video.getAttribute('poster'));
    function pickSource() {
      var holder = el.closest('[data-theme]');
      var dark = !!holder && holder.getAttribute('data-theme') === 'dark';
      var changed = false;
      targets.forEach(function (t) {
        var want = dark ? (t.getAttribute('data-src-dark') || t.getAttribute('data-src-light')) : t.getAttribute('data-src-light');
        if (want && t.getAttribute('src') !== want) { t.setAttribute('src', want); changed = true; }
      });
      var poster = dark ? (video.getAttribute('data-poster-dark') || video.getAttribute('data-poster-light')) : video.getAttribute('data-poster-light');
      if (poster && video.getAttribute('poster') !== poster) video.setAttribute('poster', poster);
      if (changed) { video.load(); sync(); }
    }
    // under a playing first-visit intro the page's films wait, so they don't decode against it
    function covered() {
      var intro = document.querySelector('[data-nda-intro]');
      return !!intro && !intro.hidden && !NDA.introEnded && !intro.hasAttribute('data-replay') && !intro.contains(el);
    }
    function sync() {
      if (!reducedMotion() && visible && !document.hidden && !covered()) {
        var p = video.play(); if (p && p.catch) p.catch(noop);
      } else {
        video.pause();
      }
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[entries.length - 1].isIntersecting; sync();
      }, { threshold: 0.05 }).observe(el);
    }
    document.addEventListener('visibilitychange', sync);
    document.addEventListener('nda:introstart', sync);
    document.addEventListener('nda:introend', sync);
    onMotionChange(sync);
    if ('MutationObserver' in window) {
      new MutationObserver(pickSource).observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['data-theme'] });
    }
    pickSource();
    sync();
    el.__ndaLiquid = { video: video, sync: sync, pickSource: pickSource };
    return el.__ndaLiquid;
  };

  /* ---- Radio control: play / pause pair, the available action is circled ---- */
  NDA.radio = function (el) {
    if (el.__ndaRadio) return el.__ndaRadio;
    var play = el.querySelector('.nda-radio__play');
    var pause = el.querySelector('.nda-radio__pause');
    var src = el.getAttribute('data-src');
    var audio = null;
    function set(state, moveFocus) {
      var playing = state === 'playing';
      el.setAttribute('data-state', playing ? 'playing' : 'idle');
      play.setAttribute('aria-disabled', playing ? 'true' : 'false');
      pause.setAttribute('aria-disabled', playing ? 'false' : 'true');
      if (moveFocus) (playing ? pause : play).focus();
      el.dispatchEvent(new CustomEvent('nda:radio', { bubbles: true, detail: { playing: playing } }));
    }
    play.addEventListener('click', function () {
      if (el.getAttribute('data-state') === 'playing') return;
      if (src) {
        audio = audio || new Audio();
        audio.src = src;
        var p = audio.play();
        if (p && p.catch) p.catch(function () { set('idle', true); });
      }
      set('playing', true);
    });
    pause.addEventListener('click', function () {
      if (el.getAttribute('data-state') !== 'playing') return;
      if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
      set('idle', true);
    });
    set(el.getAttribute('data-state') === 'playing' ? 'playing' : 'idle', false);
    el.__ndaRadio = { set: set };
    return el.__ndaRadio;
  };

  var intros = 0;

  /* ---- Fork mark --------------------------------------------------------------
     Gives each inline mark its own gradient id: repeated ids would all point at
     the first mark's gradient, which stops painting when that mark is hidden.
     Where nothing can hover (touch screens), the mark cuts itself once when it is
     mostly in view, so the slash is still seen. */
  var forkMarks = 0, forkSeen = null;
  NDA.forkMark = function (el) {
    if (el.__ndaFork) return;
    el.__ndaFork = true;
    var grad = el.querySelector('linearGradient[id]');
    if (grad) {
      var ref = 'url(#' + grad.id + ')', id = grad.id + '-' + (++forkMarks);
      grad.id = id;
      [].forEach.call(el.querySelectorAll('[fill="' + ref + '"], [stroke="' + ref + '"]'), function (p) {
        ['fill', 'stroke'].forEach(function (a) { if (p.getAttribute(a) === ref) p.setAttribute(a, 'url(#' + id + ')'); });
      });
    }
    if (!window.IntersectionObserver || !window.matchMedia || !matchMedia('(hover: none)').matches) return;
    forkSeen = forkSeen || new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        forkSeen.unobserve(e.target);
        setTimeout(function () { e.target.classList.add('is-split'); }, 250);
      });
    }, { threshold: 0.75 });
    forkSeen.observe(el);
  };

  /* ---- Pigment wash in motion ------------------------------------------------
     On a panel's first hover or focus, adds the film layer (.nda-wash__film: the
     still's field as film, slowed) and plays it while the panel is hovered or
     focused, pausing it once it has faded out. The still shows underneath until the
     film has a frame. Nothing happens under reduced motion or when the film paths
     (--nda-wash-film-webm / -mp4) are empty. Pinned panels (.is-washed) play while
     on screen. */
  function cssString(el, prop) {
    return (getComputedStyle(el).getPropertyValue(prop) || '').trim().replace(/^url\((.*)\)$/, '$1').replace(/^["']|["']$/g, '');
  }
  var washSeen = null;
  NDA.wash = function (el) {
    if (el.__ndaWash) return;
    el.__ndaWash = true;
    var layer = null, video = null, srcKey = '', hovered = false, focused = false, onScreen = false, stopTimer = 0;
    function sources() {
      var webm = cssString(el, '--nda-wash-film-webm'), mp4 = cssString(el, '--nda-wash-film-mp4');
      return webm || mp4 ? [[webm, 'video/webm'], [mp4, 'video/mp4']] : null;
    }
    function build(list) {
      if (!layer) {
        layer = document.createElement('span');
        layer.className = 'nda-wash__film';
        layer.setAttribute('aria-hidden', 'true');
        video = document.createElement('video');
        video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'auto'; video.tabIndex = -1;
        video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.setAttribute('disablepictureinpicture', '');
        video.addEventListener('playing', function () { if (wanted()) el.classList.add('is-filming'); });
        layer.appendChild(video);
        el.insertBefore(layer, el.firstChild);
      }
      video.textContent = '';
      list.forEach(function (s) {
        if (!s[0]) return;
        var source = document.createElement('source');
        source.src = s[0]; source.type = s[1];
        video.appendChild(source);
      });
      srcKey = list.map(function (s) { return s[0]; }).join('|');
      video.load();
    }
    function wanted() { return hovered || focused || (onScreen && el.classList.contains('is-washed')); }
    function update() {
      if (wanted() && !reducedMotion()) {
        clearTimeout(stopTimer);
        var list = sources();
        if (!list) return;
        if (!layer || list.map(function (s) { return s[0]; }).join('|') !== srcKey) build(list);   // first use, or the theme changed
        var p = video.play();
        if (p && p.catch) p.catch(noop);
        if (!video.paused && video.readyState > 2) el.classList.add('is-filming');
      } else if (layer) {
        el.classList.remove('is-filming');
        clearTimeout(stopTimer);
        stopTimer = setTimeout(function () { if (!wanted()) video.pause(); }, 700);   // after the fade
      }
    }
    el.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') { hovered = true; update(); } });
    el.addEventListener('pointerleave', function () { hovered = false; update(); });
    el.addEventListener('focusin', function () { focused = true; update(); });
    el.addEventListener('focusout', function (e) { if (!el.contains(e.relatedTarget)) { focused = false; update(); } });
    onMotionChange(update);
    if (el.classList.contains('is-washed') && window.IntersectionObserver) {
      washSeen = washSeen || new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { var w = e.target.__ndaWashSeen; if (w) w(e.isIntersecting); });
      }, { threshold: 0.2 });
      el.__ndaWashSeen = function (v) { onScreen = v; update(); };
      washSeen.observe(el);
    }
  };

  /* ---- Drawn hovers: Coining Reason's band and The Graphic's dots ------------
     A canvas behind the panel's type (.nda-program__canvas), drawn each frame while the
     panel is hovered or focused, or pinned (.is-washed) and on screen; .is-live swaps it
     in for the CSS layer, which stays as the still under reduced motion or without
     script. The canvas fades out with the hover and stops once it has. */
  var drawnSeen = null;
  function drawnHover(el, draw) {
    if (el.__ndaDrawn) return;
    el.__ndaDrawn = true;
    var canvas = null, ctx = null, raf = 0, t0 = 0, hovered = false, focused = false, onScreen = false, stopTimer = 0, box = null, sizer = null;
    function wanted() { return hovered || focused || (onScreen && el.classList.contains('is-washed')); }
    function size() {
      var dpr = Math.min(2, window.devicePixelRatio || 1), w = el.clientWidth, h = el.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var cs = getComputedStyle(el);
      box = { w: w, h: h, cw: w - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0), cs: cs };
    }
    function frame(now) {
      if (!t0) t0 = now;
      ctx.clearRect(0, 0, box.w, box.h);
      draw(ctx, box, (now - t0) / 1000);
      raf = requestAnimationFrame(frame);
    }
    function stop() { cancelAnimationFrame(raf); raf = 0; t0 = 0; }
    function update() {
      if (wanted() && !reducedMotion()) {
        clearTimeout(stopTimer);
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvas.className = 'nda-program__canvas';
          canvas.setAttribute('aria-hidden', 'true');
          el.insertBefore(canvas, el.firstChild);
          ctx = canvas.getContext('2d');
          if (window.ResizeObserver) { sizer = new ResizeObserver(function () { if (raf) size(); }); sizer.observe(el); }
        }
        if (!raf) { size(); raf = requestAnimationFrame(frame); }
        el.classList.add('is-live');
      } else if (canvas) {
        el.classList.remove('is-live');
        clearTimeout(stopTimer);
        stopTimer = setTimeout(function () { if (!wanted() || reducedMotion()) stop(); }, 600);   // after the fade
      }
    }
    el.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') { hovered = true; update(); } });
    el.addEventListener('pointerleave', function () { hovered = false; update(); });
    el.addEventListener('focusin', function () { focused = true; update(); });
    el.addEventListener('focusout', function (e) { if (!el.contains(e.relatedTarget)) { focused = false; update(); } });
    onMotionChange(update);
    if (el.classList.contains('is-washed') && window.IntersectionObserver) {
      drawnSeen = drawnSeen || new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { var f = e.target.__ndaDrawnSeen; if (f) f(e.isIntersecting); });
      }, { threshold: 0.2 });
      el.__ndaDrawnSeen = function (v) { onScreen = v; update(); };
      drawnSeen.observe(el);
    }
  }
  function smooth(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

  /* Coining Reason: the still band's 36 curves (--nda-engrave-image), laid out as the CSS
     mask lays them (a 240 × 200 tile, 110cqi × 92cqi, repeated across, its top at
     45px − 20.2cqi), flexed as one body: every point rides the same wave travelling along
     the band (one bend per tile, 8s round) and the mesh swells and narrows about its own
     midline a quarter-wave behind, like a tube. The wave grows in over the first second,
     so the band starts as the still. */
  var engraveCurves = null;
  function engraveData(el) {
    if (engraveCurves) return engraveCurves;
    var raw = cssString(el, '--nda-engrave-image'), d = '';
    try { d = (decodeURIComponent(raw.slice(raw.indexOf(',') + 1)).match(/ d='([^']+)'/) || [])[1] || ''; } catch (e) { d = ''; }
    var curves = d.split('M').filter(function (c) { return c.trim(); }).map(function (c) {
      return c.split('L').map(function (pt) { var v = pt.trim().split(/\s+/); return [+v[0], +v[1]]; });
    });
    if (!curves.length) return null;
    var n = curves[0].length, mid = [];
    for (var i = 0; i < n; i++) {   // the band's midline: the mean of its curves at each step
      var sum = 0;
      curves.forEach(function (c) { sum += c[i] ? c[i][1] : 0; });
      mid.push(sum / curves.length);
    }
    return (engraveCurves = { curves: curves, mid: mid });
  }
  NDA.engrave = function (el) {
    drawnHover(el, function (ctx, box, t) {
      var data = engraveData(el);
      if (!data) return;
      var W = 1.1 * box.cw, H = 0.92 * box.cw, top = 45 - 0.202 * box.cw, sx = W / 240, sy = H / 200;
      var left = (box.w - W) / 2, first = left - Math.ceil(left / W) * W;
      var grow = smooth(t / 1.1), phase = t * Math.PI * 2 / 8, A = 8 * grow, B = 0.08 * grow, k = Math.PI * 2 / 240;
      ctx.strokeStyle = box.cs.getPropertyValue('--ink').trim() || '#111';
      ctx.lineWidth = Math.max(0.7, 0.68 * sx);
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (var x0 = first; x0 < box.w; x0 += W) {
        data.curves.forEach(function (c) {
          for (var i = 0; i < c.length; i++) {
            var u = c[i][0], v = c[i][1], m = data.mid[i] || 100, a = k * u - phase;
            var y = m + (v - m) * (1 + B * Math.sin(a - Math.PI / 2)) + A * Math.sin(a);
            var px = x0 + u * sx, py = top + y * sy;
            if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
          }
        });
      }
      ctx.stroke();
    });
  };

  /* The Graphic: an unseen magnifying glass, a long strip, is drawn across the panel's
     Ben-Day dots diagonally, from the top-right corner to the bottom-left. Nothing marks
     the glass itself; the dots under it are the panel's own, seen through it: about three
     times their size across its middle, easing off towards its edges, where the enlarged
     rows bulge, crowd and shrink a little before meeting the page's dots, so the glass has
     no edge. As it passes they turn into six-armed asterisks, each dot shrinking as its arms
     grow, so the change can be watched; behind it they stay asterisks, and the next pass
     turns them back. A pass takes 7.5s.
     The lens, across the glass: a point at a fraction x of its half-width shows the page at
     g(x), with g′ = 1/ZP over the middle (x < X0) and, out to the edge, rising through a
     bulge back to 1, its integral 1 so the edge meets the page. Along the glass the page is
     spread ZA times in the middle, 1 at the edges, about the middle of the glass's chord;
     the dots grow as the page is magnified across (1/g′). Kept in a table. */
  NDA.comic = function (el) {
    var arms = [];
    for (var a = 0; a < 3; a++) { var ang = Math.PI / 2 + a * Math.PI / 3; arms.push([Math.cos(ang), Math.sin(ang)]); }
    function mark(ctx, x, y, q, r, arm, line) {   // q: 0 a dot, 1 an asterisk; between, both
      if (q < 1) { ctx.beginPath(); ctx.arc(x, y, r * (1 - q), 0, Math.PI * 2); ctx.fill(); }
      if (q > 0) {
        ctx.lineWidth = line; ctx.beginPath();
        arms.forEach(function (v) { ctx.moveTo(x - v[0] * arm * q, y - v[1] * arm * q); ctx.lineTo(x + v[0] * arm * q, y + v[1] * arm * q); });
        ctx.stroke();
      }
    }
    var ZP = 3, ZA = 1.45, X0 = 0.3, N = 400, GD = [], GV = [0];
    var K = (1 - 1 / ZP) * (1 + X0) / (1 - X0);
    for (var i = 0; i <= N; i++) {   // g′ and g on [0, 1]
      var x = i / N, r = x <= X0 ? 0 : (x - X0) / (1 - X0);
      GD.push(1 / ZP + (1 - 1 / ZP) * smooth(r) + K * Math.pow(Math.sin(Math.PI * r), 2));
      if (i) GV.push(GV[i - 1] + (GD[i] + GD[i - 1]) / (2 * N));
    }
    for (i = 0; i <= N; i++) GV[i] /= GV[N];   // exactly g(1) = 1
    function lensAt(y) {   // the image fraction x showing the page at fraction y, with g′ there
      var lo = 0, hi = N;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (GV[mid] < y) lo = mid; else hi = mid; }
      var f = GV[hi] > GV[lo] ? (y - GV[lo]) / (GV[hi] - GV[lo]) : 0, x = (lo + f) / N;
      return [x, GD[lo] + (GD[hi] - GD[lo]) * f];
    }
    drawnHover(el, function (ctx, box, t) {
      var dot = box.cs.getPropertyValue('--nda-comic-dot').trim() || '#5bb348';
      var G = 9, R = 1.75, ARM = 2.6, LINE = 1.15, HW = 88, PASS = 7.5, HOLD = 0.3;
      var w = box.w, h = box.h, S2 = Math.SQRT2;
      var L = (w + h) / S2, run = PASS + HOLD, n = Math.floor(t / run), u = Math.min(1, (t - n * run) / PASS);
      var c = -HW + u * (L + 2 * HW);   // the glass's centre line, along the diagonal from the top-right corner
      var toStars = n % 2 === 0;
      // the middle of the centre line's chord across the panel: the point the glass spreads the page about, along it
      var xa = Math.max(0, w - c * S2), xb = Math.min(w, w - c * S2 + h), xm = (xa + xb) / 2, ym = xm - w + c * S2;
      ctx.fillStyle = dot; ctx.strokeStyle = dot; ctx.lineCap = 'round';
      for (var y = G / 2; y < h + G; y += G) {
        for (var x = G / 2; x < w + G; x += G) {
          var es = (-(x - xm) + (y - ym)) / S2;          // across the glass: + ahead of its centre line, − behind
          if (Math.abs(es) >= HW) { mark(ctx, x, y, (es < 0) === toStars ? 1 : 0, R, ARM, LINE); continue; }
          var lens = lensAt(Math.abs(es) / HW), xi = lens[0], e = (es < 0 ? -xi : xi) * HW;
          var spread = 1 + (ZA - 1) * (1 - smooth(xi <= X0 ? 0 : (xi - X0) / (1 - X0)));
          var ai = ((x - xm) + (y - ym)) / S2 * spread;
          var px = xm + (ai - e) / S2, py = ym + (ai + e) / S2;
          if (px < -20 || px > w + 20 || py < -20 || py > h + 20) continue;
          var size = 1 / lens[1];
          var turn = smooth(0.5 - es / (HW * 0.5));       // 0 ahead, 1 behind: the turn happens under the glass's middle
          mark(ctx, px, py, toStars ? turn : 1 - turn, R * size, ARM * size, LINE * (1 + (size - 1) * 0.75));
        }
      }
    });
  };

  /* ---- Header: the homepage's masthead --------------------------------------
     On the homepage the statement's first line is the masthead, so the header
     ([data-nda-dock]) keeps its wordmark out (.is-undocked) until that line has
     scrolled up under the header. The attribute's value names the line; empty,
     it is the first hero line. */
  NDA.dock = function (header) {
    if (header.__ndaDock || !window.IntersectionObserver) return;
    var target = document.querySelector(header.getAttribute('data-nda-dock') || '.nda-hero__line');
    if (!target) return;
    header.__ndaDock = true;
    var io = null, h = -1;
    function watch() {
      var nh = Math.round(header.getBoundingClientRect().height);
      if (nh === h) return;
      h = nh;
      if (io) io.disconnect();
      io = new IntersectionObserver(function (entries) {
        var under = !entries[entries.length - 1].isIntersecting;   // gone up under the header
        header.classList.toggle('is-undocked', !under);
        header.classList.toggle('is-docked', under);
      }, { rootMargin: (-h) + 'px 0px 0px 0px', threshold: 0 });
      io.observe(target);
    }
    watch();
    window.addEventListener('resize', watch);
  };

  /* ---- Header that steps aside -------------------------------------------------
     [data-nda-autohide]: for pages where the screen belongs to something else
     (Cinema). The header tucks away as you scroll down past it and comes back as
     soon as you scroll up, focus into it, or open its menu. */
  NDA.autohide = function (header) {
    if (header.__ndaHide) return;
    header.__ndaHide = true;
    var lastY = window.scrollY || 0, ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY || 0, h = header.offsetHeight;
      var keep = y < h || y < lastY - 2 || header.hasAttribute('data-open') || header.contains(document.activeElement);
      if (keep || y > lastY + 2) header.classList.toggle('is-tucked', !keep);
      lastY = y;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    header.addEventListener('focusin', function () { header.classList.remove('is-tucked'); });
  };

  /* ---- Tag line: the tags fade in one after another ------------------------
     [data-nda-sequence] on a TagList: each tag fades up into place in turn, the
     last a beat later, so the line lands on it; all of them stay. Once, when the
     list is first on screen, and after the intro on a first visit. Under reduced
     motion (or without Web Animations) the tags are simply there. */
  NDA.sequence = function (list) {
    if (list.__ndaSeq) return;
    list.__ndaSeq = true;
    if (reducedMotion() || !list.animate || !window.IntersectionObserver) return;
    var items = [].slice.call(list.children);
    items.forEach(function (li) {
      var roll = document.createElement('span');
      roll.className = 'nda-taglist__roll';
      while (li.firstChild) roll.appendChild(li.firstChild);
      li.appendChild(roll);
    });
    list.classList.add('is-waiting');
    var started = false;
    function play() {
      if (started) return;
      started = true;
      items.forEach(function (li, i) {
        var last = i === items.length - 1 && items.length > 1;
        li.firstChild.animate([
          { opacity: 0, transform: 'translateY(4px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: last ? 700 : 420, delay: i * 380 + (last ? 320 : 0), easing: 'ease-out', fill: 'backwards' });
      });
      list.classList.remove('is-waiting');
    }
    function whenSeen() {
      var io = new IntersectionObserver(function (entries) {
        if (!entries[entries.length - 1].isIntersecting) return;
        io.disconnect();
        setTimeout(play, 250);
      }, { threshold: 0.6 });
      io.observe(list);
    }
    var intro = document.querySelector('[data-nda-intro]');
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(function () {
      if (intro && !intro.hidden && !NDA.introEnded && !intro.hasAttribute('data-replay')) document.addEventListener('nda:introend', whenSeen, { once: true });
      else whenSeen();
    });
    onMotionChange(function () { if (reducedMotion()) { started = true; list.classList.remove('is-waiting'); } });
  };

  /* ---- Header menu (below 1024px) ---- */
  NDA.menu = function (header) {
    if (header.__ndaMenu) return;
    header.__ndaMenu = true;
    var button = header.querySelector('.nda-header__menu');
    if (!button) return;
    function setOpen(open) {
      if (open) header.setAttribute('data-open', ''); else header.removeAttribute('data-open');
      button.setAttribute('aria-expanded', String(open));
    }
    button.addEventListener('click', function () { setOpen(!header.hasAttribute('data-open')); });
    header.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.hasAttribute('data-open')) { setOpen(false); button.focus(); }
    });
    if (window.matchMedia) {
      var wide = window.matchMedia('(min-width: 1024px)');
      var close = function () { if (wide.matches) setOpen(false); };
      if (wide.addEventListener) wide.addEventListener('change', close); else if (wide.addListener) wide.addListener(close);
    }
  };

  /* ---- A nav item's own menu (Seminars) ----
     The toggle opens and closes it; Escape closes it and returns to the toggle; so does a click or focus elsewhere.
     On pointer devices it also opens on hover (CSS). */
  NDA.submenu = function (group) {
    if (group.__ndaSubmenu) return;
    group.__ndaSubmenu = true;
    var toggle = group.querySelector('.nda-header__sub-toggle');
    if (!toggle) return;
    function setOpen(open) {
      if (open) group.setAttribute('data-open', ''); else group.removeAttribute('data-open');
      toggle.setAttribute('aria-expanded', String(open));
    }
    toggle.addEventListener('click', function () { setOpen(!group.hasAttribute('data-open')); });
    group.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && group.hasAttribute('data-open')) { setOpen(false); toggle.focus(); e.stopPropagation(); }
    });
    group.addEventListener('focusout', function (e) { if (!group.contains(e.relatedTarget)) setOpen(false); });
    document.addEventListener('click', function (e) { if (!group.contains(e.target)) setOpen(false); });
  };

  /* ---- Intro sequence: the first-visit overture -----------------------------
     The intro concept film, rebuilt live and laid out from its measurements.
     "Neta DAO Academy" never moves; "the home of Web3 and" shivers where PHILOSOPHY
     knocks it, is pushed up under the first line at the burst and wipes back in
     from the left as THOUGHT comes in. HISTORY OF SCIENCE is already sliding up
     under PHILOSOPHY; after a hold SOCIOLOGY pushes the stack up, PHILOSOPHY is
     squashed away under the second line and HISTORY OF SCIENCE turns into
     PSYCHOANALYSIS at the head of the list, and the disciplines, each
     at its own size, width and weight (Archivo's width and weight axes), run in three rows
     and then four that share one box, so a big word squashes the others and a row
     coming or going lets them stretch: unevenly paced scrolls, peels, twists, rolls,
     three shivers (each one turns a word into the next), a travelling pinch and tugs
     between neighbours, with holds where the film holds. The type is mostly cream:
     the kinetic pigment film stains a few words (a stain at the start, a band
     through THOUGHT). At the burst a plum
     spot blooms on the wall behind the rows and paint is thrown out of it, splashes and
     shards that hang in the air, lit by the spot and casting shadows on the wall; the
     film's own ribbon flicks through the rows; the whole frame breathes. THOUGHT is peeled in by a right-angled edge, like _|, whose corner
     runs from the top of THOU to the lower right (the tops of THOU first, the last
     T last), each letter unfolding flat as it is uncovered, as the rows smear away
     and a nucleus of paint explodes almost to the screen's edges; after a
     hold, a hairline white bar sweeps the intro off the page.
     It opens on a still (1 s) and plays the concept film's soundtrack with the score, where the browser
     allows, or from the Sound on button, lowering Neta DAO Radio under it.
     Every move is a Web Animation on one clock (state.seek(ms) scrubs it); the ribbon's frames are drawn from that clock.
     Skippable with the button or Escape; once per visitor; never under
     prefers-reduced-motion. */
  // THOUGHT's reveal edge and the film's mask animate through registered custom properties (plain ones would jump)
  var SWEEP_MASK = (function () {
    if (!window.CSS || typeof CSS.registerProperty !== 'function') return false;
    // THOUGHT's corner (--nda-rx, --nda-ry) and the film's stains in the letters (a moving ellipse, a band through THOUGHT)
    [['--nda-rx', '<percentage>', '0%'], ['--nda-ry', '<percentage>', '0%'], ['--nda-fx', '<percentage>', '50%'], ['--nda-fy', '<percentage>', '50%'],
      ['--nda-fw', '<percentage>', '30%'], ['--nda-fh', '<percentage>', '30%'], ['--nda-fa', '<number>', '0'], ['--nda-tb', '<percentage>', '50%'],
      ['--nda-ta', '<number>', '0']].forEach(function (n) {
      try { CSS.registerProperty({ name: n[0], syntax: n[1], inherits: false, initialValue: n[2] }); } catch (e) { /* already registered */ }
    });
    return true;
  })();
  /* -- paint for the intro's burst (the splashes, the folded pigment in the shards), drawn once per page into small canvases from
        seeded value noise, so the system ships no image for it. -- */
  var PAINT = null;
  function burstPaint() {
    if (PAINT) return PAINT;
    var s = 97;
    function rand() { s = (s + 0x6D2B79F5) | 0; var t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    function grid() { var a = new Float32Array(64 * 64); for (var i = 0; i < a.length; i++) a[i] = rand(); return a; }
    function vn(a, x, y) {
      var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      xi &= 63; yi &= 63; var x1 = (xi + 1) & 63, y1 = (yi + 1) & 63;
      var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      var a00 = a[yi * 64 + xi], a10 = a[yi * 64 + x1], a01 = a[y1 * 64 + xi], a11 = a[y1 * 64 + x1];
      return a00 + (a10 - a00) * u + (a01 - a00) * v + (a00 - a10 - a01 + a11) * u * v;
    }
    function field(oct) { var gs = []; for (var i = 0; i < oct; i++) gs.push(grid()); return gs; }
    function fbm(gs, x, y) { var t = 0, amp = 0.5, f = 1, n = 0; for (var o = 0; o < gs.length; o++) { t += amp * vn(gs[o], x * f + o * 17.3, y * f + o * 9.1); n += amp; amp *= 0.5; f *= 2.03; } return t / n; }
    function ss(a, b, x) { var k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); }
    function sprite(w, h, fn) {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data, px = [0, 0, 0, 0];
      for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
        fn((i + 0.5) / w * 2 - 1, (j + 0.5) / h * 2 - 1, px);
        var k = (j * w + i) * 4; d[k] = px[0]; d[k + 1] = px[1]; d[k + 2] = px[2]; d[k + 3] = Math.max(0, Math.min(1, px[3])) * 255;
      }
      g.putImageData(img, 0, 0);
      return c.toDataURL('image/png');
    }
    function marble() {   // the pigment, folded: blue, violet and magenta paint turned through each other, for the burst's shards
      var W1 = field(4), W2 = field(4), D1 = field(5);
      var RAMP = [[0, [24, 52, 140]], [0.28, [52, 112, 226]], [0.46, [116, 84, 206]], [0.62, [214, 62, 152]], [0.8, [240, 118, 182]], [1, [250, 214, 234]]];
      return sprite(160, 160, function (u, v, px) {
        var q = fbm(W1, u * 1.1 + 1, v * 1.1 + 3), r = fbm(W2, u * 1.1 + 3.5 * q + 7, v * 1.1 + 3.5 * q + 2);
        var x = Math.max(0, Math.min(1, (fbm(D1, u * 1.4 + 3 * r, v * 1.4 + 3 * r) - 0.28) / 0.44)), i = 1;
        while (i < RAMP.length - 1 && x > RAMP[i][0]) i++;
        var a0 = RAMP[i - 1], a1 = RAMP[i], f = (x - a0[0]) / (a1[0] - a0[0]);
        px[0] = a0[1][0] + (a1[1][0] - a0[1][0]) * f; px[1] = a0[1][1] + (a1[1][1] - a0[1][1]) * f; px[2] = a0[1][2] + (a1[1][2] - a0[1][2]) * f; px[3] = 1;
      });
    }
    function splash(rgb, dark, hl) {   // a splash of thin paint, as the film's burst throws them: an uneven blot with a torn edge, darker where it pools
      var W1 = field(3), D1 = field(5), D2 = field(4);
      return sprite(176, 144, function (u, v, px) {
        var w = fbm(W1, u * 1.4 + 5, v * 1.4 + 1) - 0.5, uu = u + 0.6 * w, vv = v + 0.55 * w;
        var r = Math.sqrt(uu * uu + vv * vv), body = fbm(D1, uu * 1.7 + 1, vv * 1.7 + 8), pool = fbm(D2, uu * 1.3 + 4, vv * 1.3 + 2);
        var a = ss(0.98, 0.84, r + 0.7 * (body - 0.5)) * ss(1, 0.86, Math.max(Math.abs(u), Math.abs(v))) * (0.8 + 0.2 * ss(0.3, 0.7, body));
        var t1 = ss(0.45, 0.85, pool) * 0.8, t2 = ss(0.72, 0.9, body) * 0.3;
        px[0] = rgb[0] + (dark[0] - rgb[0]) * t1; px[1] = rgb[1] + (dark[1] - rgb[1]) * t1; px[2] = rgb[2] + (dark[2] - rgb[2]) * t1;
        px[0] += (hl[0] - px[0]) * t2; px[1] += (hl[1] - px[1]) * t2; px[2] += (hl[2] - px[2]) * t2; px[3] = a * 0.9;
      });
    }
    PAINT = { marble: marble(), sblue: splash([66, 122, 228], [30, 64, 160], [150, 186, 246]), sblue2: splash([52, 104, 214], [24, 52, 136], [132, 172, 240]),
      smag: splash([214, 66, 158], [118, 28, 94], [248, 156, 210]) };
    return PAINT;
  }
  NDA.intro = function (el, options) {
    if (el.__ndaIntro) return el.__ndaIntro;
    options = options || {};
    var attrKey = el.getAttribute('data-storage-key');
    var key = options.storageKey !== undefined ? options.storageKey : (attrKey === 'none' ? null : (attrKey || 'academy-intro-seen-v6'));
    var replay = options.replay !== undefined ? options.replay : el.hasAttribute('data-replay');
    var userDone = options.onDone || noop;
    // the page's own reveals (NDA.sequence) wait for this
    function onDone() { NDA.introEnded = true; try { document.dispatchEvent(new CustomEvent('nda:introend')); } catch (e) { /* old browsers */ } userDone(); }
    function q(s) { return el.querySelector(s); }
    var sheet = q('.nda-intro__sheet'), camera = q('.nda-intro__camera'), breath = q('.nda-intro__breath');
    var stage = q('.nda-intro__stage'), wordLine = q('.nda-intro__line--word'), win = q('.nda-intro__window');
    var rowsEl = q('.nda-intro__rows'), thought = q('.nda-intro__thought'), fill = q('.nda-intro__fill');
    var back = q('.nda-intro__burst'), debris = q('.nda-intro__debris'), wipe = q('.nda-intro__wipe'), skip = q('.nda-intro__skip');
    var shade = null;   // THOUGHT again, in black, under the window (made in build)
    var line2 = el.querySelectorAll('.nda-intro__line')[1];
    // optional: a filmed burst behind the rows, which starts data-lead ms before the burst and rises to data-level
    var bg = q('.nda-intro__bg');
    var bloomV = q('video.nda-intro__bloom');   // optional: the bloom film, behind the type
    var filmV = q('video.nda-intro__film');     // optional: the whole intro, rendered (phones play it; see FILM)
    // optional: the soundtrack, and the button that turns it on and off
    var sound = q('audio.nda-intro__sound'), soundBtn = q('.nda-intro__sound-toggle');
    var fx = q('.nda-intro__fx filter'), turb = null, disp = null, fxId = '';
    if (fx) {
      fxId = fx.id + '-' + (++intros);
      fx.id = fxId;
      turb = fx.querySelector('feTurbulence'); disp = fx.querySelector('feDisplacementMap');
    }
    var words = [].map.call(el.querySelectorAll('.nda-intro__list li'), function (li) { return li.textContent.replace(/\s+/g, ' ').trim(); });
    var thoughtWord = thought ? (thought.getAttribute('data-word') || thought.textContent.trim()) : 'Thought';
    if (thought) thought.setAttribute('data-word', thoughtWord);
    var T = { burst: 3200, reveal: 7950, end: 10000, exit: 900 };
    // the hold: the opening frame (the statement, PHILOSOPHY with the paint moving in it) stands still this long
    // before anything moves, so the eye can take it in. The clock includes it; the score's times start after it.
    var HOLD = options.hold !== undefined ? Math.max(0, +options.hold || 0) : 1000;
    // Lite: phones, tablets and small machines (and data-lite) get the same score with less to paint: no blur filters
    // on the moving letters and shards, no shadows on the wall, no warp in the rows, fewer shards flying out, and the
    // films nudged to load at once. On an iPhone the full version drops frames all through the burst.
    function liteDevice() {
      var ua = navigator.userAgent || '';
      var iOS = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
      var coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
      var small = Math.min(screen.width || 9999, screen.height || 9999) < 820;
      var weak = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
      return iOS || (coarse && small) || weak;
    }
    var liteAttr = el.getAttribute('data-lite');   // data-lite="off": the full version everywhere
    var LITE = options.lite !== undefined ? !!options.lite : liteAttr === 'off' ? false : (liteAttr !== null || liteDevice());
    if (LITE) el.setAttribute('data-lite', '');
    // Film: a phone held upright plays the full version as one rendered film (.nda-intro__film: data-src, and its first
    // frame as data-poster), sized like the stage; the grain, the sound, Skip and the exit sweep stay live over it.
    // Where the film can't play (Low Power Mode, an error), the live lite version runs instead.
    function portraitPhone() {
      var w = window.innerWidth || 0, h = window.innerHeight || 0;
      return h > w * 1.25 && Math.min(screen.width || 9999, screen.height || 9999) < 600;
    }
    var filmOn = !!filmV && !!filmV.getAttribute('data-src') && !replay && options.film !== false && LITE && portraitPhone();
    var FILM_LEN = HOLD + T.end, filmSwept = false;
    // the film in the letters runs at 0.83x. It opens 3.8 s in, where the paint already flows across the frame in streams
    // (its first seconds are one small splash in the middle), and while it is hidden after the burst it jumps back to
    // run in step with the score from there on: THOUGHT's band is where it always was
    // intro-fill is cut for the intro: the kinetic film from 2.97s, slowed to 0.83, cutting back at 3.4s of the score;
    // so it plays straight through on the clock and never seeks mid-sequence (a seek stalls the letters' paint)
    var FILM_END = 12.95;
    function attr(n, d) { var v = bg ? parseFloat(bg.getAttribute(n)) : NaN; return isNaN(v) ? d : v; }
    var BG = bg ? { lead: attr('data-lead', 250), level: attr('data-level', 0.45), fragments: bg.hasAttribute('data-fragments') } : null;
    var BG0 = BG ? T.burst - BG.lead : 0, BG_END = T.reveal + 1450;
    var anims = [], cues = [], timers = [], playing = false, clockStart = null;
    var state = { done: false, duration: HOLD + T.end + T.exit, seek: noop, pause: noop, play: noop, skip: noop };
    if (!sheet || !stage || !win || !rowsEl || !thought || !words.length) return state;

    function seen() { try { return key && localStorage.getItem(key) === '1'; } catch (e) { return false; } }
    function remember() { try { if (key) localStorage.setItem(key, '1'); } catch (e) {} }
    function media(v, fn) { if (v) { try { fn(v); } catch (e) {} } }

    /* -- a seeded random, so every run of the intro is the same film -- */
    var seed = 11;
    function rnd() {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    function rr(a, b) { return a + (b - a) * rnd(); }
    function pick(list) { return list[Math.floor(rnd() * list.length)]; }

    /* -- geometry, in cqi of the stage (100 = the statement's width) -- */
    var G = {}, L = {};
    function metrics(weight, fam) {
      var c = document.createElement('canvas').getContext('2d');
      c.font = weight + ' 100px ' + (fam || getComputedStyle(wordLine).fontFamily);
      var m = c.measureText('H');
      var asc = (m.fontBoundingBoxAscent || 100) / 100, desc = (m.fontBoundingBoxDescent || 30) / 100;
      var cap = (m.actualBoundingBoxAscent || 70) / 100;
      return { cap: cap, base: (0.8 - asc - desc) / 2 + asc };   // baseline below the top of a .8 line box
    }
    var probe = document.createElement('span');
    function measure(text, weight, tight, v) {
      probe.className = 'nda-intro__word' + (tight === 'word' ? ' nda-intro__word--thought' : tight ? ' nda-intro__word--tight' : '');
      probe.style.cssText = 'font-size:100px;opacity:0;visibility:hidden;font-weight:' + weight;
      if (v) { probe.style.fontFamily = v.fam; probe.style.fontVariationSettings = v.fvs; probe.style.fontSynthesis = 'none'; }
      probe.textContent = text.toUpperCase();
      rowsEl.appendChild(probe);
      var node = probe.firstChild, range = document.createRange(), left = probe.getBoundingClientRect().left;
      range.selectNodeContents(probe);
      var width = range.getBoundingClientRect().width / 100;
      var chars = [];
      for (var i = 0; i < node.length; i++) {
        range.setStart(node, i); range.setEnd(node, i + 1);
        var r = range.getBoundingClientRect();
        chars.push({ ch: node.data.charAt(i), x: (r.left - left) / 100, w: r.width / 100 });
      }
      var ls = (parseFloat(getComputedStyle(probe).letterSpacing) || 0) / 100;
      rowsEl.removeChild(probe);
      return { em: width, ink: width - Math.min(0, ls), chars: chars };   // ink: the advance plus the trailing negative tracking
    }
    function geometry() {
      G.W = stage.getBoundingClientRect().width || 1120;
      G.px = G.W / 100;
      G.mB = metrics(700); G.mT = metrics(800);
      // the disciplines are set in the Archivo variable font, so each can take its own width and weight, as in the film
      G.famV = getComputedStyle(el).getPropertyValue('--font-display-widths').trim() || getComputedStyle(wordLine).fontFamily;
      G.mV = metrics(700, G.famV);
      G.thoughtM = measure(thoughtWord, 800, 'word');
      var fitT = G.thoughtM.ink * 1.002;
      wordLine.style.setProperty('--nda-fit', fitT.toFixed(3));
      G.fT = 100 / fitT;
      G.capT = 29.66;                                   // THOUGHT's capitals: 29.7% of the width, as in the film
      G.s = G.capT / (G.mT.cap * G.fT);
      wordLine.style.setProperty('--nda-s', G.s.toFixed(4));
      G.capTop = (G.mT.base - G.mT.cap) * G.fT * G.s;
      G.boxH = 0.8 * G.fT * G.s;
      G.rowCap = 9.4;                                   // a row's capitals: 9.4% of the width, 1.2% apart, as in the film
      G.P = 10.6;                                       // three rows span THOUGHT's capitals, starting a little above them
      var sr = sheet.getBoundingClientRect(), wr = wordLine.getBoundingClientRect();
      var below = (sr.bottom - wr.bottom) / G.px, maxExt = G.P * 1.2;
      G.ext = Math.max(0, Math.min(below + 1, maxExt));
      win.style.setProperty('--nda-ext', G.ext.toFixed(3) + 'cqi');
      if (below > maxExt) { win.setAttribute('data-fade', ''); win.style.setProperty('--nda-fade', (G.P * 0.7).toFixed(3) + 'cqi'); }
      else win.removeAttribute('data-fade');
      // the window reaches up to just under the first line, so in the middle of the score a fourth row can take the
      // second line's place. Everything in it is placed from its top: the word line starts G.y0 below that.
      var lines = el.querySelectorAll('.nda-intro__line'), m1 = lineMetrics(lines[0]), m2 = lineMetrics(lines[1]);
      G.y0 = Math.max(0, (wr.top - m1.base) / G.px - 0.4);
      win.style.top = (-G.y0).toFixed(3) + 'cqi';
      thought.style.top = G.y0.toFixed(3) + 'cqi';
      G.Bup = G.y0 + (m2.base - wr.top) / G.px;          // the second line's baseline: the top row's slot once it is gone
      G.winH = G.boxH + G.ext + G.y0;
      // the rows' clip: under the second line until the burst knocks it away, then under the first. The clip sits on
      // the rows, not on the window: a clip-path on the lighten group leaves a bright seam along its edges.
      win.style.clipPath = '';
      G.clipLow = G.y0 + Math.max(0, G.capTop - 1.4); G.clipHigh = 0.25;
      rowsEl.style.clipPath = clipAt(G.clipLow);
      G.stageH = stage.getBoundingClientRect().height / G.px;
      G.lineTop = (wr.top - stage.getBoundingClientRect().top) / G.px;
      G.rowsTop = G.lineTop - G.y0;                         // the window's top, in stage cqi
      // the second line's bump: how far its letters may rise before the first line hides them, and how far to go
      var l2fs = parseFloat(getComputedStyle(lines[1]).fontSize) || 1, l2r = lines[1].getBoundingClientRect();
      G.l2C = Math.max(0, (l2r.top - m1.base) / l2fs - 0.02);
      G.l2D = l2r.height / l2fs + G.l2C + 0.06;
      // the box the rows share: from under the second line (before the burst) or the first (after) down to THOUGHT's
      // baseline, where the film's rows end. kBox scales the designed sizes so a settled set of four just fills it.
      L.g = 1.5;
      L.Y0q = G.Bup + 1.9;
      L.Y0p = -0.4 + 1.9;
      L.Y1 = G.y0 + G.capTop + G.capT + 0.6;
      L.kBox = (L.Y1 - L.Y0p - 3 * L.g) / 38.4;
      L.top = L.Y0q;
      var ink = getComputedStyle(el).color.match(/[\d.]+/g) || [229, 221, 203];
      G.ink = function (a) { return 'rgba(' + ink[0] + ', ' + ink[1] + ', ' + ink[2] + ', ' + a + ')'; };
    }
    function blur(k) { return 'blur(' + (k * G.W / 1120).toFixed(2) + 'px)'; }
    function clipAt(top) { return 'inset(' + top.toFixed(3) + 'cqi -10cqi -10cqi -10cqi)'; }

    /* -- the clock: every animation is created paused and driven together. Times in the score are after the hold;
          the moves that open the score hold their first frame through it. -- */
    function A(node, frames, t, dur, easing, composite) {
      if (LITE) frames = frames.map(function (f) { if (!('filter' in f)) return f; var g = {}; for (var k in f) if (k !== 'filter') g[k] = f[k]; return g; });
      var opts = { duration: Math.max(1, dur), delay: HOLD + Math.max(0, t), easing: easing || 'linear', fill: t > 0 ? 'forwards' : 'both' };
      if (composite) opts.composite = composite;
      var a = node.animate(frames, opts);
      if (a.persist) a.persist();     // keep finished moves, so the clock can be scrubbed backwards
      a.pause();
      anims.push(a);
      return a;
    }
    function init(node, props) { for (var k in props) node.style[k] = props[k]; }
    function cue(t, fn) { cues.push({ t: HOLD + t, fn: fn }); }

    /* -- words -- */
    function span(cls) { var s = document.createElement('span'); s.className = cls; return s; }
    function makeWord(text, o) {
      o = o || {};
      var weight = o.wght || o.weight || 700, tight = !!o.tight;
      var v = o.wdth ? { fam: G.famV, fvs: "'wdth' " + o.wdth + ", 'wght' " + o.wght } : null;
      var m = measure(text, weight, tight, v), mm = v ? G.mV : weight >= 800 ? G.mT : G.mB;
      var maxW = o.maxW || 99.4, f = o.size || Math.min(G.rowCap / mm.cap, maxW / m.ink);
      if (o.cap) f = Math.min(o.cap / mm.cap, maxW / m.ink);
      var w = { f: f, em: m.em, y: 0, s: 1, chars: [], el: span('nda-intro__word' + (tight ? ' nda-intro__word--tight' : '')),
        st: span('nda-intro__st'), face: span('nda-intro__face') };
      var st = o.stretch || 1, capOrigin = '0 ' + ((mm.base - mm.cap) / 0.8 * 100).toFixed(2) + '%';
      w.capH = mm.cap * f * st;
      w.c = mm.cap * f;                                     // its capitals' natural height (cqi)
      if (o.capTop !== undefined) w.base0 = o.capTop + w.capH;
      else w.base0 = o.base !== undefined ? o.base : L.Y1;
      w.top = w.base0 - w.capH - (mm.base - mm.cap) * f;   // the box top, with the capitals stretched downward from their top
      w.ct0 = w.top + (mm.base - mm.cap) * f;               // where its capitals start before any move
      if (st !== 1) init(w.face, { transformOrigin: capOrigin, transform: 'scaleY(' + st + ')' });
      w.st.style.transformOrigin = capOrigin;               // the stretch layer squashes and stretches from the capitals' top
      w.x = o.x || 0;
      init(w.el, { fontSize: f + 'cqi', width: m.em + 'em', top: w.top + 'cqi', left: w.x + 'cqi', opacity: '0' });
      w.el.style.fontWeight = weight;
      if (v) { w.el.style.fontFamily = v.fam; w.el.style.fontVariationSettings = v.fvs; w.el.style.fontSynthesis = 'none'; w.el.style.wordSpacing = '-.02em'; }
      m.chars.forEach(function (c) {
        if (c.ch === ' ') return;
        var ch = span('nda-intro__char');
        ch.textContent = c.ch;
        ch.style.left = c.x + 'em';
        w.face.appendChild(ch);
        w.chars.push({ el: ch, x: c.x, w: c.w });
      });
      w.st.appendChild(w.face);
      w.el.appendChild(w.st);
      rowsEl.appendChild(w.el);
      return w;
    }
    function ty(y) { return 'translate3d(0,' + y.toFixed(3) + 'cqi,0)'; }
    function place(w, y, visible) { w.y = y; init(w.el, { transform: ty(y), opacity: visible === false ? '0' : '1' }); }
    function trail(a) { return '0 ' + a + 'em 0 ' + G.ink(0.3) + ', 0 ' + (a * 2.1) + 'em 2px ' + G.ink(0.13); }
    var NO_TRAIL = '0 0 0 rgba(0,0,0,0), 0 0 0 rgba(0,0,0,0)';
    // vertical motion blur: a trail of the letters behind the move, plus a little softening
    function smear(w, t, dur, dir, k) {
      A(w.face, [{ textShadow: NO_TRAIL }, { textShadow: trail(dir < 0 ? 0.07 : -0.07), offset: 0.42 }, { textShadow: NO_TRAIL }], t, dur);
      A(w.el, [{ filter: blur(0) }, { filter: blur(k), offset: 0.45 }, { filter: blur(0) }], t, dur);
    }
    // the letters lag the word a little, each its own way
    function jelly(w, t, dur, dir) {
      w.chars.forEach(function (c) {
        var d = -dir * rr(0.015, 0.065);
        A(c.el, [{ transform: 'translateY(0em)' }, { transform: 'translateY(' + d.toFixed(3) + 'em)', offset: rr(0.3, 0.5) }, { transform: 'translateY(0em)' }],
          t + rr(0, 50), dur * rr(0.95, 1.3), 'ease-in-out', 'add');
      });
    }
    // every move is added to the ones before it, so a word can be pushed by the stack while it rolls or scrolls
    function moveTo(w, t, dur, y, easing, k) {
      var dir = y < w.y ? -1 : 1;
      A(w.el, [{ transform: ty(0) }, { transform: ty(y - w.y) }], t, dur, easing || 'cubic-bezier(.6,0,.15,1)', 'add');
      if (k) smear(w, t, dur, dir, k);
      jelly(w, t, dur, dir);
      w.y = y;
    }
    // scroll in from under THOUGHT (the screen's bottom edge)
    function enter(w, t, dur, easing, k) {
      place(w, G.winH + 1.5 - w.top);
      moveTo(w, t, dur, 0, easing || 'cubic-bezier(.16,1,.3,1)', k === undefined ? 2 : k);
    }
    function exitUp(w, t, dur, easing) {
      moveTo(w, t, dur, -(w.top + w.f * 1.1), easing || 'cubic-bezier(.55,0,.75,.3)', 2.5);
    }
    // where a word's capitals are and how tall they are drawn, once every move made so far has run
    function capTop(w) { return w.ct0 + w.y; }
    function height(w) { return w.c * w.s; }
    function setStretch(w, s) { w.s = s; w.st.style.transform = 'scaleY(' + s.toFixed(4) + ')'; }
    function stretchTo(w, t, dur, s, easing) {
      A(w.st, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(' + (s / w.s).toFixed(4) + ')' }], t, dur, easing || SPRING, 'add');
      w.s = s;
    }
    // to a place in the stack: capitals' top at ct, drawn h tall
    function go(w, t, dur, ct, h, easing, k) {
      var dy = ct - capTop(w), s = h / w.c;
      if (Math.abs(dy) > 0.02) moveTo(w, t, dur, w.y + dy, easing || SPRING, k || 0);
      if (Math.abs(s - w.s) > 0.004) stretchTo(w, t, dur, s, easing);
    }
    // b takes a's place: the same capitals' top, drawn the same height
    function stand(b, a, visible) { setStretch(b, height(a) / b.c); place(b, capTop(a) - b.ct0, visible); }
    // b shows up in a place in the stack (squashed, often), unseen until t
    function appear(w, t, ct, h, dur) {
      setStretch(w, h / w.c); place(w, ct - w.ct0, false);
      A(w.el, [{ opacity: 0 }, { opacity: 1 }], t, dur || 120);
    }
    // scroll in from under the window's bottom edge to a place in the stack
    function enterTo(w, t, dur, ct, h, easing, k) {
      setStretch(w, h / w.c); place(w, G.winH + 1.5 - w.ct0);
      moveTo(w, t, dur, ct - w.ct0, easing || 'cubic-bezier(.16,1,.3,1)', k === undefined ? 2 : k);
    }

    /* -- the stack, as the film has it: the rows share the box between the statement and the screen's edge, each as
          tall as its word asks, the gaps even. A bigger word takes room from the others and they squash; a row going
          lets the others stretch into its room; a new one grows in squashed and pushes them back. -- */
    var SPRING = 'cubic-bezier(.34,1.36,.52,1)';
    function R(w, c) { var ws = w.length !== undefined ? w : [w]; return { ws: ws, c: c !== undefined ? c : ws[0].c }; }
    function stackOf(rows, top) {
      var sum = 0, y = top;
      rows.forEach(function (r) { sum += r.c; });
      var s = (L.Y1 - top - L.g * (rows.length - 1)) / sum;
      return rows.map(function (r) { var h = r.c * s, out = { ws: r.ws, ct: y, h: h }; y += h + L.g; return out; });
    }
    // every row to its place; the rows further from the change (o.from) go a beat later
    function restack(t, rows, o) {
      o = o || {};
      var S = stackOf(rows, o.top !== undefined ? o.top : L.top);
      S.forEach(function (r, k) {
        var dt = (o.from !== undefined ? Math.abs(k - o.from) : 0) * (o.stagger !== undefined ? o.stagger : 35);
        r.ws.forEach(function (w) { go(w, t + dt, o.dur || 440, r.ct, r.h, o.easing || SPRING, o.k || 0); });
      });
      return S;
    }
    // a tug: two rows fight over the line between them; it swings d (cqi) down and back, and settles where it was.
    // The upper row stretches from its top, the lower gives way from its baseline. Laid on top of everything else.
    var tugs = [];
    function tug(a, b, t, dur, d) {
      a = [].concat(a); b = [].concat(b);
      tugs.push({ a: a, b: b, t: t, dur: dur, d: d, ha: height(a[0]), hb: height(b[0]) });
    }
    function emitTugs() {
      var seq = [0, 1, -0.62, 0.34, -0.14, 0], offs = [0, 0.2, 0.44, 0.64, 0.82, 1];
      tugs.forEach(function (g) {
        g.a.forEach(function (w) {
          A(w.st, seq.map(function (v, i) { return { transform: 'translateY(0cqi) scaleY(' + (1 + v * g.d / g.ha).toFixed(4) + ')', offset: offs[i], easing: 'ease-in-out' }; }), g.t, g.dur, 'linear', 'add');
        });
        g.b.forEach(function (w) {
          A(w.st, seq.map(function (v, i) {
            var k = 1 - v * g.d / g.hb;
            return { transform: 'translateY(' + (w.c * (1 - k)).toFixed(3) + 'cqi) scaleY(' + k.toFixed(4) + ')', offset: offs[i], easing: 'ease-in-out' };
          }), g.t, g.dur, 'linear', 'add');
        });
      });
    }
    function fadeOut(w, t, dur) {
      A(w.el, [{ opacity: 1 }, { opacity: 0 }], t, dur);
      A(w.el, [{ filter: blur(0) }, { filter: blur(9) }], t, dur);
    }
    function fadeIn(w, t, dur) {
      A(w.el, [{ opacity: 0 }, { opacity: 1 }], t, dur);
      A(w.el, [{ filter: blur(9) }, { filter: blur(0) }], t, dur, 'ease-out');
    }
    // morph: one word blurs into the next in place
    function morph(a, b, t, dur) { fadeOut(a, t, dur * 0.7); fadeIn(b, t + dur * 0.25, dur * 0.75); }
    // peel: a front crosses the row; each old letter turns away like a page, each new one turns in
    function peel(a, b, t, dur) {
      var reach = Math.max(a.em * a.f, b.em * b.f);
      stand(b, a, true);
      a.chars.forEach(function (c) {
        var s = t + (c.x * a.f / reach) * dur + rr(-15, 25), d = rr(140, 200);
        A(c.el, [{ transform: 'perspective(4em) rotateY(0deg)', transformOrigin: '0 55%' },
          { transform: 'perspective(4em) rotateY(' + rr(-98, -80).toFixed(1) + 'deg) translateZ(.12em)', transformOrigin: '0 55%' }], s, d, 'cubic-bezier(.5,0,.9,.5)');
        A(c.el, [{ opacity: 1 }, { opacity: 0 }], s + d * 0.45, d * 0.55);
        A(c.el, [{ filter: 'blur(0px) brightness(1)' }, { filter: blur(5) + ' brightness(.45)' }], s, d);
      });
      b.chars.forEach(function (c) {
        var s = t + 60 + (c.x * b.f / reach) * dur + rr(-15, 25), d = rr(220, 300);
        init(c.el, { opacity: '0', transform: 'perspective(4em) rotateY(95deg)' });
        A(c.el, [{ transform: 'perspective(4em) rotateY(95deg)', transformOrigin: '100% 55%' }, { transform: 'perspective(4em) rotateY(-9deg)', transformOrigin: '100% 55%', offset: 0.72 },
          { transform: 'perspective(4em) rotateY(0deg)', transformOrigin: '100% 55%' }], s, d, 'cubic-bezier(.2,.8,.3,1)');
        A(c.el, [{ opacity: 0 }, { opacity: 1 }], s, 70);
        A(c.el, [{ filter: blur(6) + ' brightness(.5)' }, { filter: 'blur(0px) brightness(1)' }], s, d * 0.8);
      });
    }
    // twist: the row turns over on its horizontal axis, letter by letter, and comes up as the next word
    function twist(a, b, t, dur) {
      stand(b, a, true);
      var half = dur * 0.48;
      a.chars.forEach(function (c, i) {
        var s = t + i * rr(22, 38);
        A(c.el, [{ transform: 'perspective(3em) rotateX(0deg)' }, { transform: 'perspective(3em) rotateX(' + rr(84, 92).toFixed(1) + 'deg)' }], s, half, 'cubic-bezier(.55,0,.85,.4)');
        A(c.el, [{ filter: 'brightness(1)' }, { filter: 'brightness(.35)' }], s, half);
        A(c.el, [{ opacity: 1 }, { opacity: 0 }], s + half - 20, 20);
      });
      b.chars.forEach(function (c, i) {
        var s = t + half * 0.92 + i * rr(22, 38);
        init(c.el, { opacity: '0', transform: 'perspective(3em) rotateX(-88deg)' });
        A(c.el, [{ opacity: 0 }, { opacity: 1 }], s, 20);
        A(c.el, [{ transform: 'perspective(3em) rotateX(-88deg)' }, { transform: 'perspective(3em) rotateX(0deg)' }], s, dur * 0.62, 'cubic-bezier(.2,1.4,.45,1)');
        A(c.el, [{ filter: 'brightness(.35)' }, { filter: 'brightness(1)' }], s, dur * 0.5);
      });
    }
    // roll: the row rolls up and away like a drum; the next rolls up into its place
    function roll(a, b, t, dur) {
      var p = G.P * 0.6;
      stand(b, a, false);
      var by = b.y;
      A(a.face, [{ transform: 'perspective(2.6em) rotateX(0deg)' }, { transform: 'perspective(2.6em) rotateX(58deg) scaleY(.8)' }], t, dur, 'cubic-bezier(.5,0,.75,.35)');
      moveTo(a, t, dur, a.y - p, 'cubic-bezier(.5,0,.75,.35)', 1.5);
      A(a.el, [{ opacity: 1 }, { opacity: 0 }], t + dur * 0.5, dur * 0.5);
      place(b, by + p, false);
      init(b.face, { transform: 'perspective(2.6em) rotateX(-58deg)' });
      var s = t + dur * 0.28;
      A(b.el, [{ opacity: 0 }, { opacity: 1 }], s, dur * 0.3);
      A(b.face, [{ transform: 'perspective(2.6em) rotateX(-58deg)' }, { transform: 'perspective(2.6em) rotateX(0deg)' }], s, dur * 1.05, 'cubic-bezier(.2,1.3,.4,1)');
      moveTo(b, s, dur * 1.05, by, 'cubic-bezier(.2,1.3,.4,1)', 1.2);
    }
    // shiver: a quick sideways tremor with a ghost of the letters; it always yields the next word
    function tremor(w, t, dur, amt) {
      A(w.face, [{ transform: 'translateX(0cqi)' }, { transform: 'translateX(' + (-amt) + 'cqi) skewX(-5deg)' }, { transform: 'translateX(' + (amt * 0.8) + 'cqi) skewX(4deg)' },
        { transform: 'translateX(' + (-amt * 0.45) + 'cqi) skewX(-2deg)' }, { transform: 'translateX(' + (amt * 0.2) + 'cqi) skewX(0deg)' }, { transform: 'translateX(0cqi) skewX(0deg)' }], t, dur, 'linear', 'add');
      A(w.face, [{ textShadow: NO_TRAIL }, { textShadow: '.1em 0 0 ' + G.ink(0.45) + ', -.05em 0 0 ' + G.ink(0.25) },
        { textShadow: '-.07em 0 0 ' + G.ink(0.45) + ', .04em 0 0 ' + G.ink(0.25) }, { textShadow: NO_TRAIL }], t, dur);
    }
    function shiverInto(a, list, t, dur) {
      tremor(a, t, dur, 0.75);
      fadeOut(a, t + dur * 0.35, dur * 0.4);
      list.forEach(function (b, i) {
        stand(b, a, false);
        fadeIn(b, t + dur * 0.45 + 40 * i, dur * 0.5);
        tremor(b, t + dur * 0.4 + 40 * i, dur * 0.85, 0.5);
      });
    }
    // flip: the row turns right over on its horizontal axis and lands back
    function flip(w, t, dur) {
      A(w.face, [{ transform: 'perspective(3em) rotateX(0deg) skewX(0deg)' }, { transform: 'perspective(3em) rotateX(84deg) skewX(-14deg)', offset: 0.46, easing: 'step-end' },
        { transform: 'perspective(3em) rotateX(-84deg) skewX(-14deg)', offset: 0.5 }, { transform: 'perspective(3em) rotateX(0deg) skewX(0deg)' }], t, dur, 'ease-in-out');
      A(w.el, [{ filter: blur(0) }, { filter: blur(3), offset: 0.5 }, { filter: blur(0) }], t, dur);
    }
    // per-letter waves, swept left to right, added on top of whatever the letters are doing
    function wave(w, t, dur, each, frames) {
      w.chars.forEach(function (c) { A(c.el, frames, t + (c.x / w.em) * (dur - each) + rr(-12, 12), each, 'ease-in-out', 'add'); });
    }
    // pinch: as in the film, a compression travels through the word; the letters it reaches shrink toward the baseline and blur
    function pinch(w, t, dur) {
      var each = 300;
      w.chars.forEach(function (c) {
        var s = t + (c.x / w.em) * (dur - each) + rr(-10, 10);
        A(c.el, [{ transform: 'translateY(0em) scale(1, 1)' }, { transform: 'translateY(.1em) scale(.84, .7)', offset: 0.45 }, { transform: 'translateY(0em) scale(1, 1)' }], s, each, 'ease-in-out', 'add');
        A(c.el, [{ filter: 'blur(0px)' }, { filter: blur(1.8), offset: 0.45 }, { filter: 'blur(0px)' }], s, each);
      });
    }
    function lean(w, t, dur, deg) { wave(w, t, dur, 220, [{ transform: 'skewX(0deg)' }, { transform: 'skewX(' + deg + 'deg)' }]); }
    function ripple(w, t, dur) {
      wave(w, t, dur, 380, [{ transform: 'perspective(2.5em) rotateX(0deg)' }, { transform: 'perspective(2.5em) rotateX(64deg) translateY(-.04em)', offset: 0.5 }, { transform: 'perspective(2.5em) rotateX(0deg)' }]);
    }


    /* -- the burst, as the film has it: a plum spot of light blooms on the wall behind the rows, and paint is thrown out
          of it: a few small splashes of thin paint (blue, one magenta) that land and spread, flat shards that fly out
          tumbling, in pink, in blue and in the pigment itself (the paint still moving inside them; one large one where a
          splash would be), and a scatter of grit. Everything leaves the heart together. Some shards fly straight on out
          of the frame; the rest hang in the air, drifting and turning, until the peel. All of it hangs in front of the
          wall and behind the type, so it shows between the letters: the spot lights it (plum near the heart, dimmer
          away from it) and it casts soft shadows on the wall, pushed out from the spot's heart, further the nearer a
          piece hangs to us; outside the spot there is no light to cast them. Positions are in stage cqi from the
          statement's centre line; the layers sit at inset -10cqi -6cqi. -- */
    var HEART = [58, 7], GLOW = [70, 8];
    var SPLASH = [   // where each splash lands (mostly to the left, under the type): [x, y, width, paint, turn]
      [5, 13, 17, 'smag', -12], [31, -12, 15, 'sblue', 160], [100, -3, 14, 'sblue2', -40], [74, 24, 11, 'sblue', 35]
    ];
    var HANG = [     // where each shard comes to rest: [x, y, length, shape, fill]
      [28, 28.5, 13, 'chip', 'marble'],
      [64.5, -6.5, 7.5, 'sliver', 'pink'], [11, -10, 8, 'sliver', 'pink'], [88, 18, 6, 'sliver', 'pink'], [46, 21, 5.6, 'sliver', 'marble'],
      [80, -14, 7, 'sliver', 'marble'], [20, 4, 4, 'chip', 'blue'], [92, 7, 5.6, 'chip', 'marble'], [56, -17, 3.6, 'chip', 'pink'],
      [40, 31, 5, 'chip', 'marble'], [73, 3, 3.4, 'chip', 'blue'], [102, 24, 6.4, 'sliver', 'blue'], [13, 21, 5, 'sliver', 'blue'],
      [62, 31, 4.2, 'chip', 'pink'], [34, -2, 3, 'chip', 'blue'], [85, -3, 5, 'sliver', 'marble'], [50, -12, 3.4, 'chip', 'marble'],
      [4, -2, 5, 'sliver', 'blue'], [24, -16, 4.4, 'chip', 'pink'], [57, 16, 4.6, 'sliver', 'pink'], [97, -13, 4.2, 'chip', 'blue'],
      [42, 9, 3.2, 'chip', 'pink'], [70, -21, 5.2, 'sliver', 'blue'], [7, 30, 4.4, 'chip', 'pink'], [106, 13, 3.8, 'chip', 'marble'],
      [80, 29, 5, 'sliver', 'marble']
    ];
    function sliverShape() {   // a thin splinter, pointed at both ends, one side bellied
      var m = rr(32, 48);
      return 'polygon(0% ' + rr(44, 54).toFixed(1) + '%, ' + m.toFixed(1) + '% ' + rr(4, 22).toFixed(1) + '%, 100% ' + rr(40, 58).toFixed(1) + '%, ' +
        (m + rr(6, 22)).toFixed(1) + '% ' + rr(80, 98).toFixed(1) + '%)';
    }
    function chipShape() {     // a flake with sharp corners: four or five points at uneven distances from its middle
      var n = rnd() < 0.5 ? 4 : 5, pts = [], a0 = rr(0, 6.283);
      for (var i = 0; i < n; i++) {
        var a = a0 + (i + rr(-0.25, 0.25)) / n * 6.283, r = rr(0.2, 0.5);
        pts.push((50 + Math.cos(a) * r * 100).toFixed(1) + '% ' + (50 + Math.sin(a) * r * 100).toFixed(1) + '%');
      }
      return 'polygon(' + pts.join(', ') + ')';
    }
    // the plum spot: how strongly it lights a point (1 at its heart, 0 past its edge), and the light that reaches it,
    // which the paint is multiplied by: the room's dim, cool light outside the spot, plum inside it
    function lightAt(x, y) {
      var dx = (x - GLOW[0]) / 32, dy = (y - GLOW[1]) / 26, d = Math.sqrt(dx * dx + dy * dy);
      return Math.pow(Math.max(0, 1 - d / 1.15), 1.3);
    }
    var DIM = [178, 174, 196], SPOT = [255, 158, 226];
    function lit(f) { return 'rgb(' + DIM.map(function (a, i) { return Math.round(a + (SPOT[i] - a) * f); }).join(' ') + ')'; }
    function shardPaint(kind, P, f) {   // flat colour, a little graded; or the pigment itself, which keeps moving inside the shard; lit by the spot
      var light = 'linear-gradient(' + lit(f) + ', ' + lit(f) + ')';
      if (kind === 'marble') return { backgroundImage: light + ', url(' + P.marble + ')', backgroundSize: '320% 320%', backgroundBlendMode: 'multiply',
        backgroundPosition: Math.round(rr(0, 100)) + '% ' + Math.round(rr(0, 100)) + '%' };
      var c = kind === 'pink' ? [pick(['#c2347f', '#d23f8e', '#b8317a']), pick(['#ef6fae', '#f28cbd', '#e45a9f'])]
        : [pick(['#2a5bc4', '#2450b0', '#3566cc']), pick(['#5b8ef0', '#6a9cf2', '#4c82e6'])];
      return { background: light + ', linear-gradient(' + Math.round(rr(0, 360)) + 'deg, ' + c[0] + ', ' + c[1] + ')', backgroundBlendMode: 'multiply' };
    }
    function burst(t) {
      if (!back) return;
      var oy = G.stageH / 2, lx = 6, ly = 10, i, P = burstPaint();
      var gx = GLOW[0] + lx, gy = oy + GLOW[1] + ly;   // the spot's heart, in the layer
      if (BG) {
        // the film rises out of the dark with the burst and sinks back under the peel
        A(bg, [{ opacity: 0 }, { opacity: BG.level }], t - 50, 650, 'cubic-bezier(.3,0,.4,1)');
        A(bg, [{ opacity: BG.level }, { opacity: BG.level * 0.7, offset: 0.4 }, { opacity: 0 }], T.reveal - 300, 1600, 'ease-in');
        if (!BG.fragments) return;
      } else {
        var glow = span('nda-intro__glow');
        init(glow, { left: gx + 'cqi', top: gy + 'cqi' });
        back.appendChild(glow);
        A(glow, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(.86)', offset: 0.35 }, { opacity: 1, transform: 'scale(1)' }], t - 40, 900, 'cubic-bezier(.2,.7,.3,1)');
        A(glow, [{ transform: 'scale(1)' }, { transform: 'scale(1.05) translate(1cqi, .5cqi)', offset: 0.5 }, { transform: 'scale(1.01) translate(-.5cqi, -.3cqi)' }], t + 860, 3600, 'ease-in-out');
        A(glow, [{ opacity: 1 }, { opacity: 0.7, offset: 0.4 }, { opacity: 0 }], T.reveal - 300, 1600, 'ease-in');
      }
      // the shadows on the wall: in a layer of their own, under everything thrown, seen only where the spot lights the wall
      var shadows = span('nda-intro__shadows'), spotMask = 'radial-gradient(36cqi 30cqi at ' + gx.toFixed(2) + 'cqi ' + gy.toFixed(2) + 'cqi, #000, rgb(0 0 0 / .8) 35%, rgb(0 0 0 / .35) 70%, #0000)';
      init(shadows, LITE ? { display: 'none' } : { webkitMaskImage: spotMask, maskImage: spotMask });
      back.appendChild(shadows);
      A(shadows, [{ opacity: 0 }, { opacity: 1 }], t, 500, 'ease-out');
      A(shadows, [{ opacity: 1 }, { opacity: 0 }], T.reveal - 200, 1000, 'ease-in');
      var EASE = 'cubic-bezier(.16,.62,.24,1)';   // splashes and shards leave the heart together, on the same curve
      var hx = HEART[0] + lx, hy = oy + HEART[1] + ly;
      // the splashes: thrown out of the heart, they land and spread as thin paint does, a little more for as long as they hang
      SPLASH.forEach(function (sp) {
        var w = sp[2], h = w * 0.82, x = sp[0] + lx, y = oy + sp[1] + ly, img = 'url(' + P[sp[3]] + ')', r1 = sp[4], r0 = r1 - 40;
        // the spot's light across it, drawn in its own (turned) frame: brighter on the side toward the heart
        var dx = gx - x, dy = gy - y, rad = -r1 * Math.PI / 180, ux = dx * Math.cos(rad) - dy * Math.sin(rad), uy = dx * Math.sin(rad) + dy * Math.cos(rad);
        var light = 'radial-gradient(circle 37cqi at ' + (50 + ux / w * 100).toFixed(1) + '% ' + (50 + uy / h * 100).toFixed(1) + '%, ' +
          lit(1) + ', ' + lit(0.63) + ' 30%, ' + lit(0.3) + ' 60%, ' + lit(0) + ')';
        var box = { width: w + 'cqi', height: h + 'cqi', marginLeft: (-w / 2) + 'cqi', marginTop: (-h / 2) + 'cqi',
          webkitMaskImage: img, maskImage: img, webkitMaskSize: '100% 100%', maskSize: '100% 100%', webkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat' };
        var d = span('nda-intro__shard'), sh = span('nda-intro__shard');
        init(d, box); init(d, { background: light + ', center / 100% 100% no-repeat ' + img, backgroundBlendMode: 'multiply, normal' });
        init(sh, box); init(sh, { background: '#000' });
        shadows.appendChild(sh); back.appendChild(d);
        var tin = t + rr(0, 50), fly = rr(600, 760);
        function tf(px, py, rot, sc) { return 'translate(' + px.toFixed(2) + 'cqi, ' + py.toFixed(2) + 'cqi) rotate(' + rot.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')'; }
        function ts(px, py, rot, sc) { return tf(px + (px - gx) * 0.09, py + (py - gy) * 0.09 + 0.7, rot, sc * 1.04); }   // its shadow on the wall
        var x0 = hx + (x - hx) * 0.12, y0 = hy + (y - hy) * 0.12, ddx = (x - hx) * 0.035, ddy = (y - hy) * 0.035, r2 = r1 + rr(-6, 6);
        A(d, [{ transform: tf(x0, y0, r0, 0.3), opacity: 0, filter: blur(3) }, { opacity: 0.8, offset: 0.06 },
          { transform: tf(x, y, r1, 1), opacity: 0.74, filter: blur(0.6) }], tin, fly, EASE);
        A(d, [{ transform: tf(x, y, r1, 1), opacity: 0.74 }, { transform: tf(x + ddx, y + ddy, r2, 1.12), opacity: 0.64 }], tin + fly, T.reveal + 900 - tin - fly, 'linear');
        A(d, [{ opacity: 0.64 }, { opacity: 0 }], T.reveal + rr(-100, 200), rr(600, 850), 'ease-in');
        A(sh, [{ transform: ts(x0, y0, r0, 0.3), opacity: 0, filter: blur(6) }, { opacity: 0.5, offset: 0.06 },
          { transform: ts(x, y, r1, 1), opacity: 0.55, filter: blur(4) }], tin, fly, EASE);
        A(sh, [{ transform: ts(x, y, r1, 1) }, { transform: ts(x + ddx, y + ddy, r2, 1.12) }], tin + fly, T.reveal + 900 - tin - fly, 'linear');
      });
      // the shards: flat flakes of paint that fly out tumbling (blurred while they fly) and hang, drifting and turning;
      // the layer's perspective (80cqi, from 62% 64%) moves things off the axis as they come forward: aim for where they should be seen
      var P0 = 80, ox = 0.62 * 112, oyP = 0.64 * (G.stageH + 20);
      function shard(o) {
        var d = span('nda-intro__shard'), paint = shardPaint(o.fill, P, o.light);
        var box = { width: o.w + 'cqi', height: o.h + 'cqi', marginLeft: (-o.w / 2) + 'cqi', marginTop: (-o.h / 2) + 'cqi', clipPath: o.shape };
        init(d, box); init(d, paint);
        back.appendChild(d);
        // a flake tumbles: it turns about an axis well out of the plane, so it flashes thin and wide as it goes
        var ax = [rr(-1, 1), rr(-1, 1), rr(0.4, 1)].map(function (v) { return v.toFixed(2); }).join(',');
        function tf(x, y, z, deg, sc) {
          var k = (P0 - z) / P0, X = ox + (x + lx - ox) * k, Y = oyP + (y + oy + ly - oyP) * k;
          return 'translate3d(' + X.toFixed(2) + 'cqi,' + Y.toFixed(2) + 'cqi,' + z.toFixed(2) + 'cqi) rotate3d(' + ax + ',' + deg.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')';
        }
        var x0 = HEART[0] + rr(-1.5, 1.5), y0 = HEART[1] + rr(-1.5, 1.5), dx = o.x - HEART[0], dy = o.y - HEART[1], L = Math.sqrt(dx * dx + dy * dy) || 1;
        if (o.out) {   // straight on out of the frame
          A(d, [{ transform: tf(x0, y0, -3, 0, 0.85), opacity: 0, filter: blur(1.6) }, { opacity: o.alpha, offset: 0.04 }, { opacity: o.alpha, offset: 0.7 },
            { transform: tf(o.x, o.y, o.z, o.spin, 1), opacity: 0, filter: blur(1.2) }], o.t, o.fly, EASE);
          return;
        }
        var ddx = dx / L * o.drift, ddy = dy / L * o.drift;
        A(d, [{ transform: tf(x0, y0, -3, 0, 0.85), opacity: 0, filter: blur(1.6) }, { opacity: o.alpha, offset: 0.04 },
          { transform: tf(o.x, o.y, o.z, o.spin, 1), opacity: o.alpha, filter: blur(o.soft) }], o.t, o.fly, EASE);
        var t1 = o.t + o.fly;
        A(d, [{ transform: tf(o.x, o.y, o.z, o.spin, 1) }, { transform: tf(o.x + ddx, o.y + ddy, o.z, o.spin + o.turn, 1) }], t1, T.reveal + 1000 - t1, 'linear');
        if (o.fill === 'marble') {   // the paint inside keeps moving
          var bp = paint.backgroundPosition.split(' ').map(parseFloat);
          A(d, [{ backgroundPosition: bp[0] + '% ' + bp[1] + '%' }, { backgroundPosition: Math.max(0, Math.min(100, bp[0] + rr(-45, 45))).toFixed(0) + '% ' + Math.max(0, Math.min(100, bp[1] + rr(-45, 45))).toFixed(0) + '%' }],
            o.t, T.reveal + 1000 - o.t, 'ease-in-out');
        }
        A(d, [{ opacity: o.alpha }, { opacity: 0 }], T.reveal + rr(0, 260), rr(650, 900), 'ease-in');
        if (!o.shadow) return;
        // its shadow: the same flake in black on the wall, pushed out from the spot's heart by how far it hangs in front of it
        var s = span('nda-intro__shard'), k = 0.07 + 0.012 * (o.z + 4);
        init(s, box); init(s, { background: '#000' });
        shadows.appendChild(s);
        function ts(x, y, z, deg, sc) { return tf(x + (x - GLOW[0]) * k, y + (y - GLOW[1]) * k + 0.6, z - 2, deg, sc * 1.05); }
        A(s, [{ transform: ts(x0, y0, -3, 0, 0.85), opacity: 0, filter: blur(4) }, { opacity: 0.5, offset: 0.04 },
          { transform: ts(o.x, o.y, o.z, o.spin, 1), opacity: 0.55, filter: blur(2.6 + 0.25 * (o.z + 3)) }], o.t, o.fly, EASE);
        A(s, [{ transform: ts(o.x, o.y, o.z, o.spin, 1) }, { transform: ts(o.x + ddx, o.y + ddy, o.z, o.spin + o.turn, 1) }], t1, T.reveal + 1000 - t1, 'linear');
      }
      HANG.forEach(function (h) {
        var sliver = h[3] === 'sliver', big = h[2] > 9;
        shard({ x: h[0], y: h[1], w: h[2], h: sliver ? h[2] * rr(0.24, 0.34) : h[2] * rr(0.7, 0.9), shape: sliver ? sliverShape() : chipShape(), fill: h[4],
          light: lightAt(h[0], h[1]), shadow: true,
          alpha: h[4] === 'marble' ? 0.95 : 0.9, soft: big ? 0.2 : rr(0.15, 0.5), z: big ? -1 : rr(-3, 3),
          spin: (big ? rr(50, 90) : rr(80, 240)) * (rnd() < 0.5 ? -1 : 1), turn: (big ? rr(12, 20) : rr(25, 70)) * (rnd() < 0.5 ? -1 : 1),
          t: t + rr(0, 50), fly: rr(600, 820), drift: rr(1.6, 3.6) });
      });
      // the rest of the blast: shards that fly straight on out of the frame
      for (i = 0; i < (LITE ? 6 : 16); i++) {
        var a2 = (i / 16) * 6.283 + rr(-0.25, 0.25), far = rr(70, 95), fill2 = ['pink', 'blue', 'marble'][i % 3], s2 = rr(4, 8), sl = rnd() < 0.6;
        shard({ out: true, x: HEART[0] + Math.cos(a2) * far * 1.3, y: HEART[1] + Math.sin(a2) * far * 0.75, w: s2, h: sl ? s2 * 0.3 : s2 * 0.8,
          shape: sl ? sliverShape() : chipShape(), fill: fill2, light: 0.6, alpha: 0.92, z: rr(-4, 14), spin: rr(160, 420) * (rnd() < 0.5 ? -1 : 1),
          t: t + rr(0, 50), fly: rr(650, 900) });
      }
      // a little grit, gone sooner
      for (i = 0; i < 16; i++) {
        var ang = rr(0, 6.283), dist = rr(16, 50), s = rr(0.5, 1.2), gx2 = HEART[0] + Math.cos(ang) * dist * 1.25, gy2 = HEART[1] + Math.sin(ang) * dist * 0.7;
        shard({ x: gx2, y: gy2, w: s, h: s * rr(0.5, 0.9), shape: chipShape(), light: lightAt(gx2, gy2),
          fill: ['pink', 'blue', 'pink', 'marble'][i % 4], alpha: 0.85, soft: 0, z: rr(-4, 4), spin: rr(90, 300), turn: rr(10, 40),
          t: t + rr(0, 60), fly: rr(500, 760), drift: rr(1, 3) });
      }
    }

    /* -- the camera: a slow drift and a breath, a kick at the burst, a push through the reveal -- */
    function cameraTrack() {
      var end = T.end + T.exit;
      // as in the film: a slow drift out and up while the rows run, a kick at the burst, a push through the reveal, home at 1:1
      var track = [[0, 1, 0, 0, 'ease-in-out'], [1330, 0.998, 0, -0.1, 'ease-in-out'], [T.burst - 50, 0.991, 0.1, -0.7, 'cubic-bezier(.2,.9,.3,1)'],
        [T.burst + 45, 1.006, 0.25, -0.9, 'cubic-bezier(.3,0,.3,1)'], [4200, 0.989, 0.05, -0.85, 'ease-in-out'], [5500, 0.993, -0.15, -0.9, 'ease-in-out'],
        [6900, 0.988, 0.1, -0.8, 'ease-in-out'], [T.reveal, 0.989, 0, -0.75, 'cubic-bezier(.4,0,.3,1)'], [T.reveal + 600, 1.006, -0.1, 0.1, 'ease-in-out'],
        [T.end, 1, 0, 0, 'linear'], [end, 1, 0, 0]];
      A(camera, track.map(function (k) {
        var f = { transform: 'translate(' + k[2] + '%,' + k[3] + '%) scale(' + k[1] + ')', offset: k[0] / end };
        if (k[4]) f.easing = k[4];
        return f;
      }), 0, end);
      if (breath) {
        var b = breath.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.0055) rotate(.05deg)' }], { duration: 2350, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
        b.pause(); anims.push(b);
      }
    }

    /* -- the second line: split into letters once, so a few of them can shiver where something hits the line.
          The letters are inline spans moved by relative offsets, so the line's layout and kerning never change. -- */
    var l2 = [];
    function splitLine2() {
      if (!line2) return;
      if (!line2.querySelector('.nda-intro__l2')) {
        var text = line2.firstChild && line2.firstChild.nodeType === 3 ? line2.firstChild : null;
        if (!text) return;
        var frag = document.createDocumentFragment();
        text.data.split('').forEach(function (ch) {
          if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
          var sp = span('nda-intro__l2'); sp.textContent = ch; frag.appendChild(sp);
        });
        line2.replaceChild(frag, text);
      }
      var st = stage.getBoundingClientRect();
      l2 = [].map.call(line2.querySelectorAll('.nda-intro__l2'), function (sp) {
        sp.removeAttribute('style');
        var r = sp.getBoundingClientRect();
        return { el: sp, x: (r.left + r.width / 2 - st.left) / G.px };
      });
    }
    // a shock: letters near x jolt and tremble, those further away later and less, the rest not at all
    function lineShock(t, x, radius, amp, lift) {
      l2.forEach(function (c) {
        var d = Math.abs(c.x - x), k = Math.exp(-(d * d) / (radius * radius));
        if (k < 0.08) return;
        var a = amp * k, s = t + d * 3 + rr(0, 30), j = function (m) { return (rr(-1, 1) * a * m).toFixed(3) + 'em'; };
        A(c.el, [{ left: '0em', top: '0em' }, { left: j(1), top: (-lift * k).toFixed(3) + 'em', offset: 0.14 }, { left: j(0.8), top: j(0.5), offset: 0.32 },
          { left: j(0.55), top: j(0.35), offset: 0.52 }, { left: j(0.3), top: j(0.2), offset: 0.74 }, { left: '0em', top: '0em' }], s, rr(320, 420), 'linear');
        if (k > 0.5) A(c.el, [{ textShadow: '0 0 0 transparent' }, { textShadow: (a * 2.4).toFixed(3) + 'em 0 0 ' + G.ink(0.35) }, { textShadow: '0 0 0 transparent' }], s, 260);
      });
    }

    // the bump: the line rises and slips away under the first line, as PHILOSOPHY does under it at 1.5 s. Its own box
    // clips it, held still on screen while the letters travel up, so they vanish just below the first line's baseline.
    function line2Bump(t, dur) {
      if (!line2) return;
      var C = G.l2C, D = G.l2D;
      A(line2, [{ transform: 'translateY(0em)', clipPath: 'inset(' + (-C).toFixed(3) + 'em -1em -1em -1em)' },
        { transform: 'translateY(' + (-D).toFixed(3) + 'em)', clipPath: 'inset(' + (D - C).toFixed(3) + 'em -1em -1em -1em)' }], t, dur, 'cubic-bezier(.45,0,.75,.45)');
      A(line2, [{ filter: 'blur(0px)' }, { filter: blur(2.5), offset: 0.5 }, { filter: blur(1) }], t, dur);
      l2.forEach(function (c) { A(c.el, [{ opacity: 1 }, { opacity: 0 }], t + dur + 40, 1); });
    }
    // the return: the line drops back into place unseen and wipes in from the left, letter by letter
    function line2Return(t, dur) {
      if (!line2) return;
      A(line2, [{ transform: 'translateY(0em)', clipPath: 'none', filter: 'blur(0px)' }, { transform: 'translateY(0em)', clipPath: 'none', filter: 'blur(0px)' }], t - 40, 1);
      l2.forEach(function (c) {
        var s0 = t + Math.pow(Math.max(0, c.x) / 100, 1.35) * dur;
        A(c.el, [{ opacity: 0, left: '-.14em', filter: 'blur(' + (7 * G.W / 1120).toFixed(1) + 'px)' }, { opacity: 1, left: '0em', filter: 'blur(0px)' }], s0, 240, 'ease-out');
      });
    }

    /* -- organic warp: a turbulence displacement on the rows that swells at each move and boils at 12 fps -- */
    var warps = [], boilAt = -1;
    function warp(t, dur, amp) { warps.push([t, dur, amp]); }
    function warpAt(ms) {
      var v = 0;
      warps.forEach(function (w) { var k = (ms - w[0]) / w[1]; if (k > 0 && k < 1) v += w[2] * Math.sin(Math.PI * k); });
      return v;
    }
    function applyWarp(ms) {
      if (!disp || LITE) return;
      var v = warpAt(ms - HOLD);
      if (v < 0.03) { if (rowsEl.style.filter) rowsEl.style.filter = ''; return; }
      if (!rowsEl.style.filter) rowsEl.style.filter = 'url(#' + fxId + ')';
      disp.setAttribute('scale', (v * G.px).toFixed(2));
      var step = Math.floor(ms / 83);
      if (step !== boilAt) { boilAt = step; turb.setAttribute('seed', String(1 + (step * 7) % 89)); }
    }

    /* -- the reveal, as the film has it: THOUGHT is uncovered by a right-angled edge, like _|, whose corner travels from
          the top of THOU to the lower right: everything below its horizontal edge and right of its vertical edge stays
          hidden: the tops of THOU first, then more of each letter as the corner runs down and right, fast at first,
          then slower and slower, so G, H and the last T come through one by one, slowly enough to feel. Each letter unfolds flat about a nearly upright hinge as it is uncovered, from shade into the light, and
          sharpens. The disciplines smear away as the edge reaches them, the bottom row lingering; pink smoke hangs over
          G, H and T; a bloom of smoky paint spreads unevenly over the top two lines and fades; the second line wipes
          back in from the left over the top row. The edge is two linear masks intersected, driven by registered custom
          properties; without them, THOUGHT's letters come up one by one in the same order. -- */
    // each edge's travel in % of THOUGHT's box, and its timing in ms from T.reveal. Both follow the film's curve for the
    // vertical edge (most of the word in its first third, then slower and slower), drawn out by about 1.4 so the peel can
    // be felt; the horizontal edge runs a little ahead, so it has cleared the letters' feet when the last T comes through
    var EDGE = [0.5, 1, 0.55, 0.68];
    var RX = { from: 15, to: 104, dur: 600, ease: EDGE }, RY = { from: -10, to: 112, dur: 540, ease: EDGE };
    var SX = 2.5, SY = 6;              // the edges' softness, either side, in % of the box
    var ANGLE = 74;                    // the hinge each letter unfolds about, from the horizontal on screen
    function maskAngle() {             // THOUGHT's box is drawn --nda-s tall, so an angle in it is flatter than on screen
      var tl = Math.atan(Math.tan(ANGLE * Math.PI / 180) / G.s);
      return 180 - tl * 180 / Math.PI;
    }
    function bezierX(x1, y1, x2, y2, y) {   // time fraction at which a cubic-bezier easing reaches progress y
      function b(a1, a2, t) { return 3 * a1 * t * (1 - t) * (1 - t) + 3 * a2 * t * t * (1 - t) + t * t * t; }
      var lo = 0, hi = 1;
      for (var i = 0; i < 32; i++) { var m = (lo + hi) / 2; if (b(y1, y2, m) < y) lo = m; else hi = m; }
      return b(x1, x2, (lo + hi) / 2);
    }
    function edgeTime(E, v) {          // ms from T.reveal at which an edge's soft side has passed v (% of the box)
      var k = Math.max(0, Math.min(1, (v - E.from) / (E.to - E.from)));
      return E.dur * bezierX(E.ease[0], E.ease[1], E.ease[2], E.ease[3], k);
    }
    function sweepTime(x, y) {         // when the corner has uncovered a point (stage x, window y; cqi)
      var py = (y - G.y0) / G.s / (0.8 * G.fT) * 100;
      return T.reveal + Math.max(edgeTime(RX, x + SX), edgeTime(RY, py + SY));
    }
    function both(c, frames, t, dur, easing) { A(c.el, frames, t, dur, easing); if (c.sh) A(c.sh, frames, t, dur, easing); }
    function reveal(rows, topRow) {
      var midY = G.y0 + G.capTop + G.capT * 0.5;
      if (SWEEP_MASK) {
        [thought, shade].forEach(function (n) {
          A(n, [{ '--nda-rx': RX.from + '%' }, { '--nda-rx': RX.to + '%' }], T.reveal, RX.dur, 'cubic-bezier(' + RX.ease.join(',') + ')');
          A(n, [{ '--nda-ry': RY.from + '%' }, { '--nda-ry': RY.to + '%' }], T.reveal, RY.dur, 'cubic-bezier(' + RY.ease.join(',') + ')');
        });
        // the peel: each letter lies folded back about a nearly upright hinge at its left and unfolds flat as the
        // vertical edge crosses it: out of shade, catching the light at the turn, then settling
        var topY = G.y0 + G.capTop, al = (180 - maskAngle()) * Math.PI / 180;
        var axis = 'rotate3d(' + Math.cos(al).toFixed(3) + ', ' + (-Math.sin(al)).toFixed(3) + ', 0, ';
        G.tChars.forEach(function (c) {
          var t0 = sweepTime((c.x + c.w * 0.25) * G.fT, topY + G.capT * 0.15) - 160;
          both(c, [{ transform: 'perspective(5em) ' + axis + '-78deg)', transformOrigin: '0% 6%', filter: blur(4) + ' brightness(.35)' },
            { transform: 'perspective(5em) ' + axis + '10deg)', transformOrigin: '0% 6%', filter: 'blur(0px) brightness(1.12)', offset: 0.62 },
            { transform: 'perspective(5em) ' + axis + '0deg)', transformOrigin: '0% 6%', filter: 'blur(0px) brightness(1)' }], t0, 720, 'cubic-bezier(.3,.6,.3,1)');
        });
      } else {
        G.tChars.forEach(function (c) {
          both(c, [{ opacity: 0, filter: blur(9) }, { opacity: 1, filter: 'blur(0px)' }], sweepTime(c.x * G.fT, G.y0 + G.capTop) - 40, 320, 'ease-out');
        });
      }
      // the disciplines smear away, down and to the right, as the front reaches them
      var th = 0.5;
      rows.forEach(function (w, k) {
        var top = capTop(w), hh = height(w), last = k === rows.length - 1;   // the bottom row lingers as a ghost
        w.chars.forEach(function (c) {
          var cx = w.x + (c.x + c.w / 2) * w.f, cy = top + 0.5 * hh, s0 = sweepTime(cx, cy) - (last ? 70 : 130), d = last ? 420 : 220;
          A(c.el, [{ transform: 'translate(0em, 0em) scale(1)' }, { transform: 'translate(' + (Math.sin(th) * 0.16).toFixed(3) + 'em, ' + (Math.cos(th) * 0.16).toFixed(3) + 'em) scale(1.06)' }], s0, d, 'ease-out', 'add');
          A(c.el, last ? [{ opacity: 1 }, { opacity: 0.45, offset: 0.35 }, { opacity: 0 }] : [{ opacity: 1 }, { opacity: 0 }], s0, d - 20, last ? 'ease-in' : 'linear');
          A(c.el, [{ filter: 'blur(0px)' }, { filter: blur(9) }], s0, d);
        });
      });
      // the bloom, from just before the edge starts
      bloom();
      // from here the film colours THOUGHT only: the rows go over it, cream, as they smear away
      A(rowsEl, [{ zIndex: 1 }, { zIndex: 1 }], T.reveal - 40, 1);
      // the second line comes back from the left over the top row, quickly at first, wiping the row away as it goes
      var w0 = T.reveal - 170, wd = 440;
      line2Return(w0, wd);
      topRow.forEach(function (w) {
        w.chars.forEach(function (c) {
          var s0 = w0 + Math.pow((w.x + (c.x + c.w / 2) * w.f) / 100, 1.35) * wd - 30;
          A(c.el, [{ opacity: 1 }, { opacity: 0 }], s0, 160);
          A(c.el, [{ filter: 'blur(0px)' }, { filter: blur(8) }], s0, 180);
        });
      });
      // smoke: a pink cloud around G and H that drifts right as the last letters come through it, a little grey low down
      if (debris) {
        var y0 = G.rowsTop + midY + 10;
        [[56, -1, 'pink', 10, -2, 1.7, 140, 900], [70, 4, 'pink', 12, 2, 1.8, 220, 960], [84, -2, 'pink', 9, -3, 1.6, 320, 900],
          [76, 10, 'grey', 10, 4, 1.7, 260, 860], [44, 12, 'grey', 8, 6, 1.5, 300, 700], [90, 9, 'grey', 8, 3, 1.4, 420, 760]].forEach(function (p) {
          var d = span('nda-intro__smoke' + (p[2] === 'grey' ? ' nda-intro__smoke--grey' : ''));
          init(d, { left: (p[0] + 6) + 'cqi', top: (y0 + p[1]) + 'cqi' });
          debris.appendChild(d);
          A(d, [{ transform: 'translate(0cqi, 0cqi) scale(.3)', opacity: 0 }, { opacity: 0.9, offset: 0.3 },
            { transform: 'translate(' + p[3] + 'cqi, ' + p[4] + 'cqi) scale(' + p[5] + ')', opacity: 0 }], T.reveal + p[6], p[7], 'cubic-bezier(.2,.6,.3,1)');
        });
      }
    }

    /* -- the bloom: just before THOUGHT comes through, an unstable nucleus of paint goes off in the middle of the page,
          behind the type, and blooms outward into a glowing, cell-like membrane, electric blue to the left and
          magenta to the right, almost to the screen's edges, then thins away. intro-bloom is the kinetic film's burst
          at twice speed, warped by a boiling turbulence and blurred outward while it explodes, with a glow, screened
          onto the ground; the element starts small and grows fast, centred on the page just under the second line. -- */
    var BLOOM0 = T.reveal - 70, BLOOM_DUR = 740;
    function bloomAt(ms) { return Math.max(0, Math.min((ms - HOLD - BLOOM0) / 1000, (bloomV && bloomV.duration ? bloomV.duration : 0.7) - 0.04)); }
    function bloom() {
      if (!bloomV) return;
      var lines = el.querySelectorAll('.nda-intro__line'), st = stage.getBoundingClientRect();
      var y2 = (lines[1].getBoundingClientRect().bottom - st.top) / G.px;
      var w = 118, h = w * 9 / 16, cx = 50, cy = y2 + 3;   // the film's burst is at its middle: the page's middle
      init(bloomV, { width: w + 'cqi', height: h + 'cqi', left: (cx - w / 2) + 'cqi', top: (cy - h / 2) + 'cqi', transformOrigin: '50% 50%' });
      A(bloomV, [{ transform: 'scale(.28) rotate(-8deg)' }, { transform: 'scale(.9) rotate(0deg)', offset: 0.35 }, { transform: 'scale(1.15) rotate(4deg)' }],
        BLOOM0, BLOOM_DUR, 'cubic-bezier(.2,.5,.4,1)');
      A(bloomV, [{ opacity: 0 }, { opacity: 0.85, offset: 0.08 }, { opacity: 0.75, offset: 0.48 }, { opacity: 0 }], BLOOM0, BLOOM_DUR, 'linear');
    }

    /* -- the ribbon: from 5.6 s to 6.7 s, as the film has it, a twisting satin ribbon of paint, blue on one face and
          magenta on the other, flicks through the rows: a thin arc across the top of SPIRITUALITY whose left end
          swells into a blue curl, then an S that sweeps up from the left through the rows and folds over on itself
          above them, billows to the right, and shrinks to a blade that is gone as the rows turn into ETHICS · DESIGN.
          It is the film's own ribbon, lifted out of it frame by frame (intro-ribbon.webp packs each frame's pieces)
          and played on the score's clock at the film's 24 frames a second, where the film has it: over the letters,
          and, where the film shows its paint inside the letters, inside ours (in the window, in darken). -- */
    var RIBBON = {
      t0: 5625, fps: 24,
      // the film to the stage: the film's first line's left edge and cap top (film px), ours (stage cqi), and cqi per film px
      map: [85, 46, 0.806, 0.54, 0.08888],
      box: [55, 160, 785, 385],   // the part of the film frame its pieces fall in (film px): x, y, width, height
      // each frame's pieces: [layer (0 over the letters, 1 inside them), x, y, width, height in the atlas, x, y in the film]
      frames: [
        [[0,428,1472,282,76,130,442]],
        [[0,1469,1356,262,99,124,441]],
        [[0,1290,1232,310,114,90,426]],
        [[0,345,1232,312,120,86,420]],
        [[0,980,1094,313,130,83,410]],
        [[0,1455,841,310,142,80,398]],
        [[0,0,1472,426,96,82,392]],
        [[0,971,841,482,249,92,165]],
        [[0,1460,585,482,251,91,165]],
        [[0,0,841,483,251,90,165]],
        [[0,485,841,484,251,90,165]],
        [[0,487,585,484,253,90,164]],
        [[0,0,585,485,254,89,164]],
        [[0,973,585,485,252,89,164]],
        [[0,1559,293,415,262,153,164]],
        [[0,0,0,547,291,261,164],[0,539,1570,128,26,80,440],[1,1087,1356,110,113,712,186],[1,712,1472,265,75,80,466]],
        [[0,987,293,570,288,262,167],[0,669,1570,120,26,80,440],[1,1602,1232,110,114,712,186],[1,979,1472,265,75,80,466]],
        [[0,546,293,439,289,365,166],[0,791,1570,116,26,80,440],[1,1714,1232,110,114,712,186],[1,1246,1472,265,74,80,466],[1,1908,841,103,136,262,186]],
        [[0,0,293,544,290,256,165],[0,267,1570,112,28,80,438],[1,1826,1232,132,114,690,186],[1,1513,1472,265,73,80,466],[1,0,1094,101,136,264,186]],
        [[0,549,0,544,291,256,164],[0,381,1570,100,28,80,438],[1,0,1356,132,114,690,186],[1,1780,1472,265,72,80,466],[1,1533,1094,101,126,264,198]],
        [[0,1095,0,538,291,256,164],[0,483,1570,54,28,80,438],[1,134,1356,108,114,714,186],[1,0,1570,265,72,80,466],[1,871,1094,107,132,258,186],[1,1636,1094,122,126,700,300]],
        [[0,1295,1094,236,130,464,296],[1,1760,1094,106,124,258,186],[1,244,1356,110,114,714,186],[1,1767,841,139,140,700,300]],
        [[0,103,1094,254,136,446,304],[1,1868,1094,99,122,258,186],[1,356,1356,109,114,715,186],[1,1006,1232,140,116,700,308]],
        [[0,359,1094,254,134,446,306],[1,0,1232,91,122,258,186],[1,467,1356,110,114,714,186],[1,1148,1232,140,115,700,308]],
        [[0,615,1094,254,134,446,306],[1,93,1232,88,122,258,186],[1,579,1356,110,114,714,186],[1,691,1356,140,114,700,308]],
        [[0,659,1232,203,118,497,306],[1,183,1232,82,122,262,186],[1,833,1356,110,114,714,186],[1,945,1356,140,114,700,308]],
        [[0,1311,1356,156,111,544,308],[1,267,1232,76,122,262,186],[1,1199,1356,110,113,714,187],[1,864,1232,140,118,700,301]]
      ]
    };
    var wisps = null;                  // the inside-the-letters layer, in the window, in darken: what is drawn there shows only in the letters
    var ribbonDraw = null;             // shows the ribbon's frame for a time on the clock (set by ribbon, called every frame)
    // the ribbon's atlas, decoded before the clock starts: the first drawImage of a 2048px WebP would otherwise decode it mid-sequence
    function ribbonReady(ms) {
      var img = q('.nda-intro__ribbon');
      if (!img || img.__ndaBitmap) return Promise.resolve();
      return new Promise(function (resolve) {
        function decode() {
          if (window.createImageBitmap) createImageBitmap(img).then(function (b) { img.__ndaBitmap = b; resolve(); }, function () { resolve(); });
          else if (img.decode) img.decode().then(resolve, resolve);
          else resolve();
        }
        if (img.complete && img.naturalWidth) decode();
        else { img.addEventListener('load', decode, { once: true }); img.addEventListener('error', function () { resolve(); }, { once: true }); }
        setTimeout(resolve, ms);
      });
    }
    function ribbon() {
      var img = q('.nda-intro__ribbon');
      if (!img || !debris || !wisps) return;
      var R = RIBBON, m = R.map, b = R.box, layers = [], shown = -1;
      function sx(fx) { return m[2] + (fx - m[0]) * m[4]; }
      function sy(fy) { return m[3] + (fy - m[1]) * m[4]; }
      // one canvas over the type (in the debris layer, inset -10cqi -6cqi of the stage), one in the window (from its top)
      [[debris, 6, 10], [wisps, 0, -G.rowsTop]].forEach(function (L, n) {
        var c = document.createElement('canvas');
        c.className = 'nda-intro__ribbon-layer';
        c.width = b[2]; c.height = b[3];
        init(c, { left: (sx(b[0]) + L[1]).toFixed(3) + 'cqi', top: (sy(b[1]) + L[2]).toFixed(3) + 'cqi',
          width: (b[2] * m[4]).toFixed(3) + 'cqi', height: (b[3] * m[4]).toFixed(3) + 'cqi' });
        L[0].appendChild(c);
        layers[n] = c.getContext('2d');
      });
      ribbonDraw = function (ms) {
        var k = Math.floor((ms - HOLD - R.t0) * R.fps / 1000);
        if (k < 0 || k >= R.frames.length || !img.complete || !img.naturalWidth) k = -1;
        if (k === shown) return;
        shown = k;
        layers.forEach(function (g) { g.clearRect(0, 0, b[2], b[3]); });
        if (k < 0) return;
        var atlas = img.__ndaBitmap || img;
        R.frames[k].forEach(function (p) { layers[p[0]].drawImage(atlas, p[1], p[2], p[3], p[4], p[5] - b[0], p[6] - b[1], p[3], p[4]); });
      };
      if (!img.complete) img.addEventListener('load', function () { shown = -2; if (ribbonDraw) ribbonDraw(now()); }, { once: true });
    }

    /* -- the film in the letters. As in the film, the type is mostly cream: the pigment is a stain, not a flood. It
          flows across PHILOSOPHY and the rows under it at the start and drains away by the burst; at the reveal it
          comes up in a band through THOUGHT, rising from its foot on the left to the top of its last letters, so the
          top of THOU and the foot of GHT stay cream. The film is masked by a soft ellipse that moves (the stain) and a soft band through THOUGHT, each with
          its own strength. Without registered properties the film's opacity does the same, coarsely. -- */
    function fillScore() {
      if (!fill) return;
      if (!SWEEP_MASK) {
        A(fill, [{ opacity: 1 }, { opacity: 0 }], 3020, 280, 'ease-in');
        A(fill, [{ opacity: 0 }, { opacity: 0.9 }], T.reveal, 320, 'ease-out');
        return;
      }
      var W = 106, H = G.winH;   // the film's box: the window, in cqi
      function xp(x) { return (x / W * 100).toFixed(2) + '%'; }
      function yp(y) { return (y / H * 100).toFixed(2) + '%'; }
      // the band: 18 degrees up from the horizontal, a little under half THOUGHT's height thick, with soft edges
      var ang = 162, rad = ang * Math.PI / 180, sa = Math.sin(rad), ca = -Math.cos(rad), Lg = W * Math.abs(sa) + H * Math.abs(ca);
      function along(x, y) { return 50 + ((x - W / 2) * sa + (y - H / 2) * ca) / Lg * 100; }
      var half = 10 / Lg * 100, soft = 8 / Lg * 100, tb = 'var(--nda-tb)', ink = 'rgb(0 0 0 / var(--nda-ta))';
      function at(sign, k) { return 'calc(' + tb + ' ' + sign + ' ' + k.toFixed(2) + '%)'; }
      var band = 'linear-gradient(' + ang + 'deg, #0000 ' + at('-', half + soft) + ', ' + ink + ' ' + at('-', half) + ', ' + ink + ' ' + at('+', half) + ', #0000 ' + at('+', half + soft) + ')';
      var stain = 'radial-gradient(var(--nda-fw) var(--nda-fh) at var(--nda-fx) var(--nda-fy), rgb(0 0 0 / var(--nda-fa)) 42%, rgb(0 0 0 / calc(var(--nda-fa) * .5)) 72%, #0000)';
      fill.style.webkitMaskImage = stain + ', ' + band; fill.style.maskImage = stain + ', ' + band;
      function E(x, y, w, h, a) { return { '--nda-fx': xp(x), '--nda-fy': yp(y), '--nda-fw': xp(w), '--nda-fh': yp(h), '--nda-fa': String(a) }; }
      var s0 = E(60, 20, 40, 14, 1);
      for (var k in s0) fill.style.setProperty(k, s0[k]);
      fill.style.setProperty('--nda-ta', '0');
      // the stain: across PHILOSOPHY from its L and into the row under it, drifting down as the rows push; gone by the burst
      A(fill, [s0, E(57, 25, 40, 17, 1)], 0, 3000, 'ease-in-out');
      A(fill, [E(57, 25, 40, 17, 1), E(55, 26, 36, 15, 0)], 3000, 300, 'ease-in');
      // while nothing shows through, the film isn't drawn at all
      function rest(a, b) { A(fill, [{ opacity: 1 }, { opacity: 0, offset: 0.001 }, { opacity: 0, offset: 0.999 }, { opacity: 1 }], a, b - a); }
      rest(3320, T.reveal - 40);
      // the band through THOUGHT: it comes up with the reveal and settles a little higher
      var b0 = along(48, G.y0 + G.boxH * 0.54), b1 = along(48, G.y0 + G.boxH * 0.46);
      A(fill, [{ '--nda-tb': b0.toFixed(2) + '%', '--nda-ta': '0' }, { '--nda-tb': b0.toFixed(2) + '%', '--nda-ta': '1' }], T.reveal - 20, 340, 'ease-out');
      A(fill, [{ '--nda-tb': b0.toFixed(2) + '%' }, { '--nda-tb': b1.toFixed(2) + '%' }], T.reveal + 320, T.end - T.reveal - 320, 'ease-in-out');
    }

    /* -- the exit: a hairline white bar sweeps left to right; the page shows behind it -- */
    function exitFrames() {
      return {
        sheet: [{ clipPath: 'inset(0 0 0 0%)' }, { clipPath: 'inset(0 0 0 100%)' }],
        band: [{ transform: 'translateX(0%)' }, { transform: 'translateX(100%)' }],
        bandOpacity: [{ opacity: 0 }, { opacity: 1, offset: 0.04 }, { opacity: 1, offset: 0.96 }, { opacity: 0 }]
      };
    }
    function exitSweep(t, dur) {
      var f = exitFrames(), e = 'cubic-bezier(.65,0,.35,1)';
      A(sheet, f.sheet, t, dur, e);
      if (wipe) { A(wipe, f.band, t, dur, e); A(wipe, f.bandOpacity, t, dur); }
    }

    /* -- the score -- */
    function build() {
      anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
      anims = []; cues = []; warps = []; tugs = []; seed = 11; boilAt = -1; ribbonDraw = null;
      clockAnim = A(el, [], 0, T.end + T.exit + 3000);
      rowsEl.style.filter = '';
      [].slice.call(rowsEl.querySelectorAll('.nda-intro__word')).forEach(function (n) { rowsEl.removeChild(n); });
      if (back) back.textContent = '';
      if (debris) debris.textContent = '';
      if (!wisps) { wisps = span('nda-intro__wisps'); win.appendChild(wisps); }
      wisps.textContent = '';
      [sheet, camera, breath, fill, wipe, bg, bloomV].forEach(function (n) { if (n) n.removeAttribute('style'); });
      geometry();
      splitLine2();
      // THOUGHT, letter by letter, hidden until its reveal: behind the front's mask, or (without the mask) each letter
      thought.textContent = '';
      G.tChars = G.thoughtM.chars.map(function (c) {
        var ch = span('nda-intro__char');
        ch.textContent = c.ch; ch.style.left = c.x + 'em'; ch.style.opacity = SWEEP_MASK ? '1' : '0';
        thought.appendChild(ch);
        return { el: ch, x: c.x, w: c.w };
      });
      // the shade: THOUGHT again in black, under the window and over everything behind the type, so nothing behind
      // the word (the bloom, the glow) can lighten its letters through the window's lighten blend; it moves with them
      if (!shade) { shade = span('nda-intro__shade'); shade.setAttribute('aria-hidden', 'true'); wordLine.insertBefore(shade, win); }
      shade.textContent = ''; shade.removeAttribute('style');
      G.tChars.forEach(function (c) {
        var ch = span('nda-intro__char');
        ch.textContent = c.el.textContent; ch.style.left = c.el.style.left; ch.style.opacity = c.el.style.opacity;
        shade.appendChild(ch); c.sh = ch;
      });
      if (SWEEP_MASK) {
        // the corner: uncovered above its horizontal edge and left of its vertical one
        var mask = 'linear-gradient(90deg, #000 calc(var(--nda-rx) - ' + SX + '%), #0000 calc(var(--nda-rx) + ' + SX + '%)), ' +
          'linear-gradient(180deg, #000 calc(var(--nda-ry) - ' + SY + '%), #0000 calc(var(--nda-ry) + ' + SY + '%))';
        [thought, shade].forEach(function (n) {
          n.style.setProperty('--nda-rx', RX.from + '%'); n.style.setProperty('--nda-ry', RY.from + '%');
          n.style.webkitMaskImage = mask; n.style.maskImage = mask;
          n.style.webkitMaskComposite = 'source-in'; n.style.maskComposite = 'intersect';
        });
      }
      // the film in the letters: a stain at the start, a band through THOUGHT (fillScore)
      // (it runs through the hold too, so PHILOSOPHY's paint is moving while the rest stands still)
      cues.push({ t: 0, fn: function () { media(fill, function (v) { if (Math.abs(v.currentTime - filmAt(0)) > 0.1) v.currentTime = filmAt(0); var p = v.play(); if (p && p.catch) p.catch(noop); }); } });
      fillScore();
      cameraTrack();
      // each discipline's size (its capitals, cqi, before kBox), width and weight on Archivo's axes, by its place in the
      // score. Measured in the film (its rows are heavier and a little wider than the statement, CIVICS far heavier and
      // wider; the widths and weights were matched on Archivo by stem and letter width), then pushed further apart: in each
      // set of four, the biggest is two-thirds taller than the smallest, and a settled set just fills the box, so a bigger
      // word can only take room from the others.
      var SPEC = [null, null,
        [9.2, 71.9, 812], [9.8, 72.2, 842], [8.6, 73.0, 802],                         // PSYCHOANALYSIS, SOCIOLOGY, LITERARY THEORY
        [7.2, 69.0, 792], [12.4, 71.8, 850], [7.4, 63.4, 778], [11.4, 63.2, 772],     // ART HISTORY, LAW, PERFORMANCE STUDIES, ECONOMICS
        [9.0, 65.3, 792], [12.0, 64.1, 805], [7.2, 64.1, 808], [10.2, 63.9, 792],     // CRITICAL THEORY, RELIGION, VISUAL STUDIES, POLITICS
        [7.4, 62, 730],                                                               // HISTORY OF TECHNOLOGY
        [11.0, 74.6, 832], [11.8, 73.5, 845], [7.6, 71.9, 790], [8.4, 70.9, 805],     // ANTHROPOLOGY, GOVERNANCE, SPIRITUALITY, SOCIAL THEORY
        [10.4, 74.8, 825], [12.0, 63.4, 778], [12.0, 62.9, 762], [9.2, 102.4, 900]];  // ECOLOGY, ETHICS, DESIGN, CIVICS
      function word(i, o) {
        o = o || {};
        var sp = SPEC[i];
        if (sp && o.cap === undefined && o.size === undefined) { o.cap = sp[0] * L.kBox; o.wdth = sp[1]; o.wght = sp[2]; o.maxW = 105; }
        return makeWord(words[i % words.length], o);
      }

      // 0.0 s: the statement with PHILOSOPHY under it; HISTORY OF SCIENCE is already sliding up from the bottom edge
      var philM = measure(words[0], 800, true), philF = 99.6 / philM.ink;
      var phil = word(0, { tight: true, weight: 800, size: philF, capTop: G.y0 + G.capTop, stretch: 17.3 / (G.mT.cap * philF) });
      place(phil, 0);
      // set to the statement's width, as PHILOSOPHY is, so the opening keeps its block: four justified lines (a hair
      // wider than PHILOSOPHY's fit, since its E stands further in from its edge than the lines' Y and D)
      var hosM = measure(words[1], 700, true);
      var hos = word(1, { tight: true, capTop: phil.base0 + 2.3, size: 100 / hosM.ink });
      enter(hos, 40, 320, 'cubic-bezier(.12,.9,.25,1.04)', 2.4);
      // 0.36-1.3 s: hold
      // 1.3 s: HISTORY OF SCIENCE leans into italic
      A(hos.face, [{ transform: 'skewX(0deg)' }, { transform: 'skewX(-13deg)', offset: 0.45 }, { transform: 'skewX(-11deg)' }], 1300, 380, 'ease-out');
      // 1.4 s: SOCIOLOGY comes up from the bottom edge and pushes the stack, as the film has it: HISTORY OF SCIENCE rises
      // into PHILOSOPHY's place and PHILOSOPHY is squashed up under the second line, knocking its middle, to a sliver
      // that hangs there until 1.95 s. One timing and easing for all three, so the rows never cross.
      var SLIVER = 3.4, PUSH = 'cubic-bezier(.35,.2,.3,1)', psy = word(2);
      stand(psy, hos, false);
      L.top = capTop(phil) + SLIVER + L.g;
      // the rows are laid out as if the box ran on past the screen's edge, so the two in view are drawn big and the
      // third arrives cut off by the edge, as in the film; they settle into the box at 2 s
      var Y1 = L.Y1; L.Y1 += 5;
      var soc = word(3), lit = word(4), P = stackOf([R([hos, psy]), R(soc), R(lit)], L.top);
      L.Y1 = Y1;
      enterTo(soc, 1420, 360, P[1].ct, P[1].h, PUSH, 1.4);
      go(hos, 1420, 360, P[0].ct, P[0].h, PUSH, 1.6); go(psy, 1420, 360, P[0].ct, P[0].h, PUSH);
      stretchTo(phil, 1420, 360, phil.s * SLIVER / height(phil), PUSH);
      lineShock(1470, 50, 22, 0.022, 0.05);
      // 1.57 s: landing, HISTORY OF SCIENCE turns into PSYCHOANALYSIS (a quick doubled crossfade): PSYCHOANALYSIS heads the list
      morph(hos, psy, 1570, 150);
      A(psy.el, [{ transform: 'translateX(.06em)' }, { transform: 'translateX(-.04em)', offset: 0.4 }, { transform: 'translateX(0em)' }], 1600, 160, 'ease-out', 'add');
      // 1.8 s: LITERARY THEORY scrolls up from the bottom edge, slowly
      enterTo(lit, 1790, 470, P[2].ct, P[2].h, 'cubic-bezier(.35,.3,.3,1)', 1.6);
      // 1.95 s: the last of PHILOSOPHY is squeezed out and the rows close up under the second line
      stretchTo(phil, 1940, 150, phil.s * 0.02, 'cubic-bezier(.5,0,.8,.5)');
      A(phil.el, [{ opacity: 1 }, { opacity: 0 }], 2030, 60);
      L.top = L.Y0q;
      restack(1990, [R([psy, hos]), R(soc), R(lit)], { from: 0, dur: 420 });
      // 2.2-2.8 s: hold; SOCIOLOGY and LITERARY THEORY tug at the line between them
      tug(soc, lit, 2260, 460, 0.8);

      // 2.78 s: ART HISTORY peels over PSYCHOANALYSIS: it is small, and the rows below stretch up into the room it leaves
      var art = word(5); peel(psy, art, 2780, 400);
      restack(2860, [R([art, psy]), R(soc), R(lit)], { from: 0, dur: 380 });
      // 3.0 s: SOCIOLOGY shivers into LAW, which is big: it shoulders the others aside
      var law = word(6); shiverInto(soc, [law], 3000, 240);
      restack(3060, [R(art), R([law, soc]), R(lit)], { from: 1, dur: 340 });

      // 3.2 s: the burst. The box grows up to the first line: ART HISTORY rises into the second line's place and pushes
      // it up under the first; LITERARY THEORY blurs into PERFORMANCE STUDIES; ECONOMICS grows in, squashed, at the bottom
      burst(T.burst);
      A(rowsEl, [{ clipPath: clipAt(G.clipLow) }, { clipPath: clipAt(G.clipHigh) }], T.burst + 30, 300, 'cubic-bezier(.45,0,.75,.45)');
      line2Bump(T.burst + 60, 320);
      L.top = L.Y0p;
      var perf = word(7), econ = word(8);
      stand(perf, lit, false);
      var S1 = stackOf([R(art), R(law), R(perf), R(econ, econ.c * 0.2)], L.top);
      go(art, 3240, 340, S1[0].ct, S1[0].h, 'cubic-bezier(.5,0,.15,1)', 2.4);
      go(law, 3290, 300, S1[1].ct, S1[1].h, 'cubic-bezier(.5,0,.15,1)', 2.2);
      go(lit, 3320, 340, S1[2].ct, S1[2].h, 'cubic-bezier(.45,0,.1,1)', 2.4);
      go(perf, 3320, 340, S1[2].ct, S1[2].h, 'cubic-bezier(.45,0,.1,1)', 2.4);
      morph(lit, perf, 3340, 240);
      appear(econ, 3400, S1[3].ct, S1[3].h, 120);
      restack(3480, [R(art), R(law), R(perf), R(econ)], { from: 3, dur: 560 });

      // 3.95 s: a quick cascade, top to bottom: CRITICAL THEORY, RELIGION, VISUAL STUDIES, POLITICS, each taking or giving
      // room as it lands
      var crit = word(9); roll(art, crit, 3950, 280);
      restack(4030, [R(crit), R(law), R(perf), R(econ)], { from: 0, dur: 380 });
      var rel = word(10); roll(law, rel, 4020, 280);
      restack(4100, [R(crit), R(rel), R(perf), R(econ)], { from: 1, dur: 380 });
      var vis = word(11); roll(perf, vis, 4090, 280);
      restack(4170, [R(crit), R(rel), R(vis), R(econ)], { from: 2, dur: 380 });
      var pol = word(12); roll(econ, pol, 4160, 280);
      restack(4240, [R(crit), R(rel), R(vis), R(pol)], { from: 3, dur: 400 });

      // 4.5 s: POLITICS is squashed out and the rows above stretch down into its room; HISTORY OF TECHNOLOGY grows in
      // where it was and pushes them back, and a pinch travels through it
      restack(4500, [R(crit), R(rel), R(vis), R(pol, pol.c * 0.16)], { from: 3, dur: 320, easing: 'cubic-bezier(.4,0,.3,1)' });
      A(pol.el, [{ opacity: 1 }, { opacity: 0 }], 4660, 110);
      var tech = word(13), S2 = stackOf([R(crit), R(rel), R(vis), R(tech, pol.c * 0.16)], L.top);
      appear(tech, 4670, S2[3].ct, S2[3].h, 100);
      restack(4740, [R(crit), R(rel), R(vis), R(tech)], { from: 3, dur: 600 });
      pinch(tech, 4820, 820);
      // 5.05 s: RELIGION leans into italic, letter by letter
      lean(rel, 5050, 320, -12);
      // 5.23 s: all four change at once, as in the film: ANTHROPOLOGY peels over CRITICAL THEORY and pushes the rows
      // down, RELIGION twists into GOVERNANCE, VISUAL STUDIES shivers into SPIRITUALITY, HISTORY OF TECHNOLOGY rolls into
      // SOCIAL THEORY
      var anth = word(14); peel(crit, anth, 5230, 340);
      var gov = word(15); twist(rel, gov, 5300, 300);
      var spi = word(16); shiverInto(vis, [spi], 5360, 240);
      restack(5380, [R([anth, crit]), R([gov, rel]), R([spi, vis]), R(tech)], { from: 0 });
      var soct = word(17); roll(tech, soct, 5440, 280);
      restack(5520, [R(anth), R(gov), R(spi), R(soct)], { from: 3 });
      // 5.6 s: the ribbon flicks through the rows (the film's own, frame by frame); they ripple
      ribbon();
      ripple(spi, 5760, 440);
      ripple(gov, 5820, 440);

      // 6.12 s: the last scroll: ANTHROPOLOGY goes up under the first line, the others climb and stretch into its room,
      // and ECOLOGY grows in at the bottom
      exitUp(anth, 6120, 240);
      var eco = word(18), S3 = stackOf([R(gov), R(spi), R(soct), R(eco, eco.c * 0.2)], L.top);
      go(gov, 6140, 280, S3[0].ct, S3[0].h, 'cubic-bezier(.55,0,.15,1)', 2);
      go(spi, 6170, 300, S3[1].ct, S3[1].h, 'cubic-bezier(.35,0,.1,1)', 1.8);
      go(soct, 6200, 300, S3[2].ct, S3[2].h, 'cubic-bezier(.35,0,.1,1)', 1.8);
      appear(eco, 6240, S3[3].ct, S3[3].h, 100);
      restack(6290, [R(gov), R(spi), R(soct), R(eco)], { from: 3, dur: 400 });
      // 6.62 s: GOVERNANCE shivers into ETHICS · DESIGN, the biggest row, and the others squeeze;
      // SPIRITUALITY twists into CIVICS; ETHICS leans into italic
      var eth = word(19), des = word(20, { x: Math.max(44, eth.em * eth.f + 6) });
      shiverInto(gov, [eth, des], 6620, 240);
      restack(6690, [R([eth, des, gov]), R(spi), R(soct), R(eco)], { from: 0, dur: 380 });
      var civ = word(21); twist(spi, civ, 6700, 300);
      restack(6790, [R([eth, des]), R(civ), R(soct), R(eco)], { from: 1, dur: 380 });
      lean(eth, 6900, 260, -10);

      // 6.95-7.8 s: hold, as the film does: the rows only push at each other. ETHICS · DESIGN and CIVICS fight over the
      // line between them, twice; SOCIAL THEORY and ECOLOGY once
      tug([eth, des], civ, 6980, 520, 1.8);
      tug(soct, eco, 7230, 440, -1.1);
      tug([eth, des], civ, 7500, 360, -1.3);

      // the warp: every move ripples the letters a little (not the reveal)
      warp(1330, 560, 0.55); warp(1600, 380, 0.4); warp(2780, 440, 0.5); warp(2990, 280, 0.35); warp(T.burst, 760, 0.95);
      warp(3940, 520, 0.5); warp(4500, 620, 0.35); warp(5220, 600, 0.45); warp(5760, 480, 0.5);
      warp(6120, 700, 0.45); warp(6610, 380, 0.35);

      // 7.8 s: the second line wipes back in from the left; 7.95 s: THOUGHT is peeled in by the _| edge, the bloom spreads
      reveal([civ, soct, eco], [eth, des]);
      // the tugs go on top of everything else, so they squash and stretch whatever the rows are doing
      emitTugs();
      // the sweep to the page
      exitSweep(T.end, T.exit);
      cue(T.end + T.exit, function () { finish(true); });
      state.duration = HOLD + T.end + T.exit;
      el.setAttribute('data-ready', '');
    }

    /* -- the soundtrack: the concept film's own, cut to the same moments as the score (which runs a frame, 40 ms,
          behind the film), with its last ring let out into the homepage. Browsers only play sound unasked where the
          visitor has already been active (pressing play on the radio, for one), so the intro tries, and where it
          may not, the Sound on button starts it from wherever the score is. While it plays, Neta DAO Radio (if it is
          on) is lowered under it, and brought back up when it ends, is turned off or the intro is skipped. At the
          end of the sweep the intro goes, but its last ring plays out under the homepage. -- */
    var SOUND_LAG = 40;
    var soundOn = false, soundWanted = options.sound !== undefined ? !!options.sound : !el.hasAttribute('data-muted'), soundFader = 0;
    function soundAt(ms) { return Math.max(0, (ms - HOLD - SOUND_LAG) / 1000); }
    function duckRadio(on) { try { var r = window.NetaDAORadio; if (r && r.duck) r.duck(on, on ? 14000 : 0); } catch (e) { /* no radio */ } }
    function soundLabel() {
      if (!soundBtn) return;
      soundBtn.hidden = !sound;
      soundBtn.textContent = soundOn ? 'Sound off' : 'Sound on';
      soundBtn.setAttribute('aria-pressed', String(soundOn));
    }
    function soundPlay(from) {
      if (!sound || !soundWanted) return;
      clearInterval(soundFader);
      media(sound, function (v) {
        v.volume = 1;
        var t = soundAt(from);
        if (Math.abs(v.currentTime - t) > 0.05) v.currentTime = t;
        var p = v.play();
        var on = function () { if (!soundOn) duckRadio(true); soundOn = true; soundLabel(); };
        var off = function () { soundOn = false; soundLabel(); };
        if (p && p.then) p.then(on, off); else on();
      });
    }
    function soundStop(fadeMs) {
      if (!sound) return;
      var was = soundOn;
      soundOn = false; soundLabel();
      clearInterval(soundFader);
      if (fadeMs && !sound.paused) {
        var v0 = sound.volume, t0 = Date.now();
        soundFader = setInterval(function () {
          var k = Math.min(1, (Date.now() - t0) / fadeMs);
          try { sound.volume = v0 * (1 - k); } catch (e) {}
          if (k >= 1) { clearInterval(soundFader); media(sound, function (v) { v.pause(); }); }
        }, 30);
      } else media(sound, function (v) { v.pause(); });
      if (was) duckRadio(false);
    }
    // start it in step with the clock at from: now, or when the score starts if it is still in the hold
    function soundFrom(from) {
      if (!sound || !soundWanted) return;
      var sf = from - HOLD;
      if (sf < SOUND_LAG) timers.push(setTimeout(function () { soundPlay(HOLD + SOUND_LAG); }, SOUND_LAG - sf));
      else if (sf < T.end) soundPlay(from);
    }
    // a long way off the clock (a stall, a tab put back): put it back in step
    function soundKeep(ms) {
      if (!soundOn || !sound || sound.paused || sound.seeking || ms >= HOLD + T.end) return;
      if (Math.abs(sound.currentTime - soundAt(ms)) > 0.15) sound.currentTime = soundAt(ms);
    }
    if (sound) sound.addEventListener('ended', function () { if (soundOn) { soundOn = false; soundLabel(); duckRadio(false); } });
    if (soundBtn) soundBtn.addEventListener('click', function () {
      if (soundOn) { soundWanted = false; soundStop(160); return; }
      soundWanted = true;
      if (playing) soundFrom(now());
    });

    /* -- running it -- */
    function setAll(fn) { anims.forEach(function (a) { try { fn(a); } catch (e) {} }); }
    // clock time to film time (the score's time is the clock's less the hold; the film in the letters plays through the hold)
    function filmAt(ms) { return Math.min(Math.max(0, ms) / 1000, FILM_END); }
    function bgAt(ms) { return Math.max(0, Math.min((ms - HOLD - BG0) / 1000, (bg && bg.duration ? bg.duration : 9) - 0.05)); }
    function playBg(from) { media(bg, function (v) { var t = bgAt(from); if (Math.abs(v.currentTime - t) > 0.04) v.currentTime = t; var p = v.play(); if (p && p.catch) p.catch(noop); }); }
    function playBloom(from) { media(bloomV, function (v) { var t = bloomAt(from); if (Math.abs(v.currentTime - t) > 0.04) v.currentTime = t; var p = v.play(); if (p && p.catch) p.catch(noop); }); }
    var raf = 0;
    function tick() {
      if (!playing) { raf = 0; return; }
      var t = now(); applyWarp(t); if (ribbonDraw) ribbonDraw(t); soundKeep(t);
      if (filmOn && (filmV.ended || t >= FILM_LEN)) filmEnd();
      raf = requestAnimationFrame(tick);
    }
    function ticking() { if (!raf && window.requestAnimationFrame) raf = requestAnimationFrame(tick); }
    function seek(ms) {
      setAll(function (a) { a.pause(); a.currentTime = ms; });
      applyWarp(ms);
      if (ribbonDraw) ribbonDraw(ms);
      media(fill, function (v) { v.pause(); v.currentTime = filmAt(ms); });
      media(bg, function (v) { v.pause(); v.currentTime = bgAt(ms); });
      media(bloomV, function (v) { v.pause(); v.currentTime = bloomAt(ms); });
      soundStop(0); media(sound, function (v) { v.currentTime = soundAt(ms); });
      if (filmOn) media(filmV, function (v) { v.pause(); v.currentTime = Math.min(ms, FILM_LEN) / 1000; });
      playing = false;
    }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    // the clock: an empty animation that runs the whole length (a finished one holds its last time, so it can't be the first move)
    var clockAnim = null;
    function now() {
      if (filmOn) return filmV.currentTime * 1000;
      var a = clockAnim || anims[0]; return a ? (a.currentTime || 0) : 0;
    }
    function runCues(from) {
      cues.forEach(function (c) { if (c.t >= from) timers.push(setTimeout(c.fn, c.t - from)); });
      var sf = from - HOLD;   // where the score is
      if (BG && sf < BG_END) {
        if (sf >= BG0) playBg(from); else timers.push(setTimeout(function () { playBg(HOLD + BG0); }, BG0 - sf));
        timers.push(setTimeout(function () { media(bg, function (v) { v.pause(); }); }, BG_END - sf));
      }
      media(fill, function (v) { if (from > 0) { if (Math.abs(v.currentTime - filmAt(from)) > 0.1) v.currentTime = filmAt(from); var p = v.play(); if (p && p.catch) p.catch(noop); } });
      if (bloomV) {
        var bEnd = BLOOM0 + BLOOM_DUR;
        if (sf < BLOOM0) timers.push(setTimeout(function () { playBloom(HOLD + BLOOM0); }, BLOOM0 - sf));
        else if (sf < bEnd) playBloom(from);
      }
      soundFrom(from);
    }
    function start() {
      clockStart = document.timeline ? document.timeline.currentTime : null;
      setAll(function (a) { if (clockStart !== null) a.startTime = clockStart; else a.play(); });
      playing = true;
      soundLabel();
      runCues(0);
      ticking();
    }
    function pause(keepSound) {
      if (!playing) return;
      setAll(function (a) { a.pause(); });
      media(fill, function (v) { v.pause(); }); media(bg, function (v) { v.pause(); }); media(bloomV, function (v) { v.pause(); });
      if (filmOn) media(filmV, function (v) { v.pause(); });
      if (!keepSound) soundStop(0);
      clearTimers(); playing = false;
    }
    function resume() {
      if (filmOn && !playing && !state.done && !filmSwept) {
        media(filmV, function (v) { var p = v.play(); if (p && p.catch) p.catch(noop); });
        playing = true; soundFrom(now()); ticking(); return;
      }
      if (playing || state.done || !anims.length) return;
      var t = now();
      setAll(function (a) { a.play(); });
      runCues(t);
      playing = true;
      ticking();
    }
    // full: wait until the browser expects to play it through without stopping (the films that run under the whole sequence)
    function whenReady(v, ms, full) {
      return new Promise(function (resolve) {
        var need = full ? 4 : 3, type = full ? 'canplaythrough' : 'canplay';
        if (!v || v.readyState >= need) return resolve();
        var done = function () { v.removeEventListener(type, done); resolve(); };
        v.addEventListener(type, done);
        setTimeout(done, ms);
      });
    }
    function loadFaces() {
      if (!document.fonts || !document.fonts.load) return Promise.resolve();
      var fam = getComputedStyle(wordLine).fontFamily;
      var famV = getComputedStyle(el).getPropertyValue('--font-display-widths').trim();
      return Promise.all([document.fonts.load('700 100px ' + fam, 'NETA'), document.fonts.load('800 100px ' + fam, 'THOUGHT'),
        famV ? document.fonts.load('700 100px ' + famV, 'LAW') : null]).catch(noop);
    }
    function finish(swept) {
      if (state.done || (filmSwept && !swept)) return;   // a film already sweeping off finishes its sweep
      state.done = true; clearTimers(); if (!replay) remember();
      document.removeEventListener('keydown', onKey);
      function close() {
        media(fill, function (v) { v.pause(); }); media(bg, function (v) { v.pause(); }); media(bloomV, function (v) { v.pause(); });
        if (filmOn) media(filmV, function (v) { v.pause(); v.removeAttribute('src'); v.load(); });   // let the phone free it
        if (replay) { timers.push(setTimeout(function () { state.done = false; run(); }, 1800)); return; }
        el.hidden = true;
        setAll(function (a) { a.cancel(); });
        onDone();
      }
      // swept off at the end: the soundtrack's last ring plays on under the homepage
      if (swept) return close();
      // skipped: the sound fades and the intro sweeps away from wherever it is
      pause(true);
      soundStop(450);
      var f = exitFrames(), e = 'cubic-bezier(.65,0,.35,1)', d = 560, out = [sheet.animate(f.sheet, { duration: d, easing: e, fill: 'forwards' })];
      if (wipe) { out.push(wipe.animate(f.band, { duration: d, easing: e, fill: 'forwards' })); out.push(wipe.animate(f.bandOpacity, { duration: d, fill: 'forwards' })); }
      anims = anims.concat(out);
      out[0].finished.catch(noop).then(close);
    }
    function onKey(e) { if (e.key === 'Escape') finish(false); }
    function onVisibility() { if (document.hidden) { if (replay) pause(); else if (!state.done && playing) finish(false); } else if (replay) resume(); }
    function run() {
      el.hidden = false;
      document.addEventListener('keydown', onKey);
      build();
      seek(0);
      try { document.dispatchEvent(new CustomEvent('nda:introstart')); } catch (e) { /* old browsers */ }
      // a phone loads a film only once it is asked to play: ask, and stop it again, so the wait below is for real loading
      if (LITE) [fill, bloomV, bg].forEach(function (v) { media(v, function (v) { if (v.readyState < 3) { var p = v.play(); if (p && p.then) p.then(function () { if (!playing) v.pause(); }, noop); } }); });
      Promise.all([whenReady(fill, LITE ? 2500 : 4000, true), whenReady(bloomV, LITE ? 1500 : 2500, true), whenReady(bg, 1500), whenReady(sound, 1200), ribbonReady(2500)]).then(function () {
        if (state.done) return;
        seek(0);
        start();
      });
    }

    function live() {
      Promise.all([fontsReady(), loadFaces()]).then(function () {
        if (state.done) return;
        each(el, '[data-nda-fit]', measureFit);
        run();
      });
    }

    /* -- the live version's films wait (preload="none") until it is sure to run, so a phone playing the film, or a
          visitor who has seen the intro, never loads them -- */
    function wake() { [fill, bloomV, bg].forEach(function (v) { media(v, function (v) { if (v.preload !== 'auto') { v.preload = 'auto'; v.load(); } }); }); }

    /* -- the film (phones), in place of the live stage -- */
    function runFilm() {
      var v = filmV, began = false;
      el.setAttribute('data-film', '');
      document.addEventListener('keydown', onKey);
      v.muted = true; v.defaultMuted = true; v.playsInline = true;
      v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
      if (v.getAttribute('data-poster')) v.setAttribute('poster', v.getAttribute('data-poster'));
      v.preload = 'auto';
      v.src = v.getAttribute('data-src');
      // it can't play: the live version, from the start
      function fail() {
        if (state.done || !filmOn) return;   // (the error and the refused play both come here)
        if (began) { finish(false); return; }
        filmOn = false; clearTimers();
        el.removeAttribute('data-film');
        media(v, function (v) { v.pause(); v.removeAttribute('src'); v.load(); });
        wake();
        live();
      }
      function go() {
        if (began || state.done || !filmOn) return;
        began = true;
        playing = true;
        try { document.dispatchEvent(new CustomEvent('nda:introstart')); } catch (e) { /* old browsers */ }
        soundLabel();
        soundFrom(now());
        ticking();
      }
      v.addEventListener('error', fail);
      v.addEventListener('ended', function () { if (filmOn) filmEnd(); });
      // the browser starts it once it has enough to play on (its first second is the still, so starting at once is
      // the same as holding); the clock is the film's own
      v.addEventListener('playing', go);
      var p = v.play();
      if (p && p.then) p.then(go, fail);
      // still not playing 8 s on: it won't
      timers.push(setTimeout(function () { if (!began) fail(); }, 8000));
    }
    // the film's last frame holds while the sweep takes it off the page
    function filmEnd() {
      if (filmSwept || state.done) return;
      filmSwept = true;
      var f = exitFrames(), e = 'cubic-bezier(.65,0,.35,1)', out = [sheet.animate(f.sheet, { duration: T.exit, easing: e, fill: 'forwards' })];
      if (wipe) { out.push(wipe.animate(f.band, { duration: T.exit, easing: e, fill: 'forwards' })); out.push(wipe.animate(f.bandOpacity, { duration: T.exit, fill: 'forwards' })); }
      anims = anims.concat(out);
      out[0].finished.catch(noop).then(function () { finish(true); });
    }

    state.seek = function (ms) { clearTimers(); seek(ms); };
    state.now = function () { return now(); };      // where the clock is, in ms
    state.pause = function () { pause(); };
    state.play = resume;
    state.skip = function () { finish(false); };
    el.__ndaIntro = state;
    if (skip) skip.addEventListener('click', function () { finish(false); });
    document.addEventListener('visibilitychange', onVisibility);
    onMotionChange(function () { if (reducedMotion()) finish(false); });
    if (!el.animate) { el.hidden = true; state.done = true; onDone(); return state; }
    if (reducedMotion() && replay) {
      // Showcase under reduced motion: the settled statement, nothing moving.
      el.hidden = false;
      if (skip) skip.hidden = true;
      wake();
      Promise.all([fontsReady(), loadFaces()]).then(function () { each(el, '[data-nda-fit]', measureFit); build(); seek(T.end - 100); });
      state.done = true; return state;
    }
    if (reducedMotion() || (!replay && seen())) { el.hidden = true; state.done = true; onDone(); return state; }
    el.hidden = false;
    if (filmOn) runFilm(); else { wake(); live(); }
    return state;
  };

  /* ---- enhance: wire everything under root ---- */
  NDA.enhance = function (root) {
    root = root || document;
    each(root, '[data-nda-fit]', NDA.fit);
    each(root, '.nda-hero__title, .nda-intro__statement', watchGaps);
    each(root, '[data-nda-liquid]', NDA.liquidWord);
    each(root, '[data-nda-radio]', NDA.radio);
    each(root, '[data-nda-menu]', NDA.menu);
    each(root, '[data-nda-submenu]', NDA.submenu);
    each(root, '.nda-forkmark', NDA.forkMark);
    each(root, '.nda-wash', NDA.wash);
    each(root, '.nda-engrave', NDA.engrave);
    each(root, '.nda-comic', NDA.comic);
    each(root, '[data-nda-intro]', function (el) { NDA.intro(el); });
    each(root, '[data-nda-dock]', NDA.dock);
    each(root, '[data-nda-autohide]', NDA.autohide);
    each(root, '[data-nda-sequence]', NDA.sequence);
    return root;
  };

  NDA.version = '3.4.0';
})();
