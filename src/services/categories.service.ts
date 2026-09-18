import { apiClient } from "@/lib/api-client";
import type { Category, CategoryType } from "@/types";

interface CategoryResponse {
  id: string;
  household_id: string;
  parent_id: string | null;
  name: string;
  type: CategoryType;
  icon: string | null;
  is_system: boolean;
  is_hidden: boolean;
}

function toCategory(res: CategoryResponse): Category {
  return {
    id: res.id,
    household_id: res.household_id,
    parent_id: res.parent_id,
    name: res.name,
    type: res.type,
    is_system: res.is_system,
    is_active: !res.is_hidden,
    icon: res.icon ?? undefined,
  };
}

export async function listCategories(): Promise<Category[]> {
  const res = await apiClient.get<{ data: CategoryResponse[] }>("/categories");
  return res.data.data.map(toCategory);
}

export async function createCategory(data: {
  name: string;
  type: CategoryType;
  icon?: string;
  parent_id?: string;
}): Promise<Category> {
  const res = await apiClient.post<{ data: CategoryResponse }>("/categories", data);
  return toCategory(res.data.data);
}

export async function updateCategory(
  id: string,
  data: { name?: string; type?: CategoryType; icon?: string; is_hidden?: boolean }
): Promise<Category> {
  const res = await apiClient.patch<{ data: CategoryResponse }>(`/categories/${id}`, data);
  return toCategory(res.data.data);
}

export async function toggleCategoryStatus(id: string): Promise<Category> {
  const res = await apiClient.patch<{ data: CategoryResponse }>(
    `/categories/${id}/toggle-status`
  );
  return toCategory(res.data.data);
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}
