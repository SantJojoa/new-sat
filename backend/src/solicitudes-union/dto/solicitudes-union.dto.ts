import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateSolicitudUnionDto {
    @IsString()
    @IsNotEmpty()
    salida_id: string;

    @IsString()
    @IsOptional()
    mensaje?: string;

    /** Área con la que se une (usado por subdirectores/superadmin, que no tienen área propia). */
    @IsString()
    @IsOptional()
    area_id?: string;
}

export class ResolveSolicitudUnionDto {
    @IsString()
    @IsOptional()
    respuesta?: string;
}
