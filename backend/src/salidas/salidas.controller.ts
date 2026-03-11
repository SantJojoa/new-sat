import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    Query,
    Res,
    StreamableFile
} from '@nestjs/common';
import type { Response } from 'express';
import { SalidasService } from './salidas.service';
import { CreateSalidaDto } from './dto/create-salida.dto';
import { UpdateSalidaDto } from './dto/update-salida.dto';
import { ApproveSalidaDto, RejectSalidaDto, BulkApproveSalidaDto, BulkRejectSalidaDto } from './dto/aprove-salida.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('salidas')
@UseGuards(JwtAuthGuard)
export class SalidasController {
    constructor(private readonly salidasService: SalidasService) { }

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
        @Query('jornada') jornada?: string
    ) {
        return this.salidasService.getEstadisticas(req.user, startDate, endDate, areaId, estado, jornada);
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
        @Query('jornada') jornada?: string
    ) {
        const { buffer, filename } = await this.salidasService.exportEstadisticasPdf(
            req.user,
            startDate,
            endDate,
            areaId,
            estado,
            jornada
        );

        res.set({
            'Content-Type': 'application/pdf',
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

    @Get(':id/historial')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_salida', 'view')
    getHistorial(@Param('id') id: string, @Request() req) {
        // Aquí podrías implementar un historial de cambios si lo necesitas
        return { message: 'Historial no implementado aún' };
    }
}
