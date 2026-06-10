const { runWorkerProfileAlignmentAudit } = require('../services/workerProfileAlignment.service');

const buildFindChain = (items) => {
  const chain = {
    sort: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    lean: jest.fn().mockResolvedValue(items),
  };
  return chain;
};

describe('worker profile alignment service', () => {
  test('returns dry-run summary samples without mutating stored documents', async () => {
    const workers = [
      {
        _id: 'worker-1',
        firstName: 'Legacy',
        lastName: 'Worker',
        profession: 'Gardener',
        bio: 'Legacy gardening bio',
        skills: ['gardening', 'landscaping'],
        specializations: ['Landscaping'],
      },
    ];
    const profiles = [
      {
        userId: 'worker-1',
        profession: 'Licensed Electrician',
        bio: 'Professional electrician focused on panel diagnostics.',
        skills: ['wiring'],
        skillEntries: [{ name: 'lighting' }],
        specializations: ['Electrical Work'],
      },
    ];

    const userQuery = buildFindChain(workers);
    const User = {
      find: jest.fn(() => userQuery),
      updateOne: jest.fn(),
    };
    const WorkerProfile = {
      find: jest.fn(() => ({ lean: jest.fn().mockResolvedValue(profiles) })),
      updateOne: jest.fn(),
      create: jest.fn(),
    };

    const result = await runWorkerProfileAlignmentAudit({
      apply: false,
      ensureReady: false,
      sampleSize: 5,
      models: {
        loadModels: jest.fn(),
        User,
        WorkerProfile,
      },
    });

    expect(result.mode).toBe('dry-run');
    expect(result.summary.totalWorkers).toBe(1);
    expect(result.summary.workersNeedingChanges).toBe(1);
    expect(result.summary.userUpdates).toBe(4);
    expect(result.summary.profileUpdates).toBe(0);
    expect(result.samples).toHaveLength(1);
    expect(result.samples[0]).toMatchObject({
      workerId: 'worker-1',
      missingProfile: false,
      userUpdates: {
        profession: 'Licensed Electrician',
        bio: 'Professional electrician focused on panel diagnostics.',
        skills: ['wiring', 'lighting'],
        specializations: ['Electrical Work'],
      },
    });
    expect(User.updateOne).not.toHaveBeenCalled();
    expect(WorkerProfile.updateOne).not.toHaveBeenCalled();
    expect(WorkerProfile.create).not.toHaveBeenCalled();
  });

  test('applies updates and creates missing profiles when requested', async () => {
    const workers = [
      {
        _id: 'worker-2',
        firstName: 'Fresh',
        lastName: 'Worker',
        profession: 'Plumber',
        bio: 'Reliable plumbing worker.',
        skills: ['pipe repair', 'leak detection'],
        specializations: ['Plumbing'],
      },
    ];

    const userQuery = buildFindChain(workers);
    const User = {
      find: jest.fn(() => userQuery),
      updateOne: jest.fn(),
    };
    const WorkerProfile = {
      find: jest.fn(() => ({ lean: jest.fn().mockResolvedValue([]) })),
      updateOne: jest.fn(),
      create: jest.fn(),
    };

    const result = await runWorkerProfileAlignmentAudit({
      apply: true,
      ensureReady: false,
      sampleSize: 5,
      models: {
        loadModels: jest.fn(),
        User,
        WorkerProfile,
      },
    });

    expect(result.mode).toBe('apply');
    expect(result.summary.missingProfiles).toBe(1);
    expect(result.summary.profilesCreated).toBe(1);
    expect(WorkerProfile.create).toHaveBeenCalledWith({
      userId: 'worker-2',
      profession: 'Plumber',
      bio: 'Reliable plumbing worker.',
      skills: ['pipe repair', 'leak detection'],
      specializations: ['Plumbing'],
    });
    expect(User.updateOne).not.toHaveBeenCalled();
  });
});