import { Module } from '@nestjs/common';
import { SolicitudesUnionService } from './solicitudes-union.service';
import { SolicitudesUnionController } from './solicitudes-union.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [AuthModule, NotificationsModule, CommonModule],
    controllers: [SolicitudesUnionController],
    providers: [SolicitudesUnionService, PrismaService],
    exports: [SolicitudesUnionService],
})
export class SolicitudesUnionModule { }
