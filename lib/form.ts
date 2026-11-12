import { ApiError } from "./laravel";

export type FormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export function toFormState(e: unknown): FormState {
  if (e instanceof ApiError) {
    if (e.status === 422) {
      return { ok: false, message: e.body?.message, fieldErrors: e.body?.errors ?? {} };
    }
    if (e.status === 429) {
      return { ok: false, message: e.body?.message ?? "Too many attempts. Please try again later." };
    }
  }
  throw e;
}
