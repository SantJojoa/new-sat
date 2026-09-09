import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
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
    saveFirma(@Param('token') token: string, @Body() dto: SaveFirmaDto, @Req() req: Request) {
        // nginx manda la IP real del visitante en X-Real-IP (no usa X-Forwarded-For)
        const ip = (req.headers['x-real-ip'] as string) || req.socket.remoteAddress || 'desconocida';
        return this.firmaService.saveFirma(token, dto.firma, ip);
    }
}