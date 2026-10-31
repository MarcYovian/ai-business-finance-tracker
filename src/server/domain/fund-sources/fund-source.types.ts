export type FundSourceType = "bank" | "cash" | "e-wallet" | "credit_card";

export interface FundSourceDTO {
  id: string;
  userId: string;
  name: string;
  type: FundSourceType;
  balance: number; // Rupiah murni (e.g. 1500000)
  accountNumber?: string | null;
  accountHolderName?: string | null;
  cardExpiry?: string | null;
  colorTheme?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateFundSourceDTO {
  name: string;
  type: FundSourceType;
  balance: number; // Rupiah murni
  accountNumber?: string | null;
  accountHolderName?: string | null;
  cardExpiry?: string | null;
  colorTheme?: string | null;
  isActive?: boolean;
}

export interface UpdateFundSourceDTO {
  name?: string;
  type?: FundSourceType;
  accountNumber?: string | null;
  accountHolderName?: string | null;
  cardExpiry?: string | null;
  colorTheme?: string | null;
  isActive?: boolean;
}

export interface BalanceSummaryDTO {
  totalBalance: number; // Rupiah murni
  accountCount: number;
  byType: Record<FundSourceType, number>;
  accounts: FundSourceDTO[];
}

export interface IFundSourceService {
  list(activeOnly?: boolean): Promise<FundSourceDTO[]>;
  getById(id: string): Promise<FundSourceDTO>;
  create(payload: CreateFundSourceDTO): Promise<FundSourceDTO>;
  update(id: string, payload: UpdateFundSourceDTO): Promise<FundSourceDTO>;
  delete(id: string): Promise<void>;
  getBalanceSummary(): Promise<BalanceSummaryDTO>;
}
