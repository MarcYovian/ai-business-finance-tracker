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
  const cleaned = input.replace(/[$,\s]/g, '');
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : Math.round(amount * 100);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
