import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { SalidasModule } from './salidas/salidas.module';
import { SubdireccionesModule } from './subdirecciones/subdirecciones.module';
import { AreasModule } from './areas/areas.module';
import { SolicitudesUnionModule } from './solicitudes-union/solicitudes-union.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    SalidasModule,
    SubdireccionesModule,
    AreasModule,
    SolicitudesUnionModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule { }
