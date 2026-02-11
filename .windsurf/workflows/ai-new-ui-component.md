---
description: Generate a new UI primitive in src/components/ui
---

1. Decide the component name (e.g. `toggle.tsx`).
2. Create the file in `src/components/ui/`.
3. Requirements:
   - Export a component with `className` support.
   - Use token-based Tailwind classes (`bg-background`, `border-border`, etc.).
   - Use `cn()` from `src/lib/cn.ts`.
   - No external component libraries.
4. Add a minimal usage example by updating `src/app/page.tsx` (or the relevant route).
