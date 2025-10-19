import { AITransactionResponse, ValidationResult } from "@/types/ai";
import { Category, FundSource } from "@/types/finance";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validates a transaction response from AI
 * This is a soft validation - it allows missing entities that can be created automatically
 */
export function validateCompleteTransaction(
  transaction: AITransactionResponse,
  categories: Category[],
  fundSources: FundSource[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!transaction.type) {
    errors.push("Tipe transaksi tidak boleh kosong.");
  }

  if (!transaction.amount || transaction.amount <= 0) {
    errors.push("Jumlah transaksi harus lebih dari 0.");
  }

  if (!transaction.description || transaction.description.trim() === "") {
    errors.push("Deskripsi tidak boleh kosong.");
  }

  if (!transaction.date) {
    errors.push("Tanggal transaksi tidak boleh kosong.");
  }

  // Type-specific validation
  if (transaction.type === "expense") {
    if (!transaction.fundSource) {
      errors.push("Sumber dana diperlukan untuk pengeluaran.");
    } else {
      // Check if fund source exists
      const fundExists = fundSources.some(
        (f) => f.name.toLowerCase() === transaction.fundSource?.toLowerCase()
      );

      if (!fundExists) {
        warnings.push(
          `Sumber dana "${
            transaction.fundSource
          }" belum terdaftar. Sistem akan membuat sumber dana baru dengan saldo awal Rp ${transaction.amount.toLocaleString(
            "id-ID"
          )}.`
        );
      } else {
        // Check if fund has sufficient balance
        const fund = fundSources.find(
          (f) => f.name.toLowerCase() === transaction.fundSource?.toLowerCase()
        );

        if (fund && fund.balance < transaction.amount * 100) {
          warnings.push(
            `Saldo "${
              transaction.fundSource
            }" tidak mencukupi. Saldo saat ini: Rp ${(
              fund.balance / 100
            ).toLocaleString(
              "id-ID"
            )}, diperlukan: Rp ${transaction.amount.toLocaleString("id-ID")}.`
          );
        }
      }
    }

    // Check category (optional warning)
    if (transaction.category) {
      const categoryExists = categories.some(
        (c) =>
          c.name.toLowerCase() === transaction.category?.toLowerCase() &&
          c.type === "expense"
      );

      if (!categoryExists) {
        warnings.push(
          `Kategori "${transaction.category}" belum terdaftar. Sistem akan membuat kategori baru.`
        );
      }
    }
  } else if (transaction.type === "income") {
    if (!transaction.destinationFund && !transaction.fundSource) {
      errors.push("Sumber dana tujuan diperlukan untuk pemasukan.");
    }

    // For income, we accept fundSource as destination
    const destinationName =
      transaction.destinationFund || transaction.fundSource;

    if (destinationName) {
      const fundExists = fundSources.some(
        (f) => f.name.toLowerCase() === destinationName.toLowerCase()
      );

      if (!fundExists) {
        warnings.push(
          `Sumber dana "${destinationName}" belum terdaftar. Sistem akan membuat sumber dana baru.`
        );
      }
    }

    // Check category (optional warning)
    if (transaction.category) {
      const categoryExists = categories.some(
        (c) =>
          c.name.toLowerCase() === transaction.category?.toLowerCase() &&
          c.type === "income"
      );

      if (!categoryExists) {
        warnings.push(
          `Kategori "${transaction.category}" belum terdaftar. Sistem akan membuat kategori baru.`
        );
      }
    }
  } else if (transaction.type === "transfer") {
    if (!transaction.sourceFund) {
      errors.push("Sumber dana asal diperlukan untuk transfer.");
    }

    if (!transaction.destinationFund) {
      errors.push("Sumber dana tujuan diperlukan untuk transfer.");
    }

    if (
      transaction.sourceFund &&
      transaction.destinationFund &&
      transaction.sourceFund.toLowerCase() ===
        transaction.destinationFund.toLowerCase()
    ) {
      errors.push("Sumber dana asal dan tujuan tidak boleh sama.");
    }

    // Check if funds exist
    if (transaction.sourceFund) {
      const sourceFundExists = fundSources.some(
        (f) => f.name.toLowerCase() === transaction.sourceFund?.toLowerCase()
      );

      if (!sourceFundExists) {
        warnings.push(
          `Sumber dana "${
            transaction.sourceFund
          }" belum terdaftar. Sistem akan membuat sumber dana baru dengan saldo Rp ${transaction.amount.toLocaleString(
            "id-ID"
          )}.`
        );
      } else {
        // Check if source fund has sufficient balance
        const fund = fundSources.find(
          (f) => f.name.toLowerCase() === transaction.sourceFund?.toLowerCase()
        );

        if (fund && fund.balance < transaction.amount * 100) {
          warnings.push(
            `Saldo "${
              transaction.sourceFund
            }" tidak mencukupi. Saldo saat ini: Rp ${(
              fund.balance / 100
            ).toLocaleString(
              "id-ID"
            )}, diperlukan: Rp ${transaction.amount.toLocaleString("id-ID")}.`
          );
        }
      }
    }

    if (transaction.destinationFund) {
      const destFundExists = fundSources.some(
        (f) =>
          f.name.toLowerCase() === transaction.destinationFund?.toLowerCase()
      );

      if (!destFundExists) {
        warnings.push(
          `Sumber dana tujuan "${transaction.destinationFund}" belum terdaftar. Sistem akan membuat sumber dana baru.`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates if a transaction has all required fields filled
 */
export function isTransactionComplete(
  transaction: AITransactionResponse
): boolean {
  const hasBasicFields =
    !!transaction.type &&
    !!transaction.amount &&
    transaction.amount > 0 &&
    !!transaction.description &&
    !!transaction.date;

  if (!hasBasicFields) return false;

  if (transaction.type === "expense") {
    return !!transaction.fundSource;
  } else if (transaction.type === "income") {
    return !!(transaction.destinationFund || transaction.fundSource);
  } else if (transaction.type === "transfer") {
    return !!transaction.sourceFund && !!transaction.destinationFund;
  }

  return false;
}

/**
 * Gets missing fields from a transaction
 */
export function getMissingFields(transaction: AITransactionResponse): string[] {
  const missing: string[] = [];

  if (!transaction.type) missing.push("type");
  if (!transaction.amount || transaction.amount <= 0) missing.push("amount");
  if (!transaction.description) missing.push("description");
  if (!transaction.date) missing.push("date");

  if (transaction.type === "expense" && !transaction.fundSource) {
    missing.push("fundSource");
  } else if (
    transaction.type === "income" &&
    !transaction.destinationFund &&
    !transaction.fundSource
  ) {
    missing.push("destinationFund");
  } else if (transaction.type === "transfer") {
    if (!transaction.sourceFund) missing.push("sourceFund");
    if (!transaction.destinationFund) missing.push("destinationFund");
  }

  return missing;
}
