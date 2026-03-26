import { getDb } from '../db/connection.js';
import { getRunningTaskCount } from '../services/orchestrator.js';
import { getConnectedClients } from '../services/websocket.js';
import { isConfigured } from '../services/openai.js';

export default async function dashboardRoutes(fastify) {
    fastify.get('/api/dashboard/stats', { preHandler: [fastify.authenticate] }, async (request) => {
        const db = getDb();
        const workspaceId = request.user.workspace_id;

        const totalAgents = db.prepare('SELECT COUNT(*) as count FROM agents WHERE workspace_id = ?').get(workspaceId).count;
        const activeAgents = db.prepare("SELECT COUNT(*) as count FROM agents WHERE status = 'running' AND workspace_id = ?").get(workspaceId).count;
        const idleAgents = db.prepare("SELECT COUNT(*) as count FROM agents WHERE status = 'idle' AND workspace_id = ?").get(workspaceId).count;
        const errorAgents = db.prepare("SELECT COUNT(*) as count FROM agents WHERE status = 'error' AND workspace_id = ?").get(workspaceId).count;

        const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE workspace_id = ?').get(workspaceId).count;
        const pendingTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending' AND workspace_id = ?").get(workspaceId).count;
        const runningTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'running' AND workspace_id = ?").get(workspaceId).count;
        const completedTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed' AND workspace_id = ?").get(workspaceId).count;
        const failedTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'failed' AND workspace_id = ?").get(workspaceId).count;
        const waitingForApproval = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'waiting_for_approval' AND workspace_id = ?").get(workspaceId).count;

        const totalWorkflows = db.prepare('SELECT COUNT(*) as count FROM workflows WHERE workspace_id = ?').get(workspaceId).count;
        const runningWorkflows = db.prepare("SELECT COUNT(*) as count FROM workflows WHERE status = 'running' AND workspace_id = ?").get(workspaceId).count;

        const pendingOversight = db.prepare("SELECT COUNT(*) as count FROM oversight_queue WHERE status = 'pending' AND workspace_id = ?").get(workspaceId).count;

        const totalCostResult = db.prepare('SELECT SUM(cost) as total FROM usage_logs WHERE workspace_id = ?').get(workspaceId);
        const totalCost = totalCostResult?.total || 0;

        const recentTasks = db.prepare(`
            SELECT t.id, t.title, t.status, t.progress, t.confidence, t.created_at, a.name as agent_name
            FROM tasks t LEFT JOIN agents a ON t.agent_id = a.id
            WHERE t.workspace_id = ?
            ORDER BY t.created_at DESC LIMIT 10
        `).all(workspaceId);

        const recentAgents = db.prepare(`SELECT id, name, status, updated_at FROM agents WHERE workspace_id = ? ORDER BY updated_at DESC LIMIT 5`).all(workspaceId);

        const avgConfidence = db.prepare("SELECT AVG(confidence) as avg FROM tasks WHERE status = 'completed' AND confidence > 0 AND workspace_id = ?").get(workspaceId);

        return {
            agents: { total: totalAgents, active: activeAgents, idle: idleAgents, error: errorAgents },
            tasks: { total: totalTasks, pending: pendingTasks, running: runningTasks, completed: completedTasks, failed: failedTasks, awaitingApproval: waitingForApproval },
            workflows: { total: totalWorkflows, running: runningWorkflows },
            oversight: { pending: pendingOversight },
            system: {
                connectedClients: getConnectedClients(),
                runningProcesses: getRunningTaskCount(), // This is system-wide, could be filtered if needed
                openaiConfigured: isConfigured(),
                avgConfidence: avgConfidence?.avg || 0,
                totalCost: (totalCost || 0).toFixed(2),
            },
            recentTasks,
            recentAgents,
        };
    });
}
