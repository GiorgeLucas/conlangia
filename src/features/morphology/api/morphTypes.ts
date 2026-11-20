import { invoke } from "@tauri-apps/api/core";

export interface MorphTypeDto {
  id: number;
  code: string;
  label: string;
  isBound: boolean;
}

export function createMorphType(
  code: string,
  label: string,
  isBound: boolean
): Promise<MorphTypeDto> {
  return invoke<MorphTypeDto>("create_morph_type", {
    code,
    label,
    isBound,
  });
}

export function listMorphTypes(): Promise<MorphTypeDto[]> {
  return invoke<MorphTypeDto[]>("list_morph_types");
}

export function updateMorphTypeCode(
  id: number,
  code: string
): Promise<MorphTypeDto> {
  return invoke<MorphTypeDto>("update_morph_type_code", {
    id,
    code,
  });
}

export function updateMorphTypeLabel(
  id: number,
  label: string
): Promise<MorphTypeDto> {
  return invoke<MorphTypeDto>("update_morph_type_label", {
    id,
    label,
  });
}

export function updateMorphTypeBound(
  id: number,
  isBound: boolean
): Promise<MorphTypeDto> {
  return invoke<MorphTypeDto>("update_morph_type_bound", {
    id,
    isBound,
  });
}

export function deleteMorphType(id: number): Promise<void> {
  return invoke<void>("delete_morph_type", { id });
}
