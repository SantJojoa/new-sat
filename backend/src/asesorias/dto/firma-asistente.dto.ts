import { IsString, Matches } from 'class-validator';

export class SaveFirmaDto {
    @IsString()
    @Matches(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, { message: 'Formato de firma inválido' })
    firma: string;
}