import { PartialType } from '@nestjs/mapped-types';
import { CreateAsesoriaDto } from './create-asesoria.dto';

export class UpdateAsesoriaDto extends PartialType(CreateAsesoriaDto) { }