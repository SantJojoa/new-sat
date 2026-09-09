import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
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
import { UnidadAnalisisService } from './unidad-analisis.service';
import { SalidasService } from '../salidas/salidas.service';
import { CreateUnidadAnalisisDto } from './dto/create-unidad-analisis.dto';
import { UpdateUnidadAnalisisDto } from './dto/update-unidad-analisis.dto';
import { SetSeguimientoArticulacionIvDto } from '../salidas/dto/set-seguimiento-articulacion-iv.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AreaAccessGuard } from '../auth/guards/area-access.guard';
import { RequireAreaAccess } from '../auth/decorators/area-access.decorator';
import { UploadActaSeguimientoDto } from '../common/dto/upload-acta-seguimiento.dto';
import { DocumentosAdicionalesService, documentosFileFilter, DOCUMENTOS_MULTER_LIMITS, DOCUMENTOS_MAX_FILES } from '../documentos-adicionales/documentos-adicionales.service';

@Controller('unidad-analisis')
@UseGuards(JwtAuthGuard, PermissionsGuard, AreaAccessGuard)
@RequireAreaAccess('unidad_analisis')
export class UnidadAnalisisController {
    constructor(
        private readonly unidadAnalisisService: UnidadAnalisisService,
        private readonly salidasService: SalidasService,
        private readonly documentosAdicionalesService: DocumentosAdicionalesService,
    ) { }

    @Post()
    @RequirePermissions('unidad_analisis', 'create')
    create(@Body() dto: CreateUnidadAnalisisDto, @Request() req) {
        return this.unidadAnalisisService.create(dto, req.user);
    }

    @Get()
    @RequirePermissions('unidad_analisis', 'view')
    findAll(@Request() req, @Query('viewAll') viewAll?: string) {
        return this.unidadAnalisisService.findAll(req.user, viewAll === 'true');
    }

    @Get('catalogos')
    @RequirePermissions('unidad_analisis', 'view')
    getCatalogos(@Request() req) {
        return this.unidadAnalisisService.getCatalogos(req.user);
    }

    @Get(':id')
    @RequirePermissions('unidad_analisis', 'view')
    findOne(@Param('id') id: string, @Request() req) {
        return this.unidadAnalisisService.findOne(id, req.user);
    }

    @Patch(':id')
    @RequirePermissions('unidad_analisis', 'edit')
    update(@Param('id') id: string, @Body() dto: UpdateUnidadAnalisisDto, @Request() req) {
        return this.unidadAnalisisService.update(id, dto, req.user);
    }

    @Delete(':id')
    @RequirePermissions('unidad_analisis', 'delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.unidadAnalisisService.remove(id, req.user);
    }

    @Patch(':id/seguimiento-articulacion-iv')
    @RequirePermissions('unidad_analisis', 'edit')
    async setSeguimiento(@Param('id') id: string, @Body() dto: SetSeguimientoArticulacionIvDto, @Request() req) {
        await this.unidadAnalisisService.findOne(id, req.user);
        return this.salidasService.setSeguimientoArticulacionIv(id, dto, req.user);
    }

    @Post(':id/seguimiento-articulacion-iv/archivo')
    @RequirePermissions('unidad_analisis', 'edit')
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        limits: { fileSize: 15 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (file.mimetype !== 'application/pdf') return cb(new BadRequestException('Solo se permiten archivos PDF'), false);
            cb(null, true);
        },
    }))
    async uploadActa(
        @Param('id') id: string,
        @Body() dto: UploadActaSeguimientoDto,
        @UploadedFile() file: Express.Multer.File,
        @Request() req,
    ) {
        await this.unidadAnalisisService.findOne(id, req.user);
        return this.salidasService.uploadActaArticulacionIv(id, file, dto.se_realizo === 'true', req.user);
    }

    @Get(':id/seguimiento-articulacion-iv/archivo')
    @RequirePermissions('unidad_analisis', 'view')
    async downloadActa(@Param('id') id: string, @Request() req, @Res({ passthrough: true }) res: Response) {
        await this.unidadAnalisisService.findOne(id, req.user);
        const { buffer, nombre } = await this.salidasService.getActaArchivoArticulacionIv(id, req.user);
        res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${nombre}"` });
        return new StreamableFile(buffer);
    }

    @Post(':id/documentos')
    @RequirePermissions('unidad_analisis', 'view')
    @UseInterceptors(FilesInterceptor('files', DOCUMENTOS_MAX_FILES, {
        storage: memoryStorage(),
        limits: DOCUMENTOS_MULTER_LIMITS,
        fileFilter: documentosFileFilter,
    }))
    async uploadDocumentos(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[], @Request() req) {
        await this.unidadAnalisisService.findOne(id, req.user);
        return this.documentosAdicionalesService.upload('salida', id, files, req.user.id);
    }

    @Get(':id/documentos')
    @RequirePermissions('unidad_analisis', 'view')
    async listDocumentos(@Param('id') id: string, @Request() req) {
        await this.unidadAnalisisService.findOne(id, req.user);
        return this.documentosAdicionalesService.list('salida', id);
    }

    @Get(':id/documentos/:docId')
    @RequirePermissions('unidad_analisis', 'view')
    async downloadDocumento(
        @Param('id') id: string,
        @Param('docId') docId: string,
        @Request() req,
        @Res({ passthrough: true }) res: Response,
    ) {
        await this.unidadAnalisisService.findOne(id, req.user);
        const { buffer, nombre, mimeType } = await this.documentosAdicionalesService.download('salida', id, docId);
        res.set({ 'Content-Type': mimeType, 'Content-Disposition': `inline; filename="${nombre}"` });
        return new StreamableFile(buffer);
    }

    @Delete(':id/documentos/:docId')
    @RequirePermissions('unidad_analisis', 'edit')
    async deleteDocumento(@Param('id') id: string, @Param('docId') docId: string, @Request() req) {
        await this.unidadAnalisisService.findOne(id, req.user);
        return this.documentosAdicionalesService.remove('salida', id, docId);
    }
}
