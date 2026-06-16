import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Res } from '@nestjs/common';
import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { IvcService } from './ivc.service';
import { CreateIvcDto } from './dto/create-ivc.dto';
import { UpdateIvcDto } from './dto/update-ivc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('ivc')
@UseGuards(JwtAuthGuard)
export class IvcController {
    constructor(private readonly ivcService: IvcService) { }

    @Post()
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_ivc', 'create')
    create(@Body() dto: CreateIvcDto, @Request() req) {
        return this.ivcService.create(dto, req.user);
    }

    @Get()
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_ivc', 'view')
    findAll(@Request() req, @Query('viewAll') viewAll?: string) {
        return this.ivcService.findAll(req.user, viewAll === 'true');
    }

    @Get('catalogos')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_ivc', 'view')
    getCatalogos(@Request() req) {
        return this.ivcService.getCatalogos();
    }

    @Get('estadisticas')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_ivc', 'view')
    getEstadisticas(
        @Request() req,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('area_id') areaId?: string,
        @Query('estado') estado?: string,
        @Query('subdireccion_id') subdireccionId?: string,
    ) {
        return this.ivcService.getEstadisticas(req.user, startDate, endDate, areaId, estado, subdireccionId);
    }

    @Get('estadisticas/excel')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_ivc', 'view')
    async downloadExcel(
        @Request() req,
        @Res({ passthrough: true }) res: Response,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('area_id') areaId?: string,
        @Query('estado') estado?: string,
        @Query('subdireccion_id') subdireccionId?: string,
    ) {
        const { buffer, filename } = await this.ivcService.exportExcel(req.user, startDate, endDate, areaId, estado, subdireccionId);
        res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${filename}"` });
        return new StreamableFile(buffer);
    }

    @Get('estadisticas/pdf')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_ivc', 'view')
    async downloadPdf(
        @Request() req,
        @Res({ passthrough: true }) res: Response,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('area_id') areaId?: string,
        @Query('estado') estado?: string,
        @Query('subdireccion_id') subdireccionId?: string,
    ) {
        const { buffer, filename } = await this.ivcService.exportPdf(req.user, startDate, endDate, areaId, estado, subdireccionId);
        res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` });
        return new StreamableFile(buffer);
    }

    @Get(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_ivc', 'view')
    findOne(@Param('id') id: string, @Request() req) {
        return this.ivcService.findOne(id, req.user);
    }

    @Patch(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_ivc', 'edit')
    update(@Param('id') id: string, @Body() dto: UpdateIvcDto, @Request() req) {
        return this.ivcService.update(id, dto, req.user);
    }

    @Delete(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('solicitar_ivc', 'delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.ivcService.remove(id, req.user);
    }
}
