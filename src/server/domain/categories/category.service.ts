import { AuthContext } from "@/server/auth/types";
import {
  ICategoryService,
  CategoryDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryType,
} from "./category.types";
import { createCategorySchema, updateCategorySchema } from "./category.schema";
import { NotFoundError, DatabaseOperationError, DomainError } from "@/server/errors/domain-error";

export class CategoryDomainService implements ICategoryService {
  constructor(private ctx: AuthContext) {}

  /**
   * Lists categories for authenticated user via Direct Supabase SDK
   */
  async list(type?: CategoryType): Promise<CategoryDTO[]> {
    let query = this.ctx.supabase
      .from("categories")
      .select("*")
      .eq("user_id", this.ctx.userId)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;
    if (error) {
      throw new DatabaseOperationError("list categories", error.message);
    }

    return (data || []).map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      name: c.name,
      type: c.type,
      parentId: c.parent_id || null,
      color: c.color || null,
      icon: c.icon || null,
      description: c.description || null,
      sortOrder: c.sort_order ?? null,
      isActive: c.is_active ?? true,
      createdAt: c.created_at,
    }));
  }

  /**
   * Retrieves single category by ID
   */
  async getById(id: string): Promise<CategoryDTO> {
    const { data, error } = await this.ctx.supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .eq("user_id", this.ctx.userId)
      .single();

    if (error || !data) {
      throw new NotFoundError("Kategori", id);
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      type: data.type,
      parentId: data.parent_id || null,
      color: data.color || null,
      icon: data.icon || null,
      description: data.description || null,
      sortOrder: data.sort_order ?? null,
      isActive: data.is_active ?? true,
      createdAt: data.created_at,
    };
  }

  /**
   * Creates a new category
   */
  async create(payload: CreateCategoryDTO): Promise<CategoryDTO> {
    const validated = createCategorySchema.parse(payload);

    const { data, error } = await this.ctx.supabase
      .from("categories")
      .insert([
        {
          user_id: this.ctx.userId,
          name: validated.name,
          type: validated.type,
          parent_id: validated.parentId || null,
          color: validated.color || null,
          icon: validated.icon || null,
          description: validated.description || null,
          sort_order: validated.sortOrder ?? null,
          is_active: validated.isActive ?? true,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      throw new DatabaseOperationError("create category", error?.message || "Gagal membuat kategori");
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      type: data.type,
      parentId: data.parent_id || null,
      color: data.color || null,
      icon: data.icon || null,
      description: data.description || null,
      sortOrder: data.sort_order ?? null,
      isActive: data.is_active ?? true,
      createdAt: data.created_at,
    };
  }

  /**
   * Updates category details
   */
  async update(id: string, payload: UpdateCategoryDTO): Promise<CategoryDTO> {
    const validated = updateCategorySchema.parse(payload);
    await this.getById(id);

    const updates: Record<string, any> = {};
    if (validated.name !== undefined) updates.name = validated.name;
    if (validated.type !== undefined) updates.type = validated.type;
    if (validated.parentId !== undefined) updates.parent_id = validated.parentId;
    if (validated.color !== undefined) updates.color = validated.color;
    if (validated.icon !== undefined) updates.icon = validated.icon;
    if (validated.description !== undefined) updates.description = validated.description;
    if (validated.sortOrder !== undefined) updates.sort_order = validated.sortOrder;
    if (validated.isActive !== undefined) updates.is_active = validated.isActive;

    const { data, error } = await this.ctx.supabase
      .from("categories")
      .update(updates)
      .eq("id", id)
      .eq("user_id", this.ctx.userId)
      .select()
      .single();

    if (error || !data) {
      throw new DatabaseOperationError("update category", error?.message || "Gagal memperbarui kategori");
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      type: data.type,
      parentId: data.parent_id || null,
      color: data.color || null,
      icon: data.icon || null,
      description: data.description || null,
      sortOrder: data.sort_order ?? null,
      isActive: data.is_active ?? true,
      createdAt: data.created_at,
    };
  }

  /**
   * Deletes a category (ensuring no existing transactions reference it)
   */
  async delete(id: string): Promise<void> {
    await this.getById(id);

    const { count, error: countErr } = await this.ctx.supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    if (countErr) {
      throw new DatabaseOperationError("check category references", countErr.message);
    }

    if (count && count > 0) {
      throw new DomainError(
        `Kategori tidak dapat dihapus karena masih digunakan pada ${count} transaksi. Ubah kategori transaksi tersebut terlebih dahulu.`,
        400,
        "CATEGORY_IN_USE"
      );
    }

    const { error } = await this.ctx.supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", this.ctx.userId);

    if (error) {
      throw new DatabaseOperationError("delete category", error.message);
    }
  }
}
