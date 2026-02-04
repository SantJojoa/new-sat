import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from "@nestjs/common";
import { SubdireccionesService } from "./subdirecciones.service";
import { CreateSubdireccionDto } from "./dto/create-subdireccion.dto";
import { UpdateSubdireccionDto } from "./dto/update-subdireccion.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller('subdirecciones')
@UseGuards(JwtAuthGuard)
export class SubdireccionesController {
    constructor(private readonly subdireccionesService: SubdireccionesService) { }

    @Post()
    create(@Body() createSubdireccionDto: CreateSubdireccionDto) {
        return this.subdireccionesService.create(createSubdireccionDto);
    }

    @Get()
    findAll() {
        return this.subdireccionesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.subdireccionesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateSubdireccionDto: UpdateSubdireccionDto) {
        return this.subdireccionesService.update(id, updateSubdireccionDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.subdireccionesService.remove(id);
    }
}
