/* eslint-env jest */
import smartSearchService from './smartSearchService';
import { api } from '../../../services/apiClient';

jest.mock('../../../services/apiClient', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('smartSearchService recommendation contracts', () => {
  beforeEach(() => {
    api.get.mockReset();
  });

  test('uses the personalized recommendations endpoint and preserves the current payload shape', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          jobs: [{ id: 'job-1', title: 'Commercial Wiring' }],
          insights: { summary: 'Matched to verified electrical skills.' },
          totalRecommendations: 1,
          averageMatchScore: 88,
        },
        meta: {
          recommendationSource: 'worker-profile',
        },
      },
    });

    const result = await smartSearchService.getSmartJobRecommendations('worker-1', {
      limit: 3,
      minScore: 50,
    });

    expect(api.get).toHaveBeenCalledWith(
      '/jobs/recommendations/personalized',
      expect.objectContaining({
        params: {
          limit: 3,
          minScore: 50,
        },
      }),
    );
    expect(result).toEqual({
      jobs: [{ id: 'job-1', title: 'Commercial Wiring' }],
      insights: { summary: 'Matched to verified electrical skills.' },
      totalRecommendations: 1,
      averageMatchScore: 88,
      recommendationSource: 'worker-profile',
    });
  });

  test('returns a forbidden status envelope when the personalized endpoint rejects non-workers', async () => {
    api.get.mockRejectedValue({
      response: {
        status: 403,
      },
    });

    await expect(
      smartSearchService.getSmartJobRecommendations('hirer-1', { limit: 2 }),
    ).resolves.toEqual({
      jobs: [],
      insights: null,
      status: 'forbidden',
    });
  });
});