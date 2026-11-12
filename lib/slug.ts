export const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "www", "app", "api", "auth", "admin", "site", "mail", "help", "support", "status",
  "docs", "blog", "static", "assets", "ws", "reverb", "dashboard", "billing", "login", "register",
]);
