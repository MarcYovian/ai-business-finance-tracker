export type AccountType = "bank" | "ewallet";

export interface BeneficiaryDTO {
  id: string;
  user_id: string;
  userId: string;
  name: string;
  bank_name: string;
  bankName: string;
  account_number: string;
  accountNumber: string;
  account_type: AccountType;
  accountType: AccountType;
  notes?: string | null;
  created_at: string;
  createdAt: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface CreateBeneficiaryDTO {
  name: string;
  bankName?: string;
  bank_name?: string;
  accountNumber?: string;
  account_number?: string;
  accountType?: AccountType;
  account_type?: AccountType;
  notes?: string | null;
}

export interface IBeneficiaryService {
  list(): Promise<BeneficiaryDTO[]>;
  getById(id: string): Promise<BeneficiaryDTO>;
  create(payload: CreateBeneficiaryDTO): Promise<BeneficiaryDTO>;
  delete(id: string): Promise<void>;
}
