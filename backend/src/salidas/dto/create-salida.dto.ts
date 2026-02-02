import { IsString, IsNumber, IsOptional, IsDateString, IsNotEmpty, Min, MaxLength } from 'class-validator';

export class CreateSalidaDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    codigo: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    descripcion: string;

    @IsString()
    @IsNotEmpty()
    tipo_salida: string; // 'equipo', 'material', 'documento', 'insumo', 'otro'

    @IsNumber()
    @Min(1)
    cantidad: number;

    @IsString()
    @IsNotEmpty()
    unidad_medida: string; // 'unidad', 'metro', 'litro', 'kilogramo', 'caja'

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    destinatario: string;

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    observaciones?: string;

    // Estos campos se asignan automáticamente del usuario autenticado
    // solicitante_id: string;  // Se obtiene del usuario autenticado
    // area_id: string;         // Se obtiene del área del usuario autenticado
}