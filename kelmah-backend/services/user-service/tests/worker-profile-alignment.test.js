const {
  buildAuthoritativeWorkerSummary,
  calculateWorkerProfileAlignment,
} = require('../../../shared/utils/workerProfileAlignment');

describe('worker profile alignment utility', () => {
  test('prefers worker-profile summary fields when both documents differ', () => {
    const userDoc = {
      _id: 'worker-1',
      profession: 'Gardener',
      bio: 'Legacy gardening bio',
      skills: ['gardening', 'landscaping'],
      specializations: ['Landscaping'],
    };

    const workerProfileDoc = {
      userId: 'worker-1',
      profession: 'Licensed Electrician',
      bio: 'Professional electrician focused on panel diagnostics.',
      skills: ['wiring'],
      skillEntries: [{ name: 'lighting' }],
      specializations: ['Electrical Work'],
    };

    expect(buildAuthoritativeWorkerSummary(userDoc, workerProfileDoc)).toEqual({
      profession: 'Licensed Electrician',
      bio: 'Professional electrician focused on panel diagnostics.',
      skills: ['wiring', 'lighting'],
      specializations: ['Electrical Work'],
      sources: expect.objectContaining({
        profession: 'workerProfile',
        bio: 'workerProfile',
        skills: 'workerProfile',
        specializations: 'workerProfile',
      }),
    });

    const alignment = calculateWorkerProfileAlignment(userDoc, workerProfileDoc);
    expect(alignment.hasChanges).toBe(true);
    expect(alignment.userUpdates).toEqual({
      profession: 'Licensed Electrician',
      bio: 'Professional electrician focused on panel diagnostics.',
      skills: ['wiring', 'lighting'],
      specializations: ['Electrical Work'],
    });
    expect(alignment.profileUpdates).toEqual({});
  });

  test('backfills a missing profile from user-owned summary fields', () => {
    const userDoc = {
      _id: 'worker-2',
      profession: 'Plumber',
      bio: 'Reliable plumbing worker.',
      skills: ['pipe repair', 'leak detection'],
      specializations: ['Plumbing'],
    };

    const alignment = calculateWorkerProfileAlignment(userDoc, null);
    expect(alignment.missingProfile).toBe(true);
    expect(alignment.profileCreate).toEqual({
      userId: 'worker-2',
      profession: 'Plumber',
      bio: 'Reliable plumbing worker.',
      skills: ['pipe repair', 'leak detection'],
      specializations: ['Plumbing'],
    });
  });
});