import { getDb } from '../db/connection.js';

export default async function billingRoutes(fastify) {
    // Billing API: usage tracking, invoices, payment status
    fastify.get('/api/billing/usage', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const db = getDb();
        const workspaceId = request.user.workspace_id;

        const usage = db.prepare(`
            SELECT 
                SUM(tokens_used) as total_tokens, 
                SUM(cost) as total_cost 
            FROM usage_logs 
            WHERE workspace_id = ?
        `).get(workspaceId);

        const recentLogs = db.prepare(`
            SELECT u.*, t.title as task_title 
            FROM usage_logs u 
            LEFT JOIN tasks t ON u.task_id = t.id 
            WHERE u.workspace_id = ? 
            ORDER BY u.created_at DESC 
            LIMIT 20
        `).all(workspaceId);

        return {
            usage: {
                tokens: usage?.total_tokens || 0,
                cost: (usage?.total_cost || 0).toFixed(4)
            },
            limit: 50.00,
            status: 'active',
            history: recentLogs
        };
    });

    fastify.get('/api/billing/status', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        return {
            subscription: 'pro',
            status: 'active',
            next_billing: '2026-04-26'
        };
    });

    fastify.post('/api/billing/checkout', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        return { checkout_url: 'https://stripe.com/mock-checkout' };
    });
}
