const { createOriginMatcher } = require('./corsPolicy');

describe('createOriginMatcher', () => {
  it('allows known production origins in production', () => {
    const { isAllowedOrigin } = createOriginMatcher({ nodeEnv: 'production' });

    expect(isAllowedOrigin('https://project-kelmah.vercel.app')).toBe(true);
    expect(isAllowedOrigin('https://kelmah-frontend.vercel.app')).toBe(true);
  });

  it('allows Kelmah Vercel preview origins in production', () => {
    const { isAllowedOrigin } = createOriginMatcher({ nodeEnv: 'production' });

    expect(isAllowedOrigin('https://project-kelmah-git-main-kelmah.vercel.app')).toBe(true);
    expect(isAllowedOrigin('https://kelmah-frontend-git-main-kelmah.vercel.app')).toBe(true);
    expect(isAllowedOrigin('https://kelmah-git-main-kelmah.vercel.app')).toBe(true);
  });

  it('rejects unrelated Vercel preview origins', () => {
    const { isAllowedOrigin } = createOriginMatcher({ nodeEnv: 'production' });

    expect(isAllowedOrigin('https://unrelated-preview.vercel.app')).toBe(false);
    expect(isAllowedOrigin('https://another-team-git-main.vercel.app')).toBe(false);
  });
});