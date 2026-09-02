"""Phase 3, part one: self-hosted faces, scroll reveal, heading weight."""

import io
import re

# ------------------------------------------------------------------ base.css
p = 'css/base.css'
s = io.open(p, encoding='utf-8').read()

old = """  h1,
  h2,
  h3,
  h4 {
    font-weight: 700;"""
new = """  /* 600 rather than 700 across the board: at display sizes Alexandria at 700
     shouts, and dropping the weight saves a whole 30 KB face per script. */
  h1,
  h2,
  h3,
  h4 {
    font-weight: 600;"""
assert old in s, 'heading weight'
s = s.replace(old, new, 1)

# scroll reveal, opt-in and only once JavaScript has said it will drive it
old = """  /* Header scroll sentinel: when this leaves the viewport the header turns to glass */"""
new = """  /* ---------- Scroll reveal ----------
     The hidden state is applied only when js/main.js has confirmed it will run
     and motion is welcome. Without JavaScript, or under reduced motion, nothing
     is ever hidden, so the content is always present for readers and crawlers. */
  html.can-reveal [data-reveal] {
    opacity: 0;
    transform: translateY(var(--sp-16));
    transition:
      opacity var(--dur-in) var(--ease),
      transform var(--dur-in) var(--ease);
    transition-delay: calc(var(--reveal-i, 0) * var(--stagger));
  }

  html.can-reveal [data-reveal].is-in {
    opacity: 1;
    transform: none;
  }

  /* Header scroll sentinel: when this leaves the viewport the header turns to glass */"""
assert old in s, 'sentinel anchor'
s = s.replace(old, new, 1)
io.open(p, 'w', encoding='utf-8').write(s)
print('base.css: heading weight 600, reveal states added')

# ------------------------------------------------------------ components.css
p = 'css/components.css'
s = io.open(p, encoding='utf-8').read()
old = """    color: var(--text);
    font-size: var(--step-0);
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
  }"""
new = """    color: var(--text);
    font-size: var(--step-0);
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
  }"""
assert old in s, 'logo weight'
io.open(p, 'w', encoding='utf-8').write(s.replace(old, new, 1))
print('components.css: logo wordmark at 600')

# ------------------------------------------------------------ sections.css
# reduced motion must also neutralise the reveal transition
p = 'css/sections.css'
s = io.open(p, encoding='utf-8').read()
old = """  .flow__gate::after,
  .marquee__track {
    animation: none;
  }"""
new = """  .flow__gate::after,
  .marquee__track {
    animation: none;
  }

  /* Belt and braces: main.js does not arm the reveal under reduced motion, but
     if the preference changes after load nothing may stay hidden. */
  html.can-reveal [data-reveal] {
    opacity: 1;
    transform: none;
  }"""
assert old in s, 'reduced motion tail'
io.open(p, 'w', encoding='utf-8').write(s.replace(old, new, 1))
print('sections.css: reduced motion covers the reveal')

# ------------------------------------------------------------- index.html
p = 'index.html'
s = io.open(p, encoding='utf-8').read()

old = re.search(
    r'  <!-- Fonts:.*?<link rel="stylesheet" href="https://fonts\.googleapis\.com[^"]*">',
    s, re.S,
).group(0)
new = """  <!-- Self-hosted faces. The two the hero paints with are preloaded so the swap
       from the fallback happens before the visitor reads the headline. -->
  <link rel="preload" href="assets/fonts/alexandria-600-arabic.woff2?v=1" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/alexandria-400-arabic.woff2?v=1" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="css/fonts.css?v=1">"""
s = s.replace(old, new, 1)

s = s.replace('.css?v=17', '.css?v=18').replace('main.js?v=17', 'main.js?v=18')
io.open(p, 'w', encoding='utf-8').write(s)
print('index.html: local fonts, preloads, assets at v=18')

# ---------------------------------------------------------------- main.js
p = 'js/main.js'
s = io.open(p, encoding='utf-8').read()
s = s.replace("i18n.js?v=17", "i18n.js?v=18").replace("hero-grid.js?v=17", "hero-grid.js?v=18")

old = """/* ==========================================================================
   HERO FLOOR GRID"""
new = """/* ==========================================================================
   SCROLL REVEAL
   Purpose: reading order. Each group enters once, in the order it is meant to
   be read, and then stops mattering. Nothing loops.

   The hidden state lives behind html.can-reveal, which is only added here, so
   a failed script or a reduced-motion preference leaves every element visible.
   ========================================================================== */
function armReveal() {
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;

  const groups = document.querySelectorAll('[data-reveal-group]');
  const solo = document.querySelectorAll('[data-reveal]');
  if (!groups.length && !solo.length) return;

  /* Index each child inside its group, capped at five, so a long grid never
     ends with items crawling in seconds after the rest. */
  groups.forEach((group) => {
    Array.from(group.children).forEach((child, index) => {
      child.setAttribute('data-reveal', '');
      child.style.setProperty('--reveal-i', String(Math.min(index, 4)));
    });
  });

  document.documentElement.classList.add('can-reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.01 }
  );

  document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
}

armReveal();

/* ==========================================================================
   HERO FLOOR GRID"""
assert old in s, 'hero grid anchor'
io.open(p, 'w', encoding='utf-8').write(s.replace(old, new, 1))
print('main.js: scroll reveal armed')
