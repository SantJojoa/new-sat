import { PartialType } from '@nestjs/mapped-types';
import { CreateSalidaDto } from './create-salida.dto';
import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';

export class UpdateSalidaDto extends PartialType(CreateSalidaDto) {
    @IsString()
    @IsOptional()
    @IsIn(['pendiente', 'aprobada', 'rechazada', 'entregada', 'cancelada'])
    estado?: string;

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    observaciones_aprobacion?: string;
}