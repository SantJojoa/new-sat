import { Module } from '@nestjs/common';
import { SalidasService } from './salidas.service';
import { SalidasController } from './salidas.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SalidasPdfReport } from './reports/salidas-pdf.report';
import { SalidasExcelReport } from './reports/salidas-excel.report';
import { AcompanamientoCertificateReport } from './reports/acompanamiento-certificate.report';
import { CommonModule } from '../common/common.module';
import { DocumentosAdicionalesModule } from '../documentos-adicionales/documentos-adicionales.module';

@Module({
    imports: [AuthModule, NotificationsModule, CommonModule, DocumentosAdicionalesModule],
    controllers: [SalidasController],
    providers: [SalidasService, PrismaService, SalidasPdfReport, SalidasExcelReport, AcompanamientoCertificateReport],
    exports: [SalidasService],
})
export class SalidasModule { }