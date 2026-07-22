import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ALLOWED_CORS_ORIGINS } from '../common/config/cors-origins';

@WebSocketGateway({
    cors: {
        origin: ALLOWED_CORS_ORIGINS,
        credentials: true,
    },
})
export class VentanaGateway {
    @WebSocketServer()
    server: Server;

    emitVentanaActualizada(abierta: boolean) {
        this.server.emit('ventana_actualizada', { abierta });
    }
}
