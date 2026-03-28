'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getDashboardStats } from '@/lib/api';
import { useWebSocket } from '@/lib/websocket';
import { useAuth } from '@/lib/auth';
import { formatIST, formatISTDate } from '@/lib/time';

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
    const [currentTime, setCurrentTime] = useState(new Date());

    const loadStats = useCallback(async () => {
        if (!user) return; // Prevent 401 errors when redirected
        try {
            const data = await getDashboardStats();
            setStats(data);
            setError(null);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { loadStats(); }, [loadStats]);

    useEffect(() => {
        if (!user) return;
        const unsubs = [
            subscribe('task:update', loadStats),
            subscribe('task:created', loadStats),
            subscribe('agent:update', loadStats),
            subscribe('oversight:new', loadStats),
            subscribe('oversight:resolved', loadStats),
        ];
        return () => unsubs.forEach(u => u());
    }, [subscribe, loadStats, user]);

    useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => {
            loadStats();
            setCurrentTime(new Date());
        }, 10000);

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(timer);
        };
    }, [loadStats, user]);

    // If redirected, don't show the dashboard content at all
    if (!user) return null;

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

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <div className="system-status-pill" style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            fontSize: '10px', fontWeight: 900, color: 'var(--accent-blue)',
                            background: 'rgba(59, 130, 246, 0.05)', padding: '6px 14px',
                            borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.1)'
                        }}>
                            <div className="status-dot" style={{ width: '6px', height: '6px', background: 'var(--accent-blue)', borderRadius: '50%', boxShadow: '0 0 10px var(--accent-blue)' }}></div>
                            <span>IST {formatIST(currentTime)}</span>
                        </div>
                        <div className="system-status-pill" style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)',
                            background: 'rgba(255, 255, 255, 0.02)', padding: '6px 14px',
                            borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                            <span>{formatISTDate(currentTime)}</span>
                        </div>
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
                                                    {formatIST(task.created_at)}
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                            {stats.recentAgents.map(agent => (
                                <div key={agent.id} className="hover-glass" style={{
                                    padding: '16px',
                                    borderRadius: '14px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex', flexDirection: 'column',
                                    gap: '12px',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '32px', height: '32px',
                                                borderRadius: '8px',
                                                background: agent.status === 'active' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${agent.status === 'active' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: agent.status === 'active' ? 'var(--accent-purple)' : 'var(--text-muted)'
                                            }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                                                    <path d="M12 12L2.1 12.1" />
                                                </svg>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>{agent.name}</div>
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{agent.model || 'Standard'}</div>
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: '3px 8px', borderRadius: '4px',
                                            fontSize: '9px', fontWeight: 950,
                                            background: agent.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.04)',
                                            color: agent.status === 'active' ? 'var(--accent-green)' : 'var(--text-muted)',
                                            border: `1px solid ${agent.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.06)'}`,
                                            letterSpacing: '1px'
                                        }}>
                                            {agent.status === 'active' ? 'ENGAGED' : 'STANDBY'}
                                        </div>
                                    </div>

                                    <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.05), transparent)' }} />

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className="sync-bar" style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '10px' }}>
                                                {[1, 2, 3, 4].map(i => (
                                                    <div key={i} style={{
                                                        width: '2px',
                                                        height: `${25 * i}%`,
                                                        background: i <= 3 ? 'var(--accent-purple)' : 'rgba(255,255,255,0.1)',
                                                        borderRadius: '1px',
                                                        opacity: i <= 3 ? 0.8 : 0.3
                                                    }} />
                                                ))}
                                            </div>
                                            <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>NEURAL_SYNC</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                                                {Math.floor(Math.random() * 200) + 100}ms
                                            </span>
                                            <small style={{ fontSize: '8px', color: 'var(--text-muted)', marginLeft: '4px', fontWeight: 900 }}>LAT</small>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Platform Architecture Showcase ─── */}
            <ArchitectureShowcase />

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

// ─── Architecture Showcase Component ───────────────────────────
function ArchitectureShowcase() {
    const tabs = [
        {
            id: 'platform',
            title: 'Neural Core Platform',
            description: 'A unified intelligence layer that orchestrates across your entire enterprise ecosystem.',
            analysis: {
                summary: 'Imagine the Neural Core as a central digital brain that connects everything. It receives instructions, decides which specialized tools to use, and ensures all your AI agents are working in perfect harmony.',
                flow: [
                    { step: 'INPUT GATE', label: 'Instruction Received', desc: 'The system captures user intent via Slack, Teams, or API.' },
                    { step: 'NEURAL HUB', label: 'Intent Analysis', desc: 'The core brain decides exactly what needs to be done.' },
                    { step: 'RESOURCE MESH', label: 'Tool Allocation', desc: 'The system selects the best agents and tools for the job.' },
                    { step: 'EXECUTION LOOP', label: 'Parallel Processing', desc: 'Multiple agents work together to fulfill the request.' }
                ],
                files: [
                    { path: 'backend/src/routes/tasks.js', description: 'The main controller for all system operations.' },
                    { path: 'backend/src/index.js', description: 'The entry point where all connections are managed.' }
                ]
            },
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
            )
        },
        {
            id: 'search',
            title: 'Intelligent Search Fusion',
            description: 'Combining semantic search with agentic execution to solve problems, not just find answers.',
            analysis: {
                summary: 'Unlike simple search, this system doesn\'t just match keywords. It understands the "meaning" of your query and scans through your entire knowledge base to find the right facts, not just files.',
                flow: [
                    { step: 'SEMANTIC HUB', label: 'Meaning Extraction', desc: 'Translating your query into a mathematical concept (Vector).' },
                    { step: 'KNOWLEDGE MESH', label: 'Deep Scanning', desc: 'Searching across databases and documents for context.' },
                    { step: 'FUSION ENGINE', label: 'Hybrid Ranking', desc: 'Combining vector and keyword results for 99% accuracy.' },
                    { step: 'GROUNDED DATA', label: 'Fact Verification', desc: 'Ensuring the answer is based on your real data.' }
                ],
                files: [
                    { path: 'backend/src/routes/ai.js', description: 'The logic that turns text into deep meaning.' },
                    { path: 'backend/src/db/schema.js', description: 'The structure of your secure knowledge base.' }
                ]
            },
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M9 11h4" /><path d="M11 9v4" />
                </svg>
            )
        },
        {
            id: 'engine',
            title: 'o1 Reasoning Engine',
            description: 'Advanced NLP and reasoning that understands complex multihop queries and intent.',
            analysis: {
                summary: 'This is the "Thinking" engine. It doesn\'t just respond instantly; it breaks down complex problems into steps, tests different solutions, and self-corrects if it finds a better way.',
                flow: [
                    { step: 'PLANNER', label: 'Step-by-Step Plan', desc: 'The engine creates a roadmap for solving the problem.' },
                    { step: 'TOOL EXECUTION', label: 'Active Doing', desc: 'The system actually runs code or fetches data.' },
                    { step: 'REFLECTOR', label: 'Self-Critique', desc: 'The engine "reviews" its own work for errors.' },
                    { step: 'FINAL LOGIC', label: 'Solution Synthesis', desc: 'Combining all steps into one perfect answer.' }
                ],
                files: [
                    { path: 'backend/src/routes/ai.js', description: 'The portal to the o1-series thinking models.' },
                    { path: 'backend/src/routes/tasks.js', description: 'The loop that allows for "thinking" before doing.' }
                ]
            },
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4" /><path d="m16.2 4.2-2.8 2.8" /><path d="M18 12h4" /><path d="m16.2 19.8-2.8-2.8" /><path d="M12 18v4" /><path d="m4.2 19.8 2.8-2.8" /><path d="M2 12h4" /><path d="m4.2 4.2 2.8 2.8" /><circle cx="12" cy="12" r="3" />
                </svg>
            )
        },
        {
            id: 'easy',
            title: 'Agent Studio',
            description: 'Extensible framework with Agent Studio for rapid deployment of specialized autonomous workers.',
            analysis: {
                summary: 'Agent Studio is like a factory for AI. You can create a specialized worker for Any department (HR, Finance, Tech) by just telling it who it is, what it knows, and what tools it can use.',
                flow: [
                    { step: 'PERSONA', label: 'Define Identity', desc: 'Choosing how the agent should speak and act.' },
                    { step: 'KNOWLEDGE', label: 'Upload Context', desc: 'Giving the agent access to specific documents.' },
                    { step: 'TOOLS', label: 'Equip Skills', desc: 'Connecting the agent to your email, calendars, or databases.' },
                    { step: 'DEPLOY', label: 'Go Live', desc: 'The agent starts its automated mission.' }
                ],
                files: [
                    { path: 'frontend/app/agents/page.js', description: 'The visual builder you see on your screen.' },
                    { path: 'backend/src/routes/agents.js', description: 'The factory that generates the new AI personalities.' }
                ]
            },
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" /><path d="M12 5v14" /><rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
            )
        }
    ];

    const [activeTab, setActiveTab] = useState('platform');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);

    const runAnalysis = () => {
        setIsAnalyzing(true);
        setShowAnalysis(false);
        setTimeout(() => {
            setIsAnalyzing(false);
            setShowAnalysis(true);
        }, 1500);
    };

    const currentTab = tabs.find(t => t.id === activeTab);

    return (
        <div style={{ marginBottom: '48px', marginTop: '20px' }} className="animate-in">
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-1px', marginBottom: '12px' }}>
                    Make work flow for every employee and all your teams
                </h2>
                <div style={{ width: '60px', height: '4px', background: 'var(--accent-blue)', margin: '0 auto', borderRadius: '2px' }}></div>
            </div>

            <div className="glass-card-static" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                {/* Tabs Header */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    background: 'rgba(255,255,255,0.02)',
                    borderBottom: '1px solid var(--border-glass)'
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setShowAnalysis(false);
                            }}
                            style={{
                                padding: '24px 20px',
                                background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                textAlign: 'left',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                outline: 'none'
                            }}
                        >
                            <div style={{
                                color: activeTab === tab.id ? 'var(--accent-blue)' : 'var(--text-muted)',
                                transition: 'color 0.3s ease'
                            }}>
                                {tab.icon}
                            </div>
                            <div style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                lineHeight: '1.4',
                                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                transition: 'color 0.3s ease',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                {tab.title}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div style={{ padding: '40px', position: 'relative', minHeight: '620px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                        maxWidth: '800px',
                        textAlign: 'center',
                        marginBottom: '32px',
                        animation: 'fadeIn 0.5s ease-out'
                    }} key={activeTab}>
                        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: 500, marginBottom: '20px' }}>
                            {currentTab.description}
                        </p>

                        <button
                            onClick={runAnalysis}
                            disabled={isAnalyzing}
                            style={{
                                padding: '10px 28px',
                                background: isAnalyzing ? 'rgba(255,255,255,0.05)' : 'var(--accent-blue)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '13px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                opacity: isAnalyzing ? 0.6 : 1,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                boxShadow: isAnalyzing ? 'none' : '0 10px 25px rgba(59, 130, 246, 0.3)'
                            }}
                        >
                            {isAnalyzing ? (
                                <>
                                    <div className="mini-spinner" style={{ width: '14px', height: '14px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></div>
                                    Running Neural Analysis...
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                    </svg>
                                    Run Neural Analysis
                                </>
                            )}
                        </button>
                    </div>

                    <div style={{
                        width: '100%',
                        maxWidth: '1000px',
                        minHeight: '560px',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-glass-hover)',
                        boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
                        position: 'relative',
                        background: '#040508',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <DynamicArchitecture activeTab={activeTab} />

                        {/* Analysis Overlay */}
                        {showAnalysis && (
                            <div className="analysis-panel animate-in" style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                width: '380px',
                                maxHeight: 'calc(100% - 40px)',
                                overflowY: 'auto',
                                background: 'rgba(5, 6, 10, 0.99)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid var(--accent-blue)',
                                borderRadius: '16px',
                                padding: '32px',
                                zIndex: 10,
                                boxShadow: '0 30px 100px rgba(0,0,0,1)',
                                animation: 'slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '24px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '12px', height: '12px', background: 'var(--accent-blue)', borderRadius: '3px', animation: 'pulse-soft 2s infinite' }}></div>
                                        <h4 style={{ fontSize: '14px', fontWeight: 1000, color: 'var(--accent-blue)', letterSpacing: '2px', textTransform: 'uppercase' }}>Neural Process Flow</h4>
                                    </div>
                                    <button onClick={() => setShowAnalysis(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>

                                <div style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                    <p style={{ fontSize: '13px', color: 'white', lineHeight: '1.7', fontWeight: 500 }}>
                                        {currentTab.analysis.summary}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <h5 style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>How it works (Step-by-Step)</h5>
                                    {currentTab.analysis.flow.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '24px', height: '24px', borderRadius: '50%',
                                                    background: 'var(--accent-blue)',
                                                    color: '#000', fontSize: '10px', fontWeight: 900,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    zIndex: 2,
                                                    boxShadow: '0 0 15px var(--accent-blue-glow)'
                                                }}>{i + 1}</div>
                                                {i < currentTab.analysis.flow.length - 1 && (
                                                    <div style={{ flex: 1, width: '2px', background: 'linear-gradient(to bottom, var(--accent-blue), transparent)', margin: '4px 0' }}></div>
                                                )}
                                            </div>
                                            <div style={{ paddingBottom: '20px' }}>
                                                <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--accent-cyan)', marginBottom: '4px' }}>{f.label}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5', fontWeight: 500 }}>{f.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                                    <h5 style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Core Components</h5>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {currentTab.analysis.files.map((file, i) => (
                                            <div key={i} style={{
                                                padding: '6px 12px',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '6px',
                                                fontSize: '10px',
                                                fontFamily: 'var(--font-mono)',
                                                color: 'var(--text-primary)'
                                            }}>
                                                {file.path.split('/').pop()}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div className="status-indicator" style={{ position: 'relative' }}>
                                        <div style={{ width: '10px', height: '10px', background: 'var(--accent-green)', borderRadius: '50%' }}></div>
                                        <div style={{ position: 'absolute', inset: -4, border: '2px solid var(--accent-green)', borderRadius: '50%', animation: 'pulse-ring 2s infinite' }}></div>
                                    </div>
                                    <span style={{ fontSize: '10px', fontWeight: 1000, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>SYSTEM_SYNC // 100% OPERATIONAL</span>
                                </div>
                            </div>
                        )}

                        {/* Tactical HUD Overlays */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'radial-gradient(circle at center, transparent 35%, rgba(4, 5, 8, 0.6) 100%)',
                            pointerEvents: 'none'
                        }}></div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes pulse-soft {
                    0% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.8; }
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); opacity: 0.8; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

// ─── Dynamic Architecture Visualization ────────────────────────
function DynamicArchitecture({ activeTab }) {
    const renderNode = (x, y, label, color, icon, sublabel, size = 26) => (
        <g key={label} style={{ animation: 'fadeIn 1s ease-out forwards' }}>
            {/* Multi-layered Glow System */}
            <circle cx={x} cy={y} r={size * 2} fill={`var(${color}-glow)`} opacity="0.06">
                <animate attributeName="opacity" values="0.03;0.1;0.03" dur="6000ms" repeatCount="indefinite" />
            </circle>
            <circle cx={x} cy={y} r={size * 1.5} fill={`var(${color}-glow)`} opacity="0.12">
                <animate attributeName="r" values={`${size * 1.4};${size * 1.6};${size * 1.4}`} dur="4500ms" repeatCount="indefinite" />
            </circle>

            {/* Primary Infrastructure Housing */}
            <circle cx={x} cy={y} r={size} fill="#0d0f17" stroke={`var(${color})`} strokeWidth="1.8" />

            {/* Tactical Decals */}
            <circle cx={x} cy={y} r={size - 5} fill="none" stroke={`var(${color})`} strokeWidth="0.5" strokeDasharray="3 4" opacity="0.4">
                <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`-360 ${x} ${y}`} dur="15s" repeatCount="indefinite" />
            </circle>

            {/* Core Symbol */}
            <text x={x} y={y + 7} textAnchor="middle" fill={`var(${color})`} fontSize={size * 0.75} style={{ userSelect: 'none', filter: 'brightness(1.8) drop-shadow(0 0 3px rgba(255,255,255,0.3))' }}>
                {icon}
            </text>

            {/* Metadata Labels */}
            <g transform={`translate(${x}, ${y + size + 16})`}>
                <text x="0" y="0" textAnchor="middle" fill="white" fontSize="9.5" fontWeight="1000" letterSpacing="1.5px">
                    {label.toUpperCase()}
                </text>
                {sublabel && (
                    <text x="0" y="11" textAnchor="middle" fill="var(--text-muted)" fontSize="7" fontWeight="800" letterSpacing="1px" opacity="0.7">
                        {sublabel.toUpperCase()}
                    </text>
                )}
            </g>
        </g>
    );

    const renderLink = (x1, y1, x2, y2, color, dashed = false, animate = true, speed = "3000ms") => (
        <g>
            <path
                d={`M${x1},${y1} L${x2},${y2}`}
                stroke={`var(${color})`} strokeWidth="1.2"
                opacity="0.22"
                strokeDasharray={dashed ? "5 5" : "none"}
                fill="none"
            />
            {animate && (
                <circle r="2.2" fill="white" style={{ filter: `drop-shadow(0 0 6px var(${color}))` }}>
                    <animateMotion
                        dur={speed}
                        repeatCount="indefinite"
                        path={`M${x1},${y1} L${x2},${y2}`}
                    />
                    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur={speed} repeatCount="indefinite" />
                </circle>
            )}
        </g>
    );

    const renderHUD = () => (
        <g opacity="0.18">
            <rect width="800" height="500" fill="none" stroke="white" strokeWidth="0.2" opacity="0.2" />
            {/* Corner HUD Markers */}
            <path d="M20,20 L60,20 M20,20 L20,60" stroke="white" strokeWidth="1.2" fill="none" />
            <path d="M780,20 L740,20 M780,20 L780,60" stroke="white" strokeWidth="1.2" fill="none" />
            <path d="M20,480 L60,480 M20,480 L20,440" stroke="white" strokeWidth="1.2" fill="none" />
            <path d="M780,480 L740,480 M780,480 L780,440" stroke="white" strokeWidth="1.2" fill="none" />

            {/* Technical Labels */}
            <text x="25" y="476" fill="white" fontSize="8" fontWeight="1000" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>CHAKRAVIEW v4.2 // NEURAL_INFRA_STABLE</text>
            <text x="775" y="476" textAnchor="end" fill="white" fontSize="8" fontWeight="1000" style={{ fontFamily: 'var(--font-mono)' }}>OP_MODE: HIGH_INTEL // SYNC_ACTIVE</text>

            {/* Grid Pattern */}
            <defs>
                <pattern id="hudGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                </pattern>
            </defs>
            <rect width="800" height="500" fill="url(#hudGrid)" />
        </g>
    );

    const renderPlatformView = () => (
        <svg viewBox="0 0 800 500" width="100%" height="100%">
            {renderHUD()}

            {/* Background Neural Web */}
            <g opacity="0.05">
                {[...Array(8)].map((_, i) => (
                    <circle key={i} cx="400" cy="250" r={80 + i * 40} fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2 10">
                        <animateTransform attributeName="transform" type="rotate" from="0 400 250" to={i % 2 === 0 ? "360 400 250" : "-360 400 250"} dur={`${20 + i * 5}s`} repeatCount="indefinite" />
                    </circle>
                ))}
            </g>

            {/* Core Connections */}
            <g>
                {/* Integration Layer */}
                {renderLink(140, 110, 400, 250, '--accent-blue', false, true, "1800ms")}
                {renderLink(140, 250, 400, 250, '--accent-blue', false, true, "2400ms")}
                {renderLink(140, 390, 400, 250, '--accent-blue', false, true, "3200ms")}

                {renderNode(140, 110, 'Enterprise API', '--accent-blue', '🌍', 'REST / GraphQL')}
                {renderNode(140, 250, 'Conversations', '--accent-blue', '🗨️', 'Slack / Teams / WhatsApp')}
                {renderNode(140, 390, 'Legacy bridge', '--accent-blue', '🏢', 'On-Prem data mesh')}

                {/* Core Engine Center */}
                {renderLink(400, 250, 400, 80, '--accent-red', true, true, "1200ms")}
                {renderNode(400, 80, 'Compliance Filter', '--accent-red', '🛡️', 'PII / Toxicity Safety')}
                {renderNode(400, 250, 'Neural Orchestrator', '--accent-blue', '💎', 'o1-based Reasoning Core', 48)}

                {/* Knowledge & Memory */}
                {renderLink(400, 250, 660, 100, '--accent-purple')}
                {renderLink(400, 250, 660, 190, '--accent-purple')}
                {renderLink(400, 250, 660, 280, '--accent-purple')}
                {renderLink(400, 250, 660, 400, '--accent-green')}

                {renderNode(660, 100, 'Semantic Vault', '--accent-purple', '💾', 'Elastic / Pinecone Context')}
                {renderNode(660, 190, 'Knowledge Graph', '--accent-purple', '⛓️', 'Entity Relationship Mesh')}
                {renderNode(660, 280, 'Expert Models', '--accent-purple', '🤖', 'Domain LLM Cluster')}
                {renderNode(660, 400, 'Action Engine', '--accent-green', '⚡', 'Third-party API Execution')}
            </g>
        </svg>
    );

    const renderSearchView = () => (
        <svg viewBox="0 0 800 500" width="100%" height="100%">
            {renderHUD()}

            {/* The Unified Search Pipeline Visualization */}
            <g>
                {/* Query Input */}
                {renderLink(120, 250, 280, 250, '--accent-cyan', false, true, "1400ms")}
                {renderNode(120, 250, 'Natural Query', '--accent-cyan', '🔍', 'Intent Classification')}

                {/* Encoding */}
                {renderLink(280, 250, 450, 150, '--accent-cyan')}
                {renderLink(280, 250, 450, 250, '--accent-cyan')}
                {renderLink(280, 250, 450, 350, '--accent-cyan')}
                {renderNode(280, 250, 'Neural Embedder', '--accent-cyan', '🧬', 'Dense Space projection', 34)}

                {/* Storage Backends */}
                {renderNode(450, 150, 'Vector DB', '--accent-blue', '📦', 'HNSW Dense retrieval')}
                {renderNode(450, 250, 'Graph Ontology', '--accent-purple', '🕸️', 'Semantic context path')}
                {renderNode(450, 350, 'Lexical Index', '--accent-blue', '📄', 'Term-based precision')}

                {/* Hybrid Fusion */}
                {renderLink(450, 150, 620, 250, '--accent-green')}
                {renderLink(450, 250, 620, 250, '--accent-green')}
                {renderLink(450, 350, 620, 250, '--accent-green')}
                {renderNode(620, 250, 'Hybrid Fusion', '--accent-green', '🚥', 'Reranking & Selection', 36)}

                {/* Output result */}
                {renderLink(620, 250, 750, 250, '--accent-green', false, true, "900ms")}
                {renderNode(750, 250, 'Verified result', '--accent-green', '🎯', 'Grounded intelligence')}
            </g>
        </svg>
    );

    const renderEngineView = () => (
        <svg viewBox="0 0 800 500" width="100%" height="100%">
            {renderHUD()}

            {/* Deep Reasoning Architecture Visualization */}
            <g>
                {/* Circular Recursive Process */}
                <circle cx="400" cy="250" r="145" fill="none" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="2.5" strokeDasharray="10 6" />

                {renderLink(400, 250, 400, 85, '--accent-purple', false, true, "1800ms")}
                {renderLink(400, 85, 570, 250, '--accent-blue', false, true, "1800ms")}
                {renderLink(570, 250, 400, 415, '--accent-cyan', false, true, "1800ms")}
                {renderLink(400, 415, 230, 250, '--accent-amber', false, true, "1800ms")}
                {renderLink(230, 250, 400, 85, '--accent-red', false, true, "1800ms")}

                {renderNode(400, 85, 'Strategic Plan', '--accent-purple', '🧩', 'Decomposition')}
                {renderNode(570, 250, 'Execution', '--accent-blue', '🔧', 'Parallel Tool calls')}
                {renderNode(400, 415, 'Observe', '--accent-cyan', '👁️', 'Result Parsing')}
                {renderNode(230, 250, 'Self-Correction', '--accent-amber', '🌀', 'Logical Reflection')}

                {/* Reasoner Hub */}
                {renderNode(400, 250, 'Chakra Reasoning Core', '--accent-purple', '⚛️', 'Multi-Layer Logic o1-v4', 52)}
            </g>

            {/* System detail indicators */}
            <g opacity="0.5" style={{ fontFamily: 'var(--font-mono)' }}>
                {renderNode(80, 80, 'Memory buffer', '--accent-muted', '📼', 'In-flight context', 15)}
                {renderNode(720, 80, 'Policy Store', '--accent-muted', '📜', 'Enterprise Rules', 15)}
                {renderNode(80, 420, 'History log', '--accent-muted', '🔋', 'Fast retrieval', 15)}
                {renderNode(720, 420, 'Critique log', '--accent-muted', '🧪', 'Audit trail', 15)}
            </g>
        </svg>
    );

    const renderStudioView = () => (
        <svg viewBox="0 0 800 500" width="100%" height="100%">
            {renderHUD()}

            {/* Agent Synthesis Factory Pipeline */}
            <g>
                {/* Build Inputs Phase */}
                {renderLink(140, 90, 350, 250, '--accent-amber')}
                {renderLink(140, 190, 350, 250, '--accent-amber')}
                {renderLink(140, 310, 350, 250, '--accent-amber')}
                {renderLink(140, 410, 350, 250, '--accent-amber')}

                {renderNode(140, 90, 'Persona config', '--accent-amber', '🎭', 'Personality & Voice')}
                {renderNode(140, 190, 'Knowledge Pack', '--accent-amber', '📚', 'Dataset / RAG base')}
                {renderNode(140, 310, 'Tool Library', '--accent-amber', '🔌', 'Function manifests')}
                {renderNode(140, 410, 'Policy Guard', '--accent-amber', '⚖️', 'Global guardrails')}

                {/* Packaging Phase */}
                {renderNode(350, 250, 'Neural Compiler', '--accent-blue', '🏗️', 'Agent Construction Engine', 42)}

                {/* Quality Tier */}
                {renderLink(350, 250, 550, 250, '--accent-blue')}
                {renderNode(550, 250, 'Evaluation Lab', '--accent-blue', '🔬', 'Test & Tuning Simulation', 34)}

                {/* Cloud & Edge Tier */}
                {renderLink(550, 250, 740, 140, '--accent-green')}
                {renderLink(550, 250, 740, 360, '--accent-green')}
                {renderNode(740, 140, 'Deploy Cloud', '--accent-green', '☁️', 'Enterprise Pipeline')}
                {renderNode(740, 360, 'Deploy Edge', '--accent-green', '📦', 'Local / Secure execution')}
            </g>

            <text x="550" y="445" textAnchor="middle" fill="var(--accent-green)" fontSize="9" fontWeight="1000" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>SYSTEM_STATUS: READY_TO_DEPLOY</text>
        </svg>
    );

    switch (activeTab) {
        case 'platform': return renderPlatformView();
        case 'search': return renderSearchView();
        case 'engine': return renderEngineView();
        case 'easy': return renderStudioView();
        default: return renderPlatformView();
    }
}
