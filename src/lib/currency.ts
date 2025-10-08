// Utility functions for currency formatting and conversion

export const formatCurrency = (amountInCents: number): string => {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const parseCurrency = (input: string): number => {
  // Remove currency symbols, commas, and whitespace
  const cleaned = input.replace(/[$,\\s]/g, '');
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : Math.round(amount * 100);
};

// New function to extract currency amount from text
export const extractCurrencyFromText = (text: string): number => {
  // Check if the original text contains dollar sign or 'dollar' to determine if we should convert to cents
  const containsDollar = /\$|dollar/i.test(text);
  
  // Check if the text contains non-dollar currency symbols (these should NOT be converted)
  const containsNonDollarCurrency = /(?:Rp|¥|€|£| IDR| USD| EUR| JPY| GBP)/i.test(text);
  
  // Handle explicit million/billion/thousand values that may also need dollar conversion
  const multiplierRegex = /(\d+(?:\.\d+)?)\s*(thousand|millions?|billions?)/i;
  const multiplierMatch = text.match(multiplierRegex);
  if (multiplierMatch) {
    const num = parseFloat(multiplierMatch[1]);
    const word = multiplierMatch[2].toLowerCase();
    let multiplier = 1;
    if (word.includes('thousand')) multiplier = 1000;
    else if (word.includes('million')) multiplier = 1000000;
    else if (word.includes('billion')) multiplier = 1000000000;
    
    const result = num * multiplier;
    
    // Convert to cents if it contains dollar symbols/words or if no non-dollar currency symbol is present
    if (containsDollar) {
      return Math.round(result * 100);
    } else if (containsNonDollarCurrency) {
      return Math.round(result);  // Don't convert if non-dollar currency symbol is present
    } else {
      // If no currency symbol, default to dollar conversion
      return Math.round(result * 100);
    }
  }
  
  // Remove non-dollar currency symbols (we need to distinguish between $ and other symbols)
  const containsDollarSymbol = text.includes('$');
  const cleanText = text.replace(/(?:Rp|¥|€|£| IDR| USD| EUR| JPY| GBP)/g, '');
  const hasNonDollarCurrencyInText = /(?:Rp|¥|€|£| IDR| USD| EUR| JPY| GBP)/i.test(text);
  
  // Find potential currency values - handle both comma separators and decimal points
  const currencyRegex = /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{1,2})?)/g;
  const matches = cleanText.match(currencyRegex);
  
  if (!matches) return 0;
  
  // Process each match looking for currency-like numbers
  for (const match of matches) {
    // Replace commas but preserve decimal point
    const amountStr = match.replace(/,/g, '');
    const amount = parseFloat(amountStr);
    
    if (!isNaN(amount) && amount > 0) {
      // Convert to cents if contains dollar symbols/words OR no non-dollar currency is present
      if (containsDollarSymbol || /\bdollar/i.test(text)) {
        return Math.round(amount * 100);
      } else if (hasNonDollarCurrencyInText) {
        return Math.round(amount);  // Don't convert if non-dollar currency is present
      } else {
        // Default to dollar conversion for numbers without explicit currency
        return Math.round(amount * 100);
      }
    }
  }
  
  return 0;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};