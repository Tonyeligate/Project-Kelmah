jest.mock('../models', () => ({
  Availability: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

const controller = require('../controllers/availability.controller');
const { Availability } = require('../models');

const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('availability controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getAvailability blocks access when route userId differs from authenticated user', async () => {
    const req = {
      params: { userId: 'worker-2' },
      user: { id: 'worker-1' },
    };
    const res = createMockResponse();

    await controller.getAvailability(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Forbidden' });
    expect(Availability.findOne).not.toHaveBeenCalled();
  });

  test('getAvailability returns default payload when no availability document exists', async () => {
    const lean = jest.fn().mockResolvedValue(null);
    Availability.findOne.mockReturnValue({ lean });

    const req = {
      params: {},
      user: { id: 'worker-5' },
    };
    const res = createMockResponse();

    await controller.getAvailability(req, res);

    expect(Availability.findOne).toHaveBeenCalledWith({ user: 'worker-5' });
    expect(lean).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        user: 'worker-5',
        isAvailable: true,
        daySlots: [],
        holidays: [],
        dailyHours: 8,
      },
    });
  });

  test('upsertAvailability persists only whitelisted fields', async () => {
    Availability.findOneAndUpdate.mockResolvedValue({
      user: 'worker-1',
      timezone: 'UTC',
      isAvailable: false,
      notes: 'Busy this week',
    });

    const req = {
      params: {},
      user: { id: 'worker-1' },
      body: {
        timezone: 'UTC',
        isAvailable: false,
        notes: 'Busy this week',
        admin: true,
        role: 'super-admin',
      },
    };
    const res = createMockResponse();

    await controller.upsertAvailability(req, res);

    const [filter, update, options] = Availability.findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ user: 'worker-1' });
    expect(update.$set).toEqual({
      timezone: 'UTC',
      isAvailable: false,
      notes: 'Busy this week',
    });
    expect(update.$setOnInsert).toEqual({ user: 'worker-1' });
    expect(options).toEqual({ upsert: true, new: true });

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        user: 'worker-1',
        timezone: 'UTC',
        isAvailable: false,
        notes: 'Busy this week',
      },
    });
  });

  test('deleteHoliday removes holiday by date for owner only', async () => {
    Availability.findOneAndUpdate.mockResolvedValue({ user: 'worker-1', holidays: [] });

    const req = {
      params: { userId: 'worker-1', date: '2026-04-03' },
      user: { id: 'worker-1' },
    };
    const res = createMockResponse();

    await controller.deleteHoliday(req, res);

    const [filter, update, options] = Availability.findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ user: 'worker-1' });
    expect(update.$pull.holidays.date).toBeInstanceOf(Date);
    expect(options).toEqual({ new: true });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { user: 'worker-1', holidays: [] },
    });
  });
});

