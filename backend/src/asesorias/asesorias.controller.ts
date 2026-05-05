import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { AsesoriasService } from './asesorias.service';
import { CreateAsesoriaDto } from './dto/create-asesoria.dto';
import { UpdateAsesoriaDto } from './dto/update-asesoria.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('asesorias')
@UseGuards(JwtAuthGuard)
export class AsesoriasController {
    constructor(private readonly asesoriasService: AsesoriasService) { }

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
}