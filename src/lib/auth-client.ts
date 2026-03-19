import { createAuthClient } from "better-auth/react";

const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // mirrors server setting
    },
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
