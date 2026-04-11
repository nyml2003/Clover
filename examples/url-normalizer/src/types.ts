export interface NormalizedUrl {
  scheme: SupportedScheme;
  host: string;
  port: number | null;
  path: string;
  query: string | null;
  normalizedHref: string;
}

export type SupportedScheme = "http" | "https";
