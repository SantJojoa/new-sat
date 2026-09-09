import { Module } from '@nestjs/common';
import { UnidadAnalisisService } from './unidad-analisis.service';
import { UnidadAnalisisController } from './unidad-analisis.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { SalidasModule } from '../salidas/salidas.module';
import { DocumentosAdicionalesModule } from '../documentos-adicionales/documentos-adicionales.module';

@Module({
    imports: [AuthModule, CommonModule, SalidasModule, DocumentosAdicionalesModule],
    controllers: [UnidadAnalisisController],
    providers: [UnidadAnalisisService, PrismaService],
})
export class UnidadAnalisisModule { }
