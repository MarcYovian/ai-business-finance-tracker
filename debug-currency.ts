// Debug script to test the currency extraction
function debugExtractCurrencyFromText(text: string): number {
  console.log(`\n--- Debugging: "${text}" ---`);
  
  // First, handle explicit million/billion/thousand values
  const multiplierRegex = /(\d+(?:\.\d+)?)\s*(thousand|millions?|billions?)/i;
  const multiplierMatch = text.match(multiplierRegex);
  console.log('Multiplier match:', multiplierMatch);
  if (multiplierMatch) {
    const num = parseFloat(multiplierMatch[1]);
    const word = multiplierMatch[2].toLowerCase();
    let multiplier = 1;
    if (word.includes('thousand')) multiplier = 1000;
    else if (word.includes('million')) multiplier = 1000000;
    else if (word.includes('billion')) multiplier = 1000000000;
    
    console.log(`Multiplier: ${num} * ${multiplier} * 100 = ${Math.round(num * multiplier * 100)}`);
    return Math.round(num * multiplier * 100);
  }
  
  // Extract currency amount with proper handling of commas as thousand separators
  // This regex matches numbers with optional commas for thousands and optional decimal points
  const currencyRegex = /(?:\$|Rp|¥|€|£| IDR| USD| EUR| JPY| GBP)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/gi;
  const matches = text.match(currencyRegex);
  console.log('All matches:', matches);
  
  if (!matches) return 0;
  
  // Find the most relevant match (the one that includes commas for thousands if present)
  const amountMatch = matches[0]; // Take the first match
  console.log('First match:', amountMatch);
  
  // Remove commas and currency symbols, then convert to number
  const amountStr = amountMatch.replace(/[\$Rp¥€£,]/g, '').trim();
  console.log('Amount string after cleaning:', amountStr);
  
  const amount = parseFloat(amountStr);
  console.log('Parsed amount:', amount);
  const result = isNaN(amount) ? 0 : Math.round(amount * 100);
  console.log('Final result:', result);
  
  return result;
}

// Test the problematic case
debugExtractCurrencyFromText('Paid Rp 150,000 for ads');
debugExtractCurrencyFromText('I spent $15.50 on lunch');
debugExtractCurrencyFromText('Received $1,200 for work');