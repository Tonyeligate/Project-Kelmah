const WorkerProfile = require('../../../shared/models/WorkerProfile');

describe('WorkerProfile shared schema', () => {
  test('declares root fields persisted by worker profile updates', () => {
    const schema = WorkerProfile.schema;

    expect(schema.path('profession')).toBeDefined();
    expect(schema.path('title')).toBeDefined();
    expect(schema.path('headline')).toBeDefined();
    expect(schema.path('tagline')).toBeDefined();
    expect(schema.path('education')).toBeDefined();
    expect(schema.path('profilePicture')).toBeDefined();
  });

  test('registers worker directory compound indexes', () => {
    const indexSpecs = WorkerProfile.schema.indexes().map(([spec]) => spec);

    expect(indexSpecs).toEqual(expect.arrayContaining([
      expect.objectContaining({ profession: 1 }),
      expect.objectContaining({ title: 1 }),
      expect.objectContaining({ latitude: 1, longitude: 1 }),
      expect.objectContaining({ availabilityStatus: 1, isVerified: -1, rating: -1, totalJobsCompleted: -1, updatedAt: -1 }),
      expect.objectContaining({ availabilityStatus: 1, hourlyRate: 1, rating: -1, updatedAt: -1 }),
      expect.objectContaining({ isVerified: 1, rating: -1, totalJobsCompleted: -1, updatedAt: -1 }),
    ]));
  });
});