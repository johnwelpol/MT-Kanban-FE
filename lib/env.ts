import "server-only";
import { z } from "zod";

const schema = z.object({
  ROOT_DOMAIN: z.string().min(1),
  APP_PROTOCOL: z.enum(["http", "https"]),
  APP_PORT: z
    .string()
    .regex(/^\d*$/)
    .optional()
    .transform((v) => v || undefined),
  LARAVEL_INTERNAL_URL: z.url(),
  INTERNAL_API_KEY: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const env: Readonly<Env> = Object.freeze(parseEnv(process.env));
