import { Module } from '@nestjs/common';
import { VentanaProgramacionService } from './ventana-programacion.service';
import { VentanaProgramacionController } from './ventana-programacion.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [VentanaProgramacionController],
    providers: [VentanaProgramacionService, PrismaService],
    exports: [VentanaProgramacionService],
})
export class VentanaProgramacionModule { }
