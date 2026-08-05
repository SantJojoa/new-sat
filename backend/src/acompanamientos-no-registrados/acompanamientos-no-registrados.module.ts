import { Module } from '@nestjs/common';
import { AcompanamientosNoRegistradosService } from './acompanamientos-no-registrados.service';
import { AcompanamientosNoRegistradosController } from './acompanamientos-no-registrados.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { AcompanamientoCertificateReport } from '../salidas/reports/acompanamiento-certificate.report';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [AuthModule, CommonModule],
    controllers: [AcompanamientosNoRegistradosController],
    providers: [AcompanamientosNoRegistradosService, PrismaService, AcompanamientoCertificateReport],
    exports: [AcompanamientosNoRegistradosService],
})
export class AcompanamientosNoRegistradosModule { }
