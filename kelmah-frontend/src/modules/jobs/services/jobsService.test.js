/* eslint-env jest */
import jobsService from './jobsService';
import { api } from '../../../services/apiClient';

jest.mock('../../../services/apiClient', () => ({
  api: {
    get: jest.fn(),
  },
}));

jest.mock('../../common/utils/mediaAssets', () => ({
  resolveMediaAssetUrl: jest.fn(() => null),
  resolveMediaAssetUrls: jest.fn(() => []),
  resolveJobVisualUrl: jest.fn(() => null),
  resolveProfileImageUrl: jest.fn(() => null),
}));

describe('jobsService personalized recommendation parsing', () => {
  beforeEach(() => {
    api.get.mockReset();
  });

  test('reads data.jobs from the personalized recommendations payload', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          jobs: [
            {
              _id: 'job-1',
              title: 'Electrical Repairs',
              description: 'Repair faulty switches and wiring.',
              budget: 450,
              currency: 'GHS',
              location: { city: 'Accra' },
              hirer: {
                _id: 'hirer-1',
                name: 'Kelmah Hire',
                verified: true,
              },
            },
          ],
        },
      },
    });

    const jobs = await jobsService.getPersonalizedJobRecommendations({ limit: 2 });

    expect(api.get).toHaveBeenCalledWith('/jobs/recommendations/personalized', {
      params: { limit: 2 },
    });
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toEqual(
      expect.objectContaining({
        id: 'job-1',
        title: 'Electrical Repairs',
      }),
    );
  });
});