// Utility functions for currency formatting and conversion

export const formatCurrency = (amountInCents: number): string => {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const parseCurrency = (input: string): number => {
  // Remove currency symbols, dots (as thousands separators), and whitespace
  const cleaned = input.replace(/[Rp.\s]/g, "").replace(/,00$/, "");
  const amount = parseInt(cleaned, 10);
  return isNaN(amount) ? 0 : amount * 100;
};

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