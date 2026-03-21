/* eslint-env jest */
import { renderHook, act } from '@testing-library/react';
import { useSelector } from 'react-redux';
import websocketService from '../../services/websocketService';
import { secureStorage } from '../../utils/secureStorage';
import useWebSocketConnect from '../useWebSocketConnect';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../services/websocketService', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
}));

jest.mock('../../utils/secureStorage', () => ({
  secureStorage: {
    getAuthToken: jest.fn(),
  },
}));

describe('useWebSocketConnect auth transition behavior', () => {
  let authState;

  beforeEach(() => {
    authState = {
      isAuthenticated: false,
      user: null,
    };

    useSelector.mockImplementation((selector) =>
      selector({ auth: authState }),
    );

    websocketService.connect.mockReset();
    websocketService.disconnect.mockReset();
    secureStorage.getAuthToken.mockReset();
  });

  test('connects shared websocket when user is authenticated', () => {
    authState = {
      isAuthenticated: true,
      user: { id: 'user-1', role: 'hirer' },
    };
    secureStorage.getAuthToken.mockReturnValue('token-1');

    renderHook(() => useWebSocketConnect());

    expect(websocketService.connect).toHaveBeenCalledWith('user-1', 'hirer', 'token-1');
  });

  test('disconnects when auth transitions to logged out', () => {
    authState = {
      isAuthenticated: true,
      user: { id: 'user-1', role: 'worker' },
    };
    secureStorage.getAuthToken.mockReturnValue('token-1');

    const { rerender } = renderHook(() => useWebSocketConnect());

    authState = {
      isAuthenticated: false,
      user: null,
    };

    act(() => {
      rerender();
    });

    expect(websocketService.disconnect).toHaveBeenCalled();
  });

  test('reconnects when authenticated user identity changes', () => {
    authState = {
      isAuthenticated: true,
      user: { id: 'user-1', role: 'worker' },
    };
    secureStorage.getAuthToken.mockReturnValue('token-1');

    const { rerender } = renderHook(() => useWebSocketConnect());

    authState = {
      isAuthenticated: true,
      user: { id: 'user-2', role: 'hirer' },
    };
    secureStorage.getAuthToken.mockReturnValue('token-2');

    act(() => {
      rerender();
    });

    expect(websocketService.disconnect).toHaveBeenCalledTimes(1);
    expect(websocketService.connect).toHaveBeenCalledTimes(2);
    expect(websocketService.connect).toHaveBeenLastCalledWith('user-2', 'hirer', 'token-2');
  });
});
