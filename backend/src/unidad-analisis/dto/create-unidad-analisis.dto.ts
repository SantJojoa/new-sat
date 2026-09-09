import { OmitType } from '@nestjs/mapped-types';
import { CreateSalidaDto } from '../../salidas/dto/create-salida.dto';

// Mismo formulario que una programación normal (CreateSalidaDto), salvo `subtipo_salida`:
// en Unidad de Análisis queda fijo en 'Inspección y Vigilancia SP (IV)' (ver UnidadAnalisisService.create),
// por lo que el cliente no lo envía.
export class CreateUnidadAnalisisDto extends OmitType(CreateSalidaDto, ['subtipo_salida'] as const) { }
