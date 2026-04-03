import { chromium } from 'playwright';

const baseUrl = 'http://127.0.0.1:3000';
const viewports = [
  { key: '320', width: 320, height: 900, mobile: true },
  { key: '768', width: 768, height: 1024, mobile: true },
  { key: '1024', width: 1024, height: 960, mobile: false },
  { key: '1440', width: 1440, height: 1024, mobile: false },
];

const authUser = {
  _id: 'ui-audit-hirer-1',
  id: 'ui-audit-hirer-1',
  firstName: 'Gifty',
  lastName: 'Afisa',
  email: 'giftyafisa@gmail.com',
  role: 'hirer',
  isEmailVerified: true,
};

const participants = [
  {
    id: 'worker-kwame',
    _id: 'worker-kwame',
    firstName: 'Kwame',
    lastName: 'Asante',
    name: 'Kwame Asante',
  },
  {
    id: 'worker-yaa',
    _id: 'worker-yaa',
    firstName: 'Yaa',
    lastName: 'Adjei',
    name: 'Yaa Adjei',
  },
  {
    id: 'worker-kojo',
    _id: 'worker-kojo',
    firstName: 'Kojo',
    lastName: 'Mensah',
    name: 'Kojo Mensah',
  },
  {
    id: 'worker-abena',
    _id: 'worker-abena',
    firstName: 'Abena',
    lastName: 'Owusu',
    name: 'Abena Owusu',
  },
];

const makeLongThread = (conversationId, recipientId) => {
  const start = Date.now() - 1000 * 60 * 170;
  return Array.from({ length: 120 }, (_, i) => {
    const outgoing = i % 2 === 0;
    const ts = new Date(start + i * 60 * 1000).toISOString();
    const content = outgoing
      ? `Update ${i + 1}: Please confirm next step.`
      : `Reply ${i + 1}: Confirmed, proceeding now.`;

    return {
      id: `${conversationId}-m-${i + 1}`,
      _id: `${conversationId}-m-${i + 1}`,
      conversationId,
      senderId: outgoing ? authUser.id : recipientId,
      sender: outgoing ? authUser.id : recipientId,
      content,
      text: content,
      createdAt: ts,
      timestamp: ts,
      status: 'sent',
      isRead: outgoing,
      attachments: [],
    };
  });
};

const conversations = participants.map((participant, index) => {
  const id = `conv-${index + 1}`;
  const messages = makeLongThread(id, participant.id);
  const lastMessage = messages[messages.length - 1];

  return {
    id,
    _id: id,
    participants: [participant],
    unreadCount: index === 0 ? 2 : 0,
    unread: index === 0 ? 2 : 0,
    isPinned: index === 0,
    updatedAt: lastMessage.createdAt,
    createdAt: new Date(Date.now() - 1000 * 60 * 260).toISOString(),
    lastMessage,
    latestMessage: lastMessage,
    jobRelated: {
      title: index === 0 ? 'Bridge delayed probe' : 'Kitchen wiring quote',
    },
    __messages: messages,
  };
});

const conversationLookup = new Map(conversations.map((c) => [c.id, c]));
const asJson = (body, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

const applyRoutes = async (page) => {
  const loginPayload = {
    success: true,
    data: {
      token: 'ui-audit-mock-token',
      refreshToken: 'ui-audit-mock-refresh-token',
      user: authUser,
    },
  };

  await page.route('**/api/auth/login*', async (route) =>
    route.fulfill(asJson(loginPayload)),
  );
  await page.route('**/api/auth/verify*', async (route) =>
    route.fulfill(asJson({ success: true, data: { user: authUser } })),
  );
  await page.route('**/api/auth/refresh-token*', async (route) =>
    route.fulfill(asJson(loginPayload)),
  );
  await page.route('**/api/auth/logout*', async (route) =>
    route.fulfill(asJson({ success: true })),
  );

  await page.route('**/api/health/aggregate*', async (route) =>
    route.fulfill(
      asJson({
        success: true,
        data: { gateway: { status: 'healthy' }, services: {} },
      }),
    ),
  );

  await page.route('**/api/notifications*', async (route) =>
    route.fulfill(
      asJson({
        success: true,
        data: {
          notifications: [],
          unreadCount: 0,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            limit: 20,
          },
        },
      }),
    ),
  );

  await page.route('**/api/messages/conversations/**/messages*', async (route) => {
    const url = new URL(route.request().url());
    const parts = url.pathname.split('/');
    const idx = parts.findIndex((part) => part === 'conversations');
    const conversationId = idx >= 0 ? parts[idx + 1] : null;
    const record = conversationId ? conversationLookup.get(conversationId) : null;
    const messages = record ? record.__messages : [];

    await route.fulfill(
      asJson({
        success: true,
        data: {
          messages,
          pagination: {
            page: 1,
            limit: 100,
            total: messages.length,
            totalPages: 2,
          },
        },
      }),
    );
  });

  await page.route('**/api/messages/conversations*', async (route) => {
    const responseConversations = conversations.map(({ __messages, ...rest }) => rest);
    await route.fulfill(asJson({ success: true, data: { conversations: responseConversations } }));
  });
};

const intersects = (a, b) => {
  if (!a || !b) return false;
  return !(
    a.right <= b.left ||
    a.left >= b.right ||
    a.bottom <= b.top ||
    a.top >= b.bottom
  );
};

const browser = await chromium.launch({ headless: true });
const report = [];

try {
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();
    await applyRoutes(page);

    await page.goto(`${baseUrl}/login`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    const email = page.locator('input[type="email"], input[name="email"]').first();
    const password = page.locator('input[type="password"], input[name="password"]').first();
    if ((await email.count()) && (await password.count())) {
      await email.fill('giftyafisa@gmail.com');
      await password.fill('Vx7!Rk2#Lm9@Qa4');
      await Promise.all([
        page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {}),
        page.locator('button[type="submit"]').first().click(),
      ]);
    }

    await page.goto(`${baseUrl}/messages?conversation=conv-1`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await page.waitForTimeout(1200);

    await page.evaluate(() => {
      const region = document.querySelector('[data-testid="messages-scroll-region"]');
      if (region) region.scrollTop = 0;
      window.scrollTo(0, 0);
    });

    const row = await page.evaluate(() => {
      const toRect = (el) => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };
      };

      const appHeader = document.querySelector('header');
      const chatHeader = document.querySelector('[data-testid="messages-chat-header"]');
      const jump = document.querySelector('[data-testid="messages-jump-latest"]');
      const chips = document.querySelector('[data-testid="messages-quick-replies"]');
      const composer = document.querySelector('[data-testid="messages-composer"]');

      const dayDividers = Array.from(
        document.querySelectorAll('[data-testid="messages-scroll-region"] .MuiChip-root'),
      ).filter((node) => {
        const text = (node.textContent || '').trim();
        return (
          text === 'Today' ||
          text === 'Yesterday' ||
          /\w{3},\s\w{3}\s\d{1,2}/.test(text)
        );
      }).length;

      return {
        appHeader: toRect(appHeader),
        chatHeader: toRect(chatHeader),
        jump: toRect(jump),
        chips: toRect(chips),
        composer: toRect(composer),
        dayDividers,
      };
    });

    report.push({
      breakpoint: vp.key,
      chatHeaderClipped: Boolean(
        row.appHeader && row.chatHeader && row.chatHeader.top < row.appHeader.bottom - 1,
      ),
      jumpOverlapsChips: intersects(row.jump, row.chips),
      jumpOverlapsComposer: intersects(row.jump, row.composer),
      hasDayDivider: row.dayDividers > 0,
    });

    await context.close();
  }
} finally {
  await browser.close();
}

const failed = report.some(
  (item) =>
    item.chatHeaderClipped ||
    item.jumpOverlapsChips ||
    item.jumpOverlapsComposer ||
    !item.hasDayDivider,
);

console.log(JSON.stringify({ failed, report }, null, 2));
process.exit(failed ? 2 : 0);
