import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      enabled: !!process.env.GITHUB_CLIENT_ID,
    },
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "https://payperplay.xyz",
    "https://www.payperplay.xyz",
  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});
