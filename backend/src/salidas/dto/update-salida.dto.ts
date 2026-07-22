import { PartialType } from '@nestjs/mapped-types';
import { CreateSalidaDto } from './create-salida.dto';

// `estado`/`observaciones_aprobacion` are intentionally NOT part of this DTO:
// state transitions only happen through the dedicated approve()/reject() endpoints,
// which require the 'approve' permission. Allowing them here let any requester with
// only 'edit' permission self-approve their own pending salida.
export class UpdateSalidaDto extends PartialType(CreateSalidaDto) { }