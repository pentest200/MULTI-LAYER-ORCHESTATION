import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import { initializeSchema } from './db/schema.js';
import authRoutes from './routes/auth.js';
import billingRoutes from './routes/billing.js';
import agentsRoutes from './routes/agents.js';
import tasksRoutes from './routes/tasks.js';
import workflowsRoutes from './routes/workflows.js';
import oversightRoutes from './routes/oversight.js';
import dashboardRoutes from './routes/dashboard.js';
import settingsRoutes from './routes/settings.js';
import wsRoutes from './routes/ws.js';

const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
    const fastify = Fastify({
        logger: {
            level: 'info',
        },
    });

    // Register plugins
    await fastify.register(cors, { origin: true });
    await fastify.register(websocket);
    await fastify.register(jwt, {
        secret: process.env.JWT_SECRET || 'super-secret-key-change-this-in-production',
    });

    fastify.decorate('authenticate', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });

    // Initialize database
    initializeSchema();

    // Register routes
    await fastify.register(authRoutes);
    await fastify.register(billingRoutes);
    await fastify.register(agentsRoutes);
    await fastify.register(tasksRoutes);
    await fastify.register(workflowsRoutes);
    await fastify.register(oversightRoutes);
    await fastify.register(dashboardRoutes);
    await fastify.register(settingsRoutes);
    await fastify.register(wsRoutes);

    fastify.get('/', async () => {
        return { status: 'running', service: 'AI Agent Command Center' };
    });

    // Start server
    try {
        const address = await fastify.listen({ port: PORT, host: HOST });
        console.log(`\n🚀 AI Agent Command Center Backend running on ${address}`);
        console.log(`📡 WebSocket available at ws://${HOST}:${PORT}/ws`);
        console.log(`🔑 OpenAI API: ${process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' ? 'Configured ✅' : 'Not configured ❌'}\n`);
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

start().catch(err => {
    console.error('Fatal error during startup:', err);
    process.exit(1);
});
