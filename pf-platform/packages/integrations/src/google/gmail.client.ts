/**
 * Gmail REST API client using service account with domain-wide delegation.
 *
 * Authenticates via GOOGLE_SERVICE_ACCOUNT_KEY (same key as Drive) and
 * impersonates the mailbox specified by GMAIL_WATCH_EMAIL.
 */

import type { GmailConfig } from './gmail.types';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
];

// ── types ────────────────────────────────────────────────────────────

interface ServiceAccountCredentials {
  private_key: string;
  client_email: string;
}

interface MessageHeader {
  name: string;
  value: string;
}

interface MessagePart {
  mimeType: string;
  filename?: string;
  body?: { attachmentId?: string; size: number; data?: string };
  parts?: MessagePart[];
}

interface RawMessage {
  id: string;
  threadId: string;
  payload: {
    headers: MessageHeader[];
    parts?: MessagePart[];
  };
  snippet: string;
  internalDate: string;
}

// ── JWT + token ──────────────────────────────────────────────────────

async function createSignedJwt(
  credentials: ServiceAccountCredentials,
  subject: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: credentials.client_email,
    sub: subject,
    scope: SCOPES.join(' '),
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const unsigned = `${encode(header)}.${encode(payload)}`;

  const pemBody = credentials.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const key = await crypto.subtle.importKey(
    'pkcs8',
    Buffer.from(pemBody, 'base64'),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned),
  );

  return `${unsigned}.${Buffer.from(sig).toString('base64url')}`;
}

let gmailToken: { token: string; expiresAt: number } | null = null;

async function getGmailAccessToken(
  credentials: ServiceAccountCredentials,
  subject: string,
): Promise<string> {
  if (gmailToken && Date.now() < gmailToken.expiresAt) {
    return gmailToken.token;
  }

  const jwt = await createSignedJwt(credentials, subject);
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
    throw new Error(`Gmail token exchange failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  gmailToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return gmailToken.token;
}

// ── config ───────────────────────────────────────────────────────────

function loadGmailConfig(): GmailConfig | null {
  const keyJson =
    process.env.GMAIL_SERVICE_ACCOUNT_KEY ??
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const email = process.env.GMAIL_WATCH_EMAIL;

  if (!keyJson || !email) return null;
  return { serviceAccountKey: keyJson, watchEmail: email };
}

// ── public API ───────────────────────────────────────────────────────

export interface GmailClient {
  /** Search messages matching a Gmail query string. */
  searchMessages(
    query: string,
    maxResults?: number,
  ): Promise<Array<{ id: string; threadId: string }>>;

  /** Fetch full message metadata + body structure. */
  getMessage(messageId: string): Promise<RawMessage>;

  /** Download an attachment by ID. */
  getAttachment(messageId: string, attachmentId: string): Promise<Buffer>;

  /** Remove a label or add a label to a message (e.g. mark read). */
  modifyMessage(
    messageId: string,
    addLabels?: string[],
    removeLabels?: string[],
  ): Promise<void>;
}

/**
 * Create a Gmail API client. Returns `null` when env vars are missing.
 */
export function createGmailClient(): GmailClient | null {
  const config = loadGmailConfig();
  if (!config) {
    console.warn(
      '[gmail] GMAIL_SERVICE_ACCOUNT_KEY / GMAIL_WATCH_EMAIL not set — Gmail integration disabled.',
    );
    return null;
  }

  const credentials = JSON.parse(
    config.serviceAccountKey,
  ) as ServiceAccountCredentials;

  async function headers(): Promise<Record<string, string>> {
    const token = await getGmailAccessToken(credentials, config.watchEmail);
    return { Authorization: `Bearer ${token}` };
  }

  const userPath = `${GMAIL_API}/users/me`;

  return {
    async searchMessages(query, maxResults = 50) {
      const h = await headers();
      const url = new URL(`${userPath}/messages`);
      url.searchParams.set('q', query);
      url.searchParams.set('maxResults', String(maxResults));

      const res = await fetch(url.toString(), { headers: h });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Gmail search failed (${res.status}): ${text}`);
      }

      const data = (await res.json()) as {
        messages?: Array<{ id: string; threadId: string }>;
      };
      return data.messages ?? [];
    },

    async getMessage(messageId) {
      const h = await headers();
      const res = await fetch(`${userPath}/messages/${messageId}?format=full`, {
        headers: h,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Gmail getMessage failed (${res.status}): ${text}`);
      }
      return (await res.json()) as RawMessage;
    },

    async getAttachment(messageId, attachmentId) {
      const h = await headers();
      const res = await fetch(
        `${userPath}/messages/${messageId}/attachments/${attachmentId}`,
        { headers: h },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Gmail getAttachment failed (${res.status}): ${text}`);
      }
      const data = (await res.json()) as { data: string };
      // Gmail returns base64url-encoded data
      return Buffer.from(data.data, 'base64url');
    },

    async modifyMessage(messageId, addLabels, removeLabels) {
      const h = await headers();
      const res = await fetch(`${userPath}/messages/${messageId}/modify`, {
        method: 'POST',
        headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addLabelIds: addLabels ?? [],
          removeLabelIds: removeLabels ?? [],
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Gmail modifyMessage failed (${res.status}): ${text}`);
      }
    },
  };
}
