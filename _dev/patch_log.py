"""The gate runs a readout, not a shower of glyphs.

Inside the hero opening: an order id and the four automation stages, executed
one after another with a status mark, then a fresh order. It is the star
section's diagram happening live at the door, in the page's own language,
aligned to a column, at readable contrast. The scattered token stream is
removed everywhere.
"""

import io
import re


def edit(path, fn):
    s = io.open(path, encoding='utf-8', newline='').read()
    out = fn(s)
    io.open(path, 'w', encoding='utf-8', newline='\n').write(out)
    print('ok', path)


# ------------------------------------------------------------ components.css
def components(s):
    start = s.index('  /* ---------- The gate is running ----------')
    end = s.index('  /* 1px ring, lit at the crown, fading to nothing at the ground */')
    block = """  /* ---------- The gate is running ----------
     A readout inside the opening: one order id, the four automation stages
     executed in sequence with a status mark, then the next order. It is the
     star section's diagram happening live at the door, in the page's own
     language, on a column, at reading contrast. js/main.js steps data-step
     from 0 (blank) to 5 (all done); everything visual is a transition. */
  .gateway__log {
    position: absolute;
    inset-block-start: 36%;
    inset-inline: 20%;
    display: grid;
    gap: var(--sp-12);
    pointer-events: none;
    opacity: 0;
    translate: 0 var(--sp-8);
    transition:
      opacity 600ms var(--ease),
      translate 600ms var(--ease);
  }

  .gateway__log[data-step]:not([data-step="0"]) {
    opacity: 1;
    translate: none;
  }

  .gateway__log-id {
    font-family: var(--font-mono);
    font-size: var(--step--1);
    line-height: 1;
    color: var(--text-faint);
    letter-spacing: .04em;
    direction: ltr;
    unicode-bidi: isolate;
    justify-self: start;
    padding-block-end: var(--sp-12);
    border-block-end: 1px solid var(--line);
    inline-size: 100%;
  }

  .gateway__log-rows {
    display: grid;
    gap: var(--sp-8);
  }

  .gateway__log-row {
    display: flex;
    align-items: center;
    gap: var(--sp-12);
    font-size: var(--step--1);
    font-weight: 500;
    line-height: 1.4;
    color: var(--text-faint);
    white-space: nowrap;
    translate: 0 var(--sp-4);
    transition:
      color var(--dur-in) var(--ease),
      translate var(--dur-in) var(--ease);
  }

  /* the status mark: hollow while waiting, lit while running, filled when done */
  .gateway__log-mark {
    flex: none;
    inline-size: var(--sp-8);
    block-size: var(--sp-8);
    border: 1px solid var(--line-strong);
    background: transparent;
    transition:
      background-color var(--dur-ui) var(--ease),
      border-color var(--dur-ui) var(--ease);
  }

  .gateway__log-row.is-active {
    color: var(--text);
    translate: none;
  }

  .gateway__log-row.is-active .gateway__log-mark {
    border-color: var(--accent);
    background: var(--accent);
  }

  .gateway__log-row.is-done {
    color: var(--text-muted);
    translate: none;
  }

  .gateway__log-row.is-done .gateway__log-mark {
    border-color: var(--text-faint);
    background: var(--text-faint);
  }

"""
    return s[:start] + block + s[end:]


edit('css/components.css', components)


# -------------------------------------------------------------- sections.css
def sections(s):
    s = s.replace(
        """  /* the stream only starts once the opening it lives in has been drawn */
  html.can-reveal .hero:not(.is-drawn) .gateway__token {
    animation-play-state: paused;
  }""",
        """  /* the readout only starts once the opening it lives in has been drawn;
     main.js waits for .is-drawn before stepping it */""",
    )
    s = s.replace(
        """    /* The opening sits behind the copy here, so nothing moves behind the words */
    .hero__arch .gateway__stream {
      display: none;
    }""",
        """    /* The opening sits behind the copy here, so nothing moves behind the words */
    .hero__arch .gateway__log {
      display: none;
    }""",
    )
    s = s.replace(
        """  .flow__gate::after,
  .marquee__track,
  .gateway__token {
    animation: none;
  }

  .gateway__token {
    opacity: .3;
  }
""",
        """  .flow__gate::after,
  .marquee__track {
    animation: none;
  }

  /* the readout does not step; it shows the finished state, so the gate still
     reads as a system without anything moving */
  .gateway__log {
    opacity: 1;
    translate: none;
  }

  .gateway__log-row {
    color: var(--text-muted);
    translate: none;
  }

  .gateway__log-row .gateway__log-mark {
    border-color: var(--text-faint);
    background: var(--text-faint);
  }
""",
    )
    assert 'gateway__token' not in s, 'token refs left in sections.css'
    return s


edit('css/sections.css', sections)


# ---------------------------------------------------------------- index.html
def html(s):
    s = re.sub(
        r'\n            <!-- The gate is running: output leaving the machine\..*?</span>\n            </span>',
        """
            <!-- The gate is running: the automation diagram happening live at the
                 door. Decorative, hidden from assistive tech, paused off screen,
                 static under reduced motion. Stepped by js/main.js. -->
            <div class="gateway__log" data-step="0" aria-hidden="true">
              <span class="gateway__log-id">#<span data-log-id>4021</span></span>
              <ol class="gateway__log-rows">
                <li class="gateway__log-row"><span class="gateway__log-mark"></span><span data-i18n="automation.s1">طلب جديد</span></li>
                <li class="gateway__log-row"><span class="gateway__log-mark"></span><span data-i18n="automation.s2">تحقق وتصنيف</span></li>
                <li class="gateway__log-row"><span class="gateway__log-mark"></span><span data-i18n="automation.s3">تحديث الأنظمة</span></li>
                <li class="gateway__log-row"><span class="gateway__log-mark"></span><span data-i18n="automation.s4">إشعار وفاتورة</span></li>
              </ol>
            </div>""",
        s, count=1, flags=re.S,
    )
    s = re.sub(
        r'\n                  <!-- The closing gate takes work in -->.*?</span>\n                  </span>',
        '', s, count=1, flags=re.S,
    )
    s = s.replace('class="gateway gateway--receive contact__arch"', 'class="gateway contact__arch"')
    assert 'gateway__token' not in s and 'gateway__stream' not in s, 'stream left in html'
    assert "gateway__log" in s, "hero readout not inserted"
    assert s.count('class="gateway__log-row"') == 4
    return s


edit('index.html', html)


# ------------------------------------------------------------------ main.js
def js(s):
    start = s.index('/* ==========================================================================\n   IDLE GATES')
    end = s.index('/* ==========================================================================\n   HERO FLOOR GRID')
    block = """/* ==========================================================================
   THE GATE RUNS
   A small state machine steps the readout inside the hero opening:
     0 blank  ->  1..4 that stage running, earlier ones done  ->  5 all done
   then blanks, takes the next order number and goes again. It waits for the
   opening to be drawn, sleeps while the hero is off screen or the tab is
   hidden, and never runs under reduced motion (CSS shows the finished state).
   ========================================================================== */
const gateLog = document.querySelector('.hero .gateway__log');

if (gateLog && !reducedMotion.matches) {
  const rows = Array.from(gateLog.querySelectorAll('.gateway__log-row'));
  const idEl = gateLog.querySelector('[data-log-id]');
  const hero = gateLog.closest('.hero');
  let order = Number(idEl ? idEl.textContent : 4021) || 4021;
  let step = 0;
  let timer = 0;

  const STEP_MS = 950;      /* one stage */
  const HOLD_MS = 1500;     /* all done, before the next order */
  const BLANK_MS = 700;     /* fade out, then a fresh id */

  function paint() {
    gateLog.dataset.step = String(step);
    rows.forEach((row, index) => {
      const stage = index + 1;
      row.classList.toggle('is-done', step > stage);
      row.classList.toggle('is-active', step === stage);
    });
  }

  function asleep() {
    return document.visibilityState !== 'visible' || hero.classList.contains('is-idle') || !hero.classList.contains('is-drawn');
  }

  function tick() {
    timer = 0;
    if (asleep()) {
      timer = window.setTimeout(tick, 500);
      return;
    }
    let wait = STEP_MS;
    if (step === 0) {
      order += 1;
      if (idEl) idEl.textContent = String(order);
      step = 1;
    } else if (step < 4) {
      step += 1;
    } else if (step === 4) {
      step = 5;
      wait = HOLD_MS;
    } else {
      step = 0;
      wait = BLANK_MS;
    }
    paint();
    timer = window.setTimeout(tick, wait);
  }

  paint();
  timer = window.setTimeout(tick, 900);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !timer) timer = window.setTimeout(tick, 300);
  });
}

/* Gates that are off screen have no reason to run */
if ('IntersectionObserver' in window) {
  const gates = document.querySelectorAll('.hero, #contact');
  if (gates.length) {
    const idle = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-idle', !entry.isIntersecting);
      });
    });
    gates.forEach((gate) => idle.observe(gate));
  }
}

"""
    s = s[:start] + block + s[end:]
    s = s.replace('i18n.js?v=23', 'i18n.js?v=25').replace('hero-grid.js?v=23', 'hero-grid.js?v=25')
    return s


edit('js/main.js', js)

# version bump for the page
def bump(s):
    return s.replace('.css?v=24', '.css?v=25').replace('main.js?v=23', 'main.js?v=25')


edit('index.html', bump)
print('done')
