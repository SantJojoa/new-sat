import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class SetSeguimientoAcompanamientoDto {
    @IsBoolean()
    @IsNotEmpty()
    se_programo: boolean;

    @IsBoolean()
    @IsNotEmpty()
    se_realizo: boolean;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    nombre_reunion?: string;

    @IsString()
    @IsOptional()
    fecha_reunion?: string;

    @IsString()
    @IsOptional()
    hora_inicial?: string;

    @IsString()
    @IsOptional()
    hora_final?: string;

    @IsString()
    @IsOptional()
    acta_numero?: string;

    @IsString()
    @IsOptional()
    institucion?: string;

    @IsString()
    @IsOptional()
    municipio?: string;

    @IsString()
    @IsOptional()
    lugar?: string;

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
}
