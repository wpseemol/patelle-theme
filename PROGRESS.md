# PATÉLLE theme — progress tracker

Keep this file current. Newest work log entries go at the top of **Work log**.

Figma file: [Product Landing Page Design](https://www.figma.com/design/RZhucKZlvKMarF3ex69k9B/Product-Landing-Page-Design)

## Status by page

| Page | Template | Figma node | Status | Notes |
|---|---|---|---|---|
| Header (all pages) | `sections/header-group.json` | — | Done | Glass header; white text over hero, black after scroll |
| Home | `templates/index.json` | 35-30 (hero card), 82-567 / 82-571 (seasonal), 137-587 (single product) | Done | GSAP hero slider, Shop All, Seasonal ×2, Collage, More to Love, Single product, News strip, Brand banner, Quality promise |
| Shop / collection | `templates/collection.json` | 232-738 | Done | Shop hero, grid, why-shop |
| Product | `templates/product.json` | 117-14 | Built from screenshot, needs Figma check | See **Product page to-do** |
| About | `templates/page.about.json` | 143-696 | Done | Page must use template `page.about` |
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

### Known issues (not caused by recent work)
- [ ] `sections/hero-banner.liquid`: 6 `ImgWidthAndHeight` theme check errors (missing width and height on `<img>`).
- [ ] `sections/header.liquid`: 48 settings, over Shopify's recommended 40.
- [ ] `sections/patelle-product-reels.liquid` is no longer used on the product page (reels moved into Product main). Keep or delete.

## Work log

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
