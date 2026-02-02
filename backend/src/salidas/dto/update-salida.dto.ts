import { PartialType } from '@nestjs/mapped-types';
import { CreateSalidaDto } from './create-salida.dto';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateSalidaDto extends PartialType(CreateSalidaDto) {
    @IsString()
    @IsOptional()
    @IsIn(['pendiente', 'aprobada', 'rechazada', 'entregada', 'cancelada'])
    estado?: string;

    @IsString()
    @IsOptional()
    observaciones_aprobacion?: string;
}