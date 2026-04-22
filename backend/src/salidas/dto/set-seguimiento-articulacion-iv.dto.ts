import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class SetSeguimientoArticulacionIvDto {
    @IsBoolean()
    @IsNotEmpty()
    se_realizo_vsp: boolean;

    @IsString()
    @IsOptional()
    @MaxLength(2000)
    observaciones?: string;
}
