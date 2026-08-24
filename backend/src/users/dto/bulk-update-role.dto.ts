import { IsArray, ArrayMinSize, IsNotEmpty, IsString } from 'class-validator';

export class BulkUpdateRoleDto {
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    user_ids: string[];

    @IsString()
    @IsNotEmpty()
    user_type_id: string;
}
