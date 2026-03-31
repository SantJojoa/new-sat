import { Module } from '@nestjs/common';
import { ArticulacionesService } from './articulaciones.service';
import { ArticulacionesController } from './articulaciones.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [ArticulacionesController],
    providers: [ArticulacionesService, PrismaService],
    exports: [ArticulacionesService],
})
export class ArticulacionesModule { }
