const { transformJobForFrontend } = require('../utils/jobTransform');

describe('transformJobForFrontend', () => {
  test('keeps missing populated hirer ids as null', () => {
    const transformed = transformJobForFrontend({
      _id: 'job-1',
      title: 'Fix kitchen sink',
      hirer: {
        firstName: 'Kojo',
        lastName: 'Mensah',
      },
    });

    expect(transformed.hirer).toEqual(
      expect.objectContaining({
        _id: null,
        id: null,
        name: 'Kojo Mensah',
      }),
    );
    expect(transformed.employer.id).toBeNull();
  });

  test('serializes populated hirer ids when present', () => {
    const transformed = transformJobForFrontend({
      _id: 'job-2',
      title: 'Wire a shop',
      hirer: {
        _id: { toString: () => 'hirer-42' },
        firstName: 'Efua',
        lastName: 'Owusu',
      },
    });

    expect(transformed.hirer._id).toBe('hirer-42');
    expect(transformed.hirer.id).toBe('hirer-42');
    expect(transformed.employer.id).toBe('hirer-42');
  });
});