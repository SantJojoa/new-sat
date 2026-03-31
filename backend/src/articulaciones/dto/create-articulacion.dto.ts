import { IsString, IsOptional, IsNotEmpty, IsEnum, IsDateString, IsInt } from 'class-validator';

export class CreateArticulacionDto {
    @IsString()
    @IsNotEmpty()
    tipo_programacion: string;

    @IsString()
    @IsNotEmpty()
    tema: string;

    @IsDateString()
    @IsNotEmpty()
    fecha_inicio: string;

    @IsDateString()
    @IsNotEmpty()
    fecha_final: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(['Manana', 'Tarde', 'Completa'])
    jornada: string;

    @IsString()
    @IsOptional()
    instituciones_convocadas?: string;

    @IsString()
    @IsOptional()
    transporte_medio?: string;

    @IsInt()
    @IsOptional()
    transporte_num_instituciones?: number;

    @IsString()
    @IsOptional()
    lugar_evento_id?: string;

    @IsString()
    @IsOptional()
    responsable_articulacion?: string;

    @IsString()
    @IsOptional()
    area_id?: string;

    @IsString()
    @IsOptional()
    solicitante_id?: string;
}
