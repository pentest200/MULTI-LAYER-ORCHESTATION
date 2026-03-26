import { getDb } from '../db/connection.js';
import { isConfigured } from '../services/openai.js';

export default async function settingsRoutes(fastify) {
    // GET all settings for workspace
    fastify.get('/api/settings', { preHandler: [fastify.authenticate] }, async (request) => {
        const db = getDb();
        const workspaceId = request.user.workspace_id;

        const rows = db.prepare('SELECT * FROM settings WHERE workspace_id = ? ORDER BY key').all(workspaceId);
        const settings = {};
        for (const row of rows) {
            settings[row.key] = row.value;
        }

        // Add defaults if missing
        if (!settings.oversight_threshold) settings.oversight_threshold = '0.7';
        if (!settings.default_model) settings.default_model = 'gpt-4o-mini';

        settings.openai_configured = !!settings.openai_api_key || isConfigured();
        return settings;
    });

    // PUT update settings
    fastify.put('/api/settings', { preHandler: [fastify.authenticate] }, async (request) => {
        const db = getDb();
        const workspaceId = request.user.workspace_id;
        const updates = request.body;

        const upsert = db.prepare(`
            INSERT INTO settings (workspace_id, key, value, updated_at) VALUES (?, ?, ?, datetime('now'))
            ON CONFLICT(workspace_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `);

        const updateMany = db.transaction((entries) => {
            for (const [key, value] of entries) {
                if (value !== undefined && value !== null) {
                    upsert.run(workspaceId, key, String(value));
                }
            }
        });

        updateMany(Object.entries(updates));

        const rows = db.prepare('SELECT * FROM settings WHERE workspace_id = ? ORDER BY key').all(workspaceId);
        const settings = {};
        for (const row of rows) {
            settings[row.key] = row.value;
        }
        return settings;
    });

    // GET health check
    fastify.get('/api/health', async () => {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            openai: isConfigured() ? 'configured' : 'not_configured',
        };
    });
}
