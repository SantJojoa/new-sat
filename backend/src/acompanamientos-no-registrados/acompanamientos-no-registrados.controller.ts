import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    BadRequestException,
    Request,
    Query,
    Res,
    StreamableFile,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { AcompanamientosNoRegistradosService } from './acompanamientos-no-registrados.service';
import { CreateAcompanamientoNoRegistradoDto } from './dto/create-acompanamiento-no-registrado.dto';
import { UploadActaAcompanamientoNoRegistradoDto } from './dto/upload-acta-acompanamiento-no-registrado.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { DocumentosAdicionalesService, documentosFileFilter, DOCUMENTOS_MULTER_LIMITS, DOCUMENTOS_MAX_FILES } from '../documentos-adicionales/documentos-adicionales.service';

@Controller('acompanamientos-no-registrados')
@UseGuards(JwtAuthGuard)
export class AcompanamientosNoRegistradosController {
    constructor(
        private readonly service: AcompanamientosNoRegistradosService,
        private readonly documentosAdicionalesService: DocumentosAdicionalesService,
    ) { }

    @Post()
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'create')
    create(@Body() dto: CreateAcompanamientoNoRegistradoDto, @Request() req) {
        return this.service.create(dto, req.user);
    }

    @Post('archivo')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'create')
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        limits: { fileSize: 15 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (file.mimetype !== 'application/pdf') return cb(new BadRequestException('Solo se permiten archivos PDF'), false);
            cb(null, true);
        },
    }))
    uploadArchivo(
        @Body() dto: UploadActaAcompanamientoNoRegistradoDto,
        @UploadedFile() file: Express.Multer.File,
        @Request() req,
    ) {
        return this.service.uploadArchivo(dto, file, req.user);
    }

    @Get()
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    findAll(@Request() req, @Query('viewAll') viewAll?: string) {
        return this.service.findAll(req.user, viewAll === 'true');
    }

    @Get(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    findOne(@Param('id') id: string, @Request() req) {
        return this.service.findOne(id, req.user);
    }

    @Get(':id/certificado')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    async getCertificado(
        @Param('id') id: string,
        @Request() req,
        @Res({ passthrough: true }) res: Response,
    ) {
        const buffer = await this.service.generateCertificado(id, req.user);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="certificado-acompanamiento-no-registrado-${id}.pdf"`,
        });
        return new StreamableFile(buffer);
    }

    @Get(':id/archivo')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    async downloadArchivo(
        @Param('id') id: string,
        @Request() req,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { buffer, nombre } = await this.service.getArchivo(id, req.user);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${nombre}"`,
        });
        return new StreamableFile(buffer);
    }

    @Post(':id/documentos')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    @UseInterceptors(FilesInterceptor('files', DOCUMENTOS_MAX_FILES, {
        storage: memoryStorage(),
        limits: DOCUMENTOS_MULTER_LIMITS,
        fileFilter: documentosFileFilter,
    }))
    async uploadDocumentos(
        @Param('id') id: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Request() req,
    ) {
        await this.service.findOne(id, req.user);
        return this.documentosAdicionalesService.upload('acta_no_registrada', id, files, req.user.id);
    }

    @Get(':id/documentos')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    async listDocumentos(@Param('id') id: string, @Request() req) {
        await this.service.findOne(id, req.user);
        return this.documentosAdicionalesService.list('acta_no_registrada', id);
    }

    @Get(':id/documentos/:docId')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    async downloadDocumento(
        @Param('id') id: string,
        @Param('docId') docId: string,
        @Request() req,
        @Res({ passthrough: true }) res: Response,
    ) {
        await this.service.findOne(id, req.user);
        const { buffer, nombre, mimeType } = await this.documentosAdicionalesService.download('acta_no_registrada', id, docId);
        res.set({ 'Content-Type': mimeType, 'Content-Disposition': `inline; filename="${nombre}"` });
        return new StreamableFile(buffer);
    }

    @Delete(':id/documentos/:docId')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    async deleteDocumento(
        @Param('id') id: string,
        @Param('docId') docId: string,
        @Request() req,
    ) {
        await this.service.findOne(id, req.user);
        return this.documentosAdicionalesService.remove('acta_no_registrada', id, docId);
    }
}
