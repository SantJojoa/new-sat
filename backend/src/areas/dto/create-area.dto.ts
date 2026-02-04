import { IsString, IsNotEmpty } from 'class-validator';

export class CreateAreaDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    subdireccion_id: string;
}
