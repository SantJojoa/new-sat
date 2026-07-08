import { IsString, IsOptional, IsNotEmpty, IsArray, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AsesoriaAsistenteDto {
    @IsString()
    @IsOptional()
    identificacion?: string;

    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsNotEmpty()
    apellido: string;

    @IsString()
    @IsNotEmpty()
    cargo: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    movil?: string;
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
    hora_fin: string;

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

    @IsString()
    @IsOptional()
    area_id?: string;

    @IsString()
    @IsOptional()
    solicitante_id?: string;
}
