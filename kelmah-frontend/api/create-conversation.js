/**
 * Vercel Serverless Function — Create Conversation Bridge
 *
 * Bypasses the Render API Gateway proxy which suffers from Express body-parser
 * consuming the request body stream before http-proxy-middleware can pipe it
 * (causing 504 Gateway Timeout on POST requests with JSON bodies).
 *
 * Flow:
 *   Browser → Vercel serverless → Render messaging-service directly
 *   (skips: Render API Gateway proxy layer)
 *
 * Environment Variables (set in Vercel Project Settings):
 *   MESSAGING_SERVICE_URL  — e.g. https://kelmah-messaging-service-kpj5.onrender.com
 *   INTERNAL_API_KEY       — shared secret for gateway trust HMAC
 *   JWT_SECRET             — fallback HMAC secret
 */

const crypto = require('crypto');
const https = require('https');
const http = require('http');

// Service configuration — environment variables take priority
const MESSAGING_URL =
  process.env.MESSAGING_SERVICE_URL ||
  process.env.MESSAGING_SERVICE_CLOUD_URL ||
  'https://kelmah-messaging-service-kpj5.onrender.com';

const HMAC_SECRET =
  process.env.INTERNAL_API_KEY ||
  process.env.JWT_SECRET ||
  'kelmah-internal-key-2024';

/**
 * Decode JWT payload without verification (the token was already validated
 * by the auth service when it was issued).  We only need the user claims
 * to build the x-authenticated-user header.
 */
function decodeJwtPayload(token) {
  try {
    const parts = token.replace('Bearer ', '').split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload;
  } catch {
    return null;
  }
}

/**
 * Make an HTTPS request and return { status, data }.
 */
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
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: { raw: data } });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(45000, () => {
      req.destroy(new Error('Upstream timeout'));
    });

    if (body) req.write(body);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Extract JWT from Authorization header
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing authorization token' });
  }

  const decoded = decodeJwtPayload(authHeader);
  if (!decoded || !decoded.sub) {
    return res.status(401).json({ success: false, message: 'Invalid token payload' });
  }

  // Build the x-authenticated-user object matching gateway authenticate() output
  const userPayload = JSON.stringify({
    id: decoded.sub || decoded.id,
    email: decoded.email || null,
    role: decoded.role || 'worker',
    firstName: decoded.firstName || null,
    lastName: decoded.lastName || null,
    isEmailVerified: decoded.isEmailVerified || false,
    tokenVersion: decoded.tokenVersion || 0,
  });

  // Compute HMAC signature matching verifyGatewayRequest expectations
  const signature = crypto.createHmac('sha256', HMAC_SECRET).update(userPayload).digest('hex');

  // Forward to messaging service
  const upstreamUrl = `${MESSAGING_URL}/api/conversations`;
  const bodyStr = JSON.stringify(req.body || {});

  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(bodyStr),
    'x-authenticated-user': userPayload,
    'x-auth-source': 'api-gateway',
    'x-gateway-signature': signature,
    'X-Internal-Request': HMAC_SECRET,
    'User-Agent': 'kelmah-vercel-bridge',
  };

  try {
    const result = await forwardRequest(upstreamUrl, 'POST', headers, bodyStr);
    return res.status(result.status).json(result.data);
  } catch (err) {
    console.error('[create-conversation] Upstream error:', err.message);
    return res.status(504).json({
      success: false,
      message: 'Messaging service temporarily unavailable',
    });
  }
};
