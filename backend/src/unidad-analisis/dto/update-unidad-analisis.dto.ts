import { PartialType } from '@nestjs/mapped-types';
import { CreateUnidadAnalisisDto } from './create-unidad-analisis.dto';

export class UpdateUnidadAnalisisDto extends PartialType(CreateUnidadAnalisisDto) { }
