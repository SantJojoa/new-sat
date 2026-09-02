import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested, ArrayMinSize, Matches } from 'class-validator';
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
    @Matches(/^\S+$/, { message: 'La identificación no debe contener espacios' })
    num_id: string;

    @IsNotEmpty()
    @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'El email tiene un formato inválido' })
    email: string;

    @IsString()
    @IsOptional()
    charge?: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\S+$/, { message: 'El nombre de usuario no debe contener espacios' })
    username: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\S+$/, { message: 'La contraseña no debe contener espacios' })
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
