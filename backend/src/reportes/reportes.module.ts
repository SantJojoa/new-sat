import { Module } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [AuthModule, CommonModule],
    controllers: [ReportesController],
    providers: [ReportesService, PrismaService],
})
export class ReportesModule { }
