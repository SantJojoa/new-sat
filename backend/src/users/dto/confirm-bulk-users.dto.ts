import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkUserRowDto {
    @IsString()
    @IsNotEmpty()
    names: string;

    @IsString()
    @IsNotEmpty()
    last_name: string;

    @IsString()
    @IsNotEmpty()
    num_id: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsOptional()
    charge?: string;

    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

export class ConfirmBulkUsersDto {
    @IsString()
    @IsNotEmpty()
    subdireccion_id: string;

    @IsString()
    @IsOptional()
    area_id?: string;

    @IsString()
    @IsNotEmpty()
    user_type_id: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => BulkUserRowDto)
    users: BulkUserRowDto[];
}
