# Cap Fahmy — MVP

Async coaching foundation for **Cap Fahmy** (Ahmed Fahmy). Slogan: *Strong today, Independent tomorrow*.

## Run locally

No build step. Open `index.html` in a browser, or from this folder:

```bash
# PowerShell
Start-Process index.html
```

Or serve statically if you prefer:

```bash
npx serve .
```

## What’s included

| Piece | Status |
| --- | --- |
| One-page site (EN primary, AR toggle) | Done |
| Philosophy, process, session structure, about | Done |
| Tiered pricing with EGP / USD toggle | Done (placeholder amounts) |
| Waiver-gated onboarding | Done (blocks until signed) |
| Intake questionnaire | Done (saved to `localStorage`) |
| Movement screen upload UI | Done (local file picker; no server yet) |
| InstaPay as single local payment path | Done (manual confirm MVP) |
| WhatsApp handoff CTA | Done (replace phone placeholder) |

## Before you go live

1. Replace `wa.me/20XXXXXXXXXX` in `onboard.html` with your real WhatsApp number.
2. Set real InstaPay handle / instructions in the payment step copy (`i18n.js`).
3. Confirm pricing amounts in `app.js` (`TIERS`).
4. Have a lawyer review the waiver text.
5. Wire intake → Google Sheet / n8n and secure video upload when ready.

## Explicitly not in this MVP

- Live 1:1 video coaching
- Multi-gateway payments
- AI workout personas
- Countdown / scarcity upsells
