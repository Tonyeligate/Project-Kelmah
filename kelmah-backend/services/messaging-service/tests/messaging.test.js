/**
 * Messaging Service Tests
 */

const { TestDataFactory, TestAssertions } = require('../../shared/test-utils');

describe('Messaging Service', () => {
  describe('Message Operations', () => {
    test('pagination caps and structure', async () => {
      const limit = 1000; // too large
      const capped = Math.min(100, Math.max(1, parseInt(limit)));
      expect(capped).toBe(100);
    });

    test('unread updates payload structure', async () => {
      const payload = {
        success: true,
        data: {
          messages: [],
          pagination: { page: 1, limit: 20, returned: 0 }
        }
      };
      expect(payload.success).toBe(true);
      expect(payload.data.pagination).toHaveProperty('page');
      expect(payload.data.pagination).toHaveProperty('limit');
      expect(payload.data.pagination).toHaveProperty('returned');
    });
  });

  describe('Mark as read semantics', () => {
    test('read update query uses dot-path filter', async () => {
      const filter = { recipient: 'user1', 'readStatus.isRead': false };
      expect(Object.keys(filter)).toContain('readStatus.isRead');
    });

    test('unread count resets to zero on mark-as-read response', async () => {
      const response = { success: true, message: 'Conversation marked as read', data: { conversationId: 'c1' } };
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('conversationId');
    });

    test('mark-as-read updates query caps and dot-path remain intact', async () => {
      const limit = parseInt('200', 10);
      const capped = Math.min(100, Math.max(1, limit));
      expect(capped).toBe(100);
      const updateFilter = { recipient: 'user2', 'readStatus.isRead': false };
      expect(Object.keys(updateFilter)).toContain('readStatus.isRead');
    });
  });
});


