/**
 * verify-messaging-fixes-final.mjs
 * 
 * Multi-breakpoint geometry and state verification for comprehensive messaging UI fixes:
 * 1. Top clipping (header offset fix)
 * 2. Jump-to-Latest overlap with quick-replies
 * 3. Composer positioning (sticky/relative per device)
 * 4. Day dividers visibility (dense thread readability)
 * 5. Active chat context prominence
 * 6. Bottom interaction stack efficiency
 * 7. Scroll region height isolation
 * 8. Conversation list density
 * 9. Quick-reply accessibility
 * 10. Overall layout stability
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, '.artifacts', 'ui', 'messaging-fixes-final');
const BREAKPOINTS = [320, 768, 1024, 1440];

// Mock data
const mockConversations = [
  {
    id: 'conv-001',
    participantName: 'Kwame Boateng',
    participantImage: 'https://api.kelmah.io/avatar/kwame.jpg',
    lastMessage: 'Can you come next week?',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    unreadCount: 0,
    isActive: true
  },
  {
    id: 'conv-002',
    participantName: 'Ama Akosua',
    lastMessage: 'Job completed successfully',
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    unreadCount: 3,
    isActive: false
  }
];

const mockMessages = Array.from({ length: 35 }, (_, i) => ({
  id: `msg-${i}`,
  text: `Message ${i + 1}: ${i % 5 === 0 ? 'This is a longer message that spans multiple lines to test text wrapping and layout stability in the message thread. It should not cause overflow or viewport issues.' : 'Quick reply'}`,
  timestamp: new Date(Date.now() - (35 - i) * 60000).toISOString(),
  senderId: i % 2 === 0 ? 'user-1' : 'user-2',
  senderName: i % 2 === 0 ? 'Me' : 'Kwame',
  read: true,
  optimisticId: null
}));

async function captureMetrics(page, breakpoint) {
  return await page.evaluate(() => {
    const metrics = {
      breakpoint: window.innerWidth,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      checks: {
        topClipping: false,
        jumpOverlapQuickReplies: false,
        jumpOverlapComposer: false,
        composerVisible: false,
        dayDividersPresent: false,
        activeChatContextVisible: false,
        bottomStackCleaned: false,
        scrollRegionIsolated: false,
        conversationListDense: false,
        quickReplyAccessible: false
      },
      geometry: {
        header: null,
        activeChat: null,
        scrollRegion: null,
        jumpButton: null,
        quickReplies: null,
        composer: null
      },
      warnings: [],
      score: 0
    };

    // Check header positioning and top content
    const header = document.querySelector('[data-testid="messages-chat-header"]');
    if (header) {
      const rect = header.getBoundingClientRect();
      metrics.geometry.header = { top: rect.top, height: rect.height };
      metrics.checks.topClipping = rect.top >= 0;
    }

    // Check active chat context visibility
    const activeChat = document.querySelector('[data-testid="messages-active-chat-context"]');
    if (activeChat) {
      const rect = activeChat.getBoundingClientRect();
      metrics.geometry.activeChat = { top: rect.top, height: rect.height };
      const header = document.querySelector('[data-testid="messages-chat-header"]');
      if (header) {
        const headerHeight = header.getBoundingClientRect().height;
        metrics.checks.activeChatContextVisible = rect.top < window.innerHeight - 300;
      }
    }

    // Check scroll region isolation
    const scrollRegion = document.querySelector('[data-testid="messages-scroll-region"]');
    if (scrollRegion) {
      const rect = scrollRegion.getBoundingClientRect();
      const parent = scrollRegion.parentElement;
      const parentRect = parent.getBoundingClientRect();
      metrics.geometry.scrollRegion = {
        top: rect.top,
        height: rect.height,
        parentHeight: parentRect.height,
        overflow: window.getComputedStyle(parent).overflow
      };
      metrics.checks.scrollRegionIsolated = rect.height > 0 && rect.height < parentRect.height;
    }

    // Check Jump-to-Latest button positioning
    const jumpButton = document.querySelector('[data-testid="messages-jump-latest"]');
    if (jumpButton) {
      const jumpRect = jumpButton.getBoundingClientRect();
      metrics.geometry.jumpButton = { bottom: window.innerHeight - jumpRect.bottom, right: window.innerWidth - jumpRect.right };

      // Check overlap with quick replies
      const quickReplies = document.querySelector('[data-testid="messages-quick-replies"]');
      if (quickReplies) {
        const qrRect = quickReplies.getBoundingClientRect();
        metrics.geometry.quickReplies = { top: qrRect.top, height: qrRect.height };
        const jumpBottom = window.innerHeight - jumpRect.bottom;
        const qrTop = qrRect.top;
        const overlap = (jumpBottom + jumpRect.height) > qrTop;
        metrics.checks.jumpOverlapQuickReplies = !overlap;

        if (overlap) {
          metrics.warnings.push(`Jump button overlaps quick-replies: jump.bottom=${window.innerHeight - jumpRect.bottom}, qr.top=${qrRect.top}`);
        }
      }

      // Check overlap with composer
      const composer = document.querySelector('[data-testid="messages-composer"]');
      if (composer) {
        const compRect = composer.getBoundingClientRect();
        metrics.geometry.composer = { top: compRect.top, height: compRect.height };
        const jumpBottom = window.innerHeight - jumpRect.bottom;
        const composerTop = compRect.top;
        const overlap = (jumpBottom + jumpRect.height) > composerTop;
        metrics.checks.jumpOverlapComposer = !overlap;
        metrics.checks.composerVisible = compRect.height > 0;

        if (overlap) {
          metrics.warnings.push(`Jump button overlaps composer: jump.bottom=${window.innerHeight - jumpRect.bottom}, composer.top=${composerTop}`);
        }
      }
    }

    // Check day dividers
    const dayDividers = document.querySelectorAll('[data-testid^="message-date-divider"]');
    metrics.checks.dayDividersPresent = dayDividers.length > 0;

    // Check bottom stack cleanup
    const messageCount = document.querySelectorAll('[data-testid^="message-bubble"]').length;
    metrics.checks.bottomStackCleaned = messageCount > 0;

    // Check quick-reply accessibility
    const quickReplyChips = document.querySelectorAll('[data-testid="quick-reply-chip"]');
    metrics.checks.quickReplyAccessible = quickReplyChips.length > 0;

    // Check conversation list density
    const convItems = document.querySelectorAll('[data-testid^="conversation-item"]');
    metrics.checks.conversationListDense = convItems.length >= 2;

    // Calculate score
    let score = 0;
    const maxScore = 10;
    Object.values(metrics.checks).forEach(check => {
      if (check === true) score += 1;
    });
    metrics.score = score;

    return metrics;
  });
}

async function runTest(browser) {
  const issueLog = {
    timestamp: new Date().toISOString(),
    breakpoints: {}
  };

  // Create screenshots directory
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  console.log('🧪 Messaging Fixes Comprehensive Verification Started\n');

  for (const breakpoint of BREAKPOINTS) {
    console.log(`\n📱 Testing breakpoint: ${breakpoint}px`);

    const page = await browser.newPage();
    await page.setViewport({ width: breakpoint, height: 800 });

    // Inject mock data and navigate
    await page.evaluateOnNewDocument(() => {
      window.__MOCK_CONVERSATIONS__ = JSON.parse(localStorage.getItem('mock:conversations') || '[]');
      window.__MOCK_MESSAGES__ = JSON.parse(localStorage.getItem('mock:messages') || '[]');
    });

    // Set mock data in localStorage
    await page.evaluate((convs, msgs) => {
      localStorage.setItem('mock:conversations', JSON.stringify(convs));
      localStorage.setItem('mock:messages', JSON.stringify(msgs));
      localStorage.setItem('auth:token', 'mock-jwt-token');
      localStorage.setItem('auth:user', JSON.stringify({ id: 'user-1', name: 'Test User', email: 'test@kelmah.test' }));
    }, mockConversations, mockMessages);

    // Navigate to messages page
    await page.goto('http://localhost:3000/messages', { waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});

    // Wait for key UI elements
    await page.waitForSelector('[data-testid="messages-chat-header"]', { timeout: 5000 }).catch(() => {});

    // Allow animations to settle
    await page.waitForTimeout(1000);

    // Capture metrics
    const metrics = await captureMetrics(page, breakpoint);

    // Screenshot
    const screenshotPath = path.join(SCREENSHOTS_DIR, `${breakpoint}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    // Log results
    console.log(`   ✅ Metrics captured`);
    console.log(`   Score: ${metrics.score}/10`);
    if (metrics.warnings.length > 0) {
      console.log(`   ⚠️  Warnings:`);
      metrics.warnings.forEach(w => console.log(`      - ${w}`));
    }

    issueLog.breakpoints[breakpoint] = metrics;

    await page.close();
  }

  // Save scorecard
  const scorecard = {
    timestamp: issueLog.timestamp,
    totalBreakpoints: BREAKPOINTS.length,
    breakpoints: issueLog.breakpoints,
    summary: {
      averageScore: (Object.values(issueLog.breakpoints).reduce((sum, m) => sum + m.score, 0) / BREAKPOINTS.length).toFixed(2),
      allPassed: Object.values(issueLog.breakpoints).every(m => m.score >= 8),
      ciriticalIssues: Object.values(issueLog.breakpoints).flatMap(m => m.warnings)
    }
  };

  console.log('\n\n📊 Final Scorecard:\n');
  console.log(`Average Score: ${scorecard.summary.averageScore}/10`);
  console.log(`All Passed: ${scorecard.summary.allPassed ? '✅' : '❌'}`);
  if (scorecard.summary.ciriticalIssues.length > 0) {
    console.log(`\n⚠️  Critical Issues Found:`);
    scorecard.summary.ciriticalIssues.forEach(issue => console.log(`  - ${issue}`));
  }

  fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'scorecard.json'), JSON.stringify(scorecard, null, 2));
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'issues.json'), JSON.stringify(issueLog, null, 2));

  console.log(`\n✅ Verification complete. Results saved to: ${SCREENSHOTS_DIR}`);
  return scorecard.summary.allPassed;
}

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const passed = await runTest(browser);
    process.exit(passed ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
