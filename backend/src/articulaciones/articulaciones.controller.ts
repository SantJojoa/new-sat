import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Res } from '@nestjs/common';
import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { ArticulacionesService } from './articulaciones.service';
import { CreateArticulacionDto } from './dto/create-articulacion.dto';
import { UpdateArticulacionDto } from './dto/update-articulacion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('articulaciones')
@UseGuards(JwtAuthGuard)
export class ArticulacionesController {
    constructor(private readonly articulacionesService: ArticulacionesService) { }

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
}
