'use client';
import { useState, useEffect, useCallback } from 'react';
import { getSettings, updateSettings, getHealth } from '@/lib/api';

export default function SettingsPage() {
    const [settings, setSettings] = useState({});
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const loadSettings = useCallback(async () => {
        try {
            const [s, h] = await Promise.all([getSettings(), getHealth()]);
            setSettings(s);
            setHealth(h);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadSettings(); }, [loadSettings]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { openai_configured, ...rest } = settings;
            await updateSettings(rest);
            setToast({ type: 'success', message: 'Settings saved successfully!' });
            setTimeout(() => setToast(null), 3000);
            loadSettings(); // Refresh to update "configured" status
        } catch (e) {
            setToast({ type: 'error', message: e.message });
            setTimeout(() => setToast(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    const updateField = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div className="loading-spinner"></div>
            <div style={{ color: 'var(--text-secondary)', marginLeft: '12px' }}>Loading workspace configuration...</div>
        </div>
    );

    return (
        <div className="animate-in">
            <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 800 }}>Workspace Settings</h1>
                    <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Configure global parameters and AI provider credentials</p>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '12px 24px' }}>
                    {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
            </div>

            <div className="data-grid data-grid-2">
                {/* System Status */}
                <div className="glass-card-static section-card">
                    <div className="section-header">
                        <h3 className="section-title">Connectivity Hub</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                        <div className="glass-card-static" style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 700 }}>OpenAI Integration</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Required for task planning and execution</div>
                                </div>
                                <span className={`status-badge ${settings.openai_configured ? 'status-completed' : 'status-failed'}`}>
                                    {settings.openai_configured ? 'CONNECTED' : 'NOT CONFIGURED'}
                                </span>
                            </div>
                        </div>
                        <div className="glass-card-static" style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 700 }}>Backend Service</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Orchestration engine health status</div>
                                </div>
                                <span className="status-badge status-completed">STABLE</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* API Key Management */}
                <div className="glass-card-static section-card">
                    <div className="section-header">
                        <h3 className="section-title">🔑 credentials</h3>
                    </div>
                    <div className="form-group" style={{ marginTop: '16px' }}>
                        <label className="form-label">OpenAI API Key</label>
                        <input
                            className="form-input"
                            type="password"
                            value={settings.openai_api_key || ''}
                            onChange={e => updateField('openai_api_key', e.target.value)}
                            placeholder="sk-..."
                        />
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                            Stored securely and used only for your workspace operations.
                        </div>
                    </div>
                </div>
            </div>

            <div className="data-grid data-grid-2" style={{ marginTop: '24px' }}>
                {/* Orchestration Controls */}
                <div className="glass-card-static section-card">
                    <div className="section-header">
                        <h3 className="section-title">🧠 Orchestration Logic</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">Human-in-the-Loop Threshold</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input
                                    style={{ flex: 1 }}
                                    type="range" min="0" max="1" step="0.05"
                                    value={settings.oversight_threshold || '0.7'}
                                    onChange={e => updateField('oversight_threshold', e.target.value)}
                                />
                                <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '40px' }}>
                                    {Math.round((settings.oversight_threshold || 0.7) * 100)}%
                                </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                Tasks with confidence below this score will trigger manual review.
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Multi-Agent Concurrency</label>
                            <input className="form-input" type="number" min="1" max="50"
                                value={settings.max_concurrent_agents || '5'}
                                onChange={e => updateField('max_concurrent_agents', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Performance & Defaults */}
                <div className="glass-card-static section-card">
                    <div className="section-header">
                        <h3 className="section-title">🤖 Intelligence Defaults</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">Preferred Intelligence Model</label>
                            <select className="form-select" value={settings.default_model || 'gpt-4o-mini'}
                                onChange={e => updateField('default_model', e.target.value)}>
                                <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cost-Effective)</option>
                                <option value="gpt-4o">GPT-4o (High Performance)</option>
                                <option value="o1">O1 (Reasoning Heavy)</option>
                                <option value="o1-mini">O1 Mini (Efficient Reasoning)</option>
                            </select>
                        </div>
                        <div style={{
                            padding: '16px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(59, 130, 246, 0.05)',
                            border: '1px solid rgba(59, 130, 246, 0.1)',
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            lineHeight: '1.6'
                        }}>
                            <strong style={{ color: 'var(--accent-blue)', display: 'block', marginBottom: '4px' }}>Pro Tip:</strong>
                            Using O1 series models can significantly improve complex task planning but may increase token spend.
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast Notifications */}
            {toast && (
                <div className="toast-container animate-in">
                    <div className={`toast toast-${toast.type}`} style={{
                        boxShadow: 'var(--shadow-glow-blue)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                    </div>
                </div>
            )}
        </div>
    );
}
