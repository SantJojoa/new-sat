import { Module } from '@nestjs/common';
import { SolicitudesUnionService } from './solicitudes-union.service';
import { SolicitudesUnionController } from './solicitudes-union.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [SolicitudesUnionController],
    providers: [SolicitudesUnionService, PrismaService],
    exports: [SolicitudesUnionService],
})
export class SolicitudesUnionModule {}
