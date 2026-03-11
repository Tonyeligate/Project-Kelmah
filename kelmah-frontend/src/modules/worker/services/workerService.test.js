/* eslint-env jest */
import workerService from './workerService';
import { api } from '../../../services/apiClient';

jest.mock('../../../services/apiClient', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('workerService directory contracts', () => {
  beforeEach(() => {
    api.get.mockReset();
  });

  test('queryWorkerDirectory uses the canonical search endpoint and query vocabulary', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          workers: [
            {
              _id: 'worker-1',
              firstName: 'Ama',
              lastName: 'Osei',
              profession: 'Electrician',
              location: 'Accra, Ghana',
              skills: ['Wiring'],
              availabilityStatus: 'available',
            },
          ],
          pagination: {
            page: 2,
            limit: 4,
            total: 1,
            pages: 1,
          },
        },
      },
    });

    const result = await workerService.queryWorkerDirectory({
      page: 2,
      limit: 4,
      query: 'electrician',
      location: 'Accra, Ghana',
      trade: 'Electrical Work',
      workType: 'Full-time',
      minRating: 4,
      verifiedOnly: true,
      sortBy: 'rating',
    });

    expect(api.get).toHaveBeenCalledWith(
      '/users/workers/search',
      expect.objectContaining({
        params: expect.objectContaining({
          page: 2,
          limit: 4,
          query: 'electrician',
          location: 'Accra',
          primaryTrade: 'Electrical Work',
          workType: 'Full-time',
          minRating: 4,
          verified: 'true',
          sortBy: 'rating',
        }),
      }),
    );

    expect(result.workers).toEqual([
      expect.objectContaining({
        userId: 'worker-1',
        name: 'Ama Osei',
        profession: 'Electrician',
      }),
    ]);
    expect(result.pagination).toEqual(
      expect.objectContaining({
        page: 2,
        limit: 4,
        totalItems: 1,
      }),
    );
  });

  test('getWorkerSearchSuggestions derives suggestions from public worker search results', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          workers: [
            {
              _id: 'worker-1',
              firstName: 'Ama',
              lastName: 'Osei',
              profession: 'Licensed Electrician',
              location: 'Accra, Ghana',
              skills: ['Wiring', 'Lighting'],
            },
          ],
          pagination: {
            page: 1,
            limit: 5,
            total: 1,
            pages: 1,
          },
        },
      },
    });

    const suggestions = await workerService.getWorkerSearchSuggestions('wiri');

    expect(api.get).toHaveBeenCalledWith(
      '/users/workers/search',
      expect.objectContaining({
        params: expect.objectContaining({
          query: 'wiri',
          page: 1,
          limit: 5,
          sortBy: 'relevance',
        }),
      }),
    );
    expect(suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'search',
          text: 'Licensed Electrician',
        }),
        expect.objectContaining({
          type: 'skill',
          text: 'Wiring',
        }),
      ]),
    );
  });
});