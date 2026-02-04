import { PartialType } from '@nestjs/mapped-types';
import { CreateSubdireccionDto } from './create-subdireccion.dto';

export class UpdateSubdireccionDto extends PartialType(CreateSubdireccionDto) { }
