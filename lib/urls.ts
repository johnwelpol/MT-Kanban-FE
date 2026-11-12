function origin(host: string): string {
  const port = process.env.APP_PORT;
  return `${process.env.APP_PROTOCOL}://${host}${port ? `:${port}` : ""}`;
}

export function rootUrl(path: string): string {
  return origin(process.env.ROOT_DOMAIN ?? "") + path;
}

export function tenantUrl(slug: string, path: string): string {
  return origin(`${slug}.${process.env.ROOT_DOMAIN}`) + path;
}

export function safeNext(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/boards";
  }
  return value;
}
