export interface ChangelogEntry {
    version: string;
    date: string;
    changes: string[];
}

/**
 * Al publicar un cambio: sube APP_VERSION y agrega una entrada nueva
 * al inicio de CHANGELOG (la más reciente va primero). El modal de
 * "Novedades" que ven los usuarios al iniciar sesión siempre muestra
 * solo CHANGELOG[0].
 */
export const APP_VERSION = '0.1.2';

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: '0.1.1',
        date: '2026-08-04',
        changes: [
            'Los usuarios ahora pueden registrar actas y seguimientos de acompañamiento.',
            'Mensaje claro al intentar eliminar un usuario con programaciones, articulaciones u otros registros asociados (en vez de un error genérico).',
            'Aviso de novedades al iniciar sesión después de una actualización.',
        ],
    },
    {
        version: '0.1.0',
        date: '2026-06-01',
        changes: ['Versión piloto inicial de SIVAT.'],
    },
    {
        version: '0.1.2',
        date: '2026-08-04',
        changes: [
            'Se agrega informacion de nuevas actualizaciones en el modal de inicio de sesion.',
            'Se corrigio el error de permisos para los usuarios normales, ahora pueden realizar seguimientos y actas.',
        ],
    }
];
