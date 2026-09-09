import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ALLOWED_CORS_ORIGINS } from '../common/config/cors-origins';

@WebSocketGateway({
    cors: {
        origin: ALLOWED_CORS_ORIGINS,
        credentials: true,
    },
})
export class AsesoriasFirmaGateway {
    @WebSocketServer()
    server: Server;

    emitFirmaActualizada(asesoriaId: string) {
        this.server.emit('asesoria_firma_actualizada', { asesoriaId });
    }
}
