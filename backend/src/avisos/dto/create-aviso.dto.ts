import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateAvisoDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    titulo: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(3000)
    mensaje: string;
}
