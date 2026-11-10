import { Injectable, ForbiddenException } from '@nestjs/common';
import { users } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserContextService } from '../common/services/user-context.service';

export type Seccion = 'programaciones' | 'asesorias' | 'articulaciones' | 'ivc' | 'iv' | 'acompanamientos';
export const TODAS_SECCIONES: Seccion[] = ['programaciones', 'asesorias', 'articulaciones', 'ivc', 'iv', 'acompanamientos'];

export interface Hoja { nombre: string; columnas: string[]; filas: (string | number)[][] }

export interface ReportesFilters {
    startDate?: string;
    endDate?: string;
    subdireccionId?: string;
    areaId?: string;
}

type Count = { name: string; count: number };
type PorUbicacion = { porSubdireccion: Count[]; porArea: Count[] };
type SeguimientoStat = { actividades: number; conSeguimiento: number; sinSeguimiento: number; realizadas: number };
export interface ReportesResumen {
    programaciones: { total: number; porEstado: Count[]; porTipo: Count[]; porSubtipo: Count[] } & PorUbicacion;
    asesorias: { total: number; minutos: number; porMedio: Count[] } & PorUbicacion;
    ivc: { total: number; porEstado: Count[] } & PorUbicacion;
    articulaciones: { total: number; porEstado: Count[] } & PorUbicacion;
    iv: { total: number } & PorUbicacion;
    seguimientos: Record<'capacitaciones' | 'ivc' | 'inspeccionVigilancia' | 'articulaciones', SeguimientoStat>;
    acompanamientos: { programados: SeguimientoStat; noProgramados: number; total: number } & PorUbicacion;
}

const norm = (v?: string | null) => (v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function toCounts(map: Record<string, number>): Count[] {
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

function tally<T>(items: T[], key: (i: T) => string | string[]): Count[] {
    const map: Record<string, number> = {};
    for (const it of items) {
        const k = key(it);
        for (const name of Array.isArray(k) ? k : [k]) map[name] = (map[name] || 0) + 1;
    }
    return toCounts(map);
}

@Injectable()
export class ReportesService {
    constructor(private prisma: PrismaService, private userContext: UserContextService) { }

    /** Restringe el alcance según el rol: superadmin todo, admin_subdirección su subdirección, resto su área. */
    private async scopeAreas(user: users, f: ReportesFilters) {
        const userType = await this.userContext.getUserType(user);
        const area: any = {};
        if (userType?.name === 'superadmin') {
            if (f.subdireccionId) area.subdireccion_id = f.subdireccionId;
        } else if (userType?.name === 'admin_subdireccion') {
            const sub = await this.userContext.getUserSubdireccionId(user);
            if (!sub) throw new ForbiddenException('No tienes subdirección asignada');
            area.subdireccion_id = sub;
        } else {
            if (!user.area_id) throw new ForbiddenException('No tienes un área asignada');
            return { id: user.area_id } as any;
        }
        if (f.areaId) area.id = f.areaId;
        return area;
    }

    private dateRange(f: ReportesFilters) {
        const r: any = {};
        if (f.startDate) r.gte = new Date(`${f.startDate}T00:00:00`);
        if (f.endDate) r.lte = new Date(`${f.endDate}T23:59:59.999`);
        return Object.keys(r).length ? r : undefined;
    }

    async getResumen(user: users, f: ReportesFilters): Promise<ReportesResumen> {
        return (await this.compute(user, f)).resumen;
    }

    private async compute(user: users, f: ReportesFilters) {
        const areaWhere = await this.scopeAreas(user, f);
        const range = this.dateRange(f);
        const withDate = (field: string) => (range ? { [field]: range } : {});

        const [salidas, articulaciones, ivc, asesorias, noRegistrados] = await Promise.all([
            this.prisma.salidas.findMany({
                where: { es_unidad_analisis: false, areas: areaWhere, ...withDate('fecha_inicio') },
                select: {
                    id: true, codigo: true, estado: true, tipo_salida: true, subtipo_salida: true, tema: true,
                    fecha_inicio: true, fecha_final: true, jornada: true,
                    solicitante: { select: { names: true, last_name: true } },
                    municipios: { select: { name: true } },
                    areas: { select: { name: true, subdirecciones: { select: { name: true } } } },
                    seguimiento_capacitacion: { select: { se_realizo: true } },
                    seguimiento_ivc: { select: { se_realizo: true } },
                    seguimiento_articulacion_iv: { select: { se_realizo_vsp: true } },
                    seguimiento_acompanamiento: { select: { se_realizo: true, se_programo: true } },
                },
            }),
            this.prisma.articulaciones.findMany({
                where: { areas: areaWhere, ...withDate('fecha_inicio') },
                select: {
                    codigo: true, estado: true, tema: true, fecha_inicio: true, fecha_final: true, jornada: true, instituciones_convocadas: true,
                    solicitante: { select: { names: true, last_name: true } },
                    areas: { select: { name: true, subdirecciones: { select: { name: true } } } },
                    seguimiento_articulacion: { select: { se_realizo: true } },
                },
            }),
            this.prisma.ivc.findMany({
                where: { areas: areaWhere, ...withDate('fecha_inicio') },
                select: {
                    codigo: true, estado: true, tema: true, fecha_inicio: true, fecha_final: true, jornada: true, instituciones_convocadas: true,
                    solicitante: { select: { names: true, last_name: true } },
                    areas: { select: { name: true, subdirecciones: { select: { name: true } } } },
                },
            }),
            this.prisma.asesorias.findMany({
                where: { areas: areaWhere, ...withDate('fecha') },
                select: {
                    codigo: true, fecha: true, hora: true, hora_fin: true, medio: true, institucion: true, temas_tratados: true, duracion_minutos: true,
                    municipio_otro: true, municipio_procedencia: { select: { name: true } },
                    registrador: { select: { names: true, last_name: true } },
                    areas: { select: { name: true, subdirecciones: { select: { name: true } } } },
                },
            }),
            this.prisma.acompanamientos_no_registrados.findMany({
                where: { areas: areaWhere, ...withDate('fecha_reunion') },
                select: {
                    id: true, codigo: true, nombre_reunion: true, fecha_reunion: true, institucion: true, municipio: true, acta_numero: true,
                    registrador: { select: { names: true, last_name: true } },
                    areas: { select: { name: true, subdirecciones: { select: { name: true } } } },
                },
            }),
        ]);

        const hasSub = (s: any, key: string) => norm(s.subtipo_salida).includes(key);
        const seg = (actividades: number, conSeguimiento: number, realizadas: number) => ({
            actividades, conSeguimiento, sinSeguimiento: actividades - conSeguimiento, realizadas,
        });

        const capac = salidas.filter(s => hasSub(s, 'capacitacion'));
        const ivcSal = salidas.filter(s => hasSub(s, 'ivc') || s.seguimiento_ivc);
        const iv = salidas.filter(s => hasSub(s, 'inspeccion') || s.seguimiento_articulacion_iv);
        const acomp = salidas.filter(s => hasSub(s, 'acompanamiento') || s.seguimiento_acompanamiento);

        const bySub = (i: any) => i.areas?.subdirecciones?.name || 'Sin subdirección';
        const byArea = (i: any) => i.areas?.name || 'Sin área';
        const acompTodos = [...acomp, ...noRegistrados];

        const resumen: ReportesResumen = {
            programaciones: {
                total: salidas.length,
                porEstado: tally(salidas, s => s.estado),
                porTipo: tally(salidas, s => s.tipo_salida || 'Sin tipo'),
                porSubtipo: tally(salidas, s => (s.subtipo_salida || '').split(',').map(x => x.trim()).filter(Boolean)),
                porSubdireccion: tally(salidas, s => s.areas?.subdirecciones?.name || 'Sin subdirección'),
                porArea: tally(salidas, s => s.areas?.name || 'Sin área'),
            },
            asesorias: {
                total: asesorias.length,
                minutos: asesorias.reduce((a, x) => a + (x.duracion_minutos || 0), 0),
                porMedio: tally(asesorias, a => a.medio || 'Sin medio'),
                porSubdireccion: tally(asesorias, bySub), porArea: tally(asesorias, byArea),
            },
            ivc: { total: ivc.length, porEstado: tally(ivc, i => i.estado), porSubdireccion: tally(ivc, bySub), porArea: tally(ivc, byArea) },
            articulaciones: { total: articulaciones.length, porEstado: tally(articulaciones, a => a.estado), porSubdireccion: tally(articulaciones, bySub), porArea: tally(articulaciones, byArea) },
            iv: { total: iv.length, porSubdireccion: tally(iv, bySub), porArea: tally(iv, byArea) },
            seguimientos: {
                capacitaciones: seg(capac.length, capac.filter(s => s.seguimiento_capacitacion).length, capac.filter(s => s.seguimiento_capacitacion?.se_realizo).length),
                ivc: seg(ivcSal.length, ivcSal.filter(s => s.seguimiento_ivc).length, ivcSal.filter(s => s.seguimiento_ivc?.se_realizo).length),
                inspeccionVigilancia: seg(iv.length, iv.filter(s => s.seguimiento_articulacion_iv).length, iv.filter(s => s.seguimiento_articulacion_iv?.se_realizo_vsp).length),
                articulaciones: seg(articulaciones.length, articulaciones.filter(a => a.seguimiento_articulacion).length, articulaciones.filter(a => a.seguimiento_articulacion?.se_realizo).length),
            },
            acompanamientos: {
                programados: seg(acomp.length, acomp.filter(s => s.seguimiento_acompanamiento).length, acomp.filter(s => s.seguimiento_acompanamiento?.se_realizo).length),
                noProgramados: noRegistrados.length,
                total: acomp.length + noRegistrados.length,
                porSubdireccion: tally(acompTodos, bySub), porArea: tally(acompTodos, byArea),
            },
        };

        return { resumen, salidas, capac, ivcSal, iv, acomp, articulaciones, ivc, asesorias, noRegistrados };
    }

    /** Resumen + hojas de detalle (una por tipo de actividad) para exportar a Excel/PDF. */
    async getReporteCompleto(user: users, f: ReportesFilters, secciones: Seccion[]) {
        const r = await this.compute(user, f);
        const has = (x: Seccion) => secciones.includes(x);
        const nom = (u?: { names: string; last_name: string } | null) => (u ? `${u.names} ${u.last_name}` : '');
        const fecha = (d?: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');
        const sub = (i: any) => i.areas?.subdirecciones?.name || '';
        const si = (v: any) => (v ? 'Sí' : 'No');

        const hojas: Hoja[] = [];
        if (has('programaciones')) hojas.push({
            nombre: 'Programaciones',
            columnas: ['Código', 'Tipo', 'Subtipo', 'Tema', 'Fecha inicio', 'Fecha final', 'Jornada', 'Estado', 'Subdirección', 'Área', 'Solicitante', 'Municipios', 'Con seguimiento', 'Realizada'],
            filas: r.salidas.map(s => {
                const segs = [s.seguimiento_capacitacion?.se_realizo, s.seguimiento_ivc?.se_realizo, s.seguimiento_articulacion_iv?.se_realizo_vsp, s.seguimiento_acompanamiento?.se_realizo];
                const hay = !!(s.seguimiento_capacitacion || s.seguimiento_ivc || s.seguimiento_articulacion_iv || s.seguimiento_acompanamiento);
                return [s.codigo, s.tipo_salida, s.subtipo_salida || '', s.tema, fecha(s.fecha_inicio), fecha(s.fecha_final), s.jornada, s.estado, sub(s), s.areas?.name || '', nom(s.solicitante), s.municipios.map(m => m.name).join(', '), si(hay), hay ? si(segs.some(Boolean)) : ''];
            }),
        });
        if (has('asesorias')) hojas.push({
            nombre: 'Asesorías',
            columnas: ['Código', 'Fecha', 'Hora', 'Hora fin', 'Medio', 'Institución', 'Municipio', 'Temas tratados', 'Duración (min)', 'Subdirección', 'Área', 'Registrador'],
            filas: r.asesorias.map(a => [a.codigo, fecha(a.fecha), a.hora, a.hora_fin, a.medio, a.institucion, a.municipio_procedencia?.name || a.municipio_otro || '', a.temas_tratados, a.duracion_minutos, sub(a), a.areas?.name || '', nom(a.registrador)]),
        });
        if (has('articulaciones')) hojas.push({
            nombre: 'Articulaciones',
            columnas: ['Código', 'Tema', 'Fecha inicio', 'Fecha final', 'Jornada', 'Estado', 'Instituciones', 'Subdirección', 'Área', 'Solicitante', 'Con seguimiento', 'Realizada'],
            filas: r.articulaciones.map(a => [a.codigo, a.tema, fecha(a.fecha_inicio), fecha(a.fecha_final), a.jornada, a.estado, a.instituciones_convocadas || '', sub(a), a.areas?.name || '', nom(a.solicitante), si(a.seguimiento_articulacion), a.seguimiento_articulacion ? si(a.seguimiento_articulacion.se_realizo) : '']),
        });
        if (has('ivc')) hojas.push({
            nombre: 'IVC',
            columnas: ['Código', 'Tema', 'Fecha inicio', 'Fecha final', 'Jornada', 'Estado', 'Instituciones', 'Subdirección', 'Área', 'Solicitante'],
            filas: r.ivc.map(a => [a.codigo, a.tema, fecha(a.fecha_inicio), fecha(a.fecha_final), a.jornada, a.estado, a.instituciones_convocadas || '', sub(a), a.areas?.name || '', nom(a.solicitante)]),
        });
        if (has('iv')) hojas.push({
            nombre: 'Inspección y Vigilancia',
            columnas: ['Código', 'Tema', 'Fecha inicio', 'Fecha final', 'Estado', 'Subdirección', 'Área', 'Solicitante', 'Con seguimiento', 'Realizada'],
            filas: r.iv.map(s => [s.codigo, s.tema, fecha(s.fecha_inicio), fecha(s.fecha_final), s.estado, sub(s), s.areas?.name || '', nom(s.solicitante), si(s.seguimiento_articulacion_iv), s.seguimiento_articulacion_iv ? si(s.seguimiento_articulacion_iv.se_realizo_vsp) : '']),
        });
        if (has('acompanamientos')) hojas.push({
            nombre: 'Acompañamientos',
            columnas: ['Modalidad', 'Código', 'Tema / Reunión', 'Fecha', 'Institución', 'Municipio', 'Subdirección', 'Área', 'Responsable', 'Con seguimiento', 'Realizado'],
            filas: [
                ...r.acomp.map(s => ['Programado', s.codigo, s.tema, fecha(s.fecha_inicio), '', s.municipios.map(m => m.name).join(', '), sub(s), s.areas?.name || '', nom(s.solicitante), si(s.seguimiento_acompanamiento), s.seguimiento_acompanamiento ? si(s.seguimiento_acompanamiento.se_realizo) : '']),
                ...r.noRegistrados.map(n => ['No programado', n.codigo, n.nombre_reunion || '', fecha(n.fecha_reunion), n.institucion || '', n.municipio || '', sub(n), n.areas?.name || '', nom(n.registrador), 'Sí', 'Sí']),
            ],
        });
        return { resumen: r.resumen, hojas };
    }
}
