import { Module } from '@nestjs/common';
import { SubdireccionesService } from './subdirecciones.service';
import { SubdireccionesController } from './subdirecciones.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    imports: [],
    controllers: [SubdireccionesController],
    providers: [SubdireccionesService, PrismaService],
    exports: [SubdireccionesService],
})
export class SubdireccionesModule { }
