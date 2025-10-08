import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrency, extractCurrencyFromText } from '@/lib/currency';

describe('Currency utilities', () => {
  describe('formatCurrency', () => {
    it('formats cents to USD currency string', () => {
      expect(formatCurrency(100)).toBe('$1.00');
      expect(formatCurrency(150)).toBe('$1.50');
      expect(formatCurrency(1000)).toBe('$10.00');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(1)).toBe('$0.01');
    });
  });

  describe('parseCurrency', () => {
    it('parses simple numeric strings to cents', () => {
      expect(parseCurrency('10.50')).toBe(1050);
      expect(parseCurrency('100')).toBe(10000);
      expect(parseCurrency('0.99')).toBe(99);
    });

    it('removes currency symbols and commas', () => {
      expect(parseCurrency('$10.50')).toBe(1050);
      expect(parseCurrency('$1,000.00')).toBe(100000);
      expect(parseCurrency('1,000.50')).toBe(100050);
    });

    it('returns 0 for invalid input', () => {
      expect(parseCurrency('')).toBe(0);
      expect(parseCurrency('abc')).toBe(0);
      expect(parseCurrency('xyz123')).toBe(0);
    });
  });

  describe('extractCurrencyFromText', () => {
    it('extracts currency values from text', () => {
      expect(extractCurrencyFromText('I spent $15.50 on lunch')).toBe(1550);
      expect(extractCurrencyFromText('Paid Rp 150,000 for ads')).toBe(150000);
      expect(extractCurrencyFromText('Received $1,200 for work')).toBe(120000);
    });

    it('handles thousand/million/billion values', () => {
      expect(extractCurrencyFromText('Bought laptop for 5 million rupiah')).toBe(500000000);
      expect(extractCurrencyFromText('Project worth 2.5 million')).toBe(250000000);
      expect(extractCurrencyFromText('Company valued at 1 billion')).toBe(100000000000);
    });

    it('extracts currency without symbols', () => {
      expect(extractCurrencyFromText('Lunch cost 15.50 today')).toBe(1550);
      expect(extractCurrencyFromText('Dinner was 85 dollars')).toBe(8500);
    });

    it('returns 0 for text without currency', () => {
      expect(extractCurrencyFromText('No money here')).toBe(0);
      expect(extractCurrencyFromText('Just some text')).toBe(0);
    });
  });
});