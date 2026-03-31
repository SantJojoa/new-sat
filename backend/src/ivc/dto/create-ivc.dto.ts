import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateIvcDto {
    @IsString()
    @IsNotEmpty()
    tema: string;

    @IsString()
    @IsNotEmpty()
    fecha_inicio: string;

    @IsString()
    @IsNotEmpty()
    fecha_final: string;

    @IsString()
    @IsNotEmpty()
    jornada: string;

    @IsString()
    @IsOptional()
    instituciones_convocadas?: string;

    @IsString()
    @IsOptional()
    transporte_medio?: string;

    @IsInt()
    @Min(0)
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
