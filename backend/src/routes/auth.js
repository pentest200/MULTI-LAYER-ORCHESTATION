import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/connection.js';

export default async function authRoutes(fastify) {
    const db = getDb();

    // Signup Flow
    fastify.post('/api/auth/signup', async (request, reply) => {
        const { name, email, password } = request.body;

        if (!name || !email || !password) {
            return reply.code(400).send({ error: 'Missing required fields' });
        }

        try {
            // Check if user exists
            const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
            if (existingUser) {
                return reply.code(400).send({ error: 'User already exists' });
            }

            const userId = uuidv4();
            const passwordHash = await bcrypt.hash(password, 10);

            // 1. Create User
            db.prepare('INSERT INTO users (id, name, email, password_hash, status) VALUES (?, ?, ?, ?, ?)')
                .run(userId, name, email, passwordHash, 'active');

            // 2. Create Default Workspace
            const workspaceId = uuidv4();
            db.prepare('INSERT INTO workspaces (id, name, owner_id, status) VALUES (?, ?, ?, ?)')
                .run(workspaceId, `${name}'s Workspace`, userId, 'active');

            // 3. Assign User as Owner of Workspace
            db.prepare('INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)')
                .run(workspaceId, userId, 'owner');

            // 4. Seed default agent for the new workspace
            const agentId = uuidv4();
            db.prepare(`
                INSERT INTO agents (id, workspace_id, name, description, system_prompt, model, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(agentId, workspaceId, 'General Assistant', 'Default workspace agent', 'You are a helpful AI assistant.', 'gpt-4o-mini', 'idle');

            const token = fastify.jwt.sign({
                id: userId,
                email,
                workspace_id: workspaceId,
                role: 'owner'
            });

            return {
                token,
                user: { id: userId, name, email, role: 'owner', workspace_id: workspaceId }
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to create account' });
        }
    });

    // Login Flow
    fastify.post('/api/auth/login', async (request, reply) => {
        const { email, password } = request.body;

        if (!email || !password) {
            return reply.code(400).send({ error: 'Missing email or password' });
        }

        try {
            const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
            if (!user) {
                return reply.code(401).send({ error: 'Invalid credentials' });
            }

            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
                return reply.code(401).send({ error: 'Invalid credentials' });
            }

            // Get primary workspace (for now, just the first one)
            const membership = db.prepare('SELECT * FROM workspace_members WHERE user_id = ? LIMIT 1').get(user.id);

            const token = fastify.jwt.sign({
                id: user.id,
                email: user.email,
                workspace_id: membership.workspace_id,
                role: membership.role
            });

            return {
                token,
                user: { id: user.id, name: user.name, email: user.email, role: membership.role, workspace_id: membership.workspace_id }
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Login failed' });
        }
    });

    // Me / Profile Flow
    fastify.get('/api/auth/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(request.user.id);
        const membership = db.prepare('SELECT wm.role, w.name as workspace_name, w.id as workspace_id FROM workspace_members wm JOIN workspaces w ON wm.workspace_id = w.id WHERE user_id = ?').get(user.id);

        return {
            user: { ...user, role: membership.role },
            workspace: { id: membership.workspace_id, name: membership.workspace_name }
        };
    });

    fastify.post('/api/auth/logout', async (request, reply) => {
        return { message: 'Logged out' };
    });
}
