import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSubdireccionDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;
}
