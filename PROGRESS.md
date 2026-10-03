# PATÉLLE theme — progress tracker

Keep this file current. Newest work log entries go at the top of **Work log**.

Figma file: [Product Landing Page Design](https://www.figma.com/design/RZhucKZlvKMarF3ex69k9B/Product-Landing-Page-Design)

## Status by page

| Page | Template | Figma node | Status | Notes |
|---|---|---|---|---|
| Header (all pages) | `sections/header-group.json` | — | Done | Glass overlay header on every page; ink colors off the homepage; image-card submenu panels; flyout speed 160ms; hover-to-expand search field with live results |
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
- [ ] Create metaobject definitions **Fragrance note** (`name`, `image`) and **FAQ** (`question`, `answer`), then the product metafields `custom.highlight_notes` and `custom.faqs` that point to them. Fill notes, accords, top/heart/base notes, ingredients, about text and disclaimer per product. Until then every product shows the same theme editor content.
- [ ] Review the starter text in the product info tabs and the 8 FAQ answers (Product main → Info tab / FAQ question blocks). Concentration, longevity, made in France and cruelty-free answers were taken from existing site copy; confirm they are accurate.
- [ ] Tab text is the same on every product. For per-product text (About The Fragrance, Ingredients, notes), connect product metafields to those settings with the dynamic source button in the theme editor.
- [ ] Quantity is capped by stock only (no fixed limit of 3 anymore). For the cap to work, turn on **Track quantity** for each variant in Shopify admin and leave **Continue selling when out of stock** off. Update the **Quantity note** ("Up to 3 Save 20%") in Product main if the offer changes.

### About page to-do
- [ ] Upload images in the theme editor: About hero images 1–5, About story image, About banner image.
- [ ] Compare with Figma node 143-696 once Figma access works (spacing and exact text).

### Header to-do
- [ ] Theme editor → Header → the 3 **Menu image card** blocks: upload an image (or pick a collection) and set the link for New Arrivals, Best Sellers and Gift Sets (links point to `/collections/all` for now). Add cards for other menu items by typing their name in **Menu item**.
- [ ] Shopify admin: create the Men, Unisex, Best Sellers, New Arrivals and Gift Sets collections and link them in the main menu (most Shop submenu links are `#` now). "New Arrivels" in the menu is misspelled.
- [ ] Fine-tune **Header → Open and close speed** in the theme editor if 160ms feels too quick or too slow.
- [ ] Live search: Shopify returns "Vanila Rebal" for every search term, even nonsense words. Check **Search & Discovery** app → product boosts or synonyms in Shopify admin and remove the rule that pins it. Vanila Rebal also shows a price of $0.00; set its price.

### Theme settings to-do
- [ ] **Currency codes** is on, so prices now read "$22.00 USD" on PATÉLLE pages too. Turn off Theme settings → Currency format → Currency codes for "$22.00".
- [ ] Page width is 1400px. Try other values in Theme settings → Layout → Page width; the design was drawn at about 1400px.

### Known issues (not caused by recent work)
- [ ] `sections/hero-banner.liquid`: 6 `ImgWidthAndHeight` theme check errors (missing width and height on `<img>`).
- [ ] `sections/header.liquid`: 52 settings, over Shopify's recommended 40 (warning only).
- [ ] Global settings that still only affect Dawn's own sections (cart, search results, account, blog pages), not the PATÉLLE sections, by design: **Colors** (color schemes), **Buttons**, **Variant pills**, **Inputs**, **Product/Collection/Blog cards**, **Content containers**, **Media**, **Badges**, **Typography → font size scale**, **Layout → Section spacing / Grid spacing**, **Animations**. The PATÉLLE sections take these from their own section settings to match Figma. Wire any of them up if the store owner asks.
- [ ] `sections/patelle-product-reels.liquid` is no longer used on the product page (reels moved into Product main). Keep or delete.

## Work log

### 2026-10-03
- Theme settings fixes (audit of global settings against the PATÉLLE sections):
  - **Layout → Page width** now sets the width of every PATÉLLE section (`--pt-max` in `assets/patelle-base.css`, fed from `layout/theme.liquid`). Shop, About, Product, Contact and the homepage single product section keep their narrower design widths as a share of the page width. The header got **Match page width** (on by default) so the logo and icons line up with the content; turn it off to use the header's own **Content width**. Tested at 1400px and 1000px.
  - **Typography → PATÉLLE sections font** (new): Inter (design, default), or the theme's Body or Heading font. Inter is only loaded when it is used.
  - **Currency format → Currency codes** now applies to PATÉLLE prices (product card, product page price and variant switching, header search).
  - **Search behavior**: header live search follows **Enable search suggestions**, **Show product vendor** and **Show product price**. **Show product price** was switched on in `config/settings_data.json` so search keeps showing prices.
  - **Cart → Cart type → Drawer**: the header bag icon now opens the cart drawer instead of going to the cart page.
  - **Social media**: Pinterest, Snapchat, Tumblr and Vimeo links now show in the PATÉLLE footer (before only TikTok, Instagram, X, Facebook, YouTube).
  - Files: `layout/theme.liquid`, `config/settings_schema.json`, `config/settings_data.json`, `assets/patelle-base.css`, `assets/patelle-shop.css`, `assets/patelle-about.css`, `assets/patelle-product.css`, `assets/patelle-contact.css`, `assets/patelle-single-product.css`, `sections/header.liquid`, `assets/patelle-header.js`, `assets/patelle-header.css`, `snippets/patelle-card.liquid`, `sections/patelle-product-main.liquid`, `sections/patelle-footer.liquid`.
- Header search redesigned: new **Search opens → Expanding field on hover** (now the default). Hovering the search icon grows it into a glass pill field to the left (same glass as the icons) and focuses it, so shoppers can type right away. Live results open in the glass panel below; the panel's own field is hidden in this mode. The pill sizes itself to the space beside the nav; on narrow desktops (about 1100–1250px) the nav pill fades out while the field is open. Moving the mouse away from an empty field closes it; Esc clears it. Phones and tablets keep the tap-to-open glass panel. **Glass panel on click** and **Search page** are still available (`sections/header.liquid`, `assets/patelle-header.js`, `assets/patelle-header.css`, `sections/header-group.json`).
- Header submenu opens faster again: hover delay 60ms → 30ms, **Open and close speed** 240ms → 160ms (schema minimum 80ms), link and card stagger 12ms + 30ms → 6ms per item with no start delay (`assets/patelle-header.css`, `assets/patelle-header.js`, `sections/header-group.json`).
- Menu image card blocks (Header → Add block → Menu image card) got **Collection**, **Product** and **Button text** settings. Empty image, title and link fill from the collection, then the product. On the live store a card with no image shows a product photo (first products of the catalog) instead of the grey placeholder; the theme editor still shows the placeholder so it is clear which cards need an image (`sections/header.liquid`).
- Header search shows live results while typing: after a 250ms pause it asks Shopify's predictive search for up to 4 products, plus query suggestions and collections, and shows them under the search field (photo, title, price), with a "Search for “…”" link to the full results page. Older requests are cancelled when the shopper keeps typing, repeat searches come from a cache, and the quick links come back when the field is cleared. Two columns of results on phones (`sections/header.liquid`, `assets/patelle-header.js`, `assets/patelle-header.css`). Also fixed the search panel running about 14px past the right edge on phones.
- Pages other than home no longer hide content under the header: when the header overlays the page, `#MainContent` gets top padding equal to the header height, except on pages whose first section already allows for the header (Shop hero, About hero, Contact hero, Product main, marked with `pt-under-header`). Fixes search, cart, account, blog and other Dawn pages (`sections/header.liquid` plus those 4 sections).
- Header submenu and search panel: the panel background now starts at the top of the screen, so the dimmed strip above the bar is gone (`assets/patelle-header.css`).
- Product card (overlay style, used on Home Shop All, More to Love, You May Also Like and Shop grid): the photo now sits in its own 4:5 frame above the info panel instead of under it, so the bottle is no longer covered or heavily cropped; a blurred copy of the photo tints the panel. Titles stay on one line with "…" (full title on hover and on the product page). Slight zoom on hover. This "fit" layout is now the default; a section can still pass `fit_image: false` for the old full-bleed tile (`snippets/patelle-card.liquid`, `assets/patelle-card.css`, `assets/patelle-more-to-love.css`).
- Shop / collection grid now uses the same **overlay** product card as the homepage (name, tagline, stars and Add to Cart / Sold Out over the image), 4 columns on desktop. New Shop grid settings: **Card design** (Overlay or Catalog), **Columns on desktop** (3 or 4), **Vendor tagline**, **Show full product image** (`sections/patelle-shop-grid.liquid`, `assets/patelle-shop.css`).
- Product page tabs read product metafields first: `custom.scent_accords`, `custom.highlight_notes` (Fragrance note metaobjects), `custom.top_notes`, `custom.heart_notes`, `custom.base_notes`, `custom.ingredients`, `custom.about_fragrance`, `custom.disclaimer`, `custom.faqs` (FAQ metaobjects). Empty metafields fall back to the theme editor blocks. Info tab blocks got a **Product metafield** setting; tabs with no content hide. Tab markup moved to `snippets/patelle-product-tabs.liquid`. Metafield list in `README.md`.
- Product page info tabs (built from screenshots): scent chips, key notes and note details now sit in a **Fragrance Notes** tab, followed by **Info tab** blocks (About The Fragrance, High-Concentration EDP, 15-Day Satisfaction Guarantee, FAQ, Disclaimer & Safety Notice). The FAQ tab shows **FAQ question** blocks as a +/− accordion. Pill tabs with arrow-key support; selecting a tab or FAQ block in the theme editor opens it. Key notes restyled as white 80px circles under "Highlight Notes:", details stacked (Top, Heart, Base Notes, Ingredients). Files: `sections/patelle-product-main.liquid`, `assets/patelle-product.css`, `assets/patelle-product.js`, `templates/product.json`.
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
