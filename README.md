# PIONEER Medical Wear - Storefront

Premium, quiet-luxury Egyptian medical scrub storefront engineered for high-converting Meta Ads (mobile in-app browsers). Features pure CSS variables (no runtime compiler), responsive WebP assets, native on-site checkout with live shipping rates, Meta Conversions API (CAPI) deduplication, and bilingual Arabic/English i18n.

---

## 1. Local Development

You can serve the repository locally with any static HTTP server:

```bash
# Using Node.js npx
npx serve .

# Or using Python 3
python -m http.server 3000
```

Open `http://localhost:3000` in your mobile-emulated browser (390×844).

---

## 2. Environment Variables (Vercel)

Configure the following environment variables in your Vercel Project Settings (`Settings` → `Environment Variables`):

| Variable | Description |
| :--- | :--- |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot token used to send instant order alerts and abandoned-checkout leads. |
| `TELEGRAM_CHAT_ID` | Telegram Chat ID / Channel ID receiving alerts. |
| `META_CAPI_TOKEN` | Meta Conversions API Access Token (System User token from Meta Business Manager with ads_management access). |

> **Note:** Never commit tokens or secrets to git. The serverless functions `/api/order.js`, `/api/notify.js`, and `/api/capi.js` access these variables securely on Vercel at runtime.

---

## 3. How to Update Prices, Inventory & Shipping via Google Sheets CMS

The storefront automatically syncs with the Google Apps Script spreadsheet endpoint:
`https://script.google.com/macros/s/AKfycbyxQt-QQQmcOIaA0d713LnPhhRm4P0HB1Qgzed1RbpPo1P6ipOBh-irib_FjhHAi1orLQ/exec?action=get_data`

### Updating Prices
In your Google Sheet under the **Prices** tab:
- `basePrice`: Single set price (default: `900` EGP).
- `twoPiecesPrice`: Two sets bundle price with complimentary express delivery (default: `1800` EGP).
- Rule: 3+ sets are automatically computed in code as `qty * (twoPiecesPrice / 2 - 50)`.

### Updating Stock & Available Sizes
Under the **Inventory** tab:
- Set active size arrays per color key (`black`, `navy`, `blue`, `olive`, `teal`, `pink`).
- Example: `["M", "L", "XXL"]`.
- Any size not listed in the array will remain visible with an out-of-stock slash and disabled state.

### Updating Shipping Rates
Under the **ShippingRates** tab:
- Map governorates to fees in EGP (e.g. `{"القاهرة": 45, "الجيزة": 45, "الإسكندرية": 50}`).
- The checkout modal live-computes shipping and total upon governorate selection.
- If 2+ sets are ordered, shipping is automatically waived as complimentary express.

### Updating Announcement Bar
Under the **Announcement** tab:
- Set `active`: `true` or `false`.
- Set `text`: Your announcement message.

---

## 4. Architecture & Key Files

- `index.html`: Semantic, accessible HTML with responsive hero `<picture>` and inline SVG icons.
- `styles.css`: Pure CSS variables (`--bg`, `--surface`, `--ink`, `--muted`, `--hairline`, `--accent`) with logical properties for seamless RTL/LTR mirroring.
- `app.js`: Client application logic with non-blocking 4s CMS timeout, localStorage cache, deep linking (`?color=navy`), size calculator, and on-site checkout.
- `api/order.js`: Serverless order submission with honeypot anti-spam, IP rate limiting, Google Sheets write, and Telegram notification.
- `api/capi.js`: Serverless Meta Conversions API forwarder with SHA-256 phone hashing and `event_id` deduplication.
- `api/notify.js`: Hardened Telegram alert endpoint with input sanitization and length capping.
- `reviews.json`: Customer reviews data (kept hidden until verified customer reviews with consent are confirmed).
- `shipping-returns.html`, `privacy.html`, `contact.html`: Standalone accessible policy pages for Meta Ads compliance.
- `images/`: High-performance WebP and JPG fallback product images with 3:4 aspect crops.
