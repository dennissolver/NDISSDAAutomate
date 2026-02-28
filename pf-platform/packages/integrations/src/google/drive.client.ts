/**
 * Google Drive REST API client using service account authentication.
 *
 * Uses raw fetch against the Google APIs — no SDK dependency required.
 * Authenticates via a service account JSON key provided through the
 * GOOGLE_SERVICE_ACCOUNT_KEY environment variable.
 */

import type {
  DriveConfig,
  GoogleAccessToken,
  ServiceAccountCredentials,
} from './drive.types';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// ── helpers ──────────────────────────────────────────────────────────

/**
 * Build a self-signed JWT for Google service account auth.
 * Uses the Web Crypto API (available in Node 18+) to sign with RS256.
 */
async function createSignedJwt(
  credentials: ServiceAccountCredentials,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: credentials.client_email,
    scope: SCOPES.join(' '),
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the PEM private key
  const pemBody = credentials.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const keyBuffer = Buffer.from(pemBody, 'base64');

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken),
  );

  const sigB64 = Buffer.from(signature).toString('base64url');
  return `${unsignedToken}.${sigB64}`;
}

// ── token cache ──────────────────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(
  credentials: ServiceAccountCredentials,
): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const jwt = await createSignedJwt(credentials);

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as GoogleAccessToken;
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}

// ── configuration ────────────────────────────────────────────────────

function loadConfig(): DriveConfig | null {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!keyJson || !folderId) {
    return null;
  }

  return { serviceAccountKey: keyJson, rootFolderId: folderId };
}

function parseCredentials(keyJson: string): ServiceAccountCredentials {
  try {
    return JSON.parse(keyJson) as ServiceAccountCredentials;
  } catch {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON. ' +
        'Provide the full service account key file contents.',
    );
  }
}

// ── public API ───────────────────────────────────────────────────────

export interface DriveClient {
  listFiles(
    folderId: string,
    query?: string,
  ): Promise<
    Array<{ id: string; name: string; mimeType: string; webViewLink?: string }>
  >;
  createFolder(name: string, parentId: string): Promise<string>;
  uploadFile(
    name: string,
    mimeType: string,
    body: Buffer,
    parentId: string,
  ): Promise<{ fileId: string; webViewLink: string }>;
}

/**
 * Create a Google Drive client.
 *
 * Returns `null` when environment variables are not configured,
 * allowing callers to gracefully degrade.
 */
export function createDriveClient(): DriveClient | null {
  const config = loadConfig();
  if (!config) {
    console.warn(
      '[google-drive] GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_DRIVE_FOLDER_ID not set — Drive integration disabled.',
    );
    return null;
  }

  const credentials = parseCredentials(config.serviceAccountKey);

  async function authHeaders(): Promise<Record<string, string>> {
    const token = await getAccessToken(credentials);
    return { Authorization: `Bearer ${token}` };
  }

  return {
    async listFiles(folderId, query) {
      const headers = await authHeaders();
      const q = query
        ? `'${folderId}' in parents and trashed = false and ${query}`
        : `'${folderId}' in parents and trashed = false`;

      const url = new URL(`${DRIVE_API}/files`);
      url.searchParams.set('q', q);
      url.searchParams.set('fields', 'files(id,name,mimeType,webViewLink)');
      url.searchParams.set('pageSize', '1000');

      const res = await fetch(url.toString(), { headers });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Drive listFiles failed (${res.status}): ${text}`);
      }

      const data = (await res.json()) as {
        files: Array<{
          id: string;
          name: string;
          mimeType: string;
          webViewLink?: string;
        }>;
      };
      return data.files ?? [];
    },

    async createFolder(name, parentId) {
      const headers = await authHeaders();
      const res = await fetch(`${DRIVE_API}/files`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Drive createFolder failed (${res.status}): ${text}`);
      }

      const data = (await res.json()) as { id: string };
      return data.id;
    },

    async uploadFile(name, mimeType, body, parentId) {
      const headers = await authHeaders();

      // Multipart upload
      const boundary = '----PFUploadBoundary';
      const metadata = JSON.stringify({
        name,
        parents: [parentId],
      });

      const multipartBody = Buffer.concat([
        Buffer.from(
          `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
        ),
        body,
        Buffer.from(`\r\n--${boundary}--`),
      ]);

      const url = new URL(`${UPLOAD_API}/files`);
      url.searchParams.set('uploadType', 'multipart');
      url.searchParams.set('fields', 'id,webViewLink');

      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Drive uploadFile failed (${res.status}): ${text}`);
      }

      const data = (await res.json()) as {
        id: string;
        webViewLink: string;
      };
      return { fileId: data.id, webViewLink: data.webViewLink ?? '' };
    },
  };
}

/** Expose root folder ID from env for service layer. */
export function getRootFolderId(): string {
  return process.env.GOOGLE_DRIVE_FOLDER_ID ?? '';
}
