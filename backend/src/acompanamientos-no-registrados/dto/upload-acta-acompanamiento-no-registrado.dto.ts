import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UploadActaAcompanamientoNoRegistradoDto {
    @IsString()
    @IsNotEmpty()
    nombre_reunion: string;

    @IsString()
    @IsNotEmpty()
    fecha_reunion: string;

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
    area_id?: string;

    @IsString()
    @IsOptional()
    registrador_id?: string;
}
