import { IsString, IsEmail, IsNotEmpty, IsOptional, IsBoolean, Matches } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^\S+$/, { message: 'El nombre de usuario no debe contener espacios' })
    username: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\S+$/, { message: 'La contraseña no debe contener espacios' })
    password: string;

    @IsString()
    @IsNotEmpty()
    user_type_id: string;

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

    @IsString()
    @IsOptional()
    area_id?: string;

    @IsString()
    @IsOptional()
    subdireccion_id?: string;

    @IsString()
    @IsOptional()
    charge?: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
