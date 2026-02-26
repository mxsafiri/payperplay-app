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
        console.warn("RESEND_API_KEY not set — skipping password reset email");
        return;
      }
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
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
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://payperplay.xyz",
    "https://www.payperplay.xyz",
  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});
