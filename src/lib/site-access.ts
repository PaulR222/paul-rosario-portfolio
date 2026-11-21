import { createHmac, timingSafeEqual } from "node:crypto";

export const SITE_ACCESS_COOKIE = "paulrosario_site_access";

function configuredPassword() {
  return process.env.SITE_GATE_PASSWORD;
}

export function passwordMatches(input: string) {
  const password = configuredPassword();
  if (!password) return false;

  const supplied = Buffer.from(input);
  const expected = Buffer.from(password);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function accessToken() {
  const password = configuredPassword();
  if (!password) return undefined;
  return createHmac("sha256", password).update("paulrosario-site-access-v1").digest("hex");
}

export function hasSiteAccess(cookieValue?: string) {
  const token = accessToken();
  if (!token || !cookieValue) return false;
  const supplied = Buffer.from(cookieValue);
  const expected = Buffer.from(token);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function siteAccessToken() {
  return accessToken();
}
