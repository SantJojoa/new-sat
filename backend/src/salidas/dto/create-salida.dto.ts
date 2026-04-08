import { IsString, IsOptional, IsNotEmpty, IsArray, IsEnum, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EapbActorItemDto {
    @IsString()
    @IsNotEmpty()
    eapb_id: string;

    @IsString()
    @IsOptional()
    actor_id?: string;
}

export class IpsActorItemDto {
    @IsString()
    @IsNotEmpty()
    ips_id: string;

    @IsString()
    @IsOptional()
    actor_id?: string;
}

export class CreateSalidaDto {
    @IsString()
    @IsOptional()
    codigo?: string;

    @IsString()
    @IsNotEmpty()
    tipo_salida: string; // 'Capacitacion Presencial', 'Capacitacion Virtual', etc.

    @IsString()
    @IsOptional()
    subtipo_salida?: string; // 'Inspeccion', 'Vigilancia', 'Acompañamiento'

    @IsString()
    @IsNotEmpty()
    tema: string;

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsDateString()
    @IsNotEmpty()
    fecha_inicio: string;

    @IsDateString()
    @IsNotEmpty()
    fecha_final: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(['Manana', 'Tarde', 'Completa'])
    jornada: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    municipios_ids?: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IpsActorItemDto)
    @IsOptional()
    ips_actores?: IpsActorItemDto[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    entidades_ids?: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EapbActorItemDto)
    @IsOptional()
    eapb_actores?: EapbActorItemDto[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    organizaciones_ids?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    idsn_ids?: string[];

    // Transport Fields
    @IsString()
    @IsOptional()
    transporte_medio?: string;

    @IsString()
    @IsOptional()
    transporte_responsables?: string;

    @IsOptional()
    instituciones_convocadas?: number;

    @IsString()
    @IsOptional()
    lugar_evento_id?: string;

    @IsString()
    @IsOptional()
    area_id?: string;

    @IsString()
    @IsOptional()
    solicitante_id?: string;
}