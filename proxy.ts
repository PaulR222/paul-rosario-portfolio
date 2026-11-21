import { NextResponse, type NextRequest } from "next/server";
import { hasSiteAccess, SITE_ACCESS_COOKIE } from "./src/lib/site-access";

export function proxy(request: NextRequest) {
  if (hasSiteAccess(request.cookies.get(SITE_ACCESS_COOKIE)?.value)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/", request.url));
}

// These files belong to the private homepage. Photography and its assets stay public.
export const config = {
  matcher: ["/paul-rosario-resume.pdf", "/paul-headshot.jpg", "/paul-illustration.png"],
};
