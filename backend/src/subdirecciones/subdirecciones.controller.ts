import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from "@nestjs/common";
import { SubdireccionesService } from "./subdirecciones.service";
import { CreateSubdireccionDto } from "./dto/create-subdireccion.dto";
import { UpdateSubdireccionDto } from "./dto/update-subdireccion.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";

@Controller('subdirecciones')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SubdireccionesController {
    constructor(private readonly subdireccionesService: SubdireccionesService) { }

    @Post()
    @RequirePermissions('subdirecciones', 'create')
    create(@Body() createSubdireccionDto: CreateSubdireccionDto) {
        return this.subdireccionesService.create(createSubdireccionDto);
    }

    @Get()
    @RequirePermissions('subdirecciones', 'view')
    findAll() {
        return this.subdireccionesService.findAll();
    }

    @Get(':id')
    @RequirePermissions('subdirecciones', 'view')
    findOne(@Param('id') id: string) {
        return this.subdireccionesService.findOne(id);
    }

    @Patch(':id')
    @RequirePermissions('subdirecciones', 'edit')
    update(@Param('id') id: string, @Body() updateSubdireccionDto: UpdateSubdireccionDto) {
        return this.subdireccionesService.update(id, updateSubdireccionDto);
    }

    @Delete(':id')
    @RequirePermissions('subdirecciones', 'delete')
    remove(@Param('id') id: string) {
        return this.subdireccionesService.remove(id);
    }
}
