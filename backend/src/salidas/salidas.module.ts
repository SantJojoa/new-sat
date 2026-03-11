import { Module } from '@nestjs/common';
import { SalidasService } from './salidas.service';
import { SalidasController } from './salidas.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { SalidasPdfReport } from './reports/salidas-pdf.report';

@Module({
    imports: [AuthModule],
    controllers: [SalidasController],
    providers: [SalidasService, PrismaService, SalidasPdfReport],
    exports: [SalidasService],
})
export class SalidasModule { }