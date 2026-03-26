const clients = new Map(); // socket -> workspaceId

export function addClient(socket) {
    // We'll wait for an auth message or just store it with null for now
    clients.set(socket, null);

    socket.on('message', (msg) => {
        try {
            const data = JSON.parse(msg.toString());
            if (data.type === 'auth' && data.workspaceId) {
                clients.set(socket, data.workspaceId);
            }
        } catch (e) {
            console.error('WS Error:', e.message);
        }
    });

    socket.on('close', () => clients.delete(socket));
    socket.on('error', () => clients.delete(socket));
}

export function broadcast(message, workspaceId) {
    const data = JSON.stringify(message);
    for (const [socket, clientWorkspaceId] of clients.entries()) {
        // If workspaceId is provided, only send to matching clients
        // If message has workspace_id, we can also use that
        const targetWorkspaceId = workspaceId || message.data?.workspace_id || message.workspace_id;

        try {
            if (socket.readyState === 1) {
                if (!targetWorkspaceId || clientWorkspaceId === targetWorkspaceId) {
                    socket.send(data);
                }
            }
        } catch {
            clients.delete(socket);
        }
    }
}

export function getConnectedClients() {
    return clients.size;
}
