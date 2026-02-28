/**
 * Xero OAuth2 API client.
 *
 * Uses the Xero API v2 REST endpoints with OAuth2 client credentials
 * or token refresh flow. Env vars: XERO_CLIENT_ID, XERO_CLIENT_SECRET,
 * XERO_TENANT_ID, and optionally XERO_REFRESH_TOKEN for the initial
 * token bootstrap.
 */

import type { XeroConfig, XeroTokens } from './xero.types';

const XERO_API = 'https://api.xero.com/api.xro/2.0';
const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token';

// ── config ───────────────────────────────────────────────────────────

function loadXeroConfig(): XeroConfig | null {
  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;
  const tenantId = process.env.XERO_TENANT_ID;

  if (!clientId || !clientSecret || !tenantId) {
    return null;
  }

  return { clientId, clientSecret, tenantId };
}

// ── token management ─────────────────────────────────────────────────

let tokenCache: XeroTokens | null = null;

async function refreshAccessToken(config: XeroConfig): Promise<XeroTokens> {
  const refreshToken = tokenCache?.refreshToken ?? process.env.XERO_REFRESH_TOKEN;

  if (!refreshToken) {
    throw new Error(
      'No Xero refresh token available. Set XERO_REFRESH_TOKEN env var ' +
        'or complete the OAuth2 authorization flow first.',
    );
  }

  const basicAuth = Buffer.from(
    `${config.clientId}:${config.clientSecret}`,
  ).toString('base64');

  const res = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Xero token refresh failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  tokenCache = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return tokenCache;
}

async function getAccessToken(config: XeroConfig): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }

  const tokens = await refreshAccessToken(config);
  return tokens.accessToken;
}

// ── public API ───────────────────────────────────────────────────────

export interface XeroClient {
  /** Send a GET request to a Xero API endpoint. */
  get<T>(path: string, params?: Record<string, string>): Promise<T>;

  /** Send a POST request to a Xero API endpoint. */
  post<T>(path: string, body: unknown): Promise<T>;

  /** Send a PUT request to a Xero API endpoint. */
  put<T>(path: string, body: unknown): Promise<T>;
}

/**
 * Create a Xero API client. Returns `null` when env vars are missing.
 */
export function createXeroClient(): XeroClient | null {
  const config = loadXeroConfig();
  if (!config) {
    console.warn(
      '[xero] XERO_CLIENT_ID, XERO_CLIENT_SECRET, or XERO_TENANT_ID not set — Xero integration disabled.',
    );
    return null;
  }

  async function authHeaders(): Promise<Record<string, string>> {
    const token = await getAccessToken(config);
    return {
      Authorization: `Bearer ${token}`,
      'xero-tenant-id': config.tenantId,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }

  return {
    async get<T>(path: string, params?: Record<string, string>): Promise<T> {
      const headers = await authHeaders();
      const url = new URL(`${XERO_API}${path}`);
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          url.searchParams.set(k, v);
        }
      }

      const res = await fetch(url.toString(), { headers });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Xero GET ${path} failed (${res.status}): ${text}`);
      }
      return (await res.json()) as T;
    },

    async post<T>(path: string, body: unknown): Promise<T> {
      const headers = await authHeaders();
      const res = await fetch(`${XERO_API}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Xero POST ${path} failed (${res.status}): ${text}`);
      }
      return (await res.json()) as T;
    },

    async put<T>(path: string, body: unknown): Promise<T> {
      const headers = await authHeaders();
      const res = await fetch(`${XERO_API}${path}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Xero PUT ${path} failed (${res.status}): ${text}`);
      }
      return (await res.json()) as T;
    },
  };
}
