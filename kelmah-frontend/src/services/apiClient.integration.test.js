/* eslint-env jest */

jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    head: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  };

  const mockAxios = {
    create: jest.fn(() => mockAxiosInstance),
    post: jest.fn(),
  };

  return {
    __esModule: true,
    default: mockAxios,
    create: mockAxios.create,
    post: mockAxios.post,
    __mockAxiosInstance: mockAxiosInstance,
  };
});

jest.mock('../config/environment', () => ({
  API_BASE_URL: '/api',
  AUTH_CONFIG: {
    sendAuthHeader: true,
    httpOnlyCookieAuth: false,
    storeTokensClientSide: true,
  },
}));

jest.mock('../utils/secureStorage', () => ({
  secureStorage: {
    getAuthToken: jest.fn(() => 'token-123'),
    getRefreshToken: jest.fn(() => null),
    getUserData: jest.fn(() => null),
    setAuthToken: jest.fn(),
    setRefreshToken: jest.fn(),
    removeItem: jest.fn(),
    clearAuthData: jest.fn(),
  },
}));

jest.mock('./errorTelemetry', () => ({
  captureContractMismatch: jest.fn(),
  captureRecoverableApiError: jest.fn(),
}));

describe('apiClient integration behaviors', () => {
  let api;
  let mockAxiosInstance;
  let requestSuccessHandler;
  let responseSuccessHandler;
  let responseErrorHandler;

  beforeEach(() => {
    jest.resetModules();

    // eslint-disable-next-line global-require
    const axiosModule = require('axios');
    mockAxiosInstance = axiosModule.__mockAxiosInstance;

    mockAxiosInstance.get.mockReset();
    mockAxiosInstance.head.mockReset();
    mockAxiosInstance.post.mockReset();
    mockAxiosInstance.put.mockReset();
    mockAxiosInstance.patch.mockReset();
    mockAxiosInstance.delete.mockReset();

    mockAxiosInstance.interceptors.request.use.mockImplementation((onSuccess) => {
      requestSuccessHandler = onSuccess;
    });
    mockAxiosInstance.interceptors.response.use.mockImplementation((onSuccess, onError) => {
      responseSuccessHandler = onSuccess;
      responseErrorHandler = onError;
    });

    // eslint-disable-next-line global-require
    api = require('./apiClient').api;
  });

  test('adds request id and auth header in request interceptor', async () => {
    const config = await requestSuccessHandler({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer token-123');
    expect(config.headers['X-Request-ID']).toBeTruthy();
  });

  test('deduplicates concurrent GET calls with identical request key', async () => {
    mockAxiosInstance.get.mockResolvedValue({
      data: {
        success: true,
        data: [{ id: 'job-1' }],
      },
    });

    const first = api.get('/jobs', { params: { page: 1, q: 'plumber' } });
    const second = api.get('/jobs', { params: { q: 'plumber', page: 1 } });

    expect(first).toBe(second);

    await expect(first).resolves.toMatchObject({
      data: {
        success: true,
        data: [{ id: 'job-1' }],
      },
    });
    expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
  });

  test('throws normalized envelope error on unsuccessful success:false response', () => {
    expect(() =>
      responseSuccessHandler({
        data: {
          success: false,
          error: { message: 'Envelope failed', code: 'API_CONTRACT_MISMATCH' },
        },
        config: {
          url: '/jobs',
          method: 'get',
        },
      }),
    ).toThrow('Envelope failed');
  });

  test('marks timeout responses as retryable in error interceptor', async () => {
    const timeoutError = {
      code: 'ECONNABORTED',
      message: 'timeout exceeded',
      config: {
        url: '/payments',
        method: 'get',
      },
    };

    await expect(responseErrorHandler(timeoutError)).rejects.toMatchObject({
      isTimeout: true,
      retryable: true,
    });
  });
});
