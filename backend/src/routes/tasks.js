import { getDb } from '../db/connection.js';
import { launchTask, cancelTask } from '../services/orchestrator.js';

export default async function tasksRoutes(fastify) {
    // GET all tasks for workspace
    fastify.get('/api/tasks', { preHandler: [fastify.authenticate] }, async (request) => {
        const db = getDb();
        const workspaceId = request.user.workspace_id;
        const limit = parseInt(request.query.limit) || 50;
        const status = request.query.status;

        let query = 'SELECT t.*, a.name as agent_name FROM tasks t LEFT JOIN agents a ON t.agent_id = a.id WHERE t.workspace_id = ?';
        const params = [workspaceId];

        if (status) {
            query += ' AND t.status = ?';
            params.push(status);
        }

        query += ' ORDER BY t.created_at DESC LIMIT ?';
        params.push(limit);

        return db.prepare(query).all(...params);
    });

    // GET single task
    fastify.get('/api/tasks/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const db = getDb();
        const workspaceId = request.user.workspace_id;

        const task = db.prepare('SELECT t.*, a.name as agent_name FROM tasks t LEFT JOIN agents a ON t.agent_id = a.id WHERE t.id = ? AND t.workspace_id = ?').get(request.params.id, workspaceId);
        if (!task) return reply.code(404).send({ error: 'Task not found' });
        return task;
    });

    // POST launch task
    fastify.post('/api/tasks/launch', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { title, description, input, agentId, priority } = request.body;
        const workspaceId = request.user.workspace_id;

        if (!title) return reply.code(400).send({ error: 'Title is required' });

        try {
            const result = await launchTask({
                title,
                description,
                input,
                agentId,
                priority,
                workspaceId // Pass workspace context
            });
            return { success: true, ...result };
        } catch (error) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // POST cancel task
    fastify.post('/api/tasks/:id/cancel', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const workspaceId = request.user.workspace_id;
        try {
            const result = await cancelTask(request.params.id, workspaceId);
            return { success: true, ...result };
        } catch (error) {
            return reply.code(400).send({ error: error.message });
        }
    });

    // GET task logs
    fastify.get('/api/tasks/:id/logs', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const db = getDb();
        const workspaceId = request.user.workspace_id;

        const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND workspace_id = ?').get(request.params.id, workspaceId);
        if (!task) return reply.code(404).send({ error: 'Task not found' });

        const logs = db.prepare('SELECT * FROM task_logs WHERE task_id = ? ORDER BY created_at ASC').all(request.params.id);
        return logs;
    });
}
