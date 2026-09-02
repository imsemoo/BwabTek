/* ==========================================================================
   بوابتك - static English build + shared SEO head

   index.html is the Arabic source of truth. This script derives en/index.html
   from it so the English page is real HTML for crawlers and for anyone who
   lands on the URL directly, rather than something JavaScript assembles.

   It also writes the parts of <head> that differ per page and per language:
   canonical, hreflang, JSON-LD and the Open Graph locale.

   Run:  node build/i18n-build.mjs
         SITE_URL=https://your-domain node build/i18n-build.mjs
   ========================================================================== */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { dict } from '../js/i18n.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* PLACEHOLDER: set SITE_URL before launch. Canonical, hreflang and every URL in
   the structured data are built from it, so a wrong value here is worse than an
   obviously fake one. */
const PLACEHOLDER = 'https://bawabtak.example';
const SITE = (process.env.SITE_URL || PLACEHOLDER).replace(/\/+$/, '');
if (SITE === PLACEHOLDER) {
  console.warn(`! SITE_URL is still ${PLACEHOLDER}. Set it before deploying.`);
}

const MARK_OPEN = '<!-- SEO:START -->';
const MARK_CLOSE = '<!-- SEO:END -->';

const lookup = (lang, path) =>
  path.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict[lang]);

const escapeAttr = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const escapeText = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------------------------------------------------------------- head block
   One JSON-LD graph per page: who we are, what we sell, the questions we
   answer, and where the page sits. The FAQ entries are generated from the same
   dictionary the accordion renders, so the two can never disagree. */
function seoBlock(lang) {
  const isArabic = lang === 'ar';
  const pageUrl = isArabic ? `${SITE}/` : `${SITE}/en/`;
  const t = (key) => lookup(lang, key);

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE}/#organization`,
        name: t('brand.name'),
        alternateName: lang === 'ar' ? dict.en.brand.name : dict.ar.brand.name,
        url: `${SITE}/`,
        logo: `${SITE}/assets/logo-full.webp`,
        description: t('footer.aboutText'),
      },
      {
        '@type': 'ProfessionalService',
        '@id': `${SITE}/#service`,
        name: t('brand.name'),
        url: pageUrl,
        image: `${SITE}/assets/og.png`,
        description: t('meta.description'),
        parentOrganization: { '@id': `${SITE}/#organization` },
        areaServed: 'Worldwide',
        availableLanguage: ['ar', 'en'],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: t('services.title'),
          itemListElement: ['a', 'b', 'c', 'd', 'e', 'f'].map((letter) => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: t(`services.${letter}1`),
              description: t(`services.${letter}2`),
            },
          })),
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: [1, 2, 3, 4, 5, 6].map((n) => ({
          '@type': 'Question',
          name: t(`faq.q${n}`),
          acceptedAnswer: { '@type': 'Answer', text: t(`faq.a${n}`) },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('brand.name'), item: pageUrl },
        ],
      },
    ],
  };

  return [
    MARK_OPEN,
    `  <link rel="canonical" href="${SITE}/${isArabic ? '' : 'en/'}">`,
    `  <link rel="alternate" hreflang="ar" href="${SITE}/">`,
    `  <link rel="alternate" hreflang="en" href="${SITE}/en/">`,
    `  <link rel="alternate" hreflang="x-default" href="${SITE}/">`,
    `  <meta property="og:url" content="${pageUrl}">`,
    `  <meta property="og:image" content="${SITE}/assets/og.png">`,
    '  <meta property="og:image:width" content="1200">',
    '  <meta property="og:image:height" content="630">',
    `  <meta property="og:image:alt" content="${escapeAttr(t('brand.name'))}">`,
    `  <script type="application/ld+json">${JSON.stringify(graph)}<\/script>`,
    MARK_CLOSE,
  ].join('\n');
}

/* -------------------------------------------------------------- translation */
function translate(html, lang) {
  let missing = [];

  html = html.replace(
    /(<[a-zA-Z0-9]+[^>]*\sdata-i18n="([^"]+)"[^>]*>)([^<]*)(<\/)/g,
    (whole, open, key, body, close) => {
      const value = lookup(lang, key);
      if (value === undefined) {
        missing.push(key);
        return whole;
      }
      return open + escapeText(value) + close;
    }
  );

  html = html.replace(/<[a-zA-Z0-9]+[^>]*\sdata-i18n-attr="[^"]+"[^>]*>/g, (tag) => {
    const pairs = tag.match(/data-i18n-attr="([^"]+)"/)[1];
    for (const pair of pairs.split(';')) {
      const index = pair.indexOf(':');
      if (index === -1) continue;
      const attr = pair.slice(0, index).trim();
      const key = pair.slice(index + 1).trim();
      const value = lookup(lang, key);
      if (value === undefined) {
        missing.push(key);
        continue;
      }
      tag = tag.replace(
        new RegExp(`(\\s${attr}=")[^"]*(")`),
        (_, head, tail) => head + escapeAttr(value) + tail
      );
    }
    return tag;
  });

  if (missing.length) {
    throw new Error(`keys missing from the ${lang} dictionary: ${[...new Set(missing)].join(', ')}`);
  }
  return html;
}

/* --------------------------------------------------------------------- run */
/* Read as LF whatever the checkout did, so the head rewrites below match. */
const source = readFileSync(resolve(ROOT, 'index.html'), 'utf8').replace(/\r\n/g, '\n');

if (!source.includes(MARK_OPEN)) {
  throw new Error(`index.html is missing the ${MARK_OPEN} / ${MARK_CLOSE} pair in <head>`);
}

const replaceSeo = (html, lang) =>
  html.replace(
    new RegExp(`${MARK_OPEN}[\\s\\S]*?${MARK_CLOSE}`),
    () => seoBlock(lang)
  );

/* Arabic: same file, refreshed head */
const arabic = replaceSeo(source, 'ar');
writeFileSync(resolve(ROOT, 'index.html'), arabic);

/* English: translated, re-rooted one directory down, language locked to the URL */
let english = translate(arabic, 'en');
english = replaceSeo(english, 'en');
english = english
  .replace('<html lang="ar" dir="rtl">', '<html lang="en" dir="ltr" data-lang-locked>')
  .replace('<meta property="og:locale" content="ar_EG">', '<meta property="og:locale" content="en_US">')
  .replace('<meta property="og:locale:alternate" content="en_US">', '<meta property="og:locale:alternate" content="ar">')
  .replace(/(href|src)="(assets|css|js)\//g, '$1="../$2/')
  /* the hero paints in Inter here, so preload those faces instead */
  .replace(
    /  <link rel="preload" href="\.\.\/assets\/fonts\/alexandria-600-arabic[^>]*>\n  <link rel="preload" href="\.\.\/assets\/fonts\/alexandria-400-arabic[^>]*>/,
    '  <link rel="preload" href="../assets/fonts/inter-600-latin.woff2?v=1" as="font" type="font/woff2" crossorigin>\n' +
      '  <link rel="preload" href="../assets/fonts/inter-400-latin.woff2?v=1" as="font" type="font/woff2" crossorigin>'
  )
  /* in-page anchors keep working; the language bootstrap is not wanted here */
  .replace(
    /  <!-- Language bootstrap[\s\S]*?<\/script>\n\n/,
    '  <!-- No language bootstrap on this page: the URL declares the language. -->\n\n'
  );

mkdirSync(resolve(ROOT, 'en'), { recursive: true });
writeFileSync(resolve(ROOT, 'en/index.html'), english);

console.log(`site      ${SITE}`);
console.log(`index.html  head refreshed  ${arabic.length} bytes`);
console.log(`en/index.html generated     ${english.length} bytes`);
