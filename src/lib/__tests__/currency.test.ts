import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrency, extractCurrencyFromText } from '@/lib/currency';

describe('Currency utilities (IDR)', () => {
  describe('formatCurrency', () => {
    it('formats cents to IDR currency string', () => {
      expect(formatCurrency(100000)).toBe('Rp\u00A01.000');
      expect(formatCurrency(150000)).toBe('Rp\u00A01.500');
      expect(formatCurrency(1000000)).toBe('Rp\u00A010.000');
      expect(formatCurrency(0)).toBe('Rp\u00A00');
      expect(formatCurrency(50000)).toBe('Rp\u00A0500');
    });
  });

  describe('parseCurrency', () => {
    it('parses simple numeric strings to cents', () => {
      expect(parseCurrency('10.500')).toBe(1050000);
      expect(parseCurrency('100.000')).toBe(10000000);
    });

    it('removes currency symbols and dots', () => {
      expect(parseCurrency('Rp 10.500')).toBe(1050000);
      expect(parseCurrency('Rp 1.000.000,00')).toBe(100000000);
      expect(parseCurrency('1.000.500')).toBe(100050000);
    });

    it('returns 0 for invalid input', () => {
      expect(parseCurrency('')).toBe(0);
      expect(parseCurrency('abc')).toBe(0);
      expect(parseCurrency('xyz123')).toBe(0);
    });
  });

  describe('extractCurrencyFromText', () => {
    it('extracts currency values from text with suffixes', () => {
      expect(extractCurrencyFromText('bayar 50 ribu')).toBe(5000000);
      expect(extractCurrencyFromText('harganya 1.5 juta')).toBe(150000000);
      expect(extractCurrencyFromText('transfer 2 miliar')).toBe(200000000000);
    });

    it('extracts plain numeric values', () => {
      expect(extractCurrencyFromText('makan siang 25000')).toBe(2500000);
      expect(extractCurrencyFromText('dapat bonus 500000')).toBe(50000000);
    });

    it('handles text with mixed numbers and words', () => {
      expect(extractCurrencyFromText('kemarin habis 150 ribu buat belanja')).toBe(15000000);
    });

    it('returns 0 for text without currency', () => {
      expect(extractCurrencyFromText('tidak ada uang')).toBe(0);
      expect(extractCurrencyFromText('cuma teks biasa')).toBe(0);
    });
  });
});
