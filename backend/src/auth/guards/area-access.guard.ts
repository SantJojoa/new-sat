import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AREA_ACCESS_KEY, AreaAccessScope } from '../decorators/area-access.decorator';

const SUBDIRECCION_SALUD_PUBLICA = 'subdireccion de salud publica';
const SUBDIRECCION_CALIDAD = 'subdireccion de calidad y aseguramiento';
const AREA_VIGILANCIA_SALUD_PUBLICA = 'vigilancia en salud publica';

// Áreas fuera de Salud Pública que también pueden usar IV (por id): Aseguramiento.
const AREAS_IV_EXTRA_IDS = new Set(['cmqh8a0ne002625mnlx87xxdt']);

const AREAS_IVC_SALUD_PUBLICA = new Set([
    'control de medicamentos',
    'laboratorio de salud publica',
]);

const normalize = (value?: string | null) =>
    (value ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();

@Injectable()
export class AreaAccessGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const scope = this.reflector.getAllAndOverride<AreaAccessScope>(AREA_ACCESS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!scope) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) throw new ForbiddenException('Usuario no autenticado');

        if (user.user_types?.name === 'superadmin') return true;

        const subdireccion = normalize(user.subdirecciones?.name || user.areas?.subdirecciones?.name);
        const area = normalize(user.areas?.name);

        let allowed = false;
        if (scope === 'ivc') {
            if (subdireccion === SUBDIRECCION_CALIDAD) {
                allowed = true;
            } else if (subdireccion === SUBDIRECCION_SALUD_PUBLICA) {
                allowed = user.user_types?.name === 'admin_subdireccion' || AREAS_IVC_SALUD_PUBLICA.has(area);
            }
        } else if (scope === 'iv') {
            // Todos los usuarios de la Subdirección de Salud Pública pueden usar IV, sin filtro de área.
            allowed = subdireccion === SUBDIRECCION_SALUD_PUBLICA
                || AREAS_IV_EXTRA_IDS.has(user.areas?.id ?? user.area_id);
        } else if (scope === 'unidad_analisis') {
            if (subdireccion === SUBDIRECCION_SALUD_PUBLICA) {
                allowed = user.user_types?.name === 'admin_subdireccion' || area === AREA_VIGILANCIA_SALUD_PUBLICA;
            }
        }

        if (!allowed) {
            throw new ForbiddenException('No tienes acceso a este módulo para tu área/subdirección');
        }
        return true;
    }
}
