/* eslint-env jest */
import { secureStorage } from '../secureStorage';

// Mock localStorage
const localStorageMock = {
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

describe('secureStorage', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockReturnValue(undefined);
    localStorageMock.removeItem.mockReturnValue(undefined);
    localStorageMock.clear.mockReturnValue(undefined);
  });

  describe('setAuthToken', () => {
    test('stores token securely', () => {
      const token = 'test-token-123';
      secureStorage.setAuthToken(token);

      expect(localStorageMock.setItem).toHaveBeenCalled();
      const callArgs = localStorageMock.setItem.mock.calls[0];
      expect(callArgs[0]).toBe('kelmah_secure_data');
      // Should be encrypted, so not equal to plain token
      expect(callArgs[1]).not.toBe(token);
    });
  });

  describe('getAuthToken', () => {
    test('retrieves and decrypts token', () => {
      const token = 'test-token-123';
      secureStorage.setAuthToken(token);

      // Mock the encrypted data retrieval
      const mockEncryptedData = localStorageMock.setItem.mock.calls[0][1];
      localStorageMock.getItem.mockReturnValue(mockEncryptedData);

      const retrievedToken = secureStorage.getAuthToken();
      expect(retrievedToken).toBe(token);
    });

    test('returns null when no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const token = secureStorage.getAuthToken();
      expect(token).toBeNull();
    });
  });

  describe('clear', () => {
    test('clears all stored data', () => {
      secureStorage.setAuthToken('token');
      secureStorage.clear();

      expect(localStorageMock.clear).toHaveBeenCalled();
    });
  });
});
