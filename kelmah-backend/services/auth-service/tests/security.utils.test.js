const SecurityUtils = require('../utils/security');

describe('SecurityUtils.validateCSRFToken', () => {
  test('returns false instead of throwing for different-length inputs', () => {
    expect(() => SecurityUtils.validateCSRFToken('short', 'much-longer-token')).not.toThrow();
    expect(SecurityUtils.validateCSRFToken('short', 'much-longer-token')).toBe(false);
  });

  test('returns true for equal matching tokens', () => {
    const token = 'csrf-token-value';
    expect(SecurityUtils.validateCSRFToken(token, token)).toBe(true);
  });
});