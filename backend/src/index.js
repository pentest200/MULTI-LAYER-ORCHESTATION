import 'dotenv/config';
process.env.TZ = 'Asia/Kolkata';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import { initializeSchema } from './db/schema.js';
import { closeDb } from './db/connection.js';
import authRoutes from './routes/auth.js';
import billingRoutes from './routes/billing.js';
import agentsRoutes from './routes/agents.js';
import tasksRoutes from './routes/tasks.js';
import workflowsRoutes from './routes/workflows.js';
import oversightRoutes from './routes/oversight.js';
import dashboardRoutes from './routes/dashboard.js';
import settingsRoutes from './routes/settings.js';
import aiRoutes from './routes/ai.js';
import wsRoutes from './routes/ws.js';

const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    magenta: "\x1b[35m",
    red: "\x1b[31m",
    bgBlue: "\x1b[44m",
};

async function start() {
    console.clear();
    console.log(`
${colors.cyan}${colors.bright}   ________  _____    __ _________  ___ _    _____________       __
  / ____/ / / /   |  / //_/ __ \\   | | | |  / /  _/ ____/ |     / /
 / /   / /_/ / /| | / ,< / /_/ / /| | | | | / // // __/  | | /| / / 
/ /___/ __  / ___ |/ /| / _, _/ ___ | | | |/ // // /___  | |/ |/ /  
\\____/_/ /_/_/  |_/_/ |_/_/ |_/_/  |_| |___/___/_____/  |__/|__/   
${colors.reset}
${colors.dim}   [ NEURAL CORE ORCHESTRATION ENGINE ] v0.8.2${colors.reset}
    `);

    const fastify = Fastify({
        logger: false, // Disabling default logger for cleaner custom output
    });
    let isShuttingDown = false;

    const shutdown = async (signal) => {
        if (isShuttingDown) return;
        isShuttingDown = true;
        console.log(`${colors.yellow}[SHUTDOWN]${colors.reset} Received ${signal}, closing services...`);
        try {
            await fastify.close();
        } catch {
            // Ignore shutdown errors so the process can still exit cleanly.
        }
        closeDb();
        process.exit(0);
    };

    process.once('SIGTERM', () => shutdown('SIGTERM'));
    process.once('SIGINT', () => shutdown('SIGINT'));

    console.log(`${colors.blue}┌── ${colors.bright}SYSTEM INITIALIZATION${colors.reset}`);
    process.stdout.write(`${colors.blue}│${colors.reset} [DATABASE] Connecting to manifest storage... `);

    try {
        initializeSchema();
        process.stdout.write(`${colors.green}CONNECTED ✅${colors.reset}\n`);
    } catch (e) {
        process.stdout.write(`${colors.red}FAILED ❌${colors.reset}\n`);
        console.error(e);
    }

    // Register plugins
    process.stdout.write(`${colors.blue}│${colors.reset} [SECURITY] Activating JWT & CORS shields... `);
    await fastify.register(cors, { origin: true });
    await fastify.register(websocket);
    await fastify.register(jwt, {
        secret: process.env.JWT_SECRET || 'super-secret-key-change-this-in-production',
    });
    process.stdout.write(`${colors.green}ACTIVE ✅${colors.reset}\n`);

    fastify.decorate('authenticate', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.code(401).send({ error: 'Authentication failed', details: err.message });
        }
    });

    // Register routes
    const routes = [
        { name: 'AUTH', r: authRoutes },
        { name: 'BILLING', r: billingRoutes },
        { name: 'AGENTS', r: agentsRoutes },
        { name: 'TASKS', r: tasksRoutes },
        { name: 'WORKFLOWS', r: workflowsRoutes },
        { name: 'OVERSIGHT', r: oversightRoutes },
        { name: 'ANALYTICS', r: dashboardRoutes },
        { name: 'SETTINGS', r: settingsRoutes },
        { name: 'AI_LAB', r: aiRoutes },
        { name: 'NET_SOCKET', r: wsRoutes },
    ];

    process.stdout.write(`${colors.blue}│${colors.reset} [ROUTING] Mapping neural pathways... \n`);
    for (const route of routes) {
        await fastify.register(route.r);
        process.stdout.write(`${colors.blue}│${colors.reset}   ${colors.dim}↳${colors.reset} ${colors.bright}${route.name.padEnd(12)}${colors.reset} ${colors.green}MAP_OK${colors.reset}\n`);
    }

    fastify.setErrorHandler((error, request, reply) => {
        const statusCode = error.statusCode || (error.message.includes('not found') ? 404 : 400);
        console.error(`${colors.red}[CRITICAL ERROR]${colors.reset} ${request.method} ${request.url}`);
        reply.code(statusCode).send({ error: error.message || 'Internal Server Error' });
    });

    fastify.get('/', async () => {
        return { status: 'running', service: 'Chakraview Neural Core', epoch: Date.now() };
    });

    try {
        const address = await fastify.listen({ port: PORT, host: HOST });
        console.log(`${colors.blue}└── ${colors.bright}CORE SYNCHRONIZED${colors.reset}\n`);

        console.log(`${colors.bgBlue}${colors.bright}  OPERATIONAL STATUS  ${colors.reset}`);
        console.log(`${colors.cyan}● ${colors.bright}API_ENDPOINT:${colors.reset}  ${address}`);
        console.log(`${colors.cyan}● ${colors.bright}WS_GATEWAY:  ${colors.reset}  ws://${HOST}:${PORT}/ws`);
        console.log(`${colors.cyan}● ${colors.bright}AI_CONNECT:  ${colors.reset}  ${process.env.OPENAI_API_KEY ? colors.green + 'STABLE ✅' : colors.red + 'DISCONNECTED ❌'}${colors.reset}`);
        console.log(`${colors.cyan}● ${colors.bright}TIMESTAMP:   ${colors.reset}  ${new Date().toLocaleString()}\n`);

        console.log(`${colors.magenta}${colors.dim}--- CHAKRAVIEW NEURAL CORE IS NOW ORCHESTRATING ---${colors.reset}\n`);
    } catch (err) {
        console.error(`${colors.red}FAILED TO INITIALIZE NEURAL CORE:${colors.reset}`, err);
        process.exit(1);
    }
}

start().catch(err => {
    console.error('Fatal error during startup:', err);
    process.exit(1);
});
