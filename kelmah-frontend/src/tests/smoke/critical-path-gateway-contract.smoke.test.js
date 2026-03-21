/* eslint-env jest */

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  default: {},
}));

jest.mock('../../modules/common/services/fileUploadService', () => ({
  __esModule: true,
  default: {
    uploadFile: jest.fn(),
  },
}));

jest.mock('../../services/errorTelemetry', () => ({
  captureRecoverableApiError: jest.fn(),
}));

jest.mock('../../utils/secureStorage', () => ({
  __esModule: true,
  secureStorage: {
    setAuthToken: jest.fn(),
    setRefreshToken: jest.fn(),
    setUserData: jest.fn(),
    removeItem: jest.fn(),
    clearAuthData: jest.fn(),
    getRefreshToken: jest.fn(),
    getUserData: jest.fn(),
    getAuthToken: jest.fn(),
  },
  default: {
    setAuthToken: jest.fn(),
    setRefreshToken: jest.fn(),
    setUserData: jest.fn(),
    removeItem: jest.fn(),
    clearAuthData: jest.fn(),
    getRefreshToken: jest.fn(),
    getUserData: jest.fn(),
    getAuthToken: jest.fn(),
  },
}));

jest.mock('../../utils/userUtils', () => ({
  normalizeUser: (user) => user,
}));

jest.mock('../../config/environment', () => ({
  AUTH_CONFIG: {
    storeTokensClientSide: true,
    httpOnlyCookieAuth: false,
  },
}));

const mockResponse = { data: { success: true, data: {} } };

const { api } = require('../../services/apiClient');
const authService = require('../../modules/auth/services/authService').default;
const searchService = require('../../modules/search/services/searchService').default;
const paymentService = require('../../modules/payment/services/paymentService').default;
const { contractService } = require('../../modules/contracts/services/contractService');
const quickJobService = require('../../modules/quickjobs/services/quickJobService').default;

describe('critical-path gateway contract smoke suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue(mockResponse);
    api.post.mockResolvedValue(mockResponse);
    api.put.mockResolvedValue(mockResponse);
    api.delete.mockResolvedValue(mockResponse);
  });

  test('search requests stay on gateway relative route namespace', async () => {
    await searchService.search('carpenter', { location: 'Accra' });

    expect(api.get).toHaveBeenCalled();
    const [path] = api.get.mock.calls[0];
    expect(path).toBe('/search');
    expect(path.startsWith('/')).toBe(true);
  });

  test('quick-hire request creation uses gateway-backed quick-jobs route', async () => {
    await quickJobService.createQuickJob({
      title: 'Fix leaking pipe',
      category: 'plumbing',
    });

    expect(api.post).toHaveBeenCalledWith('/quick-jobs', expect.any(Object));
  });

  test('contracts listing uses canonical jobs contracts gateway route', async () => {
    await contractService.getContracts({ status: 'active' });

    expect(api.get).toHaveBeenCalledWith('/jobs/contracts', expect.any(Object));
  });

  test('wallet fetch uses payment gateway route', async () => {
    await paymentService.getWallet();

    expect(api.get).toHaveBeenCalledWith('/payments/wallet');
  });

  test('milestone approval route remains canonical under direct path', async () => {
    await contractService.approveMilestone('contract-123', 'milestone-1');

    expect(api.put).toHaveBeenCalledWith(
      '/jobs/contracts/contract-123/milestones/milestone-1/approve',
      { status: 'approved' },
    );
  });

  test('auth login uses canonical gateway auth route', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          token: 'token-123',
          refreshToken: 'refresh-123',
          user: { id: 'u-1', email: 'giftyafisa@gmail.com', role: 'hirer' },
        },
      },
    });

    const result = await authService.login({
      email: 'giftyafisa@gmail.com',
      password: 'Vx7!Rk2#Lm9@Qa4',
    });

    expect(api.post).toHaveBeenCalledWith('/auth/login', expect.any(Object));
    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('giftyafisa@gmail.com');
  });

  test('auth verification uses canonical gateway auth verify route', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user: { id: 'u-1', email: 'giftyafisa@gmail.com', role: 'hirer' },
        },
      },
    });

    const result = await authService.verifyAuth();

    expect(api.get).toHaveBeenCalledWith('/auth/verify');
    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('giftyafisa@gmail.com');
  });
});
