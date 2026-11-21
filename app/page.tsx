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
        <h1>Sneaky, sneaky...</h1>
        <p>If you can guess the password, you can get in.</p>
        <form action={unlock}>
          <input
            id="site-password"
            name="password"
            type="password"
            aria-label="Password"
            aria-invalid={invalidPassword}
            autoComplete="current-password"
            required
            autoFocus
          />
          {invalidPassword && <span className="access-screen-reader-only" role="alert">Incorrect password</span>}
        </form>
        <a href="/photography">Photography</a>
      </div>
    </main>
  );
}
