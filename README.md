# Frillian — Portfolio

Personal portfolio site built for the **Apple Developer Academy** application.

Computer Science student at BINUS University · Software Engineer Intern at Qpro ·
Basketball content creator behind [@drillian_basketball](https://www.instagram.com/drillian_basketball/).

**Live:** _add the Vercel URL here once deployed_

---

## Stack

Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies —
the repository is the deployable artifact.

```
index.html            the whole page
assets/css/style.css  design tokens, layout, responsive rules
assets/js/main.js     theme, reveals, counters, cursor, parallax
assets/img/           photography
```

## Features

- Light / dark theme, follows the system on first visit and remembers the choice
- Scroll-triggered reveals with staggered timing
- Animated counters for the impact numbers
- Rotating role line in the hero
- Magnetic buttons and an eased custom cursor on pointer devices
- Sticky nav with scroll progress and active-section tracking
- Fully responsive, from 320px up
- `prefers-reduced-motion` is respected throughout — every animation is disabled

## Running it locally

No tooling required. Open `index.html` in a browser.

If you would rather serve it over HTTP:

```bash
python -m http.server 8000
```

Then visit <http://localhost:8000>.

## Deploying to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import this repository.
2. Framework preset: **Other**. Leave the build command and output directory empty.
3. Deploy.

Every push to `main` redeploys automatically.

## Adding the portrait

The hero expects a photo at `assets/img/frillian.jpg` — portrait orientation,
roughly 4:5, ideally around 900×1125px. Until that file exists the hero shows a
monogram fallback instead, so the page never looks broken.
