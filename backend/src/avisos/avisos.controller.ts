import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AvisosService } from './avisos.service';
import { CreateAvisoDto } from './dto/create-aviso.dto';
import { UpdateAvisoDto } from './dto/update-aviso.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('avisos')
@UseGuards(JwtAuthGuard)
export class AvisosController {
    constructor(private readonly avisosService: AvisosService) { }

    @Post()
    create(@Body() dto: CreateAvisoDto, @Request() req) {
        return this.avisosService.create(dto, req.user);
    }

    @Get()
    findAll(@Request() req) {
        return this.avisosService.findAll(req.user);
    }

    @Get('active')
    findActive() {
        return this.avisosService.findActive();
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateAvisoDto, @Request() req) {
        return this.avisosService.update(id, dto, req.user);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        return this.avisosService.remove(id, req.user);
    }
}
