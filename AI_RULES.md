# PayPerPlay Starter Kit — AI Rules

This file is a **project contract** for AI-assisted coding.
Follow these rules to keep output consistent with the starter kit.

## Tech stack
1. Use **Next.js App Router** under `src/app`.
2. Use **TypeScript** everywhere.
3. Use **Tailwind CSS v4** utilities.
4. Use the design tokens from `src/app.config.ts`.
5. Prefer server components by default.
6. Use client components only when needed (`"use client"`).

## Directory structure
7. Routes live in `src/app/*`.
8. Reusable UI primitives live in `src/components/ui/*`.
9. Brand components live in `src/components/brand/*`.
10. SEO components live in `src/components/seo/*`.
11. Generic helpers live in `src/lib/*`.
12. Global config lives in `src/app.config.ts`.

## Design system / tokens
13. Do not hardcode colors in components; use token-based classes.
14. Prefer `bg-background`, `text-foreground`, `border-border`, `bg-card`, etc.
15. Use `text-muted-foreground` for secondary text.
16. Use `bg-muted` for subtle surfaces.
17. Use `ring-ring` for focus rings.
18. Use `rounded-[var(--ds-radius-md)]` (or `ui` components that already do).
19. If you need a new token, add it to `src/app.config.ts` and map it in `src/app/globals.css`.
20. Keep the token names stable; update values rather than renaming.
21. Keep tokens **light/dark** symmetric.

## Component conventions
22. Keep UI primitives “dumb” (presentation-first).
23. Prefer composition over prop explosion.
24. Expose `className` on components.
25. Use the `cn()` helper from `src/lib/cn.ts` to merge classNames.
26. Keep `components/ui/*` dependency-free (no heavy libraries).
27. Avoid adding component-specific global CSS.
28. Use semantic HTML elements.
29. Buttons: default `type="button"` unless it’s a form submit.
30. Forms: keep input styling consistent using `Input`.

## SEO
31. Use Next.js `metadata` for titles/descriptions.
32. Default SEO comes from `src/app/layout.tsx` + `src/app.config.ts`.
33. Use `src/app/sitemap.ts` and `src/app/robots.ts` for crawl controls.
34. Prefer `metadataBase` + relative OG URLs.
35. When creating new pages, set `export const metadata` if the page needs custom title/description.
36. Use `JsonLd` component for structured data when needed.

## JSON-LD
37. Keep JSON-LD objects minimal and correct.
38. Use stable `@id` URLs when possible.
39. Do not include personally identifiable information in JSON-LD.

## Data fetching
40. Prefer server-side data fetching in server components.
41. Use `fetch()` with proper caching:
    - For static content: default caching.
    - For frequently changing content: `cache: "no-store"`.
42. Avoid client-side fetching unless interactivity requires it.

## Accessibility
43. All interactive elements must be keyboard accessible.
44. Use visible focus styles (already supported by tokens).
45. Add `aria-*` attributes when semantics are not obvious.

## Performance
46. Avoid large client bundles.
47. Do not add heavy UI frameworks unless explicitly requested.
48. Prefer `next/image` when rendering external images.

## Code style
49. Keep files small and focused.
50. Do not introduce unused exports.
51. Avoid premature abstraction.
52. Keep naming consistent: `PascalCase` components, `camelCase` functions.

## Editing rules
53. When changing tokens, update:
    - `src/app.config.ts`
    - `src/app/globals.css` mapping
54. When adding a new `ui` component, ensure it composes tokens.
55. When adding a new route, include SEO considerations.

## “How to use” reminders
56. Install: `npm install`
57. Dev: `npm run dev`
58. Build: `npm run build`
59. Lint: `npm run lint`
