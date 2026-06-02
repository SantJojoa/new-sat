import type { AuthUser } from "../types/auth";

const normalize = (value?: string | null) =>
    (value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

const getSubdireccionName = (user?: AuthUser | null) =>
    user?.subdireccion?.name || user?.area?.subdirecciones?.name || "";

const getAreaName = (user?: AuthUser | null) => user?.area?.name || "";

export const isSaludPublicaUser = (user?: AuthUser | null) =>
    normalize(getSubdireccionName(user)).includes("subdireccion de salud publica");

export const isCalidadAreaUser = (user?: AuthUser | null) =>
    normalize(getAreaName(user)).includes("calidad");

export const canUseInspeccionVigilanciaSp = (user?: AuthUser | null) =>
    isSaludPublicaUser(user);

export const canUseIvc = (user?: AuthUser | null) =>
    isSaludPublicaUser(user) && isCalidadAreaUser(user);

export const canAccessModule = (moduleName: string, user?: AuthUser | null) => {
    if (moduleName === "seguimiento_articulacion_iv") {
        return canUseInspeccionVigilanciaSp(user);
    }

    if (["solicitar_ivc", "gestionar_ivc", "calendario_ivc", "reportes_ivc", "seguimiento_ivc"].includes(moduleName)) {
        return canUseIvc(user);
    }

    return true;
};
