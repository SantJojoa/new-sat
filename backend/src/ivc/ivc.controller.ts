import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
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
