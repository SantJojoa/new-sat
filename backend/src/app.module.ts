import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UserTypesModule } from './user_types/user_types.module';
import { SubdireccionesModule } from './subdirecciones/subdirecciones.module';
import { AreasModule } from './areas/areas.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, UserTypesModule, SubdireccionesModule, AreasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
