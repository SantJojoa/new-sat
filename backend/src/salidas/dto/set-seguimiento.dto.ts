import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class SetSeguimientoDto {
    @IsBoolean()
    @IsNotEmpty()
    se_realizo: boolean;

    @IsInt()
    @Min(0)
    @IsOptional()
    num_instituciones_asistieron?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    num_total_asistentes?: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    @IsOptional()
    evaluacion_satisfaccion?: number;

    @IsString()
    @IsOptional()
    @MaxLength(2000)
    observaciones?: string;
}