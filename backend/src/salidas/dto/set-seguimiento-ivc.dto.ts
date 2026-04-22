import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class SetSeguimientoIvcDto {
    @IsBoolean()
    @IsNotEmpty()
    se_realizo: boolean;

    @IsInt()
    @Min(0)
    @IsOptional()
    num_autocomisorio?: number;

    @IsDateString()
    @IsOptional()
    fecha_autocomisorio?: string;

    @IsString()
    @IsOptional()
    @MaxLength(2000)
    observaciones?: string;
}
