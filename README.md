# PayPerPlay Starter Kit

Starter kit for fast Next.js projects with:

- **Design system**: configurable tokens (colors, fonts, spacing)
- **SEO essentials**: metadata defaults, JSON-LD helper, `sitemap`, `robots`, OG/Twitter images
- **Branding basics**: favicon/icon, logo, open graph images, manifest
- **AI rules + commands**: conventions + workflows to improve AI output

## How to Use the Starter Kit

1. Clone / Download the repo
2. Install dependencies

```bash
npm install
```

3. Run the development server

```bash
npm run dev
```

Open `http://localhost:3000`.

## What’s included

- **Pre-configured Next.js + Tailwind CSS setup**
- **Component structure ready for AI generation**
  - `src/components/ui/*` for UI primitives
  - `src/components/brand/*` for brand components
  - `src/components/seo/*` for SEO helpers
- **Design system with easy color/font customization**
  - Tokens live in `src/app.config.ts`
  - Token mapping lives in `src/app/globals.css`
- **SEO essentials**
  - Global defaults live in `src/app/layout.tsx`
  - `src/app/sitemap.ts` and `src/app/robots.ts`
  - OpenGraph/Twitter image routes in `src/app/*-image.tsx`
- **Branding**
  - `public/logo.svg`
  - Icons via `src/app/icon.tsx` + `src/app/apple-icon.tsx`
  - Web manifest via `src/app/manifest.ts`

## AI rules + commands

- Rules live in `AI_RULES.md`.
- Reusable AI workflows live in `.windsurf/workflows/`.

## Customization

- **Site name/URL/description**: `src/app.config.ts`
- **Theme colors (light/dark)**: `src/app.config.ts` tokens
- **SEO defaults**: `src/app/layout.tsx`
