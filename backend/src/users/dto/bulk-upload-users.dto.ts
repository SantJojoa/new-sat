import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class BulkUploadUsersDto {
    @IsString()
    @IsNotEmpty()
    subdireccion_id: string;

    @IsString()
    @IsOptional()
    area_id?: string;

    @IsString()
    @IsNotEmpty()
    user_type_id: string;
}
