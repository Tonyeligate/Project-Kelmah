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
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers['authorization'] || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Missing authorization token' });
    }

    const decoded = decodeJwtPayload(authHeader);
    if (!decoded || !(decoded.sub || decoded.id || decoded.userId)) {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
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
    const upstreamUrl = `${MESSAGING_URL}/api/messages`;
    const bodyStr = JSON.stringify(req.body || {});

    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(bodyStr)),
      'x-authenticated-user': userPayload,
      'x-auth-source': 'api-gateway',
      'x-gateway-signature': signature,
      'X-Internal-Request': HMAC_SECRET,
      'User-Agent': 'kelmah-vercel-bridge/1.0',
    };

    const result = await forwardRequest(upstreamUrl, 'POST', headers, bodyStr);
    return res.status(result.status).json(result.data);
  } catch (err) {
    console.error('[send-message] Handler error:', err.message, err.stack);
    return res.status(502).json({
      success: false,
      message: 'Bridge error: ' + (err.message || 'Unknown error'),
    });
  }
}
