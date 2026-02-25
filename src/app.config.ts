export type AppTheme = "light" | "dark";

type ThemeTokens = {
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
    primary: string;
    primaryForeground: string;
    ring: string;
  };
  radius: {
    md: string;
  };
  spacing: {
    containerPaddingX: string;
  };
};

export const appConfig = {
  site: {
    name: "PayPerPlay",
    description: "Create, post and get paid. Tanzania's creator-first platform for premium content.",
    url: "https://www.payperplay.xyz",
    locale: "en",
  },
  brand: {
    social: {
      twitterHandle: "@payperplay",
    },
  },
  tokens: {
    light: {
      colors: {
        background: "#ffffff",
        foreground: "#0a0a0a",
        card: "#ffffff",
        cardForeground: "#0a0a0a",
        muted: "#f4f4f5",
        mutedForeground: "#52525b",
        border: "#e4e4e7",
        input: "#e4e4e7",
        primary: "#111827",
        primaryForeground: "#ffffff",
        ring: "#111827",
      },
      radius: {
        md: "0.75rem",
      },
      spacing: {
        containerPaddingX: "1rem",
      },
    } satisfies ThemeTokens,
    dark: {
      colors: {
        background: "#0a0a0a",
        foreground: "#fafafa",
        card: "#0f0f10",
        cardForeground: "#fafafa",
        muted: "#18181b",
        mutedForeground: "#a1a1aa",
        border: "#27272a",
        input: "#27272a",
        primary: "#fafafa",
        primaryForeground: "#09090b",
        ring: "#fafafa",
      },
      radius: {
        md: "0.75rem",
      },
      spacing: {
        containerPaddingX: "1rem",
      },
    } satisfies ThemeTokens,
  },
} as const;

function tokensToCssVars(tokens: ThemeTokens): Record<string, string> {
  return {
    "--ds-color-background": tokens.colors.background,
    "--ds-color-foreground": tokens.colors.foreground,
    "--ds-color-card": tokens.colors.card,
    "--ds-color-card-foreground": tokens.colors.cardForeground,
    "--ds-color-muted": tokens.colors.muted,
    "--ds-color-muted-foreground": tokens.colors.mutedForeground,
    "--ds-color-border": tokens.colors.border,
    "--ds-color-input": tokens.colors.input,
    "--ds-color-primary": tokens.colors.primary,
    "--ds-color-primary-foreground": tokens.colors.primaryForeground,
    "--ds-color-ring": tokens.colors.ring,
    "--ds-radius-md": tokens.radius.md,
    "--ds-space-container-px": tokens.spacing.containerPaddingX,
  };
}

function cssVarsToString(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join(" ");
}

export function getThemeCss(): string {
  const light = cssVarsToString(tokensToCssVars(appConfig.tokens.light));
  const dark = cssVarsToString(tokensToCssVars(appConfig.tokens.dark));

  return `:root { ${light} } :root.dark { ${dark} }`;
}
