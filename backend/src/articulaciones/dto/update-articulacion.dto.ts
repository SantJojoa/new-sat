import { PartialType } from '@nestjs/mapped-types';
import { CreateArticulacionDto } from './create-articulacion.dto';

export class UpdateArticulacionDto extends PartialType(CreateArticulacionDto) {}
