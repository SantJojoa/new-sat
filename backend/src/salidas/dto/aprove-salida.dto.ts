import { IsString, IsOptional, MaxLength, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';

export class ApproveSalidaDto {
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    observaciones?: string;
}

export class RejectSalidaDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    motivo: string;
}

export class BulkApproveSalidaDto {
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    ids: string[];

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    observaciones?: string;
}

export class BulkRejectSalidaDto {
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    ids: string[];

    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    motivo: string;
}