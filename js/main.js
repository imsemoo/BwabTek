/* ==========================================================================
   بوابتك - main
   Header state, active nav link, mobile menu, language toggle, lazy hero
   floor grid. No scroll listeners: IntersectionObserver drives everything.
   ========================================================================== */
import { init as i18nInit, toggle as toggleLang, t } from './i18n.js?v=7';

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

/* ---------- Active nav link: the section in the middle of the viewport ---------- */
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

document.addEventListener('bawabtak:langchange', () => {
  syncMenuLabel();
  if (heroGrid) heroGrid.anchor();
});

/* ---------- Hero floor grid: loaded after `load`, only where it is cheap ---------- */
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
    import('./hero-grid.js?v=7')
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
