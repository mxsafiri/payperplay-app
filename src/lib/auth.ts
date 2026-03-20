import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";
import { Resend } from "resend";

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      if (!process.env.RESEND_API_KEY) {
        console.warn("[auth] RESEND_API_KEY not set — skipping password reset email");
        return;
      }
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: "PayPerPlay <noreply@payperplay.xyz>",
        to: user.email,
        subject: "Reset your PayPerPlay password",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0a;color:#fff;border-radius:12px;border:1px solid #222">
            <h2 style="margin:0 0 8px;font-size:22px">Reset your password</h2>
            <p style="color:#aaa;margin:0 0 24px">Click the button below to set a new password. This link expires in 1 hour.</p>
            <a href="${url}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#000;font-weight:600;border-radius:8px;text-decoration:none">Reset Password</a>
            <p style="color:#555;font-size:12px;margin:24px 0 0">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
      if (error) {
        console.error("[auth] Failed to send password reset email:", error);
      } else {
        console.log("[auth] Password reset email sent:", data?.id);
      }
    },
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
  trustedOrigins: async (request) => {
    const origins = [
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:3001",
      "https://payperplay.xyz",
      "https://www.payperplay.xyz",
    ].filter(Boolean) as string[];

    // In development, trust any localhost port (autoPort assigns dynamic ports)
    if (process.env.NODE_ENV !== "production" && request) {
      const origin = request.headers.get("origin") || "";
      if (origin.startsWith("http://localhost")) origins.push(origin);
    }

    return origins;
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,   // 30 days before full re-login required
    updateAge: 60 * 60 * 24,         // silently extend session on each daily visit
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,                // cache session in a cookie for 5 min — no server ping on every page load
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    // Set cookie on the root domain (.payperplay.xyz) so it works whether
    // the user visits www.payperplay.xyz OR payperplay.xyz — no more logout
    // on subdomain switches. Falls back to undefined in dev (localhost).
    crossSubdomainCookies: {
      enabled: process.env.NODE_ENV === "production",
      domain: ".payperplay.xyz",
    },
  },
});
