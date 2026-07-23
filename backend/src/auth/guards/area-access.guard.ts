import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AREA_ACCESS_KEY, AreaAccessScope } from '../decorators/area-access.decorator';

const SUBDIRECCION_SALUD_PUBLICA = 'subdireccion de salud publica';
const SUBDIRECCION_CALIDAD = 'subdireccion de calidad y aseguramiento';

const AREAS_IV_SALUD_PUBLICA = new Set([
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
            allowed = subdireccion === SUBDIRECCION_CALIDAD || subdireccion === SUBDIRECCION_SALUD_PUBLICA;
        } else if (scope === 'iv') {
            if (subdireccion !== SUBDIRECCION_SALUD_PUBLICA) {
                allowed = false;
            } else if (user.user_types?.name === 'admin_subdireccion') {
                allowed = true;
            } else {
                allowed = AREAS_IV_SALUD_PUBLICA.has(area);
            }
        }

        if (!allowed) {
            throw new ForbiddenException('No tienes acceso a este módulo para tu área/subdirección');
        }
        return true;
    }
}
