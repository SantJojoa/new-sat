import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class VentanaGateway {
    @WebSocketServer()
    server: Server;

    emitVentanaActualizada(abierta: boolean) {
        this.server.emit('ventana_actualizada', { abierta });
    }
}
