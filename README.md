# بوابتك / Bawabtak

Bilingual landing page. Arabic right-to-left is the source of truth; the English
page is generated from it. Plain HTML, CSS and JavaScript modules. No framework,
no bundler, no runtime dependencies, and no third-party requests at all.

Upload the repository as it stands. Only `_dev/` is not meant to ship.

## Layout

```
index.html            Arabic page, and the source every other artefact derives from
en/index.html         generated, do not edit
css/  tokens base components sections fonts     (fonts.css is generated)
js/   i18n main hero-grid
assets/  fonts/  logo-*.webp  favicon.png  og.png
build/i18n-build.mjs  builds en/ and writes the SEO head into both pages
_dev/                 generators and preview pages, not part of the site
```

## The three generators

Run them from the project root. Each one owns its output; editing the output by
hand is how the two languages fall out of step.

| Command | Owns |
| --- | --- |
| `python _dev/build_copy.py` | every visible string, in both languages |
| `node build/i18n-build.mjs` | `en/index.html`, canonical, hreflang, JSON-LD |
| `python _dev/fetch_fonts.py` | `assets/fonts/*.woff2` and `css/fonts.css` |
| `python _dev/make_og.py` | `assets/og.png` |

Copy changes go through `_dev/build_copy.py`, which refuses to build on an Arabic
diacritic or an Egyptian colloquialism, then `node build/i18n-build.mjs` to carry
the change into the English page.

Set the domain when you build for production, or canonical and hreflang will
point at the placeholder:

```bash
SITE_URL=https://your-domain node build/i18n-build.mjs
```

## Preview

```bash
python -m http.server 8123
```

## Before launch

Everything below is marked `PLACEHOLDER` in the markup.

- `data-endpoint` on `#contactForm`. Until it is set the form validates, refuses
  to claim it sent anything, and points people at WhatsApp instead.
- The WhatsApp number, currently `wa.me/000000000000` in three places.
- The email address and the LinkedIn URL in the footer.
- `SITE_URL` for the build.
- The prices, 500 and 1,900 USD, converted from the brief's Egyptian pounds.
- The hero figures 40+, 6 and 3.
- The testimonials section is a set of empty slots. Fill it or delete it.
- Client names, sectors and case-study links for the work section.
- The privacy policy page does not exist yet.

## House rules

Read `css/tokens.css` first; it holds the whole system and the reasoning.

- Four primitives make every surface: the datum line and its notch, the recessed
  gateway, the engineering floor, and one accent. Nothing else gets invented.
- Logical CSS properties only. No `left`, `right`, `margin-left` anywhere.
- Colours, spacing, radii, durations come from tokens. No raw values.
- Only `transform`, `translate` and `opacity` animate. The scroll reveal uses
  `translate` so it never fights a hover lift on `transform`; a component with
  its own `transition` list that becomes a reveal child must merge `opacity` and
  `translate` into it (see `.card`), or it loses the fade and the stagger.
- The readout inside the hero gate is decorative and gated: off below 900px,
  asleep off screen or in a hidden tab, static under reduced motion. Its rows
  are the automation stages' own dictionary keys, so it never needs its own
  copy. The headline never waits on motion.
- Arabic copy is Modern Standard, with no diacritics.
