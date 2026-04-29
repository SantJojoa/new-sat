import { IsString, IsOptional, IsNotEmpty, IsArray, IsDateString, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class AsesoriaAsistenteDto {
    @IsString()
    @IsNotEmpty()
    identificacion: string;

    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsNotEmpty()
    apellido: string;

    @IsString()
    @IsOptional()
    cargo?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    movil?: string;
}

export class AsesoriaCompromisoDto {
    @IsString()
    @IsNotEmpty()
    compromiso: string;

    @IsString()
    @IsNotEmpty()
    responsable: string;

    @IsDateString()
    @IsOptional()
    fecha?: string;

    @IsString()
    @IsOptional()
    observaciones?: string;
}

export class CreateAsesoriaDto {
    @IsDateString()
    @IsNotEmpty()
    fecha: string;

    @IsString()
    @IsNotEmpty()
    hora: string;

    @IsString()
    @IsNotEmpty()
    medio: string;

    @IsString()
    @IsNotEmpty()
    institucion: string;

    @IsString()
    @IsOptional()
    municipio_procedencia_id?: string;

    @IsString()
    @IsOptional()
    municipio_otro?: string;

    @IsString()
    @IsNotEmpty()
    lugar: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AsesoriaAsistenteDto)
    asistentes: AsesoriaAsistenteDto[];

    @IsString()
    @IsNotEmpty()
    temas_tratados: string;

    @IsString()
    @IsNotEmpty()
    material_entregado: string;

    @IsInt()
    @Min(10)
    @Max(240)
    duracion_minutos: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AsesoriaCompromisoDto)
    @IsOptional()
    compromisos?: AsesoriaCompromisoDto[];

    @IsString()
    @IsOptional()
    area_id?: string;

    @IsString()
    @IsOptional()
    solicitante_id?: string;
}