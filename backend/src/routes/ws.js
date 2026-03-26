import { addClient } from '../services/websocket.js';

export default async function wsRoutes(fastify) {
    fastify.get('/ws', { websocket: true }, (connection, request) => {
        const { socket } = connection;
        addClient(socket);
        socket.send(JSON.stringify({ type: 'connected', data: { message: 'Connected to Command Center' } }));

        socket.on('message', (msg) => {
            try {
                const parsed = JSON.parse(msg.toString());
                if (parsed.type === 'ping') {
                    socket.send(JSON.stringify({ type: 'pong', data: { timestamp: Date.now() } }));
                }
            } catch {
                // Ignore malformed messages
            }
        });
    });
}
