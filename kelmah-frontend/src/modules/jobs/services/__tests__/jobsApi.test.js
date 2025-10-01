jest.mock('../../../../modules/common/services/axios');

describe('jobsApi application alias', () => {
  it('exposes applyForJob alias mapped to applyToJob', async () => {
    const { default: jobsApi } = await import('../jobsApi.js');
    expect(typeof jobsApi.applyForJob).toBe('function');
    expect(jobsApi.applyForJob).toBe(jobsApi.applyToJob);
  });
});
