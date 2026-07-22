export function parseDateLocal(dateStr: string | Date): Date {
    if (dateStr instanceof Date) return dateStr;
    if (dateStr.includes('T')) return new Date(dateStr);
    return new Date(`${dateStr}T12:00:00`);
}
