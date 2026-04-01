import { chromium } from 'playwright';
import CryptoJS from 'crypto-js';

const previewUrl = 'http://127.0.0.1:4173';
const secret = 'ksec_preview_seed_20260331';
const now = Date.now();
const futureExp = Math.floor((now + 7 * 24 * 60 * 60 * 1000) / 1000);

const user = {
  id: 'preview-user-1',
  email: 'preview.worker@kelmah.test',
  name: 'Preview Worker',
  firstName: 'Preview',
  lastName: 'Worker',
  role: 'worker',
  userType: 'worker',
  isVerified: true,
  isActive: true,
};

const conversationId = 'conv-dedupe-1';
const otherUserId = 'preview-user-2';

const tokenPayload = {
  sub: user.id,
  id: user.id,
  email: user.email,
  role: user.role,
  iat: Math.floor(now / 1000),
  exp: futureExp,
};

const base64Url = (value) =>
  Buffer.from(JSON.stringify(value))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const token = `${base64Url({ alg: 'none', typ: 'JWT' })}.${base64Url(tokenPayload)}.preview-signature`;
const encryptionKey = CryptoJS.SHA256(secret).toString();
const securePayload = {
  auth_token: { value: token, timestamp: now, ttl: 2 * 60 * 60 * 1000 },
  user_data: { value: user, timestamp: now, ttl: 24 * 60 * 60 * 1000 },
  _timestamp: now,
  _version: '1.0',
};
const encrypted = CryptoJS.AES.encrypt(JSON.stringify(securePayload), encryptionKey).toString();

const conversation = {
  id: conversationId,
  _id: conversationId,
  participants: [
    { id: user.id, name: 'Preview Worker' },
    { id: otherUserId, name: 'Preview Hirer' },
  ],
  unreadCount: 0,
  unread: 0,
  lastMessage: {
    id: 'msg-last',
    clientId: 'msg-last-client',
    conversationId,
    senderId: otherUserId,
    content: 'Last preview marker',
    createdAt: new Date(now - 1000).toISOString(),
  },
};

const incomingProbeText = 'dedupe-probe-incoming-hello';
const outgoingProbeText = 'dedupe-probe-outgoing-how-are-you';

const duplicateMessages = [
  {
    id: 'msg-1-server-a',
    clientId: 'msg-1-client',
    conversationId,
    senderId: otherUserId,
    sender: { id: otherUserId, name: 'Preview Hirer' },
    content: incomingProbeText,
    text: incomingProbeText,
    createdAt: new Date(now - 300000).toISOString(),
    timestamp: new Date(now - 300000).toISOString(),
    status: 'sent',
  },
  {
    id: 'msg-1-server-b',
    clientId: 'msg-1-client',
    conversationId,
    senderId: otherUserId,
    sender: { id: otherUserId, name: 'Preview Hirer' },
    content: incomingProbeText,
    text: incomingProbeText,
    createdAt: new Date(now - 299500).toISOString(),
    timestamp: new Date(now - 299500).toISOString(),
    status: 'sent',
  },
  {
    id: 'msg-2-server-a',
    clientId: 'msg-2-client',
    conversationId,
    senderId: user.id,
    sender: { id: user.id, name: 'Preview Worker' },
    content: outgoingProbeText,
    text: outgoingProbeText,
    createdAt: new Date(now - 240000).toISOString(),
    timestamp: new Date(now - 240000).toISOString(),
    status: 'sent',
  },
  {
    id: 'msg-2-server-b',
    clientId: 'msg-2-client',
    conversationId,
    senderId: user.id,
    sender: { id: user.id, name: 'Preview Worker' },
    content: outgoingProbeText,
    text: outgoingProbeText,
    createdAt: new Date(now - 239000).toISOString(),
    timestamp: new Date(now - 239000).toISOString(),
    status: 'sent',
  },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

const okJson = (body) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

await context.route('**/auth/verify**', async (route) => {
  await route.fulfill(okJson({ success: true, data: { user } }));
});

await context.route('**/auth/refresh-token**', async (route) => {
  await route.fulfill(okJson({ success: true, data: { token } }));
});

await context.route('**/messages/conversations**', async (route) => {
  const url = route.request().url();
  if (url.includes(`/messages/conversations/${conversationId}/messages`)) {
    await route.fulfill(
      okJson({
        success: true,
        data: {
          messages: duplicateMessages,
          pagination: { page: 1, limit: 50, total: duplicateMessages.length, hasMore: false },
        },
      }),
    );
    return;
  }

  if (url.endsWith(`/messages/conversations/${conversationId}`)) {
    await route.fulfill(okJson({ success: true, data: { conversation } }));
    return;
  }

  await route.fulfill(okJson({ success: true, data: { conversations: [conversation] } }));
});

await context.route('**/messages/search**', async (route) => {
  await route.fulfill(okJson({ success: true, data: { messages: [] } }));
});

await context.route('**/health**', async (route) => {
  await route.fulfill(okJson({ success: true, data: { status: 'ok' } }));
});

await context.addInitScript(
  ({ secretValue, encryptedValue }) => {
    localStorage.setItem('kelmah_encryption_secret', secretValue);
    localStorage.setItem('kelmah_secure_data', encryptedValue);
    sessionStorage.removeItem('session_id');
  },
  { secretValue: secret, encryptedValue: encrypted },
);

const page = await context.newPage();
const pageErrors = [];
const consoleErrors = [];

page.on('pageerror', (error) => {
  pageErrors.push(String(error?.message || error));
});

page.on('console', (message) => {
  if (message.type() === 'error') {
    consoleErrors.push(message.text());
  }
});

await page.goto(`${previewUrl}/messages?conversation=${conversationId}`, {
  waitUntil: 'domcontentloaded',
  timeout: 60000,
});
await page.waitForTimeout(8000);

const bodyText = await page.locator('body').innerText({ timeout: 60000 });
const helloCount = await page.getByText(incomingProbeText, { exact: true }).count();
const howAreYouCount = await page
  .getByText(outgoingProbeText, { exact: true })
  .count();
const boundaryVisible = bodyText.includes('Something went wrong');
const hookError = [...pageErrors, ...consoleErrors].some((entry) =>
  /Rendered fewer hooks than expected|Minified React error #300|hook/i.test(entry),
);

console.log(
  JSON.stringify(
    {
      url: page.url(),
      helloCount,
      howAreYouCount,
      boundaryVisible,
      hookError,
      pageErrors,
      consoleErrors: consoleErrors.slice(0, 10),
    },
    null,
    2,
  ),
);

await browser.close();