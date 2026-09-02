import { PartialType } from 'nestjs-mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateAvisoDto } from './create-aviso.dto';

export class UpdateAvisoDto extends PartialType(CreateAvisoDto) {
    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
