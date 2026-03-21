import {
  APP_SOCKET_EVENTS,
  MESSAGE_DELIVERY_ALIASES,
  SOCKET_EVENTS,
} from './socketEvents';

describe('socket event registry contracts', () => {
  test('includes canonical realtime domains for message, job, and payment events', () => {
    expect(SOCKET_EVENTS.MESSAGE.NEW_MESSAGE).toBe('new_message');
    expect(SOCKET_EVENTS.JOB.JOB_NOTIFICATION).toBe('job-notification');
    expect(SOCKET_EVENTS.PAYMENT.PAYMENT_NOTIFICATION).toBe('payment-notification');
  });

  test('exposes app-level event names used by listeners', () => {
    expect(APP_SOCKET_EVENTS.MESSAGE_NEW).toBe('message:new');
    expect(APP_SOCKET_EVENTS.JOB_NOTIFICATION).toBe('job:notification');
    expect(APP_SOCKET_EVENTS.PAYMENT_NOTIFICATION).toBe('payment:notification');
  });

  test('tracks message delivery aliases for duplicate-delivery protection', () => {
    expect(MESSAGE_DELIVERY_ALIASES).toEqual(
      expect.arrayContaining(['new_message', 'new-message', 'receive_message']),
    );
  });
});
