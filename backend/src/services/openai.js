import OpenAI from 'openai';
import { getDb } from '../db/connection.js';

const clients = new Map();

function getClient(workspaceId) {
    // Check if we have a client for this workspace
    if (workspaceId && clients.has(workspaceId)) return clients.get(workspaceId);

    let apiKey = process.env.OPENAI_API_KEY;

    // If workspaceId is provided, check database for override
    if (workspaceId) {
        const db = getDb();
        const setting = db.prepare('SELECT value FROM settings WHERE workspace_id = ? AND key = ?').get(workspaceId, 'openai_api_key');
        if (setting?.value) {
            apiKey = setting.value;
        }
    }

    if (!apiKey || apiKey === 'your_openai_api_key_here') {
        throw new Error('OpenAI API Key is not configured for this workspace. Please set it in Settings.');
    }

    const client = new OpenAI({ apiKey });
    if (workspaceId) clients.set(workspaceId, client);
    return client;
}

export async function chat(systemPrompt, userMessage, options = {}) {
    const { workspaceId, ...rest } = options;
    const openai = getClient(workspaceId);
    const model = rest.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const maxTokens = rest.maxTokens || 4096;
    const temperature = rest.temperature ?? 0.7;

    const response = await openai.chat.completions.create({
        model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
        ],
        max_tokens: maxTokens,
        temperature,
    });

    return {
        content: response.choices[0]?.message?.content || '',
        usage: response.usage,
        finishReason: response.choices[0]?.finish_reason,
    };
}

export async function generatePlan(taskDescription, agentCapabilities, workspaceId) {
    const systemPrompt = `You are a task planning AI. Given a task description and agent capabilities, generate a structured execution plan.
Return a JSON object with:
- "steps": array of step objects with "description", "estimatedDuration", and "confidence" (0-1)
- "overallConfidence": number 0-1 indicating how confident you are in completing this task
- "risks": array of potential risks
- "requiresHumanApproval": boolean`;

    const userMessage = `Task: ${taskDescription}\nAgent Capabilities: ${JSON.stringify(agentCapabilities)}`;

    const result = await chat(systemPrompt, userMessage, { temperature: 0.3, workspaceId });

    try {
        const cleaned = result.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
    } catch {
        return {
            steps: [{ description: taskDescription, estimatedDuration: '5m', confidence: 0.5 }],
            overallConfidence: 0.5,
            risks: ['Could not parse structured plan'],
            requiresHumanApproval: true,
        };
    }
}

export async function analyzeResult(taskInput, taskOutput, workspaceId) {
    const systemPrompt = `You are a quality analysis AI. Analyze the output of a completed task and provide a quality assessment.
Return a JSON object with:
- "quality": number 0-1
- "summary": brief summary of the output
- "issues": array of any issues found
- "suggestions": array of improvement suggestions`;

    const userMessage = `Task Input: ${taskInput}\nTask Output: ${taskOutput}`;

    const result = await chat(systemPrompt, userMessage, { temperature: 0.2, workspaceId });

    try {
        const cleaned = result.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
    } catch {
        return {
            quality: 0.7,
            summary: 'Analysis complete',
            issues: [],
            suggestions: [],
        };
    }
}

export function isConfigured(workspaceId) {
    try {
        getClient(workspaceId);
        return true;
    } catch {
        return false;
    }
}

export function clearClientCache(workspaceId) {
    if (workspaceId) clients.delete(workspaceId);
    else clients.clear();
}
