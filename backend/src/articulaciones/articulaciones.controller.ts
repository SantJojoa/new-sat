import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException, Request, Query, Res } from '@nestjs/common';
import { StreamableFile } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { ArticulacionesService } from './articulaciones.service';
import { CreateArticulacionDto } from './dto/create-articulacion.dto';
import { UpdateArticulacionDto } from './dto/update-articulacion.dto';
import { SetSeguimientoArticulacionDto } from './dto/set-seguimiento-articulacion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { DocumentosAdicionalesService, documentosFileFilter, DOCUMENTOS_MULTER_LIMITS, DOCUMENTOS_MAX_FILES } from '../documentos-adicionales/documentos-adicionales.service';
import { UploadActaSeguimientoDto } from '../common/dto/upload-acta-seguimiento.dto';

@Controller('articulaciones')
@UseGuards(JwtAuthGuard)
export class ArticulacionesController {
    constructor(
        private readonly articulacionesService: ArticulacionesService,
        private readonly documentosAdicionalesService: DocumentosAdicionalesService,
    ) { }

    @Post()
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_articulacion', 'create')
    create(@Body() dto: CreateArticulacionDto, @Request() req) {
        return this.articulacionesService.create(dto, req.user);
    }

    @Get()
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_articulacion', 'view')
    findAll(@Request() req, @Query('viewAll') viewAll?: string) {
        return this.articulacionesService.findAll(req.user, viewAll === 'true');
    }

    @Get('catalogos')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_articulacion', 'view')
    getCatalogos(@Request() req) {
        return this.articulacionesService.getCatalogos(req.user);
    }

    @Get('estadisticas')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_articulacion', 'view')
    getEstadisticas(
        @Request() req,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('area_id') areaId?: string,
        @Query('estado') estado?: string,
        @Query('subdireccion_id') subdireccionId?: string,
    ) {
        return this.articulacionesService.getEstadisticas(req.user, startDate, endDate, areaId, estado, subdireccionId);
    }

    @Get('estadisticas/excel')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_articulacion', 'view')
    async downloadExcel(
        @Request() req,
        @Res({ passthrough: true }) res: Response,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('area_id') areaId?: string,
        @Query('estado') estado?: string,
        @Query('subdireccion_id') subdireccionId?: string,
    ) {
        const { buffer, filename } = await this.articulacionesService.exportExcel(req.user, startDate, endDate, areaId, estado, subdireccionId);
        res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${filename}"` });
        return new StreamableFile(buffer);
    }

    @Get('estadisticas/pdf')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_articulacion', 'view')
    async downloadPdf(
        @Request() req,
        @Res({ passthrough: true }) res: Response,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('area_id') areaId?: string,
        @Query('estado') estado?: string,
        @Query('subdireccion_id') subdireccionId?: string,
    ) {
        const { buffer, filename } = await this.articulacionesService.exportPdf(req.user, startDate, endDate, areaId, estado, subdireccionId);
        res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` });
        return new StreamableFile(buffer);
    }

    @Get(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_articulacion', 'view')
    findOne(@Param('id') id: string, @Request() req) {
        return this.articulacionesService.findOne(id, req.user);
    }

    @Patch(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_articulacion', 'edit')
    update(@Param('id') id: string, @Body() dto: UpdateArticulacionDto, @Request() req) {
        return this.articulacionesService.update(id, dto, req.user);
    }

    @Delete(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_articulacion', 'delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.articulacionesService.remove(id, req.user);
    }

    @Patch(':id/seguimiento-articulacion')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_articulacion', 'view')
    setSeguimientoArticulacion(
        @Param('id') id: string,
        @Body() dto: SetSeguimientoArticulacionDto,
        @Request() req
    ) {
        return this.articulacionesService.setSeguimientoArticulacion(id, dto, req.user);
    }

    @Get(':id/certificado-articulacion')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_articulacion', 'view')
    async getCertificadoArticulacion(
        @Param('id') id: string,
        @Request() req,
        @Res({ passthrough: true }) res: Response,
    ) {
        const buffer = await this.articulacionesService.generateCertificadoArticulacion(id, req.user);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="certificado-articulacion-${id}.pdf"`,
        });
        return new StreamableFile(buffer);
    }

    @Post(':id/seguimiento-articulacion/archivo')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_articulacion', 'view')
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        limits: { fileSize: 15 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (file.mimetype !== 'application/pdf') return cb(new BadRequestException('Solo se permiten archivos PDF'), false);
            cb(null, true);
        },
    }))
    uploadActaArticulacion(
        @Param('id') id: string,
        @Body() dto: UploadActaSeguimientoDto,
        @UploadedFile() file: Express.Multer.File,
        @Request() req,
    ) {
        return this.articulacionesService.uploadActaArticulacion(id, file, dto.se_realizo === 'true', req.user);
    }

    @Get(':id/seguimiento-articulacion/archivo')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_articulacion', 'view')
    async downloadActaArticulacion(
        @Param('id') id: string,
        @Request() req,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { buffer, nombre } = await this.articulacionesService.getActaArchivoArticulacion(id, req.user);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${nombre}"`,
        });
        return new StreamableFile(buffer);
    }

    @Post(':id/seguimiento-articulacion/documentos')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_articulacion', 'view')
    @UseInterceptors(FilesInterceptor('files', DOCUMENTOS_MAX_FILES, {
        storage: memoryStorage(),
        limits: DOCUMENTOS_MULTER_LIMITS,
        fileFilter: documentosFileFilter,
    }))
    async uploadDocumentosArticulacion(
        @Param('id') id: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Request() req,
    ) {
        await this.articulacionesService.findOne(id, req.user);
        return this.documentosAdicionalesService.upload('articulacion', id, files, req.user.id);
    }

    @Get(':id/seguimiento-articulacion/documentos')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_articulacion', 'view')
    async listDocumentosArticulacion(@Param('id') id: string, @Request() req) {
        await this.articulacionesService.findOne(id, req.user);
        return this.documentosAdicionalesService.list('articulacion', id);
    }

    @Get(':id/seguimiento-articulacion/documentos/:docId')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_articulacion', 'view')
    async downloadDocumentoArticulacion(
        @Param('id') id: string,
        @Param('docId') docId: string,
        @Request() req,
        @Res({ passthrough: true }) res: Response,
    ) {
        await this.articulacionesService.findOne(id, req.user);
        const { buffer, nombre, mimeType } = await this.documentosAdicionalesService.download('articulacion', id, docId);
        res.set({ 'Content-Type': mimeType, 'Content-Disposition': `inline; filename="${nombre}"` });
        return new StreamableFile(buffer);
    }

    @Delete(':id/seguimiento-articulacion/documentos/:docId')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_articulacion', 'view')
    async deleteDocumentoArticulacion(
        @Param('id') id: string,
        @Param('docId') docId: string,
        @Request() req,
    ) {
        await this.articulacionesService.findOne(id, req.user);
        return this.documentosAdicionalesService.remove('articulacion', id, docId);
    }
}
