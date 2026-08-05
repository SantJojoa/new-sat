import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateAcompanamientoNoRegistradoDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    nombre_reunion: string;

    @IsString()
    @IsNotEmpty()
    fecha_reunion: string;

    @IsString()
    @IsNotEmpty()
    hora_inicial: string;

    @IsString()
    @IsNotEmpty()
    hora_final: string;

    @IsString()
    @IsOptional()
    acta_numero?: string;

    @IsString()
    @IsNotEmpty()
    institucion: string;

    @IsString()
    @IsNotEmpty()
    municipio: string;

    @IsString()
    @IsNotEmpty()
    lugar: string;

    @IsString()
    @IsOptional()
    material_entregado?: string;

    @IsArray()
    @IsOptional()
    asistentes?: any[];

    @IsArray()
    @IsOptional()
    orden_del_dia?: any[];

    @IsString()
    @IsOptional()
    @MaxLength(5000)
    desarrollo?: string;

    @IsString()
    @IsOptional()
    @MaxLength(5000)
    conclusiones?: string;

    @IsArray()
    @IsOptional()
    compromisos?: any[];

    @IsString()
    @IsOptional()
    proxima_lugar?: string;

    @IsString()
    @IsOptional()
    proxima_fecha?: string;

    @IsString()
    @IsOptional()
    proxima_hora?: string;

    @IsString()
    @IsOptional()
    area_id?: string;

    @IsString()
    @IsOptional()
    registrador_id?: string;
}
