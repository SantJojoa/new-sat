import { Module } from '@nestjs/common';
import { UserTypesService } from './user_types.service';
import { UserTypesController } from './user_types.controller';

@Module({
  providers: [UserTypesService],
  controllers: [UserTypesController]
})
export class UserTypesModule {}
