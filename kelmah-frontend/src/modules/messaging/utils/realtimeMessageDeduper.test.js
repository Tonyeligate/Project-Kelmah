import {
  buildRealtimeMessageKey,
  createRealtimeMessageDeduper,
} from './realtimeMessageDeduper';

describe('realtimeMessageDeduper contracts', () => {
  test('buildRealtimeMessageKey supports common realtime payload id shapes', () => {
    expect(
      buildRealtimeMessageKey({
        messageId: 'msg-1',
        conversation_id: 'conv-1',
      }),
    ).toBe('conv-1:msg-1');

    expect(
      buildRealtimeMessageKey({
        _id: 'msg-2',
        conversation: { _id: 'conv-2' },
      }),
    ).toBe('conv-2:msg-2');

    expect(
      buildRealtimeMessageKey({
        id: 'msg-3',
        conversationId: 'conv-3',
      }),
    ).toBe('conv-3:msg-3');

    expect(
      buildRealtimeMessageKey({
        id: 'server-msg-4',
        clientId: 'client-msg-4',
        conversationId: 'conv-4',
      }),
    ).toBe('conv-4:client-msg-4');
  });

  test('returns null when payload has no stable message id', () => {
    expect(buildRealtimeMessageKey({ conversationId: 'conv-1' })).toBeNull();
  });

  test('marks duplicate deliveries across aliased events', () => {
    const deduper = createRealtimeMessageDeduper();
    const firstDelivery = {
      id: 'server-msg-9',
      clientId: 'client-msg-9',
      conversationId: 'conv-9',
      content: 'hello',
    };

    const secondDelivery = {
      id: 'server-msg-9-b',
      clientId: 'client-msg-9',
      conversation_id: 'conv-9',
      content: 'hello',
    };

    expect(deduper.mark(firstDelivery, 1000)).toBe(false);
    expect(deduper.mark(secondDelivery, 1001)).toBe(true);
  });

  test('allows re-processing after TTL expiration', () => {
    const deduper = createRealtimeMessageDeduper(1000);
    const payload = { id: 'msg-10', conversationId: 'conv-10' };

    expect(deduper.mark(payload, 1000)).toBe(false);
    expect(deduper.mark(payload, 2501)).toBe(false);
  });
});
