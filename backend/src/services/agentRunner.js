import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/connection.js';
import { chat } from './openai.js';
import { broadcast } from './websocket.js';

export async function runAgentTask(taskId) {
    const db = getDb();

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    const agent = task.agent_id
        ? db.prepare('SELECT * FROM agents WHERE id = ?').get(task.agent_id)
        : null;

    const systemPrompt = agent?.system_prompt || 'You are a helpful AI assistant.';
    const model = agent?.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const temperature = agent?.temperature ?? 0.7;
    const maxTokens = agent?.max_tokens || 4096;

    // Helper to create/update nodes
    const upsertNode = (nodeId, name, status, input = '', output = '', dependsOn = '[]') => {
        db.prepare(`
            INSERT INTO task_nodes (id, task_id, name, status, input, output, depends_on)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET 
                status = excluded.status, 
                input = excluded.input, 
                output = excluded.output,
                updated_at = datetime('now')
        `).run(nodeId, taskId, name, status, input, output, dependsOn);
        broadcast({ type: 'node:update', data: { taskId, nodeId, name, status } });
    };

    const nodeIds = {
        init: uuidv4(),
        planner: uuidv4(),
        execution: uuidv4(),
        final: uuidv4()
    };

    // 1. Initialization Node
    upsertNode(nodeIds.init, 'Task Initializer', 'running', task.input || task.description);

    // Update task to running
    db.prepare(`UPDATE tasks SET status = 'running', started_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(taskId);
    if (agent) {
        db.prepare(`UPDATE agents SET status = 'running', updated_at = datetime('now') WHERE id = ?`).run(agent.id);
    }

    addLog(taskId, 'info', `Agent "${agent?.name || 'Default'}" started processing task`);
    broadcast({ type: 'task:update', data: { id: taskId, status: 'running', progress: 10 } });
    upsertNode(nodeIds.init, 'Task Initializer', 'success', task.input || task.description, 'Task parameters validated');

    try {
        // 2. Planning Node
        upsertNode(nodeIds.planner, 'AI Planner', 'running', 'Analyzing task requirements...', '', JSON.stringify([nodeIds.init]));
        db.prepare('UPDATE tasks SET progress = 30, updated_at = datetime(\'now\') WHERE id = ?').run(taskId);
        broadcast({ type: 'task:update', data: { id: taskId, status: 'running', progress: 30 } });
        addLog(taskId, 'info', 'Generating execution plan...');

        // Simulate planning phase or use OpenAI to "plan" if needed, 
        // for now we just mark it as successful as we proceed to execution
        upsertNode(nodeIds.planner, 'AI Planner', 'success', 'Analyzing requirements', `Target Model: ${model}`, JSON.stringify([nodeIds.init]));

        // 3. Execution Node
        upsertNode(nodeIds.execution, 'Model Execution', 'running', `Routing to ${model}`, '', JSON.stringify([nodeIds.planner]));
        addLog(taskId, 'info', `Sending request to ${model}...`);

        const result = await chat(systemPrompt, task.input || task.description, {
            model,
            temperature,
            maxTokens,
            workspaceId: task.workspace_id,
        });

        // Log usage
        if (result.usage) {
            db.prepare(`
                INSERT INTO usage_logs (workspace_id, task_id, tokens_used, cost)
                VALUES (?, ?, ?, ?)
            `).run(task.workspace_id, taskId, result.usage.total_tokens, (result.usage.total_tokens * 0.000002));
        }

        db.prepare('UPDATE tasks SET progress = 70, updated_at = datetime(\'now\') WHERE id = ?').run(taskId);
        broadcast({ type: 'task:update', data: { id: taskId, status: 'running', progress: 70 } });
        addLog(taskId, 'info', `AI responded (${result.usage?.total_tokens || 0} tokens used)`);

        upsertNode(nodeIds.execution, 'Model Execution', 'success', `Input: ${task.input?.slice(0, 50)}...`, `Output generated (${result.usage?.total_tokens} tokens)`, JSON.stringify([nodeIds.planner]));

        // 4. Finalization Node
        upsertNode(nodeIds.final, 'Result Review', 'running', 'Analyzing output confidence...', '', JSON.stringify([nodeIds.execution]));

        const confidence = estimateConfidence(result);
        const oversightThreshold = parseFloat(process.env.OVERSIGHT_CONFIDENCE_THRESHOLD || '0.7');

        if (confidence < oversightThreshold) {
            // Requires human approval
            db.prepare(`
                UPDATE tasks SET status = 'waiting_for_approval', output = ?, confidence = ?, progress = 90, updated_at = datetime('now')
                WHERE id = ?
            `).run(result.content, confidence, taskId);

            const oversightId = uuidv4();
            db.prepare(`
                INSERT INTO oversight_queue (id, workspace_id, task_id, agent_id, type, reason, context, status)
                VALUES (?, ?, ?, ?, 'approval', ?, ?, 'pending')
            `).run(
                oversightId,
                task.workspace_id,
                taskId,
                agent?.id || null,
                `Low confidence (${(confidence * 100).toFixed(0)}%)`,
                JSON.stringify({ output: result.content, usage: result.usage })
            );

            upsertNode(nodeIds.final, 'Result Review', 'blocked', 'Confidence check', `Low confidence (${(confidence * 100).toFixed(0)}%) - Sent to Human Oversight`, JSON.stringify([nodeIds.execution]));

            addLog(taskId, 'warn', `Low confidence (${(confidence * 100).toFixed(0)}%) — sent to oversight queue`);
            broadcast({ type: 'task:update', data: { id: taskId, status: 'waiting_for_approval', progress: 90, confidence } });
            broadcast({ type: 'oversight:new', data: { id: oversightId, taskId } });
        } else {
            // Complete directly
            db.prepare(`
                UPDATE tasks SET status = 'completed', output = ?, confidence = ?, progress = 100, completed_at = datetime('now'), updated_at = datetime('now')
                WHERE id = ?
            `).run(result.content, confidence, taskId);

            upsertNode(nodeIds.final, 'Result Review', 'success', 'Confidence check', `High confidence (${(confidence * 100).toFixed(0)}%) - Completed`, JSON.stringify([nodeIds.execution]));

            addLog(taskId, 'info', `Task completed with ${(confidence * 100).toFixed(0)}% confidence`);
            broadcast({ type: 'task:update', data: { id: taskId, status: 'completed', progress: 100, confidence } });
        }

        if (agent) {
            db.prepare(`UPDATE agents SET status = 'idle', updated_at = datetime('now') WHERE id = ?`).run(agent.id);
            broadcast({ type: 'agent:update', data: { id: agent.id, status: 'idle' } });
        }

        return { taskId, confidence };
    } catch (error) {
        db.prepare(`
            UPDATE tasks SET status = 'failed', error = ?, progress = 0, updated_at = datetime('now')
            WHERE id = ?
        `).run(error.message, taskId);

        // Mark current running nodes as failed
        Object.values(nodeIds).forEach(id => {
            const node = db.prepare('SELECT status FROM task_nodes WHERE id = ?').get(id);
            if (node && node.status === 'running') {
                upsertNode(id, 'Error', 'failed', '', error.message);
            }
        });

        if (agent) {
            db.prepare(`UPDATE agents SET status = 'error', updated_at = datetime('now') WHERE id = ?`).run(agent.id);
            broadcast({ type: 'agent:update', data: { id: agent.id, status: 'error' } });
        }

        addLog(taskId, 'error', `Task failed: ${error.message}`);
        broadcast({ type: 'task:update', data: { id: taskId, status: 'failed', error: error.message } });

        throw error;
    }
}

function estimateConfidence(result) {
    let confidence = 0.8;
    if (result.finishReason === 'stop') confidence += 0.1;
    if (result.finishReason === 'length') confidence -= 0.3;
    if (result.content.length < 50) confidence -= 0.2;
    if (result.content.length > 200) confidence += 0.05;
    return Math.max(0, Math.min(1, confidence));
}

function addLog(taskId, level, message, metadata = {}) {
    const db = getDb();
    db.prepare('INSERT INTO task_logs (task_id, level, message, metadata) VALUES (?, ?, ?, ?)').run(
        taskId,
        level,
        message,
        JSON.stringify(metadata)
    );
}
