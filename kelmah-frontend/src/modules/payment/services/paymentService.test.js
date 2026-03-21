/* eslint-env jest */
import paymentService from './paymentService';
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

describe('paymentService contract normalization', () => {
  beforeEach(() => {
    api.get.mockReset();
    api.post.mockReset();
    api.put.mockReset();
    api.patch.mockReset();
    api.delete.mockReset();
    captureRecoverableApiError.mockReset();
  });

  test('normalizes payment methods from API payload', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: [
          {
            _id: 'pm-1',
            methodType: 'mobile_money',
            phoneNumber: '0241112222',
            isDefault: true,
          },
        ],
      },
    });

    const result = await paymentService.getPaymentMethods();

    expect(api.get).toHaveBeenCalledWith('/payments/methods');
    expect(result[0]).toMatchObject({
      id: 'pm-1',
      type: 'mobile_money',
      icon: 'mobile',
      displayValue: '0241112222',
      isDefault: true,
    });
  });

  test('returns [] and captures recoverable telemetry when payment methods fail', async () => {
    const error = new Error('service unavailable');
    api.get.mockRejectedValue(error);

    await expect(paymentService.getPaymentMethods()).resolves.toEqual([]);
    expect(captureRecoverableApiError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        operation: 'payments.getPaymentMethods',
        fallbackUsed: true,
      }),
    );
  });

  test('maps new transaction history envelope format to pagination shape', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          success: true,
          data: [{ id: 'tx-1', amount: 120 }],
          meta: { total: 1, totalPages: 1, currentPage: 1 },
        },
      },
    });

    const result = await paymentService.getTransactionHistory({ page: 1, limit: 20 });

    expect(api.get).toHaveBeenCalledWith('/payments/transactions/history', {
      params: { page: 1, limit: 20 },
    });
    expect(result).toEqual({
      data: [{ id: 'tx-1', amount: 120 }],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        pages: 1,
      },
    });
  });

  test('returns empty escrows and captures telemetry when escrow fetch fails', async () => {
    const error = new Error('escrow down');
    api.get.mockRejectedValue(error);

    await expect(paymentService.getEscrows()).resolves.toEqual([]);
    expect(captureRecoverableApiError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        operation: 'payments.getEscrows',
        fallbackUsed: true,
      }),
    );
  });
});
