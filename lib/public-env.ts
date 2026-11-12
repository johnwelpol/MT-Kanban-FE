export const publicEnv = {
  reverbKey: process.env.NEXT_PUBLIC_REVERB_APP_KEY ?? "",
  reverbHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? "localhost",
  reverbPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
  reverbScheme: process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http",
} as const;
