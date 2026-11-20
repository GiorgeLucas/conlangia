import { invoke } from "@tauri-apps/api/core";

export interface CategoryDto {
  id: number;
  name: string;
  description: string | null;
}

export function createCategory(
  name: string,
  description?: string | null
): Promise<CategoryDto> {
  return invoke<CategoryDto>("create_category", {
    name,
    description: description ?? null,
  });
}

export function listCategories(): Promise<CategoryDto[]> {
  return invoke<CategoryDto[]>("list_categories");
}

export function updateCategoryName(
  id: number,
  name: string
): Promise<CategoryDto> {
  return invoke<CategoryDto>("update_category_name", {
    id,
    name,
  });
}

export function updateCategoryDescription(
  id: number,
  description?: string | null
): Promise<CategoryDto> {
  return invoke<CategoryDto>("update_category_description", {
    id,
    description: description ?? null,
  });
}

export function deleteCategory(id: number): Promise<void> {
  return invoke<void>("delete_category", { id });
}
