import { SetMetadata } from '@nestjs/common';

export const AREA_ACCESS_KEY = 'area_access';
export type AreaAccessScope = 'ivc' | 'iv' | 'unidad_analisis';

// Espeja las reglas de frontend/src/utils/userAccess.ts (canUseIvc / canUseInspeccionVigilanciaSp / canUseUnidadAnalisis):
// 'ivc'             -> subdirección de Calidad y Aseguramiento o Salud Pública
// 'iv'              -> subdirección de Salud Pública, y dentro de ella solo admin_subdireccion o áreas habilitadas
// 'unidad_analisis' -> subdirección de Salud Pública, y dentro de ella solo admin_subdireccion o el área Vigilancia en Salud Pública
export const RequireAreaAccess = (scope: AreaAccessScope) => SetMetadata(AREA_ACCESS_KEY, scope);
