import type { AuthUser } from "../types/auth";

const SUBDIRECCION_SALUD_PUBLICA = "subdireccion de salud publica";
const SUBDIRECCION_CALIDAD = "subdireccion de calidad y aseguramiento";

const AREAS_IV_SALUD_PUBLICA = new Set([
    "control de medicamentos",
    "laboratorio de salud publica",
]);

const normalize = (value?: string | null) =>
    (value ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .trim();

const getUserSubdireccionNombre = (user?: AuthUser | null) =>
    normalize(user?.subdireccion?.name || user?.area?.subdirecciones?.name);

const getUserAreaNombre = (user?: AuthUser | null) =>
    normalize(user?.area?.name);

export const isSaludPublicaUser = (user?: AuthUser | null) =>
    getUserSubdireccionNombre(user) === SUBDIRECCION_SALUD_PUBLICA;

export const canUseInspeccionVigilanciaSp = (user?: AuthUser | null) => {
    if (user?.user_type?.name === "superadmin") return true;
    return isSaludPublicaUser(user) && AREAS_IV_SALUD_PUBLICA.has(getUserAreaNombre(user));
};

export const canUseIvc = (user?: AuthUser | null) => {
    if (user?.user_type?.name === "superadmin") return true;
    const subdireccion = getUserSubdireccionNombre(user);
    if (subdireccion === SUBDIRECCION_CALIDAD) return true;
    if (subdireccion === SUBDIRECCION_SALUD_PUBLICA) return true;
    return false;
};

export const canAccessModule = (moduleName: string, user?: AuthUser | null) => {
    if (user?.user_type?.name === "superadmin") return true;

    if (moduleName === "seguimiento_articulacion_iv") {
        return canUseInspeccionVigilanciaSp(user);
    }

    if (["solicitar_ivc", "gestionar_ivc", "calendario_ivc", "reportes_ivc", "seguimiento_ivc"].includes(moduleName)) {
        return canUseIvc(user);
    }

    return true;
};
