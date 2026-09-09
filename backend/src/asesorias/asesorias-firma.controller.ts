import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { AsesoriasFirmaService } from './asesorias-firma.service';
import { SaveFirmaDto } from './dto/firma-asistente.dto';

@Controller('firma-asistente')
export class AsesoriasFirmaController {
    constructor(private readonly firmaService: AsesoriasFirmaService) { }

    @Get(':token')
    getInfo(@Param('token') token: string) {
        return this.firmaService.getByToken(token);
    }

    @Post(':token')
    saveFirma(@Param('token') token: string, @Body() dto: SaveFirmaDto) {
        return this.firmaService.saveFirma(token, dto.firma);
    }
}