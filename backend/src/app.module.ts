import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { SalidasModule } from './salidas/salidas.module';
import { SubdireccionesModule } from './subdirecciones/subdirecciones.module';
import { AreasModule } from './areas/areas.module';
import { SolicitudesUnionModule } from './solicitudes-union/solicitudes-union.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ArticulacionesModule } from './articulaciones/articulaciones.module';
import { IvcModule } from './ivc/ivc.module';
import { VentanaProgramacionModule } from './ventana-programacion/ventana-programacion.module';
import { AsesoriasModule } from './asesorias/asesorias.module';
import { AcompanamientosNoRegistradosModule } from './acompanamientos-no-registrados/acompanamientos-no-registrados.module';
import { DocumentosAdicionalesModule } from './documentos-adicionales/documentos-adicionales.module';

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
    NotificationsModule,
    ArticulacionesModule,
    IvcModule,
    VentanaProgramacionModule,
    AsesoriasModule,
    AcompanamientosNoRegistradosModule,
    DocumentosAdicionalesModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule { }
