'use client';
import { useState, useEffect, useCallback } from 'react';
import { getDashboardStats } from '@/lib/api';
import { useWebSocket } from '@/lib/websocket';

export default function AnalyticsPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { subscribe } = useWebSocket();

    const loadStats = useCallback(async () => {
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStats();
        const unsubs = [
            subscribe('task:update', loadStats),
            subscribe('task:created', loadStats),
            subscribe('node:update', loadStats),
        ];
        return () => unsubs.forEach(u => u());
    }, [loadStats, subscribe]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div className="pulse" style={{ color: 'var(--text-secondary)' }}>Gathering intelligence tokens...</div>
        </div>
    );

    const successRate = stats.tasks.total > 0
        ? ((stats.tasks.completed / stats.tasks.total) * 100).toFixed(1)
        : '0.0';

    // SVG Chart Helper
    const renderTaskChart = () => {
        const trends = stats.trends.tasks;
        const max = Math.max(...trends.map(t => t.count), 5);
        const width = 800;
        const height = 200;
        const padding = 40;

        const points = trends.map((t, i) => ({
            x: (i * (width - padding * 2)) / (trends.length - 1) + padding,
            y: height - (t.count / max) * (height - padding * 2) - padding
        }));

        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
                <defs>
                    <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(v => (
                    <line key={v} x1={padding} y1={padding + v * (height - padding * 2)}
                        x2={width - padding} y2={padding + v * (height - padding * 2)} className="chart-grid-line" />
                ))}

                <path d={areaPath} className="chart-area" />
                <path d={linePath} className="chart-line animate-draw" />

                {points.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4" className="chart-point" />
                        <text x={p.x} y={height - 10} textAnchor="middle" className="chart-axis-text">
                            {trends[i].date.split('-').slice(1).join('/')}
                        </text>
                        {trends[i].count > 0 && (
                            <text x={p.x} y={p.y - 10} textAnchor="middle" className="chart-axis-text" style={{ fill: 'var(--text-primary)' }}>
                                {trends[i].count}
                            </text>
                        )}
                    </g>
                ))}
            </svg>
        );
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-1px' }}>Intelligence Analytics</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Real-time performance audit and agent efficiency metrics.</p>
                </div>
                <div style={{ padding: '8px 16px', borderRadius: '20px', background: 'var(--accent-blue-glow)', color: 'var(--accent-blue)', fontSize: '12px', fontWeight: 800 }}>
                    <span className="pulse-dot" style={{ marginRight: '8px' }}></span> LIVE DATA
                </div>
            </div>

            <div className="metrics-grid" style={{ marginBottom: '40px' }}>
                <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
                    <div className="metric-label">System Success Rate</div>
                    <div className="metric-value" style={{ color: 'var(--accent-blue)' }}>{successRate}%</div>
                    <div className="metric-trend trend-up">↑ 2.4% from last week</div>
                </div>
                <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
                    <div className="metric-label">Total Orchestrated Tasks</div>
                    <div className="metric-value" style={{ color: 'var(--accent-purple)' }}>{stats.tasks.total}</div>
                    <div className="metric-trend" style={{ color: 'var(--text-muted)' }}>{stats.tasks.running} currently active</div>
                </div>
                <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
                    <div className="metric-label">Avg Agent Confidence</div>
                    <div className="metric-value" style={{ color: 'var(--accent-green)' }}>{Math.round(stats.system.avgConfidence * 100)}%</div>
                    <div className="metric-trend trend-up">↑ 5% above threshold</div>
                </div>
                <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--accent-amber)' }}>
                    <div className="metric-label">Total Compute Spend</div>
                    <div className="metric-value" style={{ color: 'var(--accent-amber)' }}>${stats.system.totalCost}</div>
                    <div className="metric-trend" style={{ color: 'var(--text-muted)' }}>{stats.system.openaiConfigured ? 'GPT-4o / GPT-4o-mini' : 'No Model'}</div>
                </div>
            </div>

            <div className="analytics-grid">
                <div className="glass-card-static" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Task Activity Trend</h3>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>LAST 7 DAYS</span>
                    </div>
                    <div className="chart-container">
                        {renderTaskChart()}
                    </div>
                </div>

                <div className="glass-card-static" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>Agent Performance Leaderboard</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {stats.agentPerformance.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No performance data available yet.</div>
                        ) : (
                            stats.agentPerformance.map(agent => (
                                <div key={agent.id} style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ fontWeight: 600 }}>{agent.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{agent.successful_tasks} / {agent.total_tasks} Tasks</div>
                                    </div>
                                    <div className="progress-bar" style={{ height: '6px' }}>
                                        <div className="progress-fill" style={{
                                            width: `${(agent.successful_tasks / (agent.total_tasks || 1)) * 100}%`,
                                            background: agent.successful_tasks / (agent.total_tasks || 1) > 0.8 ? 'var(--accent-green)' : 'var(--accent-blue)'
                                        }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                        <span>Confidence: {Math.round((agent.avg_confidence || 0) * 100)}%</span>
                                        <span>Model: {agent.model}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 20px;
                }
                .metric-card {
                    padding: 24px;
                    transition: all 0.3s ease;
                }
                .metric-card:hover {
                    transform: translateY(-5px);
                    background: rgba(255, 255, 255, 0.05);
                }
                .metric-label {
                    font-size: 13px;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                }
                .metric-value {
                    font-size: 32px;
                    font-weight: 900;
                    margin-bottom: 4px;
                }
                .pulse-dot {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    background: currentColor;
                    border-radius: 50%;
                    box-shadow: 0 0 0 rgba(59, 130, 246, 0.4);
                    animation: pulse-dot 2s infinite;
                }
                @keyframes pulse-dot {
                    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                }
                .pulse {
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
