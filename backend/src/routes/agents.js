import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/connection.js';

export default async function agentsRoutes(fastify) {
    // GET all agents for workspace
    fastify.get('/api/agents', { preHandler: [fastify.authenticate] }, async (request) => {
        const db = getDb();
        const workspaceId = request.user.workspace_id;

        const agents = db.prepare('SELECT * FROM agents WHERE workspace_id = ? ORDER BY created_at DESC').all(workspaceId);
        return agents.map(a => ({
            ...a,
            capabilities: JSON.parse(a.capabilities || '[]'),
        }));
    });

    // GET single agent
    fastify.get('/api/agents/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const db = getDb();
        const workspaceId = request.user.workspace_id;

        const agent = db.prepare('SELECT * FROM agents WHERE id = ? AND workspace_id = ?').get(request.params.id, workspaceId);
        if (!agent) return reply.code(404).send({ error: 'Agent not found' });
        return { ...agent, capabilities: JSON.parse(agent.capabilities || '[]') };
    });

    // POST create agent
    fastify.post('/api/agents', { preHandler: [fastify.authenticate] }, async (request) => {
        const db = getDb();
        const workspaceId = request.user.workspace_id;
        const { name, description, system_prompt, model, capabilities, max_tokens, temperature } = request.body;
        const id = uuidv4();

        db.prepare(`
            INSERT INTO agents (id, workspace_id, name, description, system_prompt, model, capabilities, max_tokens, temperature)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            workspaceId,
            name,
            description || '',
            system_prompt || 'You are a helpful AI assistant.',
            model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
            JSON.stringify(capabilities || []),
            max_tokens || 4096,
            temperature ?? 0.7
        );

        return db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
    });

    // PUT update agent
    fastify.put('/api/agents/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const db = getDb();
        const workspaceId = request.user.workspace_id;

        const agent = db.prepare('SELECT * FROM agents WHERE id = ? AND workspace_id = ?').get(request.params.id, workspaceId);
        if (!agent) return reply.code(404).send({ error: 'Agent not found' });

        const { name, description, system_prompt, model, capabilities, max_tokens, temperature, status } = request.body;

        db.prepare(`
            UPDATE agents SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                system_prompt = COALESCE(?, system_prompt),
                model = COALESCE(?, model),
                capabilities = COALESCE(?, capabilities),
                max_tokens = COALESCE(?, max_tokens),
                temperature = COALESCE(?, temperature),
                status = COALESCE(?, status),
                updated_at = datetime('now')
            WHERE id = ? AND workspace_id = ?
        `).run(
            name || null,
            description ?? null,
            system_prompt || null,
            model || null,
            capabilities ? JSON.stringify(capabilities) : null,
            max_tokens || null,
            temperature ?? null,
            status || null,
            request.params.id,
            workspaceId
        );

        const updated = db.prepare('SELECT * FROM agents WHERE id = ?').get(request.params.id);
        return { ...updated, capabilities: JSON.parse(updated.capabilities || '[]') };
    });

    // DELETE agent
    fastify.delete('/api/agents/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const db = getDb();
        const workspaceId = request.user.workspace_id;

        const agent = db.prepare('SELECT * FROM agents WHERE id = ? AND workspace_id = ?').get(request.params.id, workspaceId);
        if (!agent) return reply.code(404).send({ error: 'Agent not found' });

        db.prepare('DELETE FROM agents WHERE id = ? AND workspace_id = ?').run(request.params.id, workspaceId);
        return { success: true, id: request.params.id };
    });
}
