// Utility functions for currency formatting and conversion

/**
 * Formats a number of cents into a string with the IDR currency symbol.
 * e.g., 1500000 -> "Rp1.500.000"
 * @param amountInCents The amount of cents to format
 * @returns A string with the IDR currency symbol and thousand separators
 */
export const formatCurrency = (amountInCents: number): string => {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formats an amount already in whole Indonesian Rupiah (without dividing by 100).
 * e.g., 2306687 -> "Rp 2.306.687"
 * @param amountInRupiah The whole rupiah amount
 * @returns Formatted currency string
 */
export const formatRupiah = (amountInRupiah: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInRupiah);
};

/**
 * Formats a value into a string with the IDR currency symbol, suitable for use in an input field.
 * e.g., 1500000 -> "Rp1.500.000"
 * @param value The value to format
 * @returns A string with the IDR currency symbol and thousand separators
 * @example
 * formatCurrencyForInput(1500000) // "Rp1.500.000"
 */
export const formatCurrencyForInput = (value: number | string): string => {
  const num = Number(String(value).replace(/[^\d]/g, ""));
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat("id-ID").format(num);
};

/**
 * Parse a string containing a currency value into a number of cents.
 * e.g., "Rp1.500.000" -> 150000000
 * @param input The string containing the currency value to parse
 * @returns The number of cents represented by the input string, or 0 if the input is invalid
 * @example
 * parseCurrency("Rp1.500.000") // 150000000
 */
export const parseCurrency = (input: string): number => {
  // Remove currency symbols, dots (as thousands separators), and whitespace
  const cleaned = input.replace(/[Rp.\s]/g, "").replace(/,00$/, "");
  const amount = parseInt(cleaned, 10);
  return isNaN(amount) ? 0 : amount * 100;
};

/**
 * Parse a string containing a currency value into a number without considering the multiplier.
 * e.g., "Rp1.500.000" -> 1500000
 * @param input The string containing the currency value to parse
 * @returns The number represented by the input string, or 0 if the input is invalid
 * @example
 * parseCurrencyWithoutMultiplier("Rp1.500.000") // 1500000
 */
export const parseCurrencyWithoutMultiplier = (input: string): number => {
  const cleaned = input.replace(/[Rp.\s]/g, "").replace(/,00$/, "");
  const amount = parseInt(cleaned, 10);
  return isNaN(amount) ? 0 : amount;
};

/**
 * Extracts a currency value from a string of text, returning the value in cents.
 * The function supports the following currency units: miliar, juta, and ribu.
 * If no currency unit is found, the function will attempt to parse any numeric value from the string.
 * @param text The text to extract a currency value from
 * @returns The extracted currency value in cents, or 0 if the input is invalid
 * @example
 * extractCurrencyFromText('bayar 50 ribu') // 500000
 * extractCurrencyFromText('harganya 1.5 juta') // 150000000
 * extractCurrencyFromText('transfer 2 miliar') // 200000000000
 */
export const extractCurrencyFromText = (text: string): number => {
  const cleanedText = text.toLowerCase();

  const patterns = {
    miliar: /([\d,.]+)\s*miliar/,
    juta: /([\d,.]+)\s*juta/,
    ribu: /([\d,.]+)\s*ribu/,
  };

  let amount = 0;

  const getNumber = (str: string) => parseFloat(str.replace(/,/g, "."));

  if (patterns.miliar.test(cleanedText)) {
    const match = cleanedText.match(patterns.miliar);
    if (match) {
      amount = getNumber(match[1]) * 1000000000;
    }
  } else if (patterns.juta.test(cleanedText)) {
    const match = cleanedText.match(patterns.juta);
    if (match) {
      amount = getNumber(match[1]) * 1000000;
    }
  } else if (patterns.ribu.test(cleanedText)) {
    const match = cleanedText.match(patterns.ribu);
    if (match) {
      amount = getNumber(match[1]) * 1000;
    }
  } else {
    const numericMatch = cleanedText.match(/(\d+[.,\d]*)/);
    if (numericMatch) {
      amount = getNumber(numericMatch[1].replace(/\./g, ""));
    }
  }

  return amount * 100; // Convert to cents
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
