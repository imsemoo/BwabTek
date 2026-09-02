/* ==========================================================================
   بوابتك - main
   Header state, active nav link, mobile menu, language toggle, contact form,
   lazy hero floor grid. No scroll listeners: IntersectionObserver drives
   everything that depends on position.

   The accordion, the marquee and the automation flow are CSS only.
   ========================================================================== */
import { init as i18nInit, toggle as toggleLang, t } from './i18n.js?v=25';

i18nInit();

const header = document.getElementById('header');
const sentinel = document.querySelector('.scroll-sentinel');
const menu = document.getElementById('mobileMenu');
const menuToggle = document.getElementById('menuToggle');
const langToggles = document.querySelectorAll('[data-lang-toggle]');
const main = document.getElementById('main');
const desktopQuery = window.matchMedia('(min-width: 900px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- Header: transparent over the hero, hairline glass after 60px ---------- */
if (header && sentinel && 'IntersectionObserver' in window) {
  const headerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        header.classList.toggle('is-scrolled', !entry.isIntersecting);
      });
    },
    { threshold: 0 }
  );
  headerObserver.observe(sentinel);
} else if (header) {
  header.classList.add('is-scrolled');
}

/* ---------- Active nav link: the section crossing the middle of the viewport ---------- */
const navLinks = Array.from(document.querySelectorAll('.nav__link[href^="#"], .menu__link[href^="#"]'));
const navSections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter((section, index, list) => section && list.indexOf(section) === index);

if (navSections.length && 'IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const href = `#${entry.target.id}`;
        navLinks.forEach((link) => {
          if (link.getAttribute('href') === href) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  );
  navSections.forEach((section) => sectionObserver.observe(section));
}

/* ---------- Mobile menu ---------- */
let menuOpen = false;
let lastFocused = null;

function focusableIn(container) {
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.offsetParent !== null || el === menuToggle);
}

function syncMenuLabel() {
  if (!menuToggle) return;
  menuToggle.setAttribute('aria-label', t(menuOpen ? 'nav.menuClose' : 'nav.menuOpen'));
}

function openMenu() {
  if (!menu || menuOpen) return;
  menuOpen = true;
  lastFocused = document.activeElement;
  menu.classList.add('is-open');
  header.classList.add('is-open');
  document.documentElement.classList.add('menu-open');
  menuToggle.setAttribute('aria-expanded', 'true');
  if (main) main.inert = true;
  syncMenuLabel();
  const first = menu.querySelector('a[href], button');
  if (first) first.focus({ preventScroll: true });
}

function closeMenu({ restoreFocus = true } = {}) {
  if (!menu || !menuOpen) return;
  menuOpen = false;
  menu.classList.remove('is-open');
  header.classList.remove('is-open');
  document.documentElement.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  if (main) main.inert = false;
  syncMenuLabel();
  if (restoreFocus && lastFocused && typeof lastFocused.focus === 'function') {
    lastFocused.focus({ preventScroll: true });
  }
  lastFocused = null;
}

if (menu && menuToggle) {
  menuToggle.addEventListener('click', () => {
    if (menuOpen) closeMenu();
    else openMenu();
  });

  menu.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link) closeMenu({ restoreFocus: false });
  });

  document.addEventListener('keydown', (event) => {
    if (!menuOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === 'Tab') {
      const items = [...focusableIn(header), ...focusableIn(menu)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const onDesktopChange = (event) => {
    if (event.matches) closeMenu({ restoreFocus: false });
  };
  if (typeof desktopQuery.addEventListener === 'function') {
    desktopQuery.addEventListener('change', onDesktopChange);
  } else {
    desktopQuery.addListener(onDesktopChange);
  }

  syncMenuLabel();
}

/* ---------- Language toggle ---------- */
langToggles.forEach((button) => {
  button.addEventListener('click', () => {
    toggleLang();
  });
});

/* ==========================================================================
   CONTACT FORM
   Validated in the page, each message under the field it belongs to, and the
   success state replaces the fields without navigating.

   Messages are held as dictionary keys rather than as rendered text, so a
   language switch while errors are on screen rewrites them correctly.
   ========================================================================== */
const form = document.getElementById('contactForm');

const RULES = [
  {
    id: 'fName',
    error: 'eName',
    key: 'contact.errName',
    test: (value) => value.trim().length >= 2,
  },
  {
    id: 'fPhone',
    error: 'ePhone',
    key: 'contact.errPhone',
    /* Accepts the shapes people actually type: +20, 00, spaces, dashes */
    test: (value) => {
      const digits = value.replace(/\D/g, '');
      return /^[\d\s()+-]+$/.test(value.trim()) && digits.length >= 8 && digits.length <= 15;
    },
  },
  {
    id: 'fEmail',
    error: 'eEmail',
    key: 'contact.errEmail',
    test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()),
  },
  {
    id: 'fService',
    error: 'eService',
    key: 'contact.errService',
    test: (value) => value !== '',
  },
];

function paintMessage(el) {
  if (!el) return;
  const key = el.dataset.errorKey;
  el.textContent = key ? t(key) : '';
}

function setFieldError(rule, invalid) {
  const control = document.getElementById(rule.id);
  const message = document.getElementById(rule.error);
  if (!control || !message) return;

  const field = control.closest('.field');
  if (field) field.classList.toggle('is-invalid', invalid);
  control.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  if (invalid) message.dataset.errorKey = rule.key;
  else delete message.dataset.errorKey;
  paintMessage(message);
}

function validateForm() {
  let firstInvalid = null;
  RULES.forEach((rule) => {
    const control = document.getElementById(rule.id);
    if (!control) return;
    const ok = rule.test(control.value);
    setFieldError(rule, !ok);
    if (!ok && !firstInvalid) firstInvalid = control;
  });
  return firstInvalid;
}

if (form) {
  const formError = document.getElementById('formError');
  const submitButton = document.getElementById('formSubmit');
  const resetButton = document.getElementById('formReset');

  function showFormError(key) {
    if (!formError) return;
    if (key) formError.dataset.errorKey = key;
    else delete formError.dataset.errorKey;
    paintMessage(formError);
  }

  /* A field's message clears as soon as it becomes valid, but never appears
     before the first submit, so nobody is corrected while still typing. */
  let submitted = false;
  RULES.forEach((rule) => {
    const control = document.getElementById(rule.id);
    if (!control) return;
    const revalidate = () => {
      if (!submitted) return;
      setFieldError(rule, !rule.test(control.value));
    };
    control.addEventListener('input', revalidate);
    control.addEventListener('change', revalidate);
    control.addEventListener('blur', revalidate);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitted = true;
    showFormError(null);

    const firstInvalid = validateForm();
    if (firstInvalid) {
      showFormError('contact.errForm');
      firstInvalid.focus();
      return;
    }

    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      /* Not wired up yet. Say so honestly rather than showing a success state
         for a request that was never sent. */
      console.error('[bawabtak] contact form: set data-endpoint on #contactForm before launch.');
      showFormError('contact.errSend');
      return;
    }

    const label = submitButton ? submitButton.textContent : '';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = t('contact.sending');
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.classList.add('is-done');
      const done = form.querySelector('.form__done-title');
      if (done) {
        done.setAttribute('tabindex', '-1');
        done.focus();
      }
    } catch (error) {
      console.error('[bawabtak] contact form failed:', error);
      showFormError('contact.errSend');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = label || t('contact.submit');
      }
    }
  });

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      form.reset();
      submitted = false;
      RULES.forEach((rule) => setFieldError(rule, false));
      showFormError(null);
      form.classList.remove('is-done');
      const first = document.getElementById('fName');
      if (first) first.focus();
    });
  }
}

/* Repaint any live messages after a language switch */
document.addEventListener('bawabtak:langchange', () => {
  syncMenuLabel();
  document.querySelectorAll('[data-error-key]').forEach(paintMessage);
  if (heroGrid) heroGrid.anchor();
});

/* ==========================================================================
   SCROLL REVEAL
   Purpose: reading order. Each group enters once, in the order it is meant to
   be read, and then stops mattering. Nothing loops.

   The hidden state lives behind html.can-reveal, which is only added here, so
   a failed script or a reduced-motion preference leaves every element visible.
   ========================================================================== */
function armReveal() {
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;

  const groups = document.querySelectorAll('[data-reveal-group]');
  const singles = document.querySelectorAll('[data-reveal]:not([data-reveal-group])');
  if (!groups.length && !singles.length) return;

  /* A group is watched as a whole and its children stagger from it, capped at
     five steps so a long grid never ends with stragglers. The group itself is
     never a reveal target, or it would fade twice. */
  groups.forEach((group) => {
    group.removeAttribute('data-reveal');
    Array.from(group.children).forEach((child, index) => {
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

  groups.forEach((group) => observer.observe(group));
  singles.forEach((el) => observer.observe(el));

  /* The hero draws itself once the first frame has painted: the opening comes
     in order by order, and only then does its stream start. */
  const hero = document.querySelector('.hero');
  if (hero) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => hero.classList.add('is-drawn'));
    });
  }
}

armReveal();

/* ==========================================================================
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

/* ==========================================================================
   HERO FLOOR GRID
   Loaded after `load`, and only where drawing it is cheap.
   ========================================================================== */
let heroGrid = null;

function heroBackgroundAllowed() {
  if (reducedMotion.matches) return false;
  const connection = navigator.connection;
  if (connection) {
    if (connection.saveData) return false;
    if (/(^|-)2g$/.test(connection.effectiveType || '')) return false;
  }
  if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4) return false;
  if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 2) return false;
  return true;
}

function startHeroBackground() {
  const host = document.getElementById('heroGrid');
  if (!host || !heroBackgroundAllowed() || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    import('./hero-grid.js?v=25')
      .then((module) => {
        heroGrid = module.initHeroGrid(host, {
          horizon: document.getElementById('heroBase'),
          anchor: document.getElementById('heroArch'),
        });
      })
      .catch(() => {
        /* WebGL unavailable or blocked: the static CSS grid stays in place */
      });
  });
  observer.observe(host);
}

const onReducedMotionChange = (event) => {
  if (event.matches && heroGrid) {
    heroGrid.destroy();
    heroGrid = null;
  }
};
if (typeof reducedMotion.addEventListener === 'function') {
  reducedMotion.addEventListener('change', onReducedMotionChange);
} else {
  reducedMotion.addListener(onReducedMotionChange);
}

const schedule = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 200));

if (document.readyState === 'complete') {
  schedule(startHeroBackground);
} else {
  window.addEventListener('load', () => schedule(startHeroBackground), { once: true });
}
