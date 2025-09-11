/* eslint-env jest */
import { formatCurrency, getCurrencySymbol } from '../formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    test('formats valid amount with default GHS currency', () => {
      const result = formatCurrency(1234.56);
      expect(result).toBe('₵1,234.56');
    });

    test('formats amount with USD currency', () => {
      const result = formatCurrency(1234.56, 'USD');
      expect(result).toMatch(/\$1,234\.56/);
    });

    test('handles null amount', () => {
      const result = formatCurrency(null);
      expect(result).toBe('₵0.00');
    });

    test('handles undefined amount', () => {
      const result = formatCurrency(undefined);
      expect(result).toBe('₵0.00');
    });

    test('handles NaN amount', () => {
      const result = formatCurrency(NaN);
      expect(result).toBe('₵0.00');
    });

    test('handles invalid currency gracefully', () => {
      const result = formatCurrency(1234.56, 'INVALID');
      expect(result).toBe('INVALID1,234.56');
    });
  });

  describe('getCurrencySymbol', () => {
    test('returns correct symbol for GHS', () => {
      expect(getCurrencySymbol('GHS')).toBe('₵');
    });

    test('returns correct symbol for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    test('returns currency code for unknown currency', () => {
      expect(getCurrencySymbol('UNKNOWN')).toBe('UNKNOWN');
    });
  });
});
