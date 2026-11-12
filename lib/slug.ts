export const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "www", "app", "api", "auth", "admin", "site", "mail", "help", "support", "status",
  "docs", "blog", "static", "assets", "ws", "reverb", "dashboard", "billing", "login", "register",
]);

export type SlugProblem = "invalid" | "reserved";

export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

export function validateSlug(slug: string): SlugProblem | null {
  if (RESERVED_SLUGS.has(slug)) return "reserved";
  return SLUG_REGEX.test(slug) ? null : "invalid";
}
