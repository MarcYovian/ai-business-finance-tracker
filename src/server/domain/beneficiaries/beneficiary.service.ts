import { AuthContext } from "@/server/auth/types";
import {
  IBeneficiaryService,
  BeneficiaryDTO,
  CreateBeneficiaryDTO,
} from "./beneficiary.types";
import { createBeneficiarySchema } from "./beneficiary.schema";
import { NotFoundError, DatabaseOperationError } from "@/server/errors/domain-error";

export class BeneficiaryDomainService implements IBeneficiaryService {
  constructor(private ctx: AuthContext) {}

  /**
   * Lists all beneficiaries for authenticated user
   */
  async list(): Promise<BeneficiaryDTO[]> {
    const { data, error } = await this.ctx.supabase
      .from("beneficiaries")
      .select("*")
      .eq("user_id", this.ctx.userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new DatabaseOperationError("list beneficiaries", error.message);
    }

    return (data || []).map((b: any) => ({
      id: b.id,
      user_id: b.user_id,
      userId: b.user_id,
      name: b.name,
      bank_name: b.bank_name,
      bankName: b.bank_name,
      account_number: b.account_number,
      accountNumber: b.account_number,
      account_type: b.account_type,
      accountType: b.account_type,
      notes: b.notes,
      created_at: b.created_at,
      createdAt: b.created_at,
      updated_at: b.updated_at,
      updatedAt: b.updated_at,
    }));
  }

  /**
   * Retrieves single beneficiary by ID
   */
  async getById(id: string): Promise<BeneficiaryDTO> {
    const { data, error } = await this.ctx.supabase
      .from("beneficiaries")
      .select("*")
      .eq("id", id)
      .eq("user_id", this.ctx.userId)
      .single();

    if (error || !data) {
      throw new NotFoundError("Kontak penerima (Beneficiary)", id);
    }

    return {
      id: data.id,
      user_id: data.user_id,
      userId: data.user_id,
      name: data.name,
      bank_name: data.bank_name,
      bankName: data.bank_name,
      account_number: data.account_number,
      accountNumber: data.account_number,
      account_type: data.account_type,
      accountType: data.account_type,
      notes: data.notes,
      created_at: data.created_at,
      createdAt: data.created_at,
      updated_at: data.updated_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Creates a new beneficiary
   */
  async create(payload: CreateBeneficiaryDTO): Promise<BeneficiaryDTO> {
    const validated = createBeneficiarySchema.parse(payload);

    const { data, error } = await this.ctx.supabase
      .from("beneficiaries")
      .insert([
        {
          user_id: this.ctx.userId,
          name: validated.name,
          bank_name: validated.bankName,
          account_number: validated.accountNumber,
          account_type: validated.accountType,
          notes: validated.notes,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      throw new DatabaseOperationError("create beneficiary", error?.message || "Gagal menyimpan kontak penerima");
    }

    return {
      id: data.id,
      user_id: data.user_id,
      userId: data.user_id,
      name: data.name,
      bank_name: data.bank_name,
      bankName: data.bank_name,
      account_number: data.account_number,
      accountNumber: data.account_number,
      account_type: data.account_type,
      accountType: data.account_type,
      notes: data.notes,
      created_at: data.created_at,
      createdAt: data.created_at,
      updated_at: data.updated_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Deletes a beneficiary by ID
   */
  async delete(id: string): Promise<void> {
    await this.getById(id);

    const { error } = await this.ctx.supabase
      .from("beneficiaries")
      .delete()
      .eq("id", id)
      .eq("user_id", this.ctx.userId);

    if (error) {
      throw new DatabaseOperationError("delete beneficiary", error.message);
    }
  }
}
