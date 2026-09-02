import { Module } from '@nestjs/common';
import { DocumentosAdicionalesService } from './documentos-adicionales.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    providers: [DocumentosAdicionalesService, PrismaService],
    exports: [DocumentosAdicionalesService],
})
export class DocumentosAdicionalesModule { }
