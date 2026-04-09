import { Module } from '@nestjs/common';
import { IvcService } from './ivc.service';
import { IvcController } from './ivc.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { IvcExcelReport } from './reports/ivc-excel.report';
import { IvcPdfReport } from './reports/ivc-pdf.report';

@Module({
    imports: [AuthModule],
    controllers: [IvcController],
    providers: [IvcService, PrismaService, IvcExcelReport, IvcPdfReport],
    exports: [IvcService],
})
export class IvcModule { }
