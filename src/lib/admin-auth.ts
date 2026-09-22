import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "admin_session";

export async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const secret = process.env.ADMIN_SECRET;
  if (!token || !secret || token !== secret) {
    redirect("/admin/login");
  }
}

export async function isAdminCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const secret = process.env.ADMIN_SECRET;
  return !!(token && secret && token === secret);
}

export function checkAdminHeader(req: Request): boolean {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const token = match?.[1] ? decodeURIComponent(match[1]) : null;
  const secret = process.env.ADMIN_SECRET;
  return !!(token && secret && token === secret);
}
