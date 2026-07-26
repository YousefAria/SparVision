# SparVision Website

A responsive Swedish link-in-bio landing page for [@sparvision.official](https://www.instagram.com/sparvision.official/).

## Open locally

Double-click `index.html`, or run a local server:

```bash
npx --yes serve .
```

## Files

- `index.html` — semantic page content and metadata
- `styles.css` — responsive SparVision visual system
- `script.js` — mobile menu, sticky header, reveal motion, current year
- `assets/sparvision-official-logo-2026.jpg` — official supplied SparVision brand logo

## Publishing

Production website: [https://sparvision.vercel.app](https://sparvision.vercel.app)

The `main` branch is connected to Vercel. Every push to GitHub automatically creates a production deployment with HTTPS.

## Contact form backend

The homepage contact form posts to `/api/contact`, which sends mail through Resend.

Required environment variables on Vercel:

- `RESEND_API_KEY` — your Resend API key
- `RESEND_FROM_EMAIL` — a verified sender address from Resend, for example `SparVision <onboarding@resend.dev>` while testing
- `CONTACT_TO_EMAIL` — the inbox that should receive the form submissions (use `yousef_aria@yahoo.se`)

Optional spam / form controls:

- `CONTACT_TO_EMAIL` is optional in code because it defaults to `yousef_aria@yahoo.se`, but setting it explicitly is recommended.
- The form already includes a hidden honeypot field and server-side validation.
