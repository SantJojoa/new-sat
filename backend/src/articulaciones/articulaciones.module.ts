import { Module } from '@nestjs/common';
import { ArticulacionesService } from './articulaciones.service';
import { ArticulacionesController } from './articulaciones.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { ArticulacionesExcelReport } from './reports/articulaciones-excel.report';
import { ArticulacionesPdfReport } from './reports/articulaciones-pdf.report';

@Module({
    imports: [AuthModule],
    controllers: [ArticulacionesController],
    providers: [ArticulacionesService, PrismaService, ArticulacionesExcelReport, ArticulacionesPdfReport],
    exports: [ArticulacionesService],
})
export class ArticulacionesModule { }
