import { Module } from '@nestjs/common';
import { IvcService } from './ivc.service';
import { IvcController } from './ivc.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [IvcController],
    providers: [IvcService, PrismaService],
    exports: [IvcService],
})
export class IvcModule { }
