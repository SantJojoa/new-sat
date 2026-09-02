import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFiles, Request, Query, Res, StreamableFile } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { AsesoriasService } from './asesorias.service';
import { CreateAsesoriaDto } from './dto/create-asesoria.dto';
import { UpdateAsesoriaDto } from './dto/update-asesoria.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { DocumentosAdicionalesService, documentosFileFilter, DOCUMENTOS_MULTER_LIMITS, DOCUMENTOS_MAX_FILES } from '../documentos-adicionales/documentos-adicionales.service';

@Controller('asesorias')
@UseGuards(JwtAuthGuard)
export class AsesoriasController {
    constructor(
        private readonly asesoriasService: AsesoriasService,
        private readonly documentosAdicionalesService: DocumentosAdicionalesService,
    ) { }

    @Post()
    @UseGuards(PermissionsGuard)
    @RequirePermissions('programar_asesoria', 'create')
    create(@Body() dto: CreateAsesoriaDto, @Request() req) {
        return this.asesoriasService.create(dto, req.user);
    }

    @Get()
    @UseGuards(PermissionsGuard)
    @RequirePermissions('programar_asesoria', 'view')
    findAll(@Request() req, @Query('viewAll') viewAll?: string) {
        return this.asesoriasService.findAll(req.user, viewAll === 'true');
    }

    @Get('catalogos')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('programar_asesoria', 'view')
    getCatalogos(@Request() req) {
        return this.asesoriasService.getCatalogos(req.user);
    }

    @Get(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('programar_asesoria', 'view')
    findOne(@Param('id') id: string, @Request() req) {
        return this.asesoriasService.findOne(id, req.user);
    }

    @Patch(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('programar_asesoria', 'edit')
    update(@Param('id') id: string, @Body() dto: UpdateAsesoriaDto, @Request() req) {
        return this.asesoriasService.update(id, dto, req.user);
    }

    @Delete(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('programar_asesoria', 'delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.asesoriasService.remove(id, req.user);
    }

    @Get(':id/certificado')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('programar_asesoria', 'view')
    async generateCertificado(
        @Param('id') id: string,
        @Request() req,
        @Res({ passthrough: true }) res: Response,
    ) {
        const buffer = await this.asesoriasService.generateCertificado(id, req.user);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="certificado-asesoria-${id}.pdf"`,
        });
        return new StreamableFile(buffer);
    }

    @Post(':id/documentos')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('programar_asesoria', 'view')
    @UseInterceptors(FilesInterceptor('files', DOCUMENTOS_MAX_FILES, {
        storage: memoryStorage(),
        limits: DOCUMENTOS_MULTER_LIMITS,
        fileFilter: documentosFileFilter,
    }))
    async uploadDocumentosAsesoria(
        @Param('id') id: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Request() req,
    ) {
        await this.asesoriasService.findOne(id, req.user);
        return this.documentosAdicionalesService.upload('asesoria', id, files, req.user.id);
    }

    @Get(':id/documentos')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('programar_asesoria', 'view')
    async listDocumentosAsesoria(@Param('id') id: string, @Request() req) {
        await this.asesoriasService.findOne(id, req.user);
        return this.documentosAdicionalesService.list('asesoria', id);
    }

    @Get(':id/documentos/:docId')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('programar_asesoria', 'view')
    async downloadDocumentoAsesoria(
        @Param('id') id: string,
        @Param('docId') docId: string,
        @Request() req,
        @Res({ passthrough: true }) res: Response,
    ) {
        await this.asesoriasService.findOne(id, req.user);
        const { buffer, nombre, mimeType } = await this.documentosAdicionalesService.download('asesoria', id, docId);
        res.set({ 'Content-Type': mimeType, 'Content-Disposition': `inline; filename="${nombre}"` });
        return new StreamableFile(buffer);
    }

    @Delete(':id/documentos/:docId')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('programar_asesoria', 'view')
    async deleteDocumentoAsesoria(
        @Param('id') id: string,
        @Param('docId') docId: string,
        @Request() req,
    ) {
        await this.asesoriasService.findOne(id, req.user);
        return this.documentosAdicionalesService.remove('asesoria', id, docId);
    }
}