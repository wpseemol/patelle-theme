# Agent guide — PATÉLLE Shopify theme

Custom Shopify theme on Dawn 16. Designs come from the Figma file linked in `PROGRESS.md`.

## Track every task

At the end of every task that changes files:

1. Add a dated entry at the top of **Work log** in `PROGRESS.md` (what changed, which section or page, Figma node if any).
2. Update the **Status by page** table and tick or add items under **Open to-do**.
3. Put anything the store owner must still do in the admin or theme editor (images, text, apps) under **Open to-do**.

## Before editing

- Run `git status` and `git fetch`. The GitHub repo syncs both ways with the live theme; theme editor edits arrive as "Update from Shopify for theme …" commits. Pull first so `templates/*.json` and `config/settings_data.json` edits are not overwritten.
- Figma: extract `fileKey` and `node-id` from the URL. If the Figma tools say "no edit access", say so and work from screenshots; mark the page "Built from screenshot, needs Figma check" in `PROGRESS.md`.

## Conventions

- Custom files use the `patelle-` prefix: `sections/patelle-*.liquid`, `assets/patelle-*.css|js`, `snippets/patelle-*.liquid`.
- CSS classes use the `pt-` prefix (`pt-pdp-*` on the product page). Shared tokens, `.pt-wrap`, `.pt-pill`, `.pt-h2` and `.pt-glass` live in `assets/patelle-base.css`.
- Every section renders `patelle-section-spacing` and exposes the **Spacing control** setting (padding or margin) like the existing sections.
- Make content editable: repeated items are blocks, text and images are settings. Product-specific text reads a `custom.*` metafield first and falls back to the section setting.
- Reuse `snippets/patelle-card.liquid` for product cards instead of new card markup.
- Scripts that several sections include must be safe to load more than once (guard flag plus delegated event listeners).

## Before finishing

- Run `shopify theme check` and fix offenses in files you touched. Existing errors in `sections/hero-banner.liquid` are known.
- Check layout at desktop and phone widths when a preview is available.
- Do not commit or push unless asked. Pushing to `main` updates the connected Shopify theme.
