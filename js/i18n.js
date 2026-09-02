/* ==========================================================================
   بوابتك - i18n
   Dictionary + DOM applier. Elements opt in with:
     data-i18n="hero.title"                         -> textContent
     data-i18n-attr="placeholder:form.name;aria-label:form.nameLabel" -> attributes
   The choice persists in localStorage['bawabtak.lang'] and is pre-applied to
   <html lang/dir> by the inline <head> script before first paint.
   ========================================================================== */

export const LANG_KEY = 'bawabtak.lang';
export const LANGS = ['ar', 'en'];

export const dict = {
  ar: {
    meta: {
      title: 'بوابتك | برمجة وأتمتة تخلّي شغلك يمشي من غيرك',
      description:
        'بوابتك بيت برمجة مصري يبني تطبيقات الويب والموبايل، وأتمتة العمليات وربط الأنظمة، ووكلاء الذكاء الاصطناعي. تسليم شغّال، مش سلايدات. احجز استشارة مجانية 20 دقيقة.',
    },
    brand: {
      name: 'بوابتك',
    },
    a11y: {
      skip: 'تخطَّ إلى المحتوى',
    },
    nav: {
      label: 'القائمة الرئيسية',
      services: 'الخدمات',
      process: 'إزاي بنشتغل',
      work: 'أعمالنا',
      pricing: 'الأسعار',
      faq: 'أسئلة',
      cta: 'احجز استشارة',
      menuOpen: 'افتح القائمة',
      menuClose: 'اقفل القائمة',
    },
    lang: {
      switch: 'Switch to English',
    },
    hero: {
      title: 'برمجة وأتمتة تخلّي شغلك يمشي من غيرك',
      sub: 'بوابتك بتبني الأنظمة والتطبيقات والأتمتة اللي بتشيل الشغل اليدوي من على فريقك، وبتسلّمها شغّالة، مش سلايدات.',
      ctaPrimary: 'احجز استشارة مجانية',
      ctaSecondary: 'شوف أعمالنا',
      trustLabel: 'أرقام بوابتك',
      trust1: 'مشروع مسلّم',
      trust2: 'أسابيع متوسط التسليم',
      trust3: 'شهور دعم بعد التسليم',
    },
    menu: {
      note: 'استشارة 20 دقيقة مجانية، من غير أي التزام.',
    },
  },

  en: {
    meta: {
      title: 'Bawabtak | Software and automation that runs your business without you',
      description:
        'Bawabtak is an Egyptian software house building web and mobile apps, process automation and system integrations, and AI agents. Delivered working, not as slides. Book a free 20-minute call.',
    },
    brand: {
      name: 'Bawabtak',
    },
    a11y: {
      skip: 'Skip to content',
    },
    nav: {
      label: 'Main navigation',
      services: 'Services',
      process: 'Process',
      work: 'Work',
      pricing: 'Pricing',
      faq: 'FAQ',
      cta: 'Book a call',
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
    },
    lang: {
      switch: 'التبديل إلى العربية',
    },
    hero: {
      title: 'Software and automation that runs your business without you',
      sub: 'We build the systems, apps, and automations that take manual work off your team. Delivered working, not as slides.',
      ctaPrimary: 'Book a free call',
      ctaSecondary: 'See our work',
      trustLabel: 'Bawabtak in numbers',
      trust1: 'projects delivered',
      trust2: 'weeks average delivery',
      trust3: 'months of post-launch support',
    },
    menu: {
      note: 'A free 20-minute call, no commitment.',
    },
  },
};

const root = document.documentElement;

function lookup(obj, path) {
  let node = obj;
  for (const part of path.split('.')) {
    if (node == null || typeof node !== 'object' || !(part in node)) return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

export function current() {
  return root.lang === 'en' ? 'en' : 'ar';
}

export function t(key, lang = current()) {
  const value = lookup(dict[lang], key);
  if (value !== undefined) return value;
  const fallback = lookup(dict.ar, key);
  return fallback !== undefined ? fallback : key;
}

export function readStored() {
  try {
    const value = localStorage.getItem(LANG_KEY);
    return LANGS.includes(value) ? value : null;
  } catch (error) {
    return null;
  }
}

export function store(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch (error) {
    /* private mode or storage disabled: the choice simply does not persist */
  }
}

export function apply(lang) {
  if (!LANGS.includes(lang)) lang = 'ar';

  root.lang = lang;
  root.dir = lang === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const value = lookup(dict[lang], el.dataset.i18n);
    if (value !== undefined) el.textContent = value;
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const index = pair.indexOf(':');
      if (index === -1) return;
      const attr = pair.slice(0, index).trim();
      const key = pair.slice(index + 1).trim();
      if (!attr || !key) return;
      const value = lookup(dict[lang], key);
      if (value !== undefined) el.setAttribute(attr, value);
    });
  });

  root.removeAttribute('data-i18n-pending');
  document.dispatchEvent(new CustomEvent('bawabtak:langchange', { detail: { lang } }));
}

export function setLang(lang) {
  store(lang);
  apply(lang);
}

export function toggle() {
  setLang(current() === 'ar' ? 'en' : 'ar');
}

/* Called once on boot. The inline head script already set lang/dir when a
   stored choice exists; here we swap the strings to match and lift the veil. */
export function init() {
  const stored = readStored();
  const lang = stored || current();
  if (lang !== 'ar' || root.hasAttribute('data-i18n-pending')) {
    apply(lang);
  } else {
    root.removeAttribute('data-i18n-pending');
  }
}
