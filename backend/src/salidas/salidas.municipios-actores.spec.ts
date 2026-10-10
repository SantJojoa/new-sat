import { BadRequestException } from '@nestjs/common';
import { SalidasService } from './salidas.service';
import { UnidadAnalisisService } from '../unidad-analisis/unidad-analisis.service';

const base = {
    tipo_salida: 'Capacitacion Presencial', tema: 'Tema', fecha_inicio: '2026-11-03', fecha_final: '2026-11-03',
    jornada: 'Completa', lugar_evento_id: 'lugar-1',
};
const MSG_MUNI = 'Debe seleccionar al menos un municipio convocado';
const MSG_ACTOR = /al menos un actor/;

describe('SalidasService.assertMunicipiosYActores', () => {
    const assert = SalidasService.assertMunicipiosYActores;

    it('rechaza sin municipios', () => {
        expect(() => assert({ municipios: [], ips: [{}] })).toThrow(MSG_MUNI);
        expect(() => assert({ ips: [{}] })).toThrow(BadRequestException);
    });

    it('rechaza municipios solos', () => {
        expect(() => assert({ municipios: ['m1'] })).toThrow(MSG_ACTOR);
        expect(() => assert({ municipios: ['m1'], ips: [], entidades: [], eapb: [], organizaciones: [], idsn: [] })).toThrow(BadRequestException);
    });

    it.each(['ips', 'entidades', 'eapb', 'organizaciones', 'idsn'])('acepta municipio + %s', (key) => {
        expect(() => assert({ municipios: ['m1'], [key]: [{ id: 'x' }] })).not.toThrow();
    });
});

describe('SalidasService create/update', () => {
    let prisma: any;
    let service: SalidasService;
    const superadmin: any = { id: 'u1', user_type_id: 't1' };

    beforeEach(() => {
        prisma = {
            user_types: { findUnique: jest.fn().mockResolvedValue({ name: 'superadmin' }) },
            areas: { findUnique: jest.fn().mockResolvedValue({ name: 'Area', subdireccion_id: null }) },
            salidas: {
                count: jest.fn().mockResolvedValue(0), findUnique: jest.fn().mockResolvedValue(null),
                create: jest.fn().mockResolvedValue({ id: 's1' }), update: jest.fn().mockResolvedValue({ id: 's1' }),
            },
            municipios: { findMany: jest.fn().mockResolvedValue([{ name: 'Cali' }]) },
        };
        const userContext: any = { resolveTargetAreaId: jest.fn().mockResolvedValue('a1') };
        service = new SalidasService(prisma, {} as any, {} as any, { notify: jest.fn() } as any, {} as any, userContext);
    });

    it('create: rechaza municipios sin actores y no escribe en BD', async () => {
        await expect(service.create({ ...base, municipios_ids: ['m1'] } as any, superadmin)).rejects.toThrow(MSG_ACTOR);
        expect(prisma.salidas.create).not.toHaveBeenCalled();
    });

    it('create: rechaza actores sin municipios', async () => {
        await expect(service.create({ ...base, idsn_ids: ['i1'] } as any, superadmin)).rejects.toThrow(MSG_MUNI);
        expect(prisma.salidas.create).not.toHaveBeenCalled();
    });

    it('create: acepta municipio + actor', async () => {
        jest.spyOn(service as any, 'checkConflicts').mockResolvedValue(undefined);
        await service.create({ ...base, municipios_ids: ['m1'], idsn_ids: ['i1'] } as any, superadmin);
        expect(prisma.salidas.create).toHaveBeenCalled();
    });

    describe('update', () => {
        const existente = {
            id: 's1', estado: 'pendiente', solicitante_id: 'u1', fecha_inicio: new Date(), fecha_final: new Date(), jornada: 'Completa',
            municipios: [{ id: 'm1' }], salida_ips: [{ ips_id: 'p1', actor_id: 'a1' }], entidades: [], salida_eapb: [], organizaciones: [], idsn: [],
        };
        beforeEach(() => jest.spyOn(service, 'findOne').mockResolvedValue(existente as any));

        it('edición que no toca municipios/actores conserva los existentes', async () => {
            await service.update('s1', { tema: 'Nuevo' } as any, superadmin);
            expect(prisma.salidas.update).toHaveBeenCalled();
        });

        it('rechaza quitar todos los actores', async () => {
            await expect(service.update('s1', { ips_actores: [] } as any, superadmin)).rejects.toThrow(MSG_ACTOR);
            expect(prisma.salidas.update).not.toHaveBeenCalled();
        });

        it('rechaza quitar todos los municipios', async () => {
            await expect(service.update('s1', { municipios_ids: [] } as any, superadmin)).rejects.toThrow(MSG_MUNI);
        });
    });
});

describe('UnidadAnalisisService create/update', () => {
    let prisma: any;
    let service: UnidadAnalisisService;
    const user: any = { id: 'u1', user_type_id: 't1' };

    beforeEach(() => {
        prisma = {
            areas: { findUnique: jest.fn().mockResolvedValue({ name: 'Area' }) },
            salidas: { count: jest.fn().mockResolvedValue(0), create: jest.fn().mockResolvedValue({}), update: jest.fn().mockResolvedValue({}) },
            municipios: { findMany: jest.fn().mockResolvedValue([]) },
        };
        const userContext: any = { resolveTargetAreaId: jest.fn().mockResolvedValue('a1') };
        const salidasService: any = {
            findOne: jest.fn().mockResolvedValue({
                es_unidad_analisis: true, municipios: [{ id: 'm1' }], salida_ips: [], entidades: [{ id: 'e1' }], salida_eapb: [], organizaciones: [], idsn: [],
            }),
        };
        service = new (UnidadAnalisisService as any)(prisma, salidasService, userContext);
    });

    const dto = { ...base, tipo_salida: 'x' };

    it('create: rechaza municipios solos', async () => {
        await expect(service.create({ ...dto, municipios_ids: ['m1'] } as any, user)).rejects.toThrow(MSG_ACTOR);
        expect(prisma.salidas.create).not.toHaveBeenCalled();
    });

    it('create: rechaza sin municipios', async () => {
        await expect(service.create({ ...dto, ips_actores: [{ ips_id: 'p', actor_id: 'a' }] } as any, user)).rejects.toThrow(MSG_MUNI);
    });

    it('create: acepta municipio + actor', async () => {
        await service.create({ ...dto, municipios_ids: ['m1'], organizaciones_ids: ['o1'] } as any, user);
        expect(prisma.salidas.create).toHaveBeenCalled();
    });

    it('update: parcial conserva datos existentes; quitar actores falla', async () => {
        await service.update('s1', { tema: 'x' } as any, user);
        expect(prisma.salidas.update).toHaveBeenCalled();
        await expect(service.update('s1', { entidades_ids: [] } as any, user)).rejects.toThrow(MSG_ACTOR);
    });
});

describe('Regla del mes siguiente', () => {
    const ref = new Date(2026, 9, 9); // 9 oct 2026

    it('acepta fechas del mes siguiente (inclusive primer y último día)', () => {
        expect(() => SalidasService.assertMesSiguiente(ref, '2026-11-01', '2026-11-30')).not.toThrow();
    });

    it.each(['2026-10-31', '2026-12-01', '2026-10-09', '2027-11-05'])('rechaza %s', (f) => {
        expect(() => SalidasService.assertMesSiguiente(ref, f)).toThrow('noviembre de 2026');
    });

    it('cambio de año: diciembre -> enero', () => {
        expect(() => SalidasService.assertMesSiguiente(new Date(2026, 11, 15), '2027-01-10')).not.toThrow();
        expect(() => SalidasService.assertMesSiguiente(new Date(2026, 11, 15), '2026-12-20')).toThrow('enero de 2027');
    });

    describe('update', () => {
        let prisma: any;
        let service: SalidasService;
        const existente = {
            id: 's1', estado: 'pendiente', solicitante_id: 'u1', fecha_inicio: new Date(2026, 10, 15), fecha_final: new Date(2026, 10, 16), jornada: 'Completa',
            municipios: [{ id: 'm1' }], salida_ips: [{ ips_id: 'p1', actor_id: 'a1' }], entidades: [], salida_eapb: [], organizaciones: [], idsn: [],
        };
        const mk = (tipo: string) => {
            prisma = {
                user_types: { findUnique: jest.fn().mockResolvedValue({ name: tipo }) },
                salidas: { update: jest.fn().mockResolvedValue({}) },
                municipios: { findMany: jest.fn().mockResolvedValue([]) },
            };
            service = new SalidasService(prisma, {} as any, {} as any, {} as any, {} as any, {} as any);
            jest.spyOn(service, 'findOne').mockResolvedValue(existente as any);
            jest.spyOn(service as any, 'checkConflicts').mockResolvedValue(undefined);
        };
        const lider: any = { id: 'u1', user_type_id: 't' };

        it('líder no puede mover la fecha a un mes anterior ni posterior', async () => {
            mk('lider');
            await expect(service.update('s1', { fecha_inicio: '2026-10-20' } as any, lider)).rejects.toThrow('noviembre de 2026');
            await expect(service.update('s1', { fecha_inicio: '2026-12-02' } as any, lider)).rejects.toThrow('noviembre de 2026');
            await expect(service.update('s1', { fecha_final: '2026-12-02' } as any, lider)).rejects.toThrow('noviembre de 2026');
            expect(prisma.salidas.update).not.toHaveBeenCalled();
        });

        it('líder puede cambiar fechas dentro del mes de la programación (noviembre)', async () => {
            mk('lider');
            await service.update('s1', { fecha_inicio: '2026-11-10', fecha_final: '2026-11-12' } as any, lider);
            expect(prisma.salidas.update).toHaveBeenCalled();
        });

        it('el mes se toma de la programación, no de hoy (editar en noviembre una de noviembre)', async () => {
            mk('lider');
            jest.useFakeTimers().setSystemTime(new Date(2026, 10, 20));
            try {
                await service.update('s1', { fecha_inicio: '2026-11-25' } as any, lider);
                await expect(service.update('s1', { fecha_inicio: '2026-12-01' } as any, lider)).rejects.toThrow('noviembre de 2026');
            } finally { jest.useRealTimers(); }
        });

        it('editar sin tocar fechas no revalida el mes', async () => {
            mk('lider');
            await service.update('s1', { tema: 'x' } as any, lider);
            expect(prisma.salidas.update).toHaveBeenCalled();
        });

        it('superadmin no tiene restricción de mes', async () => {
            mk('superadmin');
            await service.update('s1', { fecha_inicio: '2026-03-01' } as any, lider);
            expect(prisma.salidas.update).toHaveBeenCalled();
        });
    });
});
