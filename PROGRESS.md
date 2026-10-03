# PATÉLLE theme — progress tracker

Keep this file current. Newest work log entries go at the top of **Work log**.

Figma file: [Product Landing Page Design](https://www.figma.com/design/RZhucKZlvKMarF3ex69k9B/Product-Landing-Page-Design)

## Status by page

| Page | Template | Figma node | Status | Notes |
|---|---|---|---|---|
| Header (all pages) | `sections/header-group.json` | — | Done | Glass overlay header on every page; ink colors off the homepage; image-card submenu panels; flyout speed 160ms; hover-to-expand search field with live results; glass cart preview on bag hover and glass added-to-cart popup |
| Home | `templates/index.json` | 35-30 (hero card), 82-567 / 82-571 (seasonal), 137-587 (single product) | Done | GSAP hero slider, Shop All, Seasonal ×2, Collage, More to Love, Single product, News strip, Brand banner, Quality promise |
| Shop / collection | `templates/collection.json` | 232-738 | Done | Measured from the Figma presentation view: hero, tile grid with wide cards, why-shop. Needs cut-out bottle photos for the exact look |
| Product | `templates/product.json` | 117-14 | Built from screenshot, needs Figma check | Reels play in a floating on-page player; product video plays inline. See **Product page to-do** |
| About | `templates/page.about.json`, `templates/page.json` | 143-696 | Built from screenshot, needs Figma check | Shows on handle `about` with either template; images to upload |
| Contact | `templates/page.contact.json` | 171-592, 171-741 (love), 171-765 (promise) | Done | Page must use template `page.contact` |
| Footer (all pages) | `sections/footer-group.json` | — | Done | Retailers strip is its own section above the footer |
| Product card | `snippets/patelle-card.liquid` | 82-425 / 82-426 | Done | Styles: `overlay`, `catalog`, `stacked` |
| Custom cursor | `snippets/patelle-cursor.liquid` | — | Done | Theme settings → Custom cursor |
| Search | `templates/search.json` | 137-156 (style reference) | Built from screenshot, needs Figma check | `patelle-search` section: filters, sort, PATÉLLE cards, empty state with popular products |
| Cart, blog, article, collections list, pages, account | Dawn templates | — | Built from screenshot, needs Figma check | Restyled by `assets/patelle-dawn.css` (Theme settings → PATÉLLE style) |

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
- [ ] Reels 2 and 3 have no video yet, so their tiles do nothing on click. Upload each reel to Shopify (Content → Files) and pick it in Product main → Reel → **Shopify-hosted video**. Vertical (9:16) videos fill the floating player best; a regular wide YouTube video shows with black bars. YouTube Shorts links also fill it.
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
- [ ] Theme editor → Header → the 3 **Menu image card** blocks: upload an image (or pick a collection) and set the link for New Arrivals, Best Sellers and Gift Sets (links point to `/collections/all` for now). Add cards for other menu items with **Show under menu item**.
- [ ] Shopify admin: create the Men, Unisex, Best Sellers, New Arrivals and Gift Sets collections and link them in the main menu (most Shop submenu links are `#` now). "New Arrivels" in the menu is misspelled.
- [ ] Fine-tune **Header → Open and close speed** in the theme editor if 160ms feels too quick or too slow.
- [ ] Live search: Shopify returns "Vanila Rebal" for every search term, even nonsense words. Check **Search & Discovery** app → product boosts or synonyms in Shopify admin and remove the rule that pins it. Vanila Rebal also shows a price of $0.00; set its price.

### Theme settings to-do
- [ ] **Currency codes** is on, so prices now read "$22.00 USD" on PATÉLLE pages too. Turn off Theme settings → Currency format → Currency codes for "$22.00".
- [ ] Page width is 1400px. Try other values in Theme settings → Layout → Page width; the design was drawn at about 1400px.

### Shop page to-do
- [ ] For the exact Figma look, give each product a cut-out bottle photo (transparent or white background). Either create the product metafield **custom.card_image** (type: File, image) and fill it per product, or make the cut-out the first (featured) product image. Products with lifestyle photos show them as rounded pictures in the card.
- [ ] Add compare-at prices to products to show the struck-through "was" price as in Figma.
- [ ] The Men and Women filter pills both point to the `woman` collection; pick the right collections in Shop hero → Filter pill blocks. Unisex, Best Sellers and New Arrivals have no collection yet.
- [ ] The Why section features all use the heart icon (as in Figma). Pick Delivery, Shopping, Secure or Support per feature in the theme editor if preferred.

### Site-wide style to-do
- [ ] Search filters show only what Shopify offers by default (availability, price). Add product type, vendor or tag filters in the **Search & Discovery** app → Filters. They appear on the search page automatically.
- [ ] Check the blog and article pages once a blog post exists (the News blog is empty, so the article cards were not seen).
- [ ] The 404 page could not be previewed locally (the CLI dev server returns a 502 error). Check it on the live theme. Gift card and password pages use their own layouts and still have the Dawn look.
- [ ] Shop hero and You May Also Like titles use `rem` sizes, which come out smaller under Dawn's 10px root size. Switch them to px if they look small next to the Figma design.
- [x] Finish the merge of `sections/header-group.json` (committed).
- [ ] Every product is sold out, so the added-to-cart popup and a filled cart preview were checked with sample data only. Once a product has stock, add it to the cart and check both on the live theme.

### Audit follow-ups (need a decision)
- [ ] Product cards show a 4.8 star rating on every product when it has no reviews (`snippets/patelle-card.liquid`, `snippets/patelle-card-tile.liquid`). Shoppers may read it as real reviews. Either install a reviews app (fills `reviews.rating`) or hide the stars when there is no rating.
- [ ] `sections/hero-banner.liquid`, `assets/hero-banner.css` and `assets/hero-slider.js` are an old slider that is disabled on the homepage (its 50/100 ml buttons do nothing). Delete them and the `hero_banner` entry in `templates/index.json` if it won't come back.
- [ ] Contact form shows a US flag that looks like a country picker but always sends `country_code=US` (`sections/patelle-contact-panel.liquid`). Make it a real select or remove it.
- [ ] Footer and the homepage hero slider have no Spacing control setting; `hero-slider.liquid` also lacks the `patelle-` prefix.
- [ ] Some product page text is fixed English (breadcrumbs, spec labels, "Save", "Quantity:", reel player buttons). Move it to settings or translations if the store needs another language.
- [ ] Shopify admin → Online Store → Preferences: the homepage title reads "PATELEY — The Perfume House…"; check the spelling.
- [ ] Footer **Quick links** and **Support** menus only contain "Search". Fill them in Online Store → Navigation.

### Known issues (not caused by recent work)
- [ ] `sections/header.liquid`: 53 settings, over Shopify's recommended 40 (warning only).
- [ ] Global settings that still only affect Dawn's own sections (cart, search results, account, blog pages), not the PATÉLLE sections, by design: **Colors** (color schemes), **Buttons**, **Variant pills**, **Inputs**, **Product/Collection/Blog cards**, **Content containers**, **Media**, **Badges**, **Typography → font size scale**, **Layout → Section spacing / Grid spacing**, **Animations**. The PATÉLLE sections take these from their own section settings to match Figma. Wire any of them up if the store owner asks. While **Theme settings → PATÉLLE style → Use PATÉLLE style on Dawn pages** is on, `assets/patelle-dawn.css` also overrides Colors, Buttons, Inputs and card corners on those Dawn pages; turn it off to use the Dawn settings again.
- [ ] `sections/patelle-product-reels.liquid` is no longer used on the product page (reels moved into Product main). Keep or delete.

## Work log

### 2026-10-03
- Theme audit and fixes (theme check 35 → 29 offenses, 0 errors; the rest are warnings: Google Fonts and GSAP links, unused Dawn header snippets, Dawn's own files):
  - **Add to cart** on the search page, Shop All and More to Love now opens the cart popup instead of jumping to `/cart` (`product-form.js` was missing).
  - **Shop All (homepage)**: shoppers no longer see "Assign a collection — Pick one for the 'Man' tab in the theme editor". Tabs without products are hidden on the live store and still show in the theme editor. Tabs now use arrow-key focus properly, and `patelle-tabs.js` no longer errors when loaded twice.
  - **Spacing control** is now respected: margins only apply when the section's Spacing control is set to Margin (all 29 sections). About and Contact sections no longer add spacing on pages where they are hidden.
  - **Alt text**: the product video poster and the Shop "Why" image lost their alt text because of how the fallback was written; fixed.
  - **Search page**: "Remove all" keeps search terms with `&`, `#` or `+`; filter values are escaped.
  - **Prices** after a variant change format correctly for every Shopify money format (comma, apostrophe and space separators, thousands groups).
  - **Screen readers**: the cart count now says "3 items" after an update instead of just "3". Star ratings and the About/Contact photo fans got proper roles.
  - Glass: the floating reel player now has glass control buttons and a glass rim on the video card. `AGENTS.md` notes the header panels as the one exception (they use the header's own glass).
  - Smaller fixes: contact email link escaped, hero slider custom font URL made safe, "Inspired by: " spacing, card review count reads the metafield value, `hero-banner` images use `image_tag` (fixes the 6 theme check errors) and no longer error without a product, cursor script guarded against loading twice, product tabs keyboard handler can't crash.
  - Files: `sections/patelle-search.liquid`, `sections/patelle-shop-all.liquid`, `sections/patelle-more-to-love.liquid`, `assets/patelle-tabs.js`, `snippets/patelle-section-spacing.liquid` plus the render line in every `sections/patelle-*.liquid`, `sections/patelle-product-video.liquid`, `sections/patelle-shop-why.liquid`, `assets/patelle-product.js`, `assets/patelle-product.css`, `sections/header.liquid`, `assets/patelle-header.js`, `sections/patelle-product-reviews.liquid`, `snippets/patelle-card.liquid`, `sections/patelle-about-*.liquid`, `sections/patelle-contact-*.liquid`, `sections/patelle-footer.liquid`, `sections/patelle-single-product.liquid`, `sections/hero-slider.liquid`, `sections/hero-banner.liquid`, `assets/patelle-cursor.js`, `AGENTS.md`.
  - Not checked in the browser: the local preview started redirecting to the store password page partway through. Restart `shopify theme dev` and enter the store password, then check the homepage Shop All tabs, search page add to cart and the product page.
- Cart and popups:
  - **Cart preview on hover**: hovering the header bag on desktop opens a glass panel. It lists each cart item (photo with a quantity badge, name, variant, line price) and the estimated total, with **View cart** and **Check out** buttons. When the cart is empty it shows "Your cart is empty" and a **Continue shopping** button.
  - Clicking the bag still opens the cart page. The panel updates after every add to cart and also opens with keyboard focus; Esc closes it. Phones and tablets keep the plain bag link.
  - New setting: **Header → Show cart preview on hover** (on).
  - **Glass popups everywhere**: one popup glass style in `assets/patelle-base.css` (`.pt-popup-glass` and the `--pt-popup-*` tokens: frosted white, 30px blur, light rim, 24px corners). It is used by:
    - the added-to-cart popup;
    - the cart preview;
    - the cart drawer;
    - Dawn's quick-add and product popup modals;
    - the country/language list;
    - the search page filter dropdowns.
  - The added-to-cart popup was restyled inside: Inter text, black check badge, round close button, product row in a soft glass card, pill **View cart** (glass) and **Check out** (black) buttons, underlined "Continue shopping".
  - New rule in `AGENTS.md`: every popup uses the glass style.
  - Files: `sections/header.liquid`, `assets/patelle-header.js`, `assets/patelle-header.css`, `assets/patelle-base.css`, `assets/patelle-dawn.css`, `AGENTS.md`.
- Shop / collection page rebuilt to match Figma 232-738. The Figma tools still say "no edit access", so sizes were measured in pixels from the Figma presentation view (1440 frame, content 1240px):
  - **Product grid**: new **Tiles** card design (now the default in Shop grid → Card design). White 398 × 394 cards with 16px corners and 24px gaps, 3 columns. Each card has the rating with a gold star at the top left and a round heart button at the top right. The bottle is centered, the name is uppercase, and the price row shows the struck-through compare-at price before the price, with a round bag (add to cart) button at the bottom right. **Wide cards** (new setting, on): the 1st and 6th card of every 7 span two columns with a taller bottle, like Figma. Tablets show 2 columns and phones 2 smaller columns, with the first card of each group full width. Products per page now 14 (range 6–48). Add to cart now uses the cart pop-up instead of reloading the page (`product-form.js` was missing).
  - The card photo uses the product metafield `custom.card_image` (a cut-out bottle) if set, otherwise the featured image. Lifestyle photos show as rounded pictures inside the card.
  - **Hero**: sans "Products" title (54px), 16px text, white 52px pills with a light border (active pill black), background `#f4f0ef`. **Top padding** now works (it was overridden before).
  - **Why Customers Choose Patelle**: same background as the page, sans 48px title, new **Text** setting under the title, features stacked (icon in a 40px circle, title, text) in two columns, image 530 × 622. New **Heart** icon option (used now, as in Figma).
  - Shop content width is capped at the Figma 1240px (it still gets narrower if Theme settings → Page width is smaller).
  - Files: `snippets/patelle-card-tile.liquid` (new), `snippets/patelle-card.liquid`, `assets/patelle-card.css`, `sections/patelle-shop-grid.liquid`, `sections/patelle-shop-hero.liquid`, `sections/patelle-shop-why.liquid`, `assets/patelle-shop.css`, `templates/collection.json`.
- Product page (Product main): when a product has only one image, the image now stays in view (sticky, under the header) on desktop while the long details column scrolls, instead of leaving a large empty space below it. New setting **Images → Keep images in view while scrolling (desktop)**: Only when the product has one image (default), Always, or Off. Phones are unchanged (`sections/patelle-product-main.liquid`, `assets/patelle-product.css`).
- Fixed every page showing "Failed to Upload Theme Files — Invalid JSON in sections/header-group.json". Pulling the theme editor commit left git conflict markers in the file. Kept Shopify's version (blocks listed first, `match_page_width`) and added back `menu_position: "2"` on the 3 menu image cards (`sections/header-group.json`).
- Dawn's default look removed from the rest of the site, so every page now uses the PATÉLLE style (Figma 137-156 homepage as reference, built from the store owner's screenshot because Figma still reports "no edit access"):
  - **Search page** is a new PATÉLLE section, `sections/patelle-search.liquid` (replaces Dawn's `main-search` in `templates/search.json`). It has a cream hero with a serif title, a pill search field and the result count. Filter chips open dropdowns (checkboxes or a price range, shown as a bottom sheet on phones) and there is a sort menu, plus active filter tags with "Remove all". Results use the PATÉLLE product card, with an "Articles & pages" list underneath and round page buttons. With no results it shows a "Popular right now" grid. Settings cover texts, products per page, card design, columns, vendor tagline, filtering, sorting, and the popular collection and count (`assets/patelle-search.css`, `assets/patelle-search.js`).
  - **Product cards everywhere**: Dawn's `snippets/card-product.liquid` now shows the PATÉLLE card (`patelle-card`) in any Dawn section (featured collection, related products, cart drawer suggestions and others). Horizontal cards are left as they are.
  - **Theme settings → PATÉLLE style** (new group): **Use PATÉLLE style on Dawn pages**, **Use PATÉLLE product cards in Dawn sections**, **Card design** (Overlay or Catalog) and **Card tagline**. Turn either checkbox off to go back to the Dawn look.
  - New `assets/patelle-dawn.css` restyles Dawn pages (cart, blog, article, collections list, standard pages, account pages, 404, search) and the cart drawer. It covers the cream background and ink text, the Inter body font and serif page titles, black pill buttons, white rounded fields, 16px card corners with hover zoom, badges, and round pagination. The page decides through a `pt-dawn` body class set in `layout/theme.liquid`. The cart pop-up keeps the glass style from the header.
  - Collections list page: a single collection no longer stretches into one giant card (CSS grid instead of Dawn's full-width rule).
  - Product card titles now use Inter instead of picking up Dawn's heading font (`assets/patelle-card.css`).
  - Files: `sections/patelle-search.liquid`, `assets/patelle-search.css`, `assets/patelle-search.js`, `templates/search.json`, `snippets/card-product.liquid`, `assets/patelle-dawn.css`, `assets/patelle-card.css`, `layout/theme.liquid`, `config/settings_schema.json`, `config/settings_data.json`.
- Product page → **PATÉLLE — Product related** (You May Also Like) got **Left / right padding (desktop)** (default 11px, which lines up with the other product page sections) and **Left / right padding (phone)** (default 16px). Before, the grid ran wider than the sections above it and touched the screen edges on phones (`sections/patelle-product-related.liquid`, `assets/patelle-product.css`).
- Product page videos now play on the site instead of opening YouTube in a new tab (Figma 117-14, built from the store owner's reference screenshot):
  - **Real Results reels** (Product main → Reel blocks): clicking a reel opens a floating vertical player at the bottom right of the page, with close (×, also Esc) and up/down buttons to go to the previous or next reel. The page stays usable behind it. On phones the player is smaller and sits bottom right too.
  - Reel blocks got a **Shopify-hosted video** setting (best option). **Video link** also plays on the page for YouTube (also Shorts), Vimeo, TikTok, Instagram reels and direct .mp4 links. Any other link shows "This video can’t play here" with a Watch video button.
  - **Product video** section: the **External video link** (YouTube, Vimeo, .mp4) now plays inside the section frame (16:9 while playing) instead of a new tab. A link alone, without a poster image, also works.
  - Fixed: the Product video frame was wider than the screen on phones (its minimum height pushed the width out), causing sideways scrolling.
  - Files: `snippets/patelle-product-reel.liquid`, `sections/patelle-product-main.liquid`, `sections/patelle-product-reels.liquid`, `sections/patelle-product-video.liquid`, `assets/patelle-product.js`, `assets/patelle-product.css`.
- Menu image card: **Show under menu item** is now a dropdown (Every menu item with a dropdown, 1st–8th menu item, or Match by name). The name field only shows with "Match by name". The 3 sample cards use 2nd menu item (Shop) (`sections/header.liquid`, `sections/header-group.json`).
- Header over the homepage hero: the script now finds the hero section on every scroll update and after theme editor section changes, instead of once at page load. Before, editing or moving sections in the theme editor could leave the text in the wrong color (white over light content, or dark over the hero) until a reload (`assets/patelle-header.js`).
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
