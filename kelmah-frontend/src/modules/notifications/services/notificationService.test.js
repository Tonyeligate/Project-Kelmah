/* eslint-env jest */
import websocketService from '../../../services/websocketService';
import { APP_SOCKET_EVENTS } from '../../../services/socketEvents';
import { notificationService } from './notificationService';

jest.mock('../../../services/apiClient', () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../../services/websocketService', () => ({
  __esModule: true,
  default: {
    isConnected: false,
    socket: null,
    connect: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}));

describe('notificationService realtime integration', () => {
  beforeEach(() => {
    websocketService.connect.mockReset();
    websocketService.addEventListener.mockReset();
    websocketService.removeEventListener.mockReset();
    websocketService.isConnected = false;
    websocketService.socket = null;
    notificationService.onNotification = null;
    notificationService.disconnect();
  });

  test('subscribes to shared websocket channels and forwards notifications', async () => {
    const handlers = {};
    websocketService.socket = { id: 'socket-1' };
    websocketService.addEventListener.mockImplementation((event, callback) => {
      handlers[event] = callback;
    });

    const onNotification = jest.fn();
    notificationService.onNotification = onNotification;

    await notificationService.connect('token-1', 'user-1', 'hirer');

    expect(websocketService.connect).toHaveBeenCalledWith('user-1', 'hirer', 'token-1');
    expect(websocketService.addEventListener).toHaveBeenCalledTimes(4);

    handlers[APP_SOCKET_EVENTS.PAYMENT_NOTIFICATION]?.({ type: 'payment', amount: 100 });
    expect(onNotification).toHaveBeenCalledWith({ type: 'payment', amount: 100 });
  });

  test('does not subscribe when token is missing', async () => {
    websocketService.socket = { id: 'socket-1' };

    await notificationService.connect(null, 'user-1', 'worker');

    expect(websocketService.connect).not.toHaveBeenCalled();
    expect(websocketService.addEventListener).not.toHaveBeenCalled();
  });

  test('disconnect detaches all previously registered listeners', async () => {
    const handlers = {};
    websocketService.socket = { id: 'socket-1' };
    websocketService.addEventListener.mockImplementation((event, callback) => {
      handlers[event] = callback;
    });

    await notificationService.connect('token-2', 'user-2', 'worker');
    notificationService.disconnect();

    expect(websocketService.removeEventListener).toHaveBeenCalledTimes(4);
    Object.entries(handlers).forEach(([event, handler]) => {
      expect(websocketService.removeEventListener).toHaveBeenCalledWith(event, handler);
    });
  });
});
