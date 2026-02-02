import { IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

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