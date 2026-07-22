interface EstadisticasFindManyDelegate {
    findMany(args: any): Promise<any[]>;
}

export interface GetEstadisticasFilters {
    areaId?: string;
    estado?: string;
    subdireccionId?: string;
    startDate?: string;
    endDate?: string;
}

// Genera las estadísticas (totales, por estado, por solicitante, por área/subdirección)
// que comparten los módulos de articulaciones e ivc — misma forma de registro
// (solicitante/area/fecha_inicio/estado), solo cambia el delegate de Prisma.
export async function getEstadisticasGenericas(
    delegate: EstadisticasFindManyDelegate,
    filters: GetEstadisticasFilters,
) {
    const { areaId, estado, subdireccionId, startDate, endDate } = filters;
    const where: any = {};
    if (areaId) where.area_id = areaId;
    if (estado) where.estado = estado;
    if (subdireccionId) where.areas = { subdireccion_id: subdireccionId };
    if (startDate || endDate) {
        where.fecha_inicio = {};
        if (startDate) where.fecha_inicio.gte = new Date(`${startDate}T00:00:00`);
        if (endDate) where.fecha_inicio.lte = new Date(`${endDate}T23:59:59`);
    }

    const items = await delegate.findMany({
        where,
        include: { solicitante: { select: { id: true, names: true, last_name: true } }, areas: { select: { id: true, name: true, subdirecciones: { select: { id: true, name: true } } } } },
        orderBy: { fecha_inicio: 'desc' }
    });

    const total = items.length;

    const toCounts = (map: Record<string, number>): { name: string; count: number }[] =>
        Object.entries(map).map(([name, count]) => ({ name, count }));

    const estadosMap: Record<string, number> = items.reduce((acc, item) => { acc[item.estado] = (acc[item.estado] || 0) + 1; return acc; }, {});
    const estados = toCounts(estadosMap);

    const solMap: Record<string, number> = items.reduce((acc, item) => {
        const name = `${item.solicitante.names} ${(item.solicitante as any).last_name || ''}`.trim();
        acc[name] = (acc[name] || 0) + 1; return acc;
    }, {});
    const topSolicitantes = toCounts(solMap).sort((a, b) => b.count - a.count).slice(0, 5);

    const areasMap: Record<string, number> = items.reduce((acc, item) => { const name = item.areas?.name || 'Sin área'; acc[name] = (acc[name] || 0) + 1; return acc; }, {});
    const areas = toCounts(areasMap);

    const subdireccionesMap: Record<string, number> = items.reduce((acc, item: any) => { const name = item.areas?.subdirecciones?.name || 'Sin subdirección'; acc[name] = (acc[name] || 0) + 1; return acc; }, {});
    const porSubdireccion = toCounts(subdireccionesMap);

    return { total, estados, topSolicitantes, areas, porSubdireccion, items };
}
