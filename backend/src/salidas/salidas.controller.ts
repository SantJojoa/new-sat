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
    Query
} from '@nestjs/common';
import { SalidasService } from './salidas.service';
import { CreateSalidaDto } from './dto/create-salida.dto';
import { UpdateSalidaDto } from './dto/update-salida.dto';
import { ApproveSalidaDto, RejectSalidaDto } from './dto/aprove-salida.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('salidas')
@UseGuards(JwtAuthGuard)
export class SalidasController {
    constructor(private readonly salidasService: SalidasService) { }

    @Post()
    @UseGuards(PermissionsGuard)
    @RequirePermissions('salidas', 'create')
    create(@Body() createSalidaDto: CreateSalidaDto, @Request() req) {
        return this.salidasService.create(createSalidaDto, req.user);
    }

    @Get()
    @UseGuards(PermissionsGuard)
    @RequirePermissions('salidas', 'view')
    findAll(@Request() req) {
        return this.salidasService.findAll(req.user);
    }

    @Get('estadisticas')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('salidas', 'view')
    getEstadisticas(@Request() req) {
        return this.salidasService.getEstadisticas(req.user);
    }

    @Get(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('salidas', 'view')
    findOne(@Param('id') id: string, @Request() req) {
        return this.salidasService.findOne(id, req.user);
    }

    @Patch(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('salidas', 'edit')
    update(
        @Param('id') id: string,
        @Body() updateSalidaDto: UpdateSalidaDto,
        @Request() req
    ) {
        return this.salidasService.update(id, updateSalidaDto, req.user);
    }

    @Delete(':id')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('salidas', 'delete')
    remove(@Param('id') id: string, @Request() req) {
        return this.salidasService.remove(id, req.user);
    }

    @Post(':id/approve')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('salidas', 'approve')
    approve(
        @Param('id') id: string,
        @Body() approveDto: ApproveSalidaDto,
        @Request() req
    ) {
        return this.salidasService.approve(id, req.user, approveDto);
    }

    @Post(':id/reject')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('salidas', 'approve')
    reject(
        @Param('id') id: string,
        @Body() rejectDto: RejectSalidaDto,
        @Request() req
    ) {
        return this.salidasService.reject(id, req.user, rejectDto);
    }

    @Get(':id/historial')
    @UseGuards(PermissionsGuard)
    @RequirePermissions('salidas', 'view')
    getHistorial(@Param('id') id: string, @Request() req) {
        // Aquí podrías implementar un historial de cambios si lo necesitas
        return { message: 'Historial no implementado aún' };
    }
}