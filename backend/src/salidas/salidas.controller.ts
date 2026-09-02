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
    StreamableFile
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { SalidasService } from './salidas.service';
import { CreateSalidaDto } from './dto/create-salida.dto';
import { UpdateSalidaDto } from './dto/update-salida.dto';
import { ApproveSalidaDto, RejectSalidaDto, BulkApproveSalidaDto, BulkRejectSalidaDto } from './dto/aprove-salida.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AreaAccessGuard } from '../auth/guards/area-access.guard';
import { RequireAreaAccess } from '../auth/decorators/area-access.decorator';
import { SetSeguimientoDto } from './dto/set-seguimiento.dto';
import { SetSeguimientoIvcDto } from './dto/set-seguimiento-ivc.dto';
import { SetSeguimientoArticulacionIvDto } from './dto/set-seguimiento-articulacion-iv.dto';
import { SetSeguimientoAcompanamientoDto } from './dto/set-seguimiento-acompanamiento.dto';
import { DocumentosAdicionalesService, documentosFileFilter, DOCUMENTOS_MULTER_LIMITS, DOCUMENTOS_MAX_FILES } from '../documentos-adicionales/documentos-adicionales.service';
import { UploadActaSeguimientoDto } from '../common/dto/upload-acta-seguimiento.dto';

@Controller('salidas')
@UseGuards(JwtAuthGuard)
export class SalidasController {
    constructor(
        private readonly salidasService: SalidasService,
        private readonly documentosAdicionalesService: DocumentosAdicionalesService,
    ) { }

    @Post()
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'create')
    create(@Body() createSalidaDto: CreateSalidaDto, @Request() req) {
        return this.salidasService.create(createSalidaDto, req.user);
    }

    @Get()
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    findAll(@Request() req, @Query('viewAll') viewAll?: string) {
        return this.salidasService.findAll(req.user, viewAll === 'true');
    }

    @Get('estadisticas')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    getEstadisticas(
        @Request() req,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('area_id') areaId?: string,
        @Query('estado') estado?: string,
        @Query('jornada') jornada?: string,
        @Query('subdireccion_id') subdireccionId?: string,
        @Query('tipo') tipo?: string,
        @Query('subtipo') subtipo?: string
    ) {
        return this.salidasService.getEstadisticas(req.user, startDate, endDate, areaId, estado, jornada, subdireccionId, tipo, subtipo);
    }

    @Get('estadisticas/pdf')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    async downloadEstadisticasPdf(
        @Request() req,
        @Res({ passthrough: true }) res: Response,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('area_id') areaId?: string,
        @Query('estado') estado?: string,
        @Query('jornada') jornada?: string,
        @Query('subdireccion_id') subdireccionId?: string,
        @Query('tipo') tipo?: string,
        @Query('subtipo') subtipo?: string
    ) {
        const { buffer, filename } = await this.salidasService.exportEstadisticasPdf(
            req.user,
            startDate,
            endDate,
            areaId,
            estado,
            jornada,
            subdireccionId,
            tipo,
            subtipo
        );

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`
        });

        return new StreamableFile(buffer);
    }

    @Get('estadisticas/excel')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    async downloadEstadisticasExcel(
        @Request() req,
        @Res({ passthrough: true }) res: Response,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('area_id') areaId?: string,
        @Query('estado') estado?: string,
        @Query('jornada') jornada?: string,
        @Query('subdireccion_id') subdireccionId?: string,
        @Query('tipo') tipo?: string,
        @Query('subtipo') subtipo?: string
    ) {
        const { buffer, filename } = await this.salidasService.exportEstadisticasExcel(
            req.user,
            startDate,
            endDate,
            areaId,
            estado,
            jornada,
            subdireccionId,
            tipo,
            subtipo
        );

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`
        });

        return new StreamableFile(buffer);
    }

    @Get('catalogos')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    getCatalogos(@Request() req: any) {
        return this.salidasService.getCatalogos(req.user);
    }

    @Post('bulk-approve')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'approve')
    bulkApprove(@Body() dto: BulkApproveSalidaDto, @Request() req) {
        return this.salidasService.bulkApprove(dto, req.user);
    }

    @Post('bulk-reject')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'approve')
    bulkReject(@Body() dto: BulkRejectSalidaDto, @Request() req) {
        return this.salidasService.bulkReject(dto, req.user);
    }

    @Get(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    findOne(@Param('id') id: string, @Request() req) {
        return this.salidasService.findOne(id, req.user);
    }

    @Patch(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'edit')
    update(
        @Param('id') id: string,
        @Body() updateSalidaDto: UpdateSalidaDto,
        @Request() req
    ) {
        return this.salidasService.update(id, updateSalidaDto, req.user);
    }

    @Delete(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.salidasService.remove(id, req.user);
    }

    @Post(':id/approve')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'approve')
    approve(
        @Param('id') id: string,
        @Body() approveDto: ApproveSalidaDto,
        @Request() req
    ) {
        return this.salidasService.approve(id, req.user, approveDto);
    }

    @Post(':id/reject')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'approve')
    reject(
        @Param('id') id: string,
        @Body() rejectDto: RejectSalidaDto,
        @Request() req
    ) {
        return this.salidasService.reject(id, req.user, rejectDto);
    }

    @Patch(':id/seguimiento')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    setSeguimiento(
        @Param('id') id: string,
        @Body() dto: SetSeguimientoDto,
        @Request() req
    ) {
        return this.salidasService.setSeguimiento(id, dto, req.user);
    }

    @Patch(':id/seguimiento-ivc')
    @UseGuards(PermissionsGuard, AreaAccessGuard)
    @RequirePermissions('solicitar_salida', 'view')
    @RequireAreaAccess('ivc')
    setSeguimientoIvc(
        @Param('id') id: string,
        @Body() dto: SetSeguimientoIvcDto,
        @Request() req
    ) {
        return this.salidasService.setSeguimientoIvc(id, dto, req.user);
    }

    @Patch(':id/seguimiento-articulacion-iv')
    @UseGuards(PermissionsGuard, AreaAccessGuard)
    @RequirePermissions('solicitar_salida', 'view')
    @RequireAreaAccess('iv')
    setSeguimientoArticulacionIv(
        @Param('id') id: string,
        @Body() dto: SetSeguimientoArticulacionIvDto,
        @Request() req
    ) {
        return this.salidasService.setSeguimientoArticulacionIv(id, dto, req.user);
    }

    @Patch(':id/seguimiento-acompanamiento')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    setSeguimientoAcompanamiento(
        @Param('id') id: string,
        @Body() dto: SetSeguimientoAcompanamientoDto,
        @Request() req
    ) {
        return this.salidasService.setSeguimientoAcompanamiento(id, dto, req.user);
    }

    @Get(':id/certificado-acompanamiento')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    async getCertificadoAcompanamiento(
        @Param('id') id: string,
        @Request() req,
        @Res({ passthrough: true }) res: Response,
    ) {
        const buffer = await this.salidasService.generateCertificadoAcompanamiento(id, req.user);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="certificado-acompanamiento-${id}.pdf"`,
        });
        return new StreamableFile(buffer);
    }

    @Post(':id/seguimiento-acompanamiento/archivo')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        limits: { fileSize: 15 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (file.mimetype !== 'application/pdf') return cb(new BadRequestException('Solo se permiten archivos PDF'), false);
            cb(null, true);
        },
    }))
    uploadActaAcompanamiento(
        @Param('id') id: string,
        @Body() dto: UploadActaSeguimientoDto,
        @UploadedFile() file: Express.Multer.File,
        @Request() req,
    ) {
        return this.salidasService.uploadActaAcompanamiento(id, file, dto.se_realizo === 'true', req.user);
    }

    @Get(':id/seguimiento-acompanamiento/archivo')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    async downloadActaAcompanamiento(
        @Param('id') id: string,
        @Request() req,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { buffer, nombre } = await this.salidasService.getActaArchivoAcompanamiento(id, req.user);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${nombre}"`,
        });
        return new StreamableFile(buffer);
    }

    @Post(':id/seguimiento/archivo')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        limits: { fileSize: 15 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (file.mimetype !== 'application/pdf') return cb(new BadRequestException('Solo se permiten archivos PDF'), false);
            cb(null, true);
        },
    }))
    uploadActaCapacitacion(
        @Param('id') id: string,
        @Body() dto: UploadActaSeguimientoDto,
        @UploadedFile() file: Express.Multer.File,
        @Request() req,
    ) {
        return this.salidasService.uploadActaCapacitacion(id, file, dto.se_realizo === 'true', req.user);
    }

    @Get(':id/seguimiento/archivo')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    async downloadActaCapacitacion(
        @Param('id') id: string,
        @Request() req,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { buffer, nombre } = await this.salidasService.getActaArchivoCapacitacion(id, req.user);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${nombre}"`,
        });
        return new StreamableFile(buffer);
    }

    @Post(':id/seguimiento-ivc/archivo')
    @UseGuards(PermissionsGuard, AreaAccessGuard)
    @RequirePermissions('solicitar_salida', 'view')
    @RequireAreaAccess('ivc')
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        limits: { fileSize: 15 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (file.mimetype !== 'application/pdf') return cb(new BadRequestException('Solo se permiten archivos PDF'), false);
            cb(null, true);
        },
    }))
    uploadActaIvc(
        @Param('id') id: string,
        @Body() dto: UploadActaSeguimientoDto,
        @UploadedFile() file: Express.Multer.File,
        @Request() req,
    ) {
        return this.salidasService.uploadActaIvc(id, file, dto.se_realizo === 'true', req.user);
    }

    @Get(':id/seguimiento-ivc/archivo')
    @UseGuards(PermissionsGuard, AreaAccessGuard)
    @RequirePermissions('solicitar_salida', 'view')
    @RequireAreaAccess('ivc')
    async downloadActaIvc(
        @Param('id') id: string,
        @Request() req,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { buffer, nombre } = await this.salidasService.getActaArchivoIvc(id, req.user);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${nombre}"`,
        });
        return new StreamableFile(buffer);
    }

    @Post(':id/seguimiento-articulacion-iv/archivo')
    @UseGuards(PermissionsGuard, AreaAccessGuard)
    @RequirePermissions('solicitar_salida', 'view')
    @RequireAreaAccess('iv')
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        limits: { fileSize: 15 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (file.mimetype !== 'application/pdf') return cb(new BadRequestException('Solo se permiten archivos PDF'), false);
            cb(null, true);
        },
    }))
    uploadActaArticulacionIv(
        @Param('id') id: string,
        @Body() dto: UploadActaSeguimientoDto,
        @UploadedFile() file: Express.Multer.File,
        @Request() req,
    ) {
        return this.salidasService.uploadActaArticulacionIv(id, file, dto.se_realizo === 'true', req.user);
    }

    @Get(':id/seguimiento-articulacion-iv/archivo')
    @UseGuards(PermissionsGuard, AreaAccessGuard)
    @RequirePermissions('solicitar_salida', 'view')
    @RequireAreaAccess('iv')
    async downloadActaArticulacionIv(
        @Param('id') id: string,
        @Request() req,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { buffer, nombre } = await this.salidasService.getActaArchivoArticulacionIv(id, req.user);
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
    async uploadDocumentosSalida(
        @Param('id') id: string,
        @UploadedFiles() files: Express.Multer.File[],
        @Request() req,
    ) {
        await this.salidasService.findOne(id, req.user);
        return this.documentosAdicionalesService.upload('salida', id, files, req.user.id);
    }

    @Get(':id/documentos')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    async listDocumentosSalida(@Param('id') id: string, @Request() req) {
        await this.salidasService.findOne(id, req.user);
        return this.documentosAdicionalesService.list('salida', id);
    }

    @Get(':id/documentos/:docId')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    async downloadDocumentoSalida(
        @Param('id') id: string,
        @Param('docId') docId: string,
        @Request() req,
        @Res({ passthrough: true }) res: Response,
    ) {
        await this.salidasService.findOne(id, req.user);
        const { buffer, nombre, mimeType } = await this.documentosAdicionalesService.download('salida', id, docId);
        res.set({ 'Content-Type': mimeType, 'Content-Disposition': `inline; filename="${nombre}"` });
        return new StreamableFile(buffer);
    }

    @Delete(':id/documentos/:docId')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    async deleteDocumentoSalida(
        @Param('id') id: string,
        @Param('docId') docId: string,
        @Request() req,
    ) {
        await this.salidasService.findOne(id, req.user);
        return this.documentosAdicionalesService.remove('salida', id, docId);
    }
}
