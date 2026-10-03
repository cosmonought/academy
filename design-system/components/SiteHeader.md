# SiteHeader

The site's one header: wordmark, the site's destinations, the Academy radio and Sign in, on `paper` above a 1px `rule`.

## Use
- Every page, once, at the top. It is sticky: it stays at the top of the window as the page scrolls.
- **Homepage** (`data-nda-dock`): the statement's first line is the masthead, so the header starts without its wordmark and takes it back (a 320ms fade and rise) once that line has scrolled up under the header (`NDA.dock()`). Without the script the wordmark simply shows.
- **Cinema** (`data-nda-autohide`): the header tucks away while you scroll down past it and comes back as soon as you scroll up, focus into it or open its menu (`NDA.autohide()`), so the film keeps the screen.
- The wordmark column is `--nda-lead` wide (default 37%). Change it on `.nda-header` if the page grid differs.
- Below 1024px of its own width the header collapses to wordmark, radio and a Menu button; `NDA.menu()` (run by `NDA.enhance()`) toggles `data-open` and `aria-expanded`, and Escape closes it.
- **Seminars has a menu** (`.nda-header__group`, `data-nda-submenu`): the link still goes to the seminars index; beside it a small toggle opens the list of seminars, each with its state in `ink-dim` (Active, On hiatus, Forthcoming). It opens on hover with a pointer, or with the toggle (`NDA.submenu()`); Escape, a click elsewhere or moving focus away closes it. In the collapsed menu the seminars are listed under Seminars, indented, and the toggle is gone.

## You provide
- The navigation links: the site's real destinations, Seminars, Cinema and Journal (fork.netadao.org). Add About and Community when those pages exist; the mockup's Search and Connect wallet are gone until the site has them. Mark the current link with `aria-current="page"`; it gets the 1px underline.
- `data-src` on the radio: the live stream URL (`https://s3.radio.co/s39c195d74/listen`). Without it the control only changes state.
- The right-hand action: **Sign in** (`nda-button--outline nda-button--sm`), or **Account** once signed in. One action only.

## Markup
```html
<header class="nda-header" data-nda-menu>
  <div class="nda-header__inner">
    <a class="nda-wordmark" href="/">Neta DAO Academy</a>
    <div class="nda-header__primary">
      <nav class="nda-header__nav" id="site-nav" aria-label="Main">
        <ul>
          <li class="nda-header__group" data-nda-submenu><a href="/seminars.html">Seminars</a><button class="nda-header__sub-toggle" type="button" aria-expanded="false" aria-controls="nav-seminars"><span class="nda-visually-hidden">Seminars menu</span><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg></button><ul class="nda-header__sub" id="nav-seminars"><li><a href="/sex-and-or-love.html">Sex, and/or Love <span class="nda-header__sub-state">Active</span></a></li><li><a href="/CoiningReason/">Coining Reason <span class="nda-header__sub-state">On hiatus</span></a></li><li><a href="/SexMonstersSuperheroes/">Sex, Monsters, and Superheroes <span class="nda-header__sub-state">Forthcoming</span></a></li></ul></li>
          <li><a href="/cinema.html">Cinema</a></li>
          <li><a href="https://fork.netadao.org">Journal</a></li>
        </ul>
      </nav>
      <div class="nda-radio" role="group" aria-label="Academy radio" data-nda-radio data-src="https://s3.radio.co/s39c195d74/listen">
        <button class="nda-radio__play" type="button" aria-label="Play Academy radio"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1v10l9-5z"/></svg></button>
        <button class="nda-radio__pause" type="button" aria-label="Pause Academy radio"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1h3v10H2zM7 1h3v10H7z"/></svg></button>
      </div>
    </div>
    <div class="nda-header__tools" id="site-tools">
      <a class="nda-button nda-button--outline nda-button--sm" href="/account.html">Sign in</a>
    </div>
    <button class="nda-header__menu" type="button" aria-expanded="false" aria-controls="site-nav site-tools"><span class="nda-header__menu-label">Menu</span> <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18"/></svg></button>
  </div>
</header>
```

## Don't
- Don't add icons to nav items, or menus to items other than Seminars, or a second button.
- Don't put the header on a dark ground on Paper pages: it is `paper` with `ink`.
