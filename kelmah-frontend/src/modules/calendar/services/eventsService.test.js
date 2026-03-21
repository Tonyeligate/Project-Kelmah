/* eslint-env jest */
import eventsService from './eventsService';
import { api } from '../../../services/apiClient';

jest.mock('../../../services/apiClient', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('eventsService contract behavior', () => {
  beforeEach(() => {
    api.get.mockReset();
    api.post.mockReset();
    api.put.mockReset();
    api.delete.mockReset();
  });

  test('falls back from /events to /calendar/events when primary route is missing', async () => {
    api.get
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: [{ id: 'evt-1', title: 'Inspection' }],
        },
      });

    const result = await eventsService.getEvents();

    expect(api.get).toHaveBeenNthCalledWith(1, '/events');
    expect(api.get).toHaveBeenNthCalledWith(2, '/calendar/events');
    expect(result).toEqual([{ id: 'evt-1', title: 'Inspection' }]);
  });

  test('throws normalized envelope errors for failed create responses', async () => {
    api.post.mockResolvedValue({
      data: {
        success: false,
        error: { message: 'Calendar validation failed', code: 'CALENDAR_VALIDATION' },
      },
    });

    await expect(
      eventsService.createEvent({ title: 'Bad Event' }),
    ).rejects.toMatchObject({
      message: 'Calendar validation failed',
      code: 'CALENDAR_VALIDATION',
    });
  });
});
