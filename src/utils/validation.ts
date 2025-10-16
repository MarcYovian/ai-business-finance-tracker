import {
  ERROR_MESSAGES,
  TRANSACTION_TYPES,
  VALIDATION_RULES,
} from "@/constants/constants";
import { AITransactionResponse, ValidationResult } from "@/types/ai";
import { Category, FundSource } from "@/types/finance";

export class ValidationError extends Error {
  constructor(message: string, public field?: string, public code?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export const validateAmount = (amount: number): ValidationResult => {
  const errors: string[] = [];

  if (typeof amount !== "number" || isNaN(amount)) {
    errors.push(ERROR_MESSAGES.INVALID_AMOUNT);
  } else if (amount < VALIDATION_RULES.MIN_AMOUNT) {
    errors.push(ERROR_MESSAGES.INVALID_AMOUNT);
  } else if (amount > VALIDATION_RULES.MAX_AMOUNT) {
    errors.push(
      `Jumlah terlalu besar (maksimal ${VALIDATION_RULES.MAX_AMOUNT}).`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateDate = (dateString: string): ValidationResult => {
  const errors: string[] = [];
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    errors.push(ERROR_MESSAGES.INVALID_DATE);
  } else {
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    if (date > now) {
      errors.push("Tanggal tidak boleh di masa depan.");
    } else if (date < oneYearAgo) {
      return {
        isValid: true,
        errors: [],
        warnings: [
          "Transaksi lebih dari 1 tahun yang lalu. Apakah Anda yakin?",
        ],
      };
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateDescription = (description: string): ValidationResult => {
  const errors: string[] = [];

  if (
    !description ||
    description.trim().length < VALIDATION_RULES.MIN_DESCRIPTION_LENGTH
  ) {
    errors.push(ERROR_MESSAGES.DESCRIPTION_TOO_SHORT);
  } else if (description.length > VALIDATION_RULES.MAX_DESCRIPTION_LENGTH) {
    errors.push(ERROR_MESSAGES.DESCRIPTION_TOO_LONG);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateTransactionType = (type: string): ValidationResult => {
  const errors: string[] = [];
  const validTypes = Object.values(TRANSACTION_TYPES);

  if (!validTypes.includes(type as any)) {
    errors.push(ERROR_MESSAGES.INVALID_TYPE);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateCategory = (
  categoryName: string | undefined,
  categories: Category[],
  transactionType: "income" | "expense"
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!categoryName) {
    warnings.push(
      "Kategori tidak disebutkan. Akan menggunakan kategori default."
    );
    return { isValid: true, errors, warnings };
  }

  const category = categories.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );

  if (!category) {
    warnings.push(
      `Kategori "${categoryName}" tidak ditemukan. Kategori baru akan dibuat.`
    );
  } else if (category.type !== transactionType) {
    errors.push(
      `Kategori "${categoryName}" adalah kategori ${category.type}, tidak cocok untuk transaksi ${transactionType}.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateFundSource = (
  fundSourceName: string | undefined,
  fundSources: FundSource[]
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fundSourceName) {
    errors.push("Sumber dana harus disebutkan.");
    return { isValid: false, errors };
  }

  const fundSource = fundSources.find(
    (f) => f.name.toLowerCase() === fundSourceName.toLowerCase()
  );

  if (!fundSource) {
    errors.push(ERROR_MESSAGES.FUND_SOURCE_NOT_FOUND);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateSufficientFunds = (
  amount: number,
  fundSource: FundSource
): ValidationResult => {
  const errors: string[] = [];

  if (fundSource.balance < amount) {
    errors.push(
      `${ERROR_MESSAGES.INSUFFICIENT_FUNDS} Saldo tersedia: ${fundSource.balance}, Diperlukan: ${amount}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateTransferTransaction = (
  transaction: AITransactionResponse,
  fundSources: FundSource[]
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!transaction.sourceFund) {
    errors.push("Sumber dana asal harus disebutkan untuk transfer.");
  }

  if (!transaction.destinationFund) {
    errors.push("Sumber dana tujuan harus disebutkan untuk transfer.");
  }

  if (transaction.sourceFund && transaction.destinationFund) {
    if (transaction.sourceFund === transaction.destinationFund) {
      errors.push("Sumber dana asal dan tujuan tidak boleh sama.");
    }

    const sourceFund = fundSources.find(
      (f) => f.name.toLowerCase() === transaction.sourceFund?.toLowerCase()
    );
    const destFund = fundSources.find(
      (f) => f.name.toLowerCase() === transaction.destinationFund?.toLowerCase()
    );

    if (!sourceFund) {
      errors.push(`Sumber dana "${transaction.sourceFund}" tidak ditemukan.`);
    } else {
      const sufficientFundsCheck = validateSufficientFunds(
        transaction.amount,
        sourceFund
      );
      errors.push(...sufficientFundsCheck.errors);
    }

    if (!destFund) {
      errors.push(
        `Sumber dana "${transaction.destinationFund}" tidak ditemukan.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateCompleteTransaction = (
  transaction: AITransactionResponse,
  categories: Category[],
  fundSources: FundSource[]
): ValidationResult => {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Validate amount
  const amountValidation = validateAmount(transaction.amount);
  allErrors.push(...amountValidation.errors);

  // Validate description
  const descriptionValidation = validateDescription(transaction.description);
  allErrors.push(...descriptionValidation.errors);

  // Validate date
  const dateValidation = validateDate(transaction.date);
  allErrors.push(...dateValidation.errors);
  if (dateValidation.warnings) allWarnings.push(...dateValidation.warnings);

  // Validate transaction type
  const typeValidation = validateTransactionType(transaction.type);
  allErrors.push(...typeValidation.errors);

  // Type-specific validations
  if (transaction.type === "transfer") {
    const transferValidation = validateTransferTransaction(
      transaction,
      fundSources
    );
    allErrors.push(...transferValidation.errors);
    if (transferValidation.warnings)
      allWarnings.push(...transferValidation.warnings);
  } else {
    // Validate category for income/expense
    const categoryValidation = validateCategory(
      transaction.category,
      categories,
      transaction.type
    );
    allErrors.push(...categoryValidation.errors);
    if (categoryValidation.warnings)
      allWarnings.push(...categoryValidation.warnings);

    // Validate fund source
    const fundSourceValidation = validateFundSource(
      transaction.fundSource,
      fundSources
    );
    allErrors.push(...fundSourceValidation.errors);

    if (transaction.type === "expense" && transaction.fundSource) {
      const fundSource = fundSources.find(
        (f) => f.name.toLowerCase() === transaction.fundSource?.toLowerCase()
      );
      if (fundSource) {
        const sufficientFundsValidation = validateSufficientFunds(
          transaction.amount,
          fundSource
        );
        allErrors.push(...sufficientFundsValidation.errors);
      }
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings.length > 0 ? allWarnings : undefined,
  };
};
