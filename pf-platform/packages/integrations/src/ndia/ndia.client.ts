/**
 * NDIA / PRODA API client.
 *
 * Authenticates via OAuth2 client credentials against the NDIA API.
 * Env vars: NDIA_API_BASE_URL, NDIA_CLIENT_ID, NDIA_CLIENT_SECRET.
 *
 * NOTE: The NDIA bulk payment API may not yet be publicly available.
 * This client is built to the expected contract and will gracefully
 * degrade when credentials are not configured.
 */

import type { NdiaConfig } from './ndia.types';

// ── config ───────────────────────────────────────────────────────────

function loadNdiaConfig(): NdiaConfig | null {
  const baseUrl = process.env.NDIA_API_BASE_URL;
  const clientId = process.env.NDIA_CLIENT_ID;
  const clientSecret = process.env.NDIA_CLIENT_SECRET;

  if (!baseUrl || !clientId || !clientSecret) {
    return null;
  }

  return { baseUrl: baseUrl.replace(/\/$/, ''), clientId, clientSecret };
}

/**
 * Check whether the NDIA integration has all required env vars.
 */
export function isNdiaConfigured(): boolean {
  return loadNdiaConfig() !== null;
}

// ── token management ─────────────────────────────────────────────────

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(config: NdiaConfig): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const tokenUrl = `${config.baseUrl}/oauth2/token`;
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NDIA token request failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return tokenCache.token;
}

// ── public API ───────────────────────────────────────────────────────

export interface NdiaClient {
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
}

/**
 * Create an NDIA API client. Returns `null` when env vars are missing.
 */
export function createNdiaClient(): NdiaClient | null {
  const config = loadNdiaConfig();
  if (!config) {
    console.warn(
      '[ndia] NDIA_API_BASE_URL, NDIA_CLIENT_ID, or NDIA_CLIENT_SECRET not set — NDIA integration disabled.',
    );
    return null;
  }

  async function authHeaders(): Promise<Record<string, string>> {
    const token = await getAccessToken(config);
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }

  return {
    async get<T>(path: string, params?: Record<string, string>): Promise<T> {
      const headers = await authHeaders();
      const url = new URL(`${config.baseUrl}${path}`);
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          url.searchParams.set(k, v);
        }
      }

      const res = await fetch(url.toString(), { headers });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`NDIA GET ${path} failed (${res.status}): ${text}`);
      }
      return (await res.json()) as T;
    },

    async post<T>(path: string, body: unknown): Promise<T> {
      const headers = await authHeaders();
      const res = await fetch(`${config.baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`NDIA POST ${path} failed (${res.status}): ${text}`);
      }
      return (await res.json()) as T;
    },
  };
}
