import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HeroSection } from "../components/HeroSection";
import { hasSiteAccess, passwordMatches, SITE_ACCESS_COOKIE, siteAccessToken } from "../src/lib/site-access";

export const metadata: Metadata = { robots: { index: false, follow: false } };

async function unlock(formData: FormData) {
  "use server";

  const password = formData.get("password");
  if (typeof password !== "string" || !passwordMatches(password)) {
    redirect("/?error=1");
  }

  const token = siteAccessToken();
  if (!token) redirect("/?error=1");

  (await cookies()).set(SITE_ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const cookieValue = (await cookies()).get(SITE_ACCESS_COOKIE)?.value;
  if (hasSiteAccess(cookieValue)) return <HeroSection />;

  const invalidPassword = (await searchParams).error === "1";
  return (
    <main className="access-page">
      <div className="access-card">
        <p className="access-eyebrow">Paul Rosario</p>
        <h1>Welcome</h1>
        <p>This part of the site requires a password.</p>
        <form action={unlock}>
          <label htmlFor="site-password">Password</label>
          <input id="site-password" name="password" type="password" autoComplete="current-password" required autoFocus />
          {invalidPassword && <p className="access-error" role="alert">That password didn&apos;t work. Please try again.</p>}
          <button type="submit">Enter site</button>
        </form>
        <a href="/photography">View public photography →</a>
      </div>
    </main>
  );
}
