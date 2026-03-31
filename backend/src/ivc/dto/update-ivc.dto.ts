import { PartialType } from '@nestjs/mapped-types';
import { CreateIvcDto } from './create-ivc.dto';

export class UpdateIvcDto extends PartialType(CreateIvcDto) {}
