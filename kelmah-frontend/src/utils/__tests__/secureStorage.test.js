/* eslint-env jest */
// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

let secureStorage;

describe('secureStorage', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    jest.resetModules();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockReturnValue(undefined);
    localStorageMock.removeItem.mockReturnValue(undefined);
    localStorageMock.clear.mockReturnValue(undefined);
    sessionStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.setItem.mockReturnValue(undefined);
    sessionStorageMock.removeItem.mockReturnValue(undefined);
    sessionStorageMock.clear.mockReturnValue(undefined);

    secureStorage = require('../secureStorage').secureStorage;
  });

  describe('setAuthToken', () => {
    test('stores token securely', () => {
      const token = 'test-token-123';
      secureStorage.setAuthToken(token);

      expect(localStorageMock.setItem).toHaveBeenCalled();
      const callArgs = localStorageMock.setItem.mock.calls.find(([key]) => key === 'kelmah_secure_data');
      expect(callArgs[0]).toBe('kelmah_secure_data');
      // Should be encrypted, so not equal to plain token
      expect(callArgs[1]).not.toBe(token);
    });
  });

  describe('getAuthToken', () => {
    test('retrieves and decrypts token', () => {
      const token = 'test-token-123';
      const decryptSpy = jest.spyOn(secureStorage, 'decrypt').mockReturnValue({
        auth_token: {
          value: token,
          timestamp: Date.now(),
          ttl: 2 * 60 * 60 * 1000,
        },
        _timestamp: Date.now(),
        _version: '1.0',
      });
      localStorageMock.getItem.mockImplementation((key) => (key === 'kelmah_secure_data' ? 'encrypted-payload' : null));

      const retrievedToken = secureStorage.getAuthToken();
      expect(retrievedToken).toBe(token);
      decryptSpy.mockRestore();
    });

    test('returns null when no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const token = secureStorage.getAuthToken();
      expect(token).toBeNull();
    });
  });

  describe('session scoped auth', () => {
    test('stores auth token in session storage when remember me is disabled', () => {
      secureStorage.setAuthToken('session-token', { persistent: false });

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'kelmah_secure_session_data',
        expect.any(String),
      );
    });
  });

  describe('clear', () => {
    test('clears all stored data', () => {
      secureStorage.setAuthToken('token');
      secureStorage.clear();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kelmah_secure_data');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('kelmah_secure_session_data');
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('kelmah_encryption_secret');
    });
  });
});
