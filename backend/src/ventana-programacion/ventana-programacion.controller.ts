import { Controller, Get, Put, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { VentanaProgramacionService } from './ventana-programacion.service';
import { SetVentanaDto } from './dto/set-ventana.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ventana-programacion')
@UseGuards(JwtAuthGuard)
export class VentanaProgramacionController {
    constructor(private readonly ventanaService: VentanaProgramacionService) { }

    @Get()
    get() {
        return this.ventanaService.get();
    }

    @Put()
    set(@Body() dto: SetVentanaDto, @Request() req) {
        return this.ventanaService.set(dto, req.user);
    }

    @Delete()
    deactivate(@Request() req) {
        return this.ventanaService.deactivate(req.user);
    }
}
