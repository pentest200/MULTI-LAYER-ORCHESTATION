'use client';
import { useState, useEffect, useCallback } from 'react';
import { getDashboardStats } from '@/lib/api';
import { useWebSocket } from '@/lib/websocket';
import { useAuth } from '@/lib/auth';

// ─── Professional SVG Icons ───────────────────────────────────
const MetricIcons = {
    agents: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><circle cx="9" cy="14" r="1.5" fill="currentColor" /><circle cx="15" cy="14" r="1.5" fill="currentColor" />
        </svg>
    ),
    active: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    ),
    completed: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    cost: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
    oversight: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
        </svg>
    ),
    failed: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    warning: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    tasks: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 12l2 2 4-4" />
        </svg>
    ),
    clock: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    chart: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
        </svg>
    ),
    workflow: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3v12" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
    ),
    target: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
        </svg>
    ),
};

const StatusIcon = ({ status }) => {
    const colors = {
        running: 'var(--accent-blue)',
        completed: 'var(--accent-green)',
        failed: 'var(--accent-red)',
        pending: 'var(--accent-amber)',
        idle: 'var(--text-muted)',
    };
    return (
        <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: colors[status] || 'var(--text-muted)',
            boxShadow: `0 0 8px ${colors[status] || 'transparent'}`,
            display: 'inline-block', flexShrink: 0,
        }} />
    );
};

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

    useEffect(() => {
        const interval = setInterval(loadStats, 10000);
        return () => clearInterval(interval);
    }, [loadStats]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
                <div className="loading-spinner"></div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Initializing Command Center...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card-static" style={{ padding: '48px', textAlign: 'center', marginTop: '40px', maxWidth: '480px', margin: '60px auto' }}>
                <div style={{ color: 'var(--accent-red)', marginBottom: '16px' }}>
                    {MetricIcons.failed}
                </div>
                <h3 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: 700 }}>Connection Error</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px', lineHeight: '1.7' }}>{error}</p>
                <button className="btn btn-primary" onClick={loadStats}>Retry Connection</button>
            </div>
        );
    }

    const metricCards = [
        {
            label: 'Total Agents', value: stats.agents.total, icon: MetricIcons.agents, color: 'blue',
            gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(37, 99, 235, 0.06) 100%)',
            borderAccent: 'rgba(59, 130, 246, 0.5)',
        },
        {
            label: 'Active Now', value: stats.agents.active, icon: MetricIcons.active, color: 'green',
            gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.06) 100%)',
            borderAccent: 'rgba(16, 185, 129, 0.5)',
        },
        {
            label: 'Completed', value: stats.tasks.completed, icon: MetricIcons.completed, color: 'purple',
            gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.18) 0%, rgba(124, 58, 237, 0.06) 100%)',
            borderAccent: 'rgba(139, 92, 246, 0.5)',
        },
        {
            label: 'Token Cost', value: `$${stats.system.totalCost || '0.00'}`, icon: MetricIcons.cost, color: 'cyan',
            gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.18) 0%, rgba(8, 145, 178, 0.06) 100%)',
            borderAccent: 'rgba(6, 182, 212, 0.5)',
        },
        {
            label: 'Pending Reviews', value: stats.oversight.pending, icon: MetricIcons.oversight, color: 'amber',
            gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.06) 100%)',
            borderAccent: 'rgba(245, 158, 11, 0.5)',
        },
        {
            label: 'Failed Tasks', value: stats.tasks.failed, icon: MetricIcons.failed, color: 'red',
            gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(220, 38, 38, 0.06) 100%)',
            borderAccent: 'rgba(239, 68, 68, 0.5)',
        },
    ];

    return (
        <div className="stagger-in">
            {/* ─── Header ─── */}
            <div style={{ marginBottom: '44px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{
                        fontSize: '11px', fontWeight: 800,
                        color: 'var(--accent-blue)',
                        textTransform: 'uppercase', letterSpacing: '2.5px',
                        background: 'rgba(59, 130, 246, 0.08)',
                        padding: '5px 14px', borderRadius: '20px',
                        border: '1px solid rgba(59, 130, 246, 0.15)',
                    }}>
                        Control Plane
                    </span>
                    <div className={`ws-indicator ${connected ? 'ws-connected' : 'ws-disconnected'}`} style={{ padding: '4px 10px', fontSize: '10px' }}>
                        <span style={{
                            width: '5px', height: '5px', borderRadius: '50%',
                            background: connected ? 'var(--accent-green)' : 'var(--accent-red)',
                            display: 'inline-block',
                        }} />
                        {connected ? 'Live' : 'Offline'}
                    </div>
                </div>
                <h1 style={{ fontSize: '38px', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '6px', lineHeight: 1.1 }}>
                    Welcome back, <span style={{
                        background: 'linear-gradient(135deg, var(--text-primary), var(--accent-blue))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>{user?.name?.split(' ')[0] || 'User'}</span>
                </h1>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    Managing <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user?.workspace_name || 'Standard Workspace'}</strong> · Connected to neural orchestrator
                </p>
            </div>

            {/* ─── OpenAI Warning ─── */}
            {!stats.system.openaiConfigured && (
                <div className="glass-card-static" style={{
                    padding: '16px 22px', marginBottom: '28px',
                    borderColor: 'rgba(251, 191, 36, 0.25)',
                    display: 'flex', alignItems: 'center', gap: '14px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06), transparent)',
                }}>
                    <div style={{ color: 'var(--accent-amber)', flexShrink: 0 }}>
                        {MetricIcons.warning}
                    </div>
                    <div style={{ flex: 1 }}>
                        <strong style={{ color: 'var(--accent-amber)', fontSize: '13px' }}>OpenAI API Key Not Configured</strong>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                            Go to Settings to configure your API key before launching tasks.
                        </p>
                    </div>
                </div>
            )}

            {/* ─── Metrics Grid ─── */}
            <div className="metrics-grid" style={{ marginBottom: '36px' }}>
                {metricCards.map((card, i) => (
                    <div key={card.label} className="glass-card metric-card animate-in" style={{
                        animationDelay: `${i * 80}ms`,
                        background: card.gradient,
                        borderLeft: `3px solid ${card.borderAccent}`,
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        borderRight: '1px solid rgba(255,255,255,0.04)',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Decorative corner glow */}
                        <div style={{
                            position: 'absolute', top: '-20px', right: '-20px',
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: `var(--accent-${card.color})`,
                            opacity: 0.04, filter: 'blur(20px)',
                            pointerEvents: 'none',
                        }} />

                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: '18px',
                        }}>
                            <div style={{
                                width: '50px', height: '50px',
                                borderRadius: 'var(--radius-md)',
                                background: `var(--accent-${card.color}-glow)`,
                                border: `1px solid rgba(255,255,255,0.06)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: `var(--accent-${card.color})`,
                                transition: 'all var(--transition-base)',
                            }}>
                                {card.icon}
                            </div>
                        </div>
                        <div style={{
                            fontSize: '32px', fontWeight: 900,
                            letterSpacing: '-1.5px',
                            lineHeight: 1,
                            marginBottom: '6px',
                            color: 'var(--text-primary)',
                        }}>
                            {card.value}
                        </div>
                        <div style={{
                            fontSize: '12px', fontWeight: 600,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                        }}>
                            {card.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── Content Grid ─── */}
            <div className="data-grid data-grid-2" style={{ marginBottom: '28px' }}>
                {/* Recent Tasks */}
                <div className="glass-card-static section-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="section-header">
                        <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: 'var(--accent-blue)', display: 'flex' }}>{MetricIcons.tasks}</span>
                            System Operations
                        </h3>
                        <span style={{
                            fontSize: '11px', color: 'var(--accent-green)', fontWeight: 700,
                            padding: '4px 12px', borderRadius: '20px',
                            background: 'var(--accent-green-glow)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                        }}>
                            {stats.tasks.running} active
                        </span>
                    </div>
                    {stats.recentTasks.length === 0 ? (
                        <div className="empty-state" style={{ padding: '60px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.4 }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 12l2 2 4-4" />
                                </svg>
                            </div>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Operational queue is empty.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {stats.recentTasks.map(task => (
                                <div key={task.id} className="hover-glass" style={{
                                    padding: '16px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--border-glass)',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between', gap: '14px',
                                    transition: 'all var(--transition-base)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '8px',
                                            background: task.status === 'running' ? 'var(--accent-blue-glow)' : 'var(--bg-glass)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: task.status === 'running' ? 'var(--accent-blue)' : 'var(--text-muted)',
                                        }}>
                                            <StatusIcon status={task.status} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: '14px', fontWeight: 600,
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                color: 'var(--text-primary)',
                                            }}>
                                                {task.title}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                <span style={{ fontWeight: 600 }}>{task.agent_name || 'Autonomous'}</span>
                                                <span style={{ opacity: 0.3 }}>|</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {MetricIcons.clock}
                                                    {new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            {task.status === 'running' && (
                                                <div className="progress-bar" style={{ marginTop: '10px', height: '4px', background: 'rgba(255,255,255,0.05)' }}>
                                                    <div className="progress-fill" style={{ width: `${task.progress || 0}%`, boxShadow: '0 0 10px var(--accent-blue)' }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                                        letterSpacing: '0.5px', color: `var(--accent-${task.status === 'running' ? 'blue' : task.status === 'completed' ? 'green' : task.status === 'failed' ? 'red' : 'muted'})`
                                    }}>
                                        {task.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Agent Fleet */}
                <div className="glass-card-static section-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="section-header">
                        <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: 'var(--accent-purple)', display: 'flex' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /><circle cx="9" cy="14" r="1.5" fill="currentColor" /><circle cx="15" cy="14" r="1.5" fill="currentColor" />
                                </svg>
                            </span>
                            Neural Fleet
                        </h3>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <span style={{
                                fontSize: '10px', color: 'var(--accent-purple)', fontWeight: 800,
                                padding: '3px 8px', borderRadius: '6px',
                                background: 'var(--accent-purple-glow)', border: '1px solid rgba(139, 92, 246, 0.2)',
                                textTransform: 'uppercase'
                            }}>
                                {stats.agents.active} ACTIVE
                            </span>
                        </div>
                    </div>
                    {stats.recentAgents.length === 0 ? (
                        <div className="empty-state" style={{ padding: '60px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.4 }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /><circle cx="9" cy="14" r="1.5" fill="currentColor" /><circle cx="15" cy="14" r="1.5" fill="currentColor" />
                                </svg>
                            </div>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>No active neural profiles found.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {stats.recentAgents.map(agent => (
                                <div key={agent.id} className="hover-glass" style={{
                                    padding: '16px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--border-glass)',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'all var(--transition-base)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{
                                            width: '40px', height: '40px',
                                            borderRadius: '12px',
                                            background: agent.status === 'active' ? 'var(--accent-purple-glow)' : 'var(--bg-glass)',
                                            border: agent.status === 'active' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid var(--border-glass)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: agent.status === 'active' ? 'var(--accent-purple)' : 'var(--text-muted)',
                                            position: 'relative'
                                        }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                                                <path d="M12 12L2.1 12.1" />
                                                <path d="M12 12l9.9 -0.1" />
                                                <path d="M12 12l0 9.9" />
                                            </svg>
                                            {agent.status === 'active' && (
                                                <span style={{
                                                    position: 'absolute', top: '-2px', right: '-2px',
                                                    width: '8px', height: '8px', borderRadius: '50%',
                                                    background: 'var(--accent-purple)',
                                                    boxShadow: '0 0 8px var(--accent-purple)'
                                                }} />
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{agent.name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                <span style={{ opacity: 0.8 }}>{agent.model || 'Standard'}</span>
                                                <span style={{ opacity: 0.3 }}>·</span>
                                                <span style={{ color: agent.status === 'active' ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
                                                    {agent.status === 'active' ? 'Engaged' : 'Standby'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>LATENCY</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 700 }}>{Math.floor(Math.random() * 200) + 100}ms</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── System Info Bar ─── */}
            <div className="glass-card-static" style={{
                padding: '14px 22px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
                borderColor: 'rgba(255,255,255,0.04)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '28px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 500 }}>
                        {MetricIcons.chart}
                        <strong style={{ color: 'var(--text-primary)' }}>{stats.tasks.total}</strong> total tasks
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 500 }}>
                        {MetricIcons.workflow}
                        <strong style={{ color: 'var(--text-primary)' }}>{stats.workflows.total}</strong> workflows
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 500 }}>
                        {MetricIcons.target}
                        Avg confidence: <strong style={{ color: 'var(--accent-blue)' }}>{(stats.system.avgConfidence * 100).toFixed(0)}%</strong>
                    </span>
                </div>
                <div className={`ws-indicator ${connected ? 'ws-connected' : 'ws-disconnected'}`}>
                    <span style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: connected ? 'var(--accent-green)' : 'var(--accent-red)',
                        display: 'inline-block',
                    }} />
                    {connected ? 'Live Updates Active' : 'Reconnecting...'}
                </div>
            </div>
        </div>
    );
}
