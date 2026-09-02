import { Module } from '@nestjs/common';
import { ArticulacionesService } from './articulaciones.service';
import { ArticulacionesController } from './articulaciones.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { ArticulacionesExcelReport } from './reports/articulaciones-excel.report';
import { ArticulacionesPdfReport } from './reports/articulaciones-pdf.report';
import { ArticulacionCertificateReport } from './reports/articulacion-certificate.report';
import { CommonModule } from '../common/common.module';
import { DocumentosAdicionalesModule } from '../documentos-adicionales/documentos-adicionales.module';

@Module({
    imports: [AuthModule, CommonModule, DocumentosAdicionalesModule],
    controllers: [ArticulacionesController],
    providers: [ArticulacionesService, PrismaService, ArticulacionesExcelReport, ArticulacionesPdfReport, ArticulacionCertificateReport],
    exports: [ArticulacionesService],
})
export class ArticulacionesModule { }
