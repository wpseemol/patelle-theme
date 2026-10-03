# PATÉLLE theme — progress tracker

Keep this file current. Newest work log entries go at the top of **Work log**.

Figma file: [Product Landing Page Design](https://www.figma.com/design/RZhucKZlvKMarF3ex69k9B/Product-Landing-Page-Design)

## Status by page

| Page | Template | Figma node | Status | Notes |
|---|---|---|---|---|
| Header (all pages) | `sections/header-group.json` | — | Done | Glass overlay header on every page; ink colors off the homepage; image-card submenu panels; flyout speed 240ms |
| Home | `templates/index.json` | 35-30 (hero card), 82-567 / 82-571 (seasonal), 137-587 (single product) | Done | GSAP hero slider, Shop All, Seasonal ×2, Collage, More to Love, Single product, News strip, Brand banner, Quality promise |
| Shop / collection | `templates/collection.json` | 232-738 | Done | Shop hero, grid, why-shop |
| Product | `templates/product.json` | 117-14 | Built from screenshot, needs Figma check | See **Product page to-do** |
| About | `templates/page.about.json`, `templates/page.json` | 143-696 | Built from screenshot, needs Figma check | Shows on handle `about` with either template; images to upload |
| Contact | `templates/page.contact.json` | 171-592, 171-741 (love), 171-765 (promise) | Done | Page must use template `page.contact` |
| Footer (all pages) | `sections/footer-group.json` | — | Done | Retailers strip is its own section above the footer |
| Product card | `snippets/patelle-card.liquid` | 82-425 / 82-426 | Done | Styles: `overlay`, `catalog`, `stacked` |
| Custom cursor | `snippets/patelle-cursor.liquid` | — | Done | Theme settings → Custom cursor |

Status values: **Not started**, **In progress**, **Built from screenshot, needs Figma check**, **Done**.

## Open to-do

### Access and setup
- [ ] Share the Figma file with `wpseemol@gmail.com` (edit access) so Cursor can read exact spacing and text. Right now every Figma request fails with "no edit access".
- [ ] Note the store domain here for `shopify theme dev`: `________.myshopify.com`

### Product page to-do
- [ ] Compare the live product page with Figma node 117-14 once Figma access works.
- [ ] Replace placeholder text in the theme editor: reels heading "Real Results", "Key Notes", scent chips, note details, the 5 quality promise labels.
- [ ] Upload at least 5 product images (first = large image, next 4 = 2×2 grid).
- [ ] Add reel posters and video links, key note images, video section poster, promise background photo.
- [ ] Install Judge.me and add its Review Widget block to the Rating & Reviews section. Then remove the 4 sample reviews.
- [ ] Create the product metafields listed in `README.md` and fill them per product.
- [ ] Quantity is capped by stock only (no fixed limit of 3 anymore). For the cap to work, turn on **Track quantity** for each variant in Shopify admin and leave **Continue selling when out of stock** off. Update the **Quantity note** ("Up to 3 Save 20%") in Product main if the offer changes.

### About page to-do
- [ ] Upload images in the theme editor: About hero images 1–5, About story image, About banner image.
- [ ] Compare with Figma node 143-696 once Figma access works (spacing and exact text).

### Header to-do
- [ ] Theme editor → Header → the 3 **Menu image card** blocks: upload an image and set the link for New Arrivals, Best Sellers and Gift Sets (links point to `/collections/all` for now). Add cards for other menu items by typing their name in **Menu item**.
- [ ] Fine-tune **Header → Open and close speed** in the theme editor if 240ms feels too quick or too slow.

### Known issues (not caused by recent work)
- [ ] `sections/hero-banner.liquid`: 6 `ImgWidthAndHeight` theme check errors (missing width and height on `<img>`).
- [ ] `sections/header.liquid`: 51 settings, over Shopify's recommended 40 (warning only).
- [ ] `sections/patelle-product-reels.liquid` is no longer used on the product page (reels moved into Product main). Keep or delete.

## Work log

### 2026-10-03
- Product page quantity: the 1–3 dropdown is replaced by a pill stepper (minus button, number field, plus button) in **Product main** (`sections/patelle-product-main.liquid`, `assets/patelle-product.css`, `assets/patelle-product.js`). It follows the variant's Shopify quantity rules (minimum, maximum, increment); with no maximum set there is no upper limit. Typed values are corrected on change. The maximum also follows stock: when Shopify tracks inventory and "continue selling when out of stock" is off, + stops at the variant's available quantity, and the limit updates when the shopper switches variants.
- Header submenu new design: **Panel design → Links with image cards** (default) shows the submenu links on the left and up to 3 image cards on the right. Cards come from new **Menu image card** blocks in the header (menu item name, image, title, link); without blocks, collection and product links use their featured images. **Links only** keeps the old panel. New `snippets/patelle-header-card.liquid`; card styles in `assets/patelle-header.css`. Three sample cards added under Shop (New Arrivals, Best Sellers, Gift Sets).
- Header submenu (flyout) opens faster: hover delay 120ms → 60ms, **Open and close speed** 420ms → 240ms (schema min lowered to 120ms), panel and link fade start without the extra 60–90ms wait, link stagger 22ms → 12ms. Mobile drill-in panels tightened the same way (`assets/patelle-header.css`, `assets/patelle-header.js`, `sections/header-group.json`, `sections/header.liquid`).
- Header: overlay position on every page (`overlay_mode: all`). Pages other than home use the solid ink colors (`pt-header--overlay-ink`) so text stays readable.
- About page (143-696) rebuilt from the Figma browser view (Figma MCP still reports "no edit access"): hero with 5-image fan, story with feature note, Vision and Value (4 blocks), brand banner (`patelle-about-banner`), trust strip with icons (`patelle-about-trust`). Sections also live in `templates/page.json`, shown only on the `about` page handle; `main-page` hides its default title and content there.

### 2026-09-29
- Product page rebuilt to follow Figma 117-14 (from a screenshot, Figma not readable):
  - Gallery is now a large image over a 2×2 grid; clicking a grid image swaps it into the large slot.
  - Reels, scent chips, key notes and a two-column notes list moved into the buy column as blocks of **Product main**.
  - Reviews: summary on page background, 3 photos per card, prev/next arrows plus Load More (2 per page).
  - Quality promise: frosted glass panel with 5 items. You May Also Like: left title, View All button, overlay cards.
  - Shared reel markup moved to `snippets/patelle-product-reel.liquid`.
- Product card (`patelle-card`) sharpened to match Figma 82-426; price shown without trailing zeros.
- Custom cursor added (Dossier-style character that follows the pointer, 5 characters).
- README added. Store is connected to GitHub: pushing to `main` updates the connected theme.
- Added this tracker and `AGENTS.md`.

### 2026-09-28
- Seasonal section: image and content blocks, left/right card position, content padding options.
- More to Love: 3 or 4 columns, card image fix.
- News strip: image and content blocks, alignment, background, border, image height and focal point.
- Spacing control (padding or margin) added to sections.
- Brand banner: content as blocks. Footer retailers moved to a new `patelle-retailers` section.
- New home sections: Single product (137-587, Figtree outline words) and a block-based section (137-524).
- Hero slider: more slides. Contact page: Contact love, Brand banner fix, Contact promise.

### 2026-09-27
- Header made the same on every page, glass background, white-to-black text on scroll.

### 2026-09-21
- Shop / collection page built (232-738). First version of the product detail page (117-14).
- Shop All padding options, Seasonal section, footer logo section and spacing options.

### 2026-09-20
- Header glass redesign, GSAP hero slider (bottle, splash, petals, background word animations).
- Home product card glass style, Shop All and following sections.
- About page (143-696) and Contact page (171-592) built.
