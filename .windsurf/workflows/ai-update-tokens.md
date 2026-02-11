---
description: Update design tokens in a single place
---

1. Update token values in `src/app.config.ts`.
2. If you added new tokens, map them in `src/app/globals.css` under `@theme inline`.
3. Verify components only use token-based classes.
4. Run the dev server and visually confirm light/dark.
