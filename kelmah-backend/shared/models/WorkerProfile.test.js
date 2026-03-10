const mongoose = require('mongoose');
const WorkerProfile = require('./WorkerProfile');

describe('WorkerProfile.getResponseRate', () => {
  test('uses the stored responseRate field when available', () => {
    const profile = new WorkerProfile({
      userId: new mongoose.Types.ObjectId(),
      responseRate: 92,
    });

    expect(profile.getResponseRate()).toBe(92);
  });

  test('falls back to legacy message counters when present', () => {
    expect(
      WorkerProfile.schema.methods.getResponseRate.call({
        totalMessagesReceived: 5,
        totalMessagesResponded: 4,
      }),
    ).toBe(80);
  });

  test('returns zero when no stored rate or legacy counters exist', () => {
    const profile = new WorkerProfile({
      userId: new mongoose.Types.ObjectId(),
    });

    expect(profile.getResponseRate()).toBe(0);
  });
});