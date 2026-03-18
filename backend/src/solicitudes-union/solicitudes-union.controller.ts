import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SolicitudesUnionService } from './solicitudes-union.service';
import { CreateSolicitudUnionDto, ResolveSolicitudUnionDto } from './dto/solicitudes-union.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('solicitudes-union')
@UseGuards(JwtAuthGuard)
export class SolicitudesUnionController {
    constructor(private readonly service: SolicitudesUnionService) {}

    @Post()
    create(@Body() dto: CreateSolicitudUnionDto, @Request() req) {
        return this.service.create(dto, req.user);
    }

    @Get()
    findAll(@Request() req) {
        return this.service.findAll(req.user);
    }

    @Get('pending-count')
    getPendingCount(@Request() req) {
        return this.service.getPendingCount(req.user);
    }

    @Post(':id/accept')
    accept(@Param('id') id: string, @Body() dto: ResolveSolicitudUnionDto, @Request() req) {
        return this.service.accept(id, dto, req.user);
    }

    @Post(':id/reject')
    reject(@Param('id') id: string, @Body() dto: ResolveSolicitudUnionDto, @Request() req) {
        return this.service.reject(id, dto, req.user);
    }
}
