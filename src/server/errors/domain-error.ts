/**
 * Standard Domain Error classes for AI Business Finance Tracker
 * Conforming to RFC 7807 Problem Details
 */

export class DomainError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, code = "DOMAIN_ERROR", details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toRFC7807(instancePath?: string) {
    return {
      type: `https://api.finance-tracker.local/errors/${this.code.toLowerCase()}`,
      title: this.name,
      status: this.statusCode,
      detail: this.message,
      instance: instancePath,
      code: this.code,
      details: this.details,
    };
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Unauthorized: Kredensial tidak valid atau tidak ditemukan.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Forbidden: Anda tidak memiliki akses ke sumber daya ini.") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, identifier?: string) {
    const detail = identifier
      ? `${resource} dengan ID '${identifier}' tidak ditemukan.`
      : `${resource} tidak ditemukan.`;
    super(detail, 404, "NOT_FOUND");
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}

export class InsufficientFundsError extends DomainError {
  constructor(accountName: string, available: number, required: number) {
    const msg = `Saldo akun '${accountName}' tidak mencukupi. Tersedia: Rp${available.toLocaleString("id-ID")}, Dibutuhkan: Rp${required.toLocaleString("id-ID")}.`;
    super(msg, 400, "INSUFFICIENT_FUNDS", { accountName, available, required });
  }
}

export class DatabaseOperationError extends DomainError {
  constructor(operation: string, originalMessage: string) {
    super(`Gagal menjalankan operasi database (${operation}): ${originalMessage}`, 500, "DATABASE_ERROR");
  }
}
