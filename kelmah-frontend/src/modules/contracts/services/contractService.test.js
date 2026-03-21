/* eslint-env jest */
import { contractService } from './contractService';
import { api } from '../../../services/apiClient';
import { captureRecoverableApiError } from '../../../services/errorTelemetry';

jest.mock('../../../services/apiClient', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../../services/errorTelemetry', () => ({
  captureRecoverableApiError: jest.fn(),
}));

describe('contractService endpoint and fallback contracts', () => {
  beforeEach(() => {
    api.get.mockReset();
    api.post.mockReset();
    api.put.mockReset();
    api.patch.mockReset();
    api.delete.mockReset();
    captureRecoverableApiError.mockReset();
  });

  test('gets contracts from canonical /jobs/contracts base path', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          contracts: [
            {
              _id: 'contract-1',
              title: 'Install piping',
              value: 2500,
            },
          ],
        },
      },
    });

    const result = await contractService.getContracts();

    expect(api.get).toHaveBeenCalledWith('/jobs/contracts', { params: {} });
    expect(result[0]).toMatchObject({
      id: 'contract-1',
      title: 'Install piping',
      value: 2500,
    });
  });

  test('approveMilestone uses canonical milestone approve endpoint', async () => {
    api.put.mockResolvedValue({
      data: {
        success: true,
        data: { approved: true },
      },
    });

    const result = await contractService.approveMilestone('contract-11', 'milestone-2');

    expect(api.put).toHaveBeenCalledWith(
      '/jobs/contracts/contract-11/milestones/milestone-2/approve',
      { status: 'approved' },
    );
    expect(result).toEqual({ approved: true });
  });

  test('approveMilestone falls back to generic update when direct route fails', async () => {
    const directError = new Error('route not found');
    directError.response = { status: 404 };

    api.put
      .mockRejectedValueOnce(directError)
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: { success: true },
        },
      });

    const result = await contractService.approveMilestone('contract-22', 'milestone-9');

    expect(api.put).toHaveBeenNthCalledWith(
      2,
      '/jobs/contracts/contract-22',
      {
        milestoneId: 'milestone-9',
        milestoneStatus: 'approved',
      },
    );
    expect(captureRecoverableApiError).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  test('approveMilestone guards invalid route ids before API calls', async () => {
    await expect(contractService.approveMilestone('', 'milestone-1')).rejects.toThrow(
      'Valid contractId and milestoneId are required',
    );

    expect(api.put).not.toHaveBeenCalled();
  });
});
