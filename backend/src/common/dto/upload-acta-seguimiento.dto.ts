import { IsIn } from 'class-validator';

export class UploadActaSeguimientoDto {
    @IsIn(['true', 'false'], { message: 'Debe indicar si se realizó o no' })
    se_realizo: string;
}
