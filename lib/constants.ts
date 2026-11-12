export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-session" : "session";
export const TENANT_ID_HEADER = "x-tenant-id";
export const TENANT_SLUG_HEADER = "x-tenant-slug";
export const PUBLIC_TENANT_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/invite",
  "/auth/callback",
  "/logout",
  "/tenant-not-found",
];
