import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateSolicitudUnionDto {
    @IsString()
    @IsNotEmpty()
    salida_id: string;

    @IsString()
    @IsOptional()
    mensaje?: string;
}

export class ResolveSolicitudUnionDto {
    @IsString()
    @IsOptional()
    respuesta?: string;
}
