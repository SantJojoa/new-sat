import { Module } from '@nestjs/common';
import { SubdireccionesService } from './subdirecciones.service';
import { SubdireccionesController } from './subdirecciones.controller';

@Module({
  providers: [SubdireccionesService],
  controllers: [SubdireccionesController]
})
export class SubdireccionesModule {}
