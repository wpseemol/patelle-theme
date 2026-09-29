# PATÉLLE Shopify Theme

Custom Shopify theme for **PATÉLLE**, a fragrance brand. Built on top of [Dawn 16.0.0](https://github.com/Shopify/dawn), with a custom set of `patelle-*` sections, styles and scripts that follow the PATÉLLE Figma designs.

## Pages

| Page | Template | Sections |
|---|---|---|
| Home | `templates/index.json` | `hero-slider`, `hero-banner`, `patelle-shop-all`, `patelle-seasonal`, `patelle-collage`, `patelle-more-to-love`, `patelle-single-product`, `patelle-news-strip`, `patelle-brand-banner`, `patelle-quality-promise` |
| Shop (collection) | `templates/collection.json` | `patelle-shop-hero`, `patelle-shop-grid`, `patelle-shop-why` |
| Product | `templates/product.json` | `patelle-product-main`, `patelle-product-reels`, `patelle-product-video`, `patelle-product-reviews`, `patelle-product-promise`, `patelle-product-related` |
| About | `templates/page.about.json` | `patelle-about-hero`, `patelle-about-story`, `patelle-about-values`, `patelle-about-banner`, `patelle-about-trust` |
| Contact | `templates/page.contact.json` | `patelle-contact-hero`, `patelle-contact-panel`, `patelle-contact-love`, `patelle-brand-banner`, `patelle-contact-promise` |

To use the About and Contact layouts, create a page in Shopify admin and set its theme template to `page.about` or `page.contact`.

## Project structure

```
assets/      CSS, JS and SVG files (custom files are prefixed with patelle-)
config/      Theme settings schema and saved settings
layout/      theme.liquid and password.liquid
locales/     Translation strings
sections/    Dawn sections plus custom patelle-* sections
snippets/    Reusable Liquid partials (patelle-card, patelle-section-spacing, ...)
templates/   JSON page templates
```

Each `patelle-*` section loads its own stylesheet (for example `patelle-product.css`) together with the shared `patelle-base.css`. Most sections have a **Spacing control** setting to switch between padding and margin.

## Development

Requirements: [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) and access to the store.

```bash
# Preview locally with hot reload
shopify theme dev --store your-store.myshopify.com

# Lint Liquid, JSON and schema
shopify theme check

# Upload as a new unpublished theme
shopify theme push --unpublished --store your-store.myshopify.com

# Pull changes made in the theme editor back into the repo
shopify theme pull --store your-store.myshopify.com
```

Settings changed in the theme editor are saved to `config/settings_data.json` and `templates/*.json`. Run `shopify theme pull` before committing so those edits are not overwritten on the next push.

## Product page setup

### Product metafields

Product-specific details come from product metafields. When a metafield is empty, the page falls back to the value set in the theme editor, so every product still renders.

Create these in **Settings → Custom data → Products**:

| Metafield | Type | Used for |
|---|---|---|
| `custom.short_description` | Multi-line text | Tagline under the product title |
| `custom.gender` | Single line text | "Gender" row |
| `custom.inspired_by` | Single line text | "Inspired By" row |
| `custom.inspired_retail` | Single line text | Retail price shown next to "Inspired By" |
| `custom.scent_family` | Multi-line text | "Scent Family" row |
| `custom.scent_intensity` | Single line text | Intensity label, e.g. "Powerful" |
| `custom.intensity_level` | Integer (1–4) | Number of filled intensity bars |
| `custom.product_video` | File (video) | Video in the product video section |

### Reviews

The theme reads Shopify's standard review metafields, `reviews.rating` and `reviews.rating_count`, for the stars on the product page and on product cards. Any review app that syncs to these metafields will work. [Judge.me](https://apps.shopify.com/judgeme) is recommended.

1. Install the review app and enable its sync to Shopify metafields.
2. In the theme editor, open the product template.
3. In the **Rating & Reviews** section, click **Add block** and choose the app's review widget.

When an app block is added, the sample review blocks are hidden and the "Write a customer review" button scrolls to the app widget. Turn off **Show rating summary** if the app shows its own summary. The **PATÉLLE — Product main** section also accepts app blocks, which appear below the Add to Cart button.

## Credits

- Base theme: [Dawn](https://github.com/Shopify/dawn) by Shopify
