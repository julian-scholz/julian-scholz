# julian-scholz.dev

Personal one-page website (book recommendations, vita, favorites, legal modals).
German is the source locale at `/`, English is served at `/en`.

## Stack

- Angular 22, zoneless (`provideZonelessChangeDetection`), signals, standalone components, `inject()`
- Static prerender (`prerender: true`, `ssr: false`), no hydration
- `@angular/localize` with `$localize`/`i18n` and explicit `@@ids`
- Tailwind CSS v4 via PostCSS, configured in `src/styles.css` (no tailwind config file)
- GSAP 3 with ScrollTrigger, imported only via `src/app/lib/misc/gsap/gsap.ts`
- Node version from `.nvmrc`, TypeScript ~6.0
- Hosting: Cloudflare Pages (`wrangler.toml`), Pages Function `functions/_middleware.ts` (TypeScript, bundled by Cloudflare on deploy)

## Commands

- `npm start` / `npm run start:en`: dev server (de / en)
- `npm run build`: runs the tests, then the production build of both locales, then `postbuild.js` runs
- `npm run lint`: ESLint (TypeScript, Angular templates, `better-tailwindcss`)
- `npm run extract-i18n`: updates `src/locale/messages.json`
- `npm test`: type-checks `functions` and `test` with `tsc` (Cloudflare only transpiles the functions), then vitest with `@cloudflare/vitest-plugin`, runs `test/**/*.test.ts` in the Workers runtime (currently the CSP middleware). It runs as `prebuild`, so a failing test stops the Cloudflare deploy. There are no Angular tests; the vitest target in `angular.json` is not set up
- The husky pre-commit hook runs lint-staged (`ng lint --fix` on staged `.ts`/`.html`)

## Build and deploy

- `i18nMissingTranslation: "error"`: every new or changed text needs its entry in `src/locale/messages.en.json`, otherwise the build fails
- `postbuild.js` does the following:
  - deletes `index.csr.html`
  - deletes the root-only files (`_headers`, `404.html`, `robots.txt`, `sitemap.xml`) from `/en`
  - copies `3rdpartylicenses.txt` to `licenses.txt`
  - sets `<lastmod>` in the sitemap
- `optimization.styles.inlineCritical` is `false` on purpose, so no large inline style tag ends up in the head
- Budgets: initial bundle warns at 650 kB; component styles warn at 2 kB, so styles belong in Tailwind classes or `src/styles.css`
- Images and fonts come from `https://assets.julian-scholz.dev` (`environment.assetsUrl`). That host is the separate repo `~/repositories/julian-scholz-assets`, with WebP files in `1920w`/`2560w` variants, loaded through `NgOptimizedImage` with `dynamicWidth`

## Security

- The CSP is set in `functions/_middleware.ts`. It replaces `DUMMY_NONCE_VALUE` (`ngCspNonce` in `src/index.html`) with a nonce per request. Static headers live in `src/_headers`
- `test/middleware.test.ts` asserts the exact CSP string, so an intended CSP change has to update the test too
- Do not loosen or extend the CSP without explicit approval. New external hosts, inline handlers or `eval`-like code break it
- Never commit or deploy licensed stock originals (e.g. `AdobeStock_*`); only derived, optimized files are allowed
- The legal texts (`src/app/modals/contents/*`) are based on eRecht24. The English versions are the project's own translations and must not be copied from other sites

## Conventions

- Tailwind classes go in multi-line `class` strings, wrapped as `better-tailwindcss` enforces. Run lint after template changes
- `src/styles.css` does the following:
  - resets colors and fonts in `@theme`, so only the defined tokens exist (`dark-void*`, `vanilla*`, `snow`)
  - defines keyframes inside `@theme`
  - defines reusable effects as `@utility`
  - defines the custom variants `dark`, `short` (max-height 500px) and `tv-floating` (portrait favorites layout)
- Icons use the project's own `app-icon` (`src/app/lib/icon`) with FontAwesome `IconDefinition`s imported per icon, not an icon library component
- Shared UI lives in `src/app/lib` (e.g. `app-shelf`, used by the book recommendations and the favorites tv)
- Keep comments minimal. Write them only where the code is otherwise unclear, and never base them on unverified browser-bug theories
- Fix problems at their root, with explicit code at the place of the cause. No global observers or workarounds
- Effects stay subtle and tied to content

## Favorites zoom (non-obvious)

- The tv zoom runs as CSS `position: sticky` plus Web Animations on a `ViewTimeline`. ScrollTrigger only switches the channel at 60 % and rebuilds the zoom on refresh
- The zoom animates the registered variables `--favorites-zoom-offset`/`--favorites-zoom-scale` (utility `favorites-zoom` in `src/styles.css`), not `transform`. Safari (26.4+) runs scroll-driven `transform` animations in its scrolling process, which made the zoom jump on iPhone whenever scrolling started. The variables keep it on the main thread, at the price of about 60 fps on ProMotion devices, which was accepted. Do not switch the keyframes back to `transform`
- Browsers without `ViewTimeline` get no zoom; there the channel follows the tv-on state
- ScrollTrigger refreshes on resize by itself. If content above the section changes height without a resize, call `ScrollTrigger.refresh()` right where that happens, not through a global observer
- Safari on iPhone is the critical target and cannot be tested locally. Name such changes as unverified
