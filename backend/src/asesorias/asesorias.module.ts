import { Module } from '@nestjs/common';
import { AsesoriasService } from './asesorias.service';
import { AsesoriasController } from './asesorias.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [AsesoriasController],
    providers: [AsesoriasService, PrismaService],
    exports: [AsesoriasService],
})
export class AsesoriasModule { }