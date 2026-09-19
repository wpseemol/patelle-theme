# Repository Guidelines

This is a Shopify Online Store 2.0 theme: Shopify **Dawn 16.0.0** plus a custom **PATÉLLE** landing-page layer. Assets are served as-is — there is no build step or package manager.

## Project Structure & Module Organization

- `layout/theme.liquid` — document shell; loads `base.css` and Dawn's global scripts.
- `sections/` — one file per section; custom ones are `hero-slider.liquid`, `hero-banner.liquid`, and `patelle-*.liquid`.
- `snippets/` — reusable partials, e.g. `patelle-card.liquid`.
- `templates/*.json` — section/block assignments; `index.json` composes the landing page.
- `assets/` — CSS, JS, and SVG. Custom files are prefixed `patelle-*`; shared design tokens live in `assets/patelle-base.css`.
- `config/` — `settings_schema.json` (editor schema), `settings_data.json` (editor state).
- `locales/` — `en.default.json` plus `en.default.schema.json` for schema labels.
- `photos/` — design references only, not theme assets.

## Build, Test, and Development Commands

Requires Shopify CLI 3.x and store access.

```bash
shopify theme dev --store <store>.myshopify.com   # local preview with hot reload
shopify theme check                               # lint Liquid and schemas
shopify theme push --unpublished --theme patelle-dev
shopify theme pull                                # sync theme-editor setting changes
```

## Coding Style & Naming Conventions

- Indent Liquid, CSS, and JSON with 2 spaces; match the surrounding file (`patelle-hero-slider.*` uses 4).
- Prefix custom CSS classes with `pt-` and follow BEM: `.pt-hs__card`, `.pt-brand__heading`; modifiers as `is-active` or `pt-h2--center`.
- Scope styles to a section root (e.g. `.pt-hs`) and pass per-instance values as CSS custom properties.
- Register custom elements as `pt-<name>` or `patelle-<name>` (`<pt-header>`, `<pt-hero-slider>`, `<patelle-tabs>`) behind a `customElements.get()` guard.
- Declare a section's CSS/JS in the section file, not `theme.liquid`: `{{ 'patelle-hero-slider.css' | asset_url | stylesheet_tag }}`.
- Dawn sections use `t:` keys from `locales/en.default.schema.json`; PATÉLLE sections keep plain English labels.

## Testing Guidelines

No automated suite exists. Validate with `shopify theme check`, then review each change in `shopify theme dev` at mobile/desktop widths and in the theme editor. Check keyboard focus and honor `prefers-reduced-motion`; GSAP sections fall back to no-animation.

## Commit & Pull Request Guidelines

History uses short imperative subjects with no prefixes or ticket IDs:

```
Add Hero Slider section with GSAP animations and customizable settings
```

Keep each commit scoped to one section or feature. PRs should describe the change, list templates/URLs to review, link related issues, and include before/after screenshots for visual work. Confirm `shopify theme check` passes. `config/settings_data.json` holds theme-editor state — re-`pull` and resolve conflicts instead of hand-editing it.

## Security & Configuration Tips

- Never commit credentials or API tokens; authenticate through `shopify theme dev`.
- Add new customer-facing strings to `en.default.json` and `en.default.schema.json`.
- Bump `theme_version` in `config/settings_schema.json` for notable releases.
