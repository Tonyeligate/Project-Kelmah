import searchService from './searchService';
import { api } from '../../../services/apiClient';

jest.mock('../../../services/apiClient', () => ({
  api: {
    get: jest.fn(),
  },
}));

jest.mock('../../worker/services/workerService', () => ({
  __esModule: true,
  default: {
    searchWorkers: jest.fn(),
  },
}));

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('searchService.getSuggestions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    api.get.mockReset();
  });

  afterEach(async () => {
    await searchService.getSuggestions('');
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('reuses the same scheduled request for duplicate queries', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          suggestions: ['plumber'],
        },
      },
    });

    const firstPromise = searchService.getSuggestions('plum', { debounceMs: 10 });
    const secondPromise = searchService.getSuggestions('plum', { debounceMs: 10 });

    expect(firstPromise).toBe(secondPromise);

    jest.advanceTimersByTime(10);
    await flushMicrotasks();

    await expect(firstPromise).resolves.toEqual(['plumber']);
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  test('aborts an inflight request when a newer query arrives', async () => {
    let firstSignal;

    api.get
      .mockImplementationOnce((_url, config) => new Promise((resolve, reject) => {
        firstSignal = config.signal;
        config.signal.addEventListener('abort', () => {
          const error = new Error('canceled');
          error.name = 'CanceledError';
          error.code = 'ERR_CANCELED';
          reject(error);
        }, { once: true });
      }))
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            suggestions: ['plumber'],
          },
        },
      });

    const firstPromise = searchService.getSuggestions('pla', { debounceMs: 10 });
    jest.advanceTimersByTime(10);
    await flushMicrotasks();

    const secondPromise = searchService.getSuggestions('plumber', { debounceMs: 10 });

    expect(firstSignal.aborted).toBe(true);

    jest.advanceTimersByTime(10);
    await flushMicrotasks();

    await expect(firstPromise).resolves.toEqual([]);
    await expect(secondPromise).resolves.toEqual(['plumber']);
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});

describe('searchService normalization contracts', () => {
  beforeEach(() => {
    api.get.mockReset();
  });

  test('search returns an empty array when the payload is an object without array results', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          total: 4,
          page: 1,
        },
      },
    });

    await expect(searchService.search('plumber')).resolves.toEqual([]);
  });

  test('popular terms returns an empty array for malformed payload shapes', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          term: 'plumbing',
        },
      },
    });

    await expect(searchService.getPopularTerms(5)).resolves.toEqual([]);
  });
});