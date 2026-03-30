/**
 * Vercel Serverless Function — Send Message Bridge
 *
 * Bypasses the Render API Gateway proxy body-stream hang for POST /messages.
 * Body: { conversationId, content, recipientId?, messageType?, attachments? }
 *
 * Flow:  Browser → Vercel serverless → Render messaging-service directly
 */

import { createHmac } from 'crypto';
import https from 'https';
import http from 'http';

const MESSAGING_URL =
  process.env.MESSAGING_SERVICE_URL ||
  'https://kelmah-messaging-service-kpj5.onrender.com';

const HMAC_SECRET =
  process.env.INTERNAL_API_KEY ||
  process.env.JWT_SECRET ||
  'kelmah-internal-key-2024';

const DEFAULT_GATEWAY_ORIGIN = 'https://kelmah-api-gateway-tvqj.onrender.com';

const DEFAULT_MESSAGING_ORIGIN =
  'https://kelmah-messaging-service-kpj5.onrender.com';

function normalizeServiceOrigin(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = new URL(raw.trim());
    return parsed.origin;
  } catch {
    return null;
  }
}

function shouldRetryWithNextOrigin(result) {
  if (!result) return true;

  if (result.status >= 500) return true;

  if (result.status === 404) {
    const rawBody =
      typeof result?.data?.raw === 'string' ? result.data.raw.trim() : '';
    return rawBody === 'Not Found';
  }

  return false;
}

async function forwardWithCandidates(candidates, method, body) {
  let lastResult = null;

  for (const candidate of candidates) {
    const { origin, path, headers } = candidate;
    if (!origin || !path) {
      continue;
    }

    const url = `${origin}${path}`;
    const result = await forwardRequest(url, method, headers || {}, body);
    lastResult = result;
    if (!shouldRetryWithNextOrigin(result)) {
      return result;
    }
  }

  return (
    lastResult || {
      status: 502,
      data: { success: false, message: 'Bridge upstream unavailable' },
    }
  );
}

function decodeJwtPayload(token) {
  try {
    const raw = token.replace('Bearer ', '').trim();
    const parts = raw.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
  } catch (e) {
    console.error('[send-message] JWT decode error:', e.message);
    return null;
  }
}

function forwardRequest(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers,
    };
    const req = transport.request(options, (res) => {
      let chunks = '';
      res.on('data', (chunk) => (chunks += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(chunks) });
        } catch {
          resolve({ status: res.statusCode, data: { raw: chunks } });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('Upstream timeout')));
    if (body) req.write(body);
    req.end();
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers['authorization'] || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ success: false, message: 'Missing authorization token' });
    }

    const decoded = decodeJwtPayload(authHeader);
    if (!decoded || !(decoded.sub || decoded.id || decoded.userId)) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid token payload' });
    }

    const userId = decoded.sub || decoded.id || decoded.userId;
    const userPayload = JSON.stringify({
      id: userId,
      email: decoded.email || null,
      role: decoded.role || 'worker',
      firstName: decoded.firstName || null,
      lastName: decoded.lastName || null,
      isEmailVerified: decoded.isEmailVerified || false,
      tokenVersion: decoded.tokenVersion || 0,
    });

    const signature = createHmac('sha256', HMAC_SECRET)
      .update(userPayload)
      .digest('hex');

    // Messages are always POSTed to /api/messages (the controller reads
    // conversationId from the body, not the URL path).
    const bodyStr = JSON.stringify(req.body || {});

    const serviceHeaders = {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(bodyStr)),
      'x-authenticated-user': userPayload,
      'x-auth-source': 'api-gateway',
      'x-gateway-signature': signature,
      'X-Internal-Request': HMAC_SECRET,
      'User-Agent': 'kelmah-vercel-bridge/1.0',
    };

    const gatewayOrigin =
      normalizeServiceOrigin(process.env.API_GATEWAY_URL) ||
      normalizeServiceOrigin(process.env.VITE_API_GATEWAY_URL) ||
      normalizeServiceOrigin(DEFAULT_GATEWAY_ORIGIN);

    const gatewayHeaders = {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(bodyStr)),
      Authorization: authHeader,
      'User-Agent': 'kelmah-vercel-bridge/1.0',
    };

    const candidates = [
      {
        origin: gatewayOrigin,
        path: '/api/messages',
        headers: gatewayHeaders,
      },
      {
        origin: normalizeServiceOrigin(MESSAGING_URL),
        path: '/api/messages',
        headers: serviceHeaders,
      },
      {
        origin: normalizeServiceOrigin(DEFAULT_MESSAGING_ORIGIN),
        path: '/api/messages',
        headers: serviceHeaders,
      },
    ];

    const result = await forwardWithCandidates(candidates, 'POST', bodyStr);
    return res.status(result.status).json(result.data);
  } catch (err) {
    console.error('[send-message] Handler error:', err.message, err.stack);
    return res.status(502).json({
      success: false,
      message: 'Bridge error: ' + (err.message || 'Unknown error'),
    });
  }
}
