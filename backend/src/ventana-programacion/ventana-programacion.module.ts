import { Module } from '@nestjs/common';
import { VentanaProgramacionService } from './ventana-programacion.service';
import { VentanaProgramacionController } from './ventana-programacion.controller';
import { VentanaGateway } from './ventana-programacion.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [VentanaProgramacionController],
    providers: [VentanaProgramacionService, VentanaGateway, PrismaService],
    exports: [VentanaProgramacionService],
})
export class VentanaProgramacionModule { }
