import { Module } from '@nestjs/common';
import { AsesoriasService } from './asesorias.service';
import { AsesoriasController } from './asesorias.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { AsesoriasCertificateReport } from './reports/asesorias-certificate.report';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [AuthModule, CommonModule],
    controllers: [AsesoriasController],
    providers: [AsesoriasService, PrismaService, AsesoriasCertificateReport],
    exports: [AsesoriasService],
})
export class AsesoriasModule { }