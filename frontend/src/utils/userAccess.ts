import type { AuthUser } from "../types/auth";

const SUBDIRECCION_SALUD_PUBLICA_ID = "cmqh8a0n2002425mnzkfx8dxj";
const SUBDIRECCION_CALIDAD_ID = "cmqh8a0ne002625mnlx87xxdt";

const AREAS_IVC_SALUD_PUBLICA = new Set([
    "cmqh8a0pp003b25mn4om76vms",
    "cmqh8a0p0002x25mng35bkigh",
]);

const getUserSubdireccionId = (user?: AuthUser | null) =>
    user?.subdireccion_id ||
    user?.subdireccion?.id ||
    user?.area?.subdireccion_id ||
    user?.area?.subdirecciones?.id ||
    null;

export const isSaludPublicaUser = (user?: AuthUser | null) =>
    getUserSubdireccionId(user) === SUBDIRECCION_SALUD_PUBLICA_ID;

export const canUseInspeccionVigilanciaSp = (user?: AuthUser | null) =>
    isSaludPublicaUser(user);

export const canUseIvc = (user?: AuthUser | null) => {
    const subdirId = getUserSubdireccionId(user);
    if (subdirId === SUBDIRECCION_CALIDAD_ID) return true;
    if (subdirId === SUBDIRECCION_SALUD_PUBLICA_ID && user?.area_id && AREAS_IVC_SALUD_PUBLICA.has(user.area_id)) return true;
    return false;
};

export const canAccessModule = (moduleName: string, user?: AuthUser | null) => {
    if (moduleName === "seguimiento_articulacion_iv") {
        return canUseInspeccionVigilanciaSp(user);
    }

    if (["solicitar_ivc", "gestionar_ivc", "calendario_ivc", "reportes_ivc", "seguimiento_ivc"].includes(moduleName)) {
        return canUseIvc(user);
    }

    return true;
};
