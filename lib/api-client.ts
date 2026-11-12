import type { ApiErrorBody } from "./api";

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody,
  ) {
    super(body?.message ?? `Request failed with ${status}`);
    this.name = "ApiClientError";
  }
}

type ApiFetchInit = Omit<RequestInit, "body"> & { json?: unknown };

export async function apiFetch<T>(path: string, { json, headers, ...init }: ApiFetchInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(json !== undefined && { "Content-Type": "application/json" }),
      ...headers,
    },
    body: json === undefined ? undefined : JSON.stringify(json),
  });

  if (res.status === 401) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- /logout is a route handler that clears the cookie; it needs a full navigation.
    window.location.assign("/logout?expired=1");
    throw new ApiClientError(401, null);
  }
  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiClientError(res.status, body);
  return body.data as T;
}
