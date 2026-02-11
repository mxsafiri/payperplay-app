---
description: Add a new route using Next.js App Router
---

1. Create a new folder under `src/app/<route>`.
2. Add `page.tsx`.
3. Add `export const metadata` if the route needs a custom title/description.
4. Prefer a server component unless client interactivity is required.
5. Use existing `components/ui/*` primitives.
