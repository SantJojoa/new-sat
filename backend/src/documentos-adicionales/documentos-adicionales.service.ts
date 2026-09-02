import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const DOCUMENTOS_ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function documentosFileFilter(_req: unknown, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) {
    if (!DOCUMENTOS_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new BadRequestException('Tipo de archivo no permitido. Se aceptan PDF, imágenes (JPG/PNG), Excel o Word'), false);
    }
    cb(null, true);
}

export const DOCUMENTOS_MULTER_LIMITS = { fileSize: 15 * 1024 * 1024 };
export const DOCUMENTOS_MAX_FILES = 10;

@Injectable()
export class DocumentosAdicionalesService {
    constructor(private prisma: PrismaService) { }

    private readonly listSelect = {
        id: true,
        nombre: true,
        mime_type: true,
        tamano: true,
        created_at: true,
        uploaded_by: { select: { id: true, names: true, last_name: true } },
    };

    async upload(seguimientoType: string, seguimientoId: string, files: Express.Multer.File[], uploadedById?: string) {
        if (!files || files.length === 0) throw new BadRequestException('No se recibió ningún archivo');

        return Promise.all(files.map(file => this.prisma.documentos_adicionales.create({
            data: {
                seguimiento_type: seguimientoType,
                seguimiento_id: seguimientoId,
                nombre: file.originalname,
                mime_type: file.mimetype,
                tamano: file.size,
                archivo: new Uint8Array(file.buffer),
                uploaded_by_id: uploadedById ?? null,
            },
            select: this.listSelect,
        })));
    }

    async list(seguimientoType: string, seguimientoId: string) {
        return this.prisma.documentos_adicionales.findMany({
            where: { seguimiento_type: seguimientoType, seguimiento_id: seguimientoId },
            select: this.listSelect,
            orderBy: { created_at: 'desc' },
        });
    }

    async download(seguimientoType: string, seguimientoId: string, docId: string): Promise<{ buffer: Buffer; nombre: string; mimeType: string }> {
        const doc = await this.prisma.documentos_adicionales.findUnique({ where: { id: docId } });
        if (!doc || doc.seguimiento_type !== seguimientoType || doc.seguimiento_id !== seguimientoId) {
            throw new NotFoundException('Documento no encontrado');
        }
        return { buffer: Buffer.from(doc.archivo), nombre: doc.nombre, mimeType: doc.mime_type };
    }

    async remove(seguimientoType: string, seguimientoId: string, docId: string) {
        const doc = await this.prisma.documentos_adicionales.findUnique({ where: { id: docId } });
        if (!doc || doc.seguimiento_type !== seguimientoType || doc.seguimiento_id !== seguimientoId) {
            throw new NotFoundException('Documento no encontrado');
        }
        await this.prisma.documentos_adicionales.delete({ where: { id: docId } });
        return { success: true };
    }
}
