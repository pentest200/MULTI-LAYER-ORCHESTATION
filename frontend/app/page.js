'use client';
import { useState, useEffect, useCallback } from 'react';
import { getDashboardStats } from '@/lib/api';
import { useWebSocket } from '@/lib/websocket';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { connected, subscribe } = useWebSocket();
    const { user } = useAuth();

    const loadStats = useCallback(async () => {
        try {
            const data = await getDashboardStats();
            setStats(data);
            setError(null);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadStats(); }, [loadStats]);

    // Refresh on WS events
    useEffect(() => {
        const unsubs = [
            subscribe('task:update', loadStats),
            subscribe('task:created', loadStats),
            subscribe('agent:update', loadStats),
            subscribe('oversight:new', loadStats),
            subscribe('oversight:resolved', loadStats),
        ];
        return () => unsubs.forEach(u => u());
    }, [subscribe, loadStats]);

    // Auto-refresh every 10s
    useEffect(() => {
        const interval = setInterval(loadStats, 10000);
        return () => clearInterval(interval);
    }, [loadStats]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚡</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Loading Command Center...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card-static" style={{ padding: '40px', textAlign: 'center', marginTop: '40px' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
                <h3 style={{ marginBottom: '8px' }}>Connection Error</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{error}</p>
                <button className="btn btn-primary" onClick={loadStats}>Retry</button>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--accent-blue)',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                        Control Plane
                    </span>
                </div>
                <h1 style={{ fontSize: '40px', fontWeight: 900, marginBottom: '4px' }}>
                    Welcome back, <span style={{
                        background: 'linear-gradient(135deg, var(--text-primary), var(--accent-blue))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>{user?.name?.split(' ')[0] || 'User'}</span>
                </h1>
                <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
                    Managing <strong style={{ color: 'var(--text-primary)' }}>{user?.workspace_name || 'Standard Workspace'}</strong> · Connected to orchestrator
                </p>
            </div>

            {/* System Status Banner */}
            {!stats.system.openaiConfigured && (
                <div className="glass-card-static" style={{
                    padding: '16px 24px',
                    marginBottom: '24px',
                    borderColor: 'rgba(251, 191, 36, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                }}>
                    <span style={{ fontSize: '20px' }}>⚠️</span>
                    <div>
                        <strong style={{ color: 'var(--accent-amber)' }}>OpenAI API Key Not Configured</strong>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Go to Settings to configure your API key before launching tasks.
                        </p>
                    </div>
                </div>
            )}

            {/* Metrics Grid */}
            <div className="metrics-grid">
                <div className="glass-card metric-card metric-blue animate-in">
                    <div className="metric-icon">🤖</div>
                    <div className="metric-value">{stats.agents.total}</div>
                    <div className="metric-label">Total Agents</div>
                </div>
                <div className="glass-card metric-card metric-green animate-in" style={{ animationDelay: '50ms' }}>
                    <div className="metric-icon">⚡</div>
                    <div className="metric-value">{stats.agents.active}</div>
                    <div className="metric-label">Active Agents</div>
                </div>
                <div className="glass-card metric-card metric-purple animate-in" style={{ animationDelay: '100ms' }}>
                    <div className="metric-icon">✅</div>
                    <div className="metric-value">{stats.tasks.completed}</div>
                    <div className="metric-label">Completed Tasks</div>
                </div>
                <div className="glass-card metric-card metric-cyan animate-in" style={{ animationDelay: '150ms' }}>
                    <div className="metric-icon">💰</div>
                    <div className="metric-value">${stats.system.totalCost || '0.00'}</div>
                    <div className="metric-label">Token Usage Cost</div>
                </div>
                <div className="glass-card metric-card metric-amber animate-in" style={{ animationDelay: '200ms' }}>
                    <div className="metric-icon">👁️</div>
                    <div className="metric-value">{stats.oversight.pending}</div>
                    <div className="metric-label">Pending Reviews</div>
                </div>
                <div className="glass-card metric-card metric-red animate-in" style={{ animationDelay: '250ms' }}>
                    <div className="metric-icon">❌</div>
                    <div className="metric-value">{stats.tasks.failed}</div>
                    <div className="metric-label">Failed Tasks</div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="data-grid data-grid-2">
                {/* Recent Tasks */}
                <div className="glass-card-static section-card">
                    <div className="section-header">
                        <h3 className="section-title">Recent Tasks</h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {stats.tasks.running} running
                        </span>
                    </div>
                    {stats.recentTasks.length === 0 ? (
                        <div className="empty-state" style={{ padding: '30px' }}>
                            <div className="empty-icon">📋</div>
                            <p>No tasks yet. Launch one from the Tasks page.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {stats.recentTasks.map(task => (
                                <div key={task.id} style={{
                                    padding: '12px 16px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'var(--bg-glass)',
                                    border: '1px solid var(--border-glass)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px',
                                }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}>
                                            {task.title}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            {task.agent_name || 'No agent'} · {new Date(task.created_at).toLocaleTimeString()}
                                        </div>
                                        {task.status === 'running' && (
                                            <div className="progress-bar" style={{ marginTop: '6px' }}>
                                                <div className="progress-fill" style={{ width: `${task.progress || 0}%` }} />
                                            </div>
                                        )}
                                    </div>
                                    <span className={`status-badge status-${task.status}`}>{task.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Agent Fleet */}
                <div className="glass-card-static section-card">
                    <div className="section-header">
                        <h3 className="section-title">Agent Fleet</h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {stats.agents.idle} idle
                        </span>
                    </div>
                    {stats.recentAgents.length === 0 ? (
                        <div className="empty-state" style={{ padding: '30px' }}>
                            <div className="empty-icon">🤖</div>
                            <p>No agents configured. Create one from the Agents page.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {stats.recentAgents.map(agent => (
                                <div key={agent.id} style={{
                                    padding: '12px 16px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'var(--bg-glass)',
                                    border: '1px solid var(--border-glass)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '32px', height: '32px',
                                            borderRadius: 'var(--radius-sm)',
                                            background: 'var(--accent-blue-glow)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '16px',
                                        }}>🤖</div>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{agent.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                Updated {new Date(agent.updated_at).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`status-badge status-${agent.status}`}>{agent.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* System Info Bar */}
            <div className="glass-card-static" style={{
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>📊 {stats.tasks.total} total tasks</span>
                    <span>🔄 {stats.workflows.total} workflows</span>
                    <span>🎯 Avg confidence: {(stats.system.avgConfidence * 100).toFixed(0)}%</span>
                </div>
                <div className={`ws-indicator ${connected ? 'ws-connected' : 'ws-disconnected'}`}>
                    <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: connected ? 'var(--accent-green)' : 'var(--accent-red)',
                    }} />
                    {connected ? 'Live Updates Active' : 'Reconnecting...'}
                </div>
            </div>
        </div>
    );
}
