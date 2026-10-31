export type CategoryType = "income" | "expense";

export interface CategoryDTO {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  parentId?: string | null;
  color?: string | null;
  icon?: string | null;
  description?: string | null;
  sortOrder?: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCategoryDTO {
  name: string;
  type: CategoryType;
  parentId?: string | null;
  color?: string | null;
  icon?: string | null;
  description?: string | null;
  sortOrder?: number | null;
  isActive?: boolean;
}

export interface UpdateCategoryDTO {
  name?: string;
  type?: CategoryType;
  parentId?: string | null;
  color?: string | null;
  icon?: string | null;
  description?: string | null;
  sortOrder?: number | null;
  isActive?: boolean;
}

export interface ICategoryService {
  list(type?: CategoryType): Promise<CategoryDTO[]>;
  getById(id: string): Promise<CategoryDTO>;
  create(payload: CreateCategoryDTO): Promise<CategoryDTO>;
  update(id: string, payload: UpdateCategoryDTO): Promise<CategoryDTO>;
  delete(id: string): Promise<void>;
}
