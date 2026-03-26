import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/connection.js';
import { executeWorkflow } from '../services/orchestrator.js';

export default async function workflowsRoutes(fastify) {
    // GET all workflows for workspace
    fastify.get('/api/workflows', { preHandler: [fastify.authenticate] }, async (request) => {
        const db = getDb();
        const workspaceId = request.user.workspace_id;
        const workflows = db.prepare('SELECT * FROM workflows WHERE workspace_id = ? ORDER BY created_at DESC').all(workspaceId);
        return workflows.map(w => ({ ...w, steps: JSON.parse(w.steps || '[]') }));
    });

    // GET single workflow
    fastify.get('/api/workflows/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const db = getDb();
        const workspaceId = request.user.workspace_id;
        const workflow = db.prepare('SELECT * FROM workflows WHERE id = ? AND workspace_id = ?').get(request.params.id, workspaceId);
        if (!workflow) return reply.code(404).send({ error: 'Workflow not found' });
        return { ...workflow, steps: JSON.parse(workflow.steps || '[]') };
    });

    // POST create workflow
    fastify.post('/api/workflows', { preHandler: [fastify.authenticate] }, async (request) => {
        const db = getDb();
        const workspaceId = request.user.workspace_id;
        const { name, description, steps } = request.body;
        const id = uuidv4();

        db.prepare(`
            INSERT INTO workflows (id, workspace_id, name, description, steps)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, workspaceId, name, description || '', JSON.stringify(steps || []));

        const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(id);
        return { ...workflow, steps: JSON.parse(workflow.steps || '[]') };
    });

    // PUT update workflow
    fastify.put('/api/workflows/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const db = getDb();
        const workspaceId = request.user.workspace_id;
        const workflow = db.prepare('SELECT * FROM workflows WHERE id = ? AND workspace_id = ?').get(request.params.id, workspaceId);
        if (!workflow) return reply.code(404).send({ error: 'Workflow not found' });

        const { name, description, steps } = request.body;

        db.prepare(`
            UPDATE workflows SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                steps = COALESCE(?, steps),
                updated_at = datetime('now')
            WHERE id = ? AND workspace_id = ?
        `).run(name || null, description ?? null, steps ? JSON.stringify(steps) : null, request.params.id, workspaceId);

        const updated = db.prepare('SELECT * FROM workflows WHERE id = ?').get(request.params.id);
        return { ...updated, steps: JSON.parse(updated.steps || '[]') };
    });

    // DELETE workflow
    fastify.delete('/api/workflows/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const db = getDb();
        const workspaceId = request.user.workspace_id;
        const workflow = db.prepare('SELECT * FROM workflows WHERE id = ? AND workspace_id = ?').get(request.params.id, workspaceId);
        if (!workflow) return reply.code(404).send({ error: 'Workflow not found' });

        db.prepare('DELETE FROM workflows WHERE id = ? AND workspace_id = ?').run(request.params.id, workspaceId);
        return { success: true, id: request.params.id };
    });

    // POST execute workflow
    fastify.post('/api/workflows/:id/execute', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const workspaceId = request.user.workspace_id;
        try {
            const result = await executeWorkflow(request.params.id, workspaceId);
            return { success: true, ...result };
        } catch (error) {
            return reply.code(400).send({ error: error.message });
        }
    });
}
