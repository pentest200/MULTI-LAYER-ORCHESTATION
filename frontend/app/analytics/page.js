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
        } catch (e) {
            console.error('Failed to load stats:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStats();
        const unsub = subscribe('task:update', loadStats);
        return unsub;
    }, [loadStats, subscribe]);

    const renderChakraTopology = () => {
        const center = 150;
        const rings = [55, 85, 115];

        return (
            <div className="chakra-topology-container">
                <svg viewBox="0 0 300 300" className="topology-svg">
                    <defs>
                        <filter id="glow-heavy" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="8" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0.8" />
                        </linearGradient>
                    </defs>

                    {/* Orbital Base Rings */}
                    {rings.map((r, i) => (
                        <circle
                            key={i}
                            cx={center} cy={center} r={r}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.05)"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Active Data Rings */}
                    <circle
                        cx={center} cy={center} r={rings[1]}
                        fill="none"
                        stroke="url(#ring-grad)"
                        strokeWidth="3"
                        strokeDasharray="60 180"
                        className="rotate-slow"
                        filter="url(#glow-heavy)"
                        style={{ opacity: 0.4 }}
                    />

                    <circle
                        cx={center} cy={center} r={rings[0]}
                        fill="none"
                        stroke="var(--accent-green)"
                        strokeWidth="2"
                        strokeDasharray="40 160"
                        className="rotate-fast"
                        style={{ opacity: stats?.agents?.active > 0 ? 0.8 : 0.1 }}
                    />

                    {/* Central Core (Chakra) */}
                    <g className="core-portal">
                        <circle cx={center} cy={center} r="35" fill="rgba(13, 15, 23, 0.8)" stroke="var(--border-glass)" />
                        <circle cx={center} cy={center} r="20" fill="none" stroke="var(--accent-blue)" strokeWidth="1" className="rotate-fast" strokeDasharray="5 5" />
                        <circle cx={center} cy={center} r="8" fill="var(--accent-blue)" filter="url(#glow-heavy)">
                            <animate attributeName="r" values="8;12;8" dur="4s" repeatCount="indefinite" />
                        </circle>
                    </g>

                    {/* Connection Filaments */}
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                        const rad = (angle * Math.PI) / 180;
                        const x2 = center + Math.cos(rad) * 135;
                        const y2 = center + Math.sin(rad) * 135;

                        return (
                            <g key={i}>
                                <line
                                    x1={center} y1={center} x2={x2} y2={y2}
                                    stroke="rgba(59, 130, 246, 0.08)"
                                    strokeWidth="1"
                                />
                                <circle
                                    cx={x2} cy={y2} r="4"
                                    fill={i % 2 === 0 ? "var(--accent-blue)" : "var(--accent-purple)"}
                                    className="data-pulse"
                                    style={{ animationDelay: `${i * 0.7}s` }}
                                />
                            </g>
                        );
                    })}
                </svg>

                <div className="topology-footer">
                    <div className="topology-legend">
                        <div className="legend-item">
                            <span className="dot" style={{ background: 'var(--accent-blue)' }}></span>
                            <span>SYS_PEAK</span>
                        </div>
                        <div className="legend-item">
                            <span className="dot" style={{ background: 'var(--accent-green)' }}></span>
                            <span>SYNC_OK</span>
                        </div>
                    </div>

                    <div className="topology-ovr-stats">
                        <div className="ovr-row">
                            <label>NET_NODES</label>
                            <span className="ovr-value">{stats?.agents?.active || 0}</span>
                        </div>
                        <div className="ovr-row">
                            <label>NET_LATENCY</label>
                            <span className="ovr-value highlight">24<small>ms</small></span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderVelocityChart = () => {
        const trends = stats?.trends?.tasks || [];
        const max = Math.max(...trends.map(t => t.count), 5);
        const width = 1000;
        const height = 240;

        const points = trends.map((t, i) => ({
            x: (i / (trends.length - 1 || 1)) * width,
            y: height - ((t.count / max) * height * 0.7 + height * 0.15)
        }));

        const d = points.length > 1
            ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
            : '';

        const areaD = d ? `${d} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z` : '';

        return (
            <div className="velocity-container">
                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {areaD && <path d={areaD} fill="url(#area-grad)" />}
                    {d && <path d={d} fill="none" stroke="var(--accent-blue)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 12px var(--accent-blue))' }} />}
                    {points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="6" fill="white" stroke="var(--accent-blue)" strokeWidth="3" />
                    ))}
                </svg>
            </div>
        );
    };

    if (loading) return (
        <div className="loading-container">
            <div className="chakra-loader">
                <div className="loader-ring"></div>
                <div className="loader-ring"></div>
                <div className="loader-ring"></div>
                <div className="loader-core"></div>
            </div>
            <p className="loading-text">Synchronizing Chakraview Neural Core...</p>
        </div>
    );

    const successRate = stats?.tasks?.total > 0
        ? ((stats.tasks.completed / stats.tasks.total) * 100).toFixed(1)
        : '0.0';

    return (
        <div className="analytics-container">
            <header className="page-header animate-in">
                <div className="header-meta">
                    <div className="intel-segment">
                        <span className="intel-tag">NEURAL_CORE_v4.2</span>
                        <div className="pulse-line"></div>
                    </div>
                    <div className="system-status-pill">
                        <div className="status-dot"></div>
                        <span>SYSTEM_NOMINAL_OVR</span>
                    </div>
                </div>
                <h1 className="dashboard-title">
                    <span className="title-alt">CHAKRAVIEW</span>
                    <span className="title-main">NEURAL CORE</span>
                </h1>
                <div className="header-decoration"></div>
            </header>

            {/* Top Row: Elite Mini Stats */}
            <div className="stats-row">
                <div className="stat-card-mini animate-in" style={{ animationDelay: '0s' }}>
                    <div className="stat-card-inner">
                        <div className="stat-icon-wrapper blue">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                        </div>
                        <div className="stat-data">
                            <label>NODE_PRECISION</label>
                            <div className="val-group">
                                <h3>{successRate}</h3>
                                <span className="unit">%</span>
                            </div>
                        </div>
                    </div>
                    <div className="card-accent"></div>
                </div>

                <div className="stat-card-mini animate-in" style={{ animationDelay: '0.1s' }}>
                    <div className="stat-card-inner">
                        <div className="stat-icon-wrapper green">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                        <div className="stat-data">
                            <label>ACTIVE_ENTITIES</label>
                            <div className="val-group">
                                <h3>{stats?.agents?.active || 0}</h3>
                                <span className="unit">/ {stats?.agents?.total || 0}</span>
                            </div>
                        </div>
                    </div>
                    <div className="card-accent"></div>
                </div>

                <div className="stat-card-mini animate-in" style={{ animationDelay: '0.2s' }}>
                    <div className="stat-card-inner">
                        <div className="stat-icon-wrapper purple">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                        </div>
                        <div className="stat-data">
                            <label>COMPUTE_LATENCY</label>
                            <div className="val-group">
                                <h3>{(stats?.usage?.cost || 0).toFixed(3)}</h3>
                                <span className="unit">ms</span>
                            </div>
                        </div>
                    </div>
                    <div className="card-accent"></div>
                </div>

                <div className="stat-card-mini animate-in" style={{ animationDelay: '0.3s' }}>
                    <div className="stat-card-inner">
                        <div className="stat-icon-wrapper amber">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                        </div>
                        <div className="stat-data">
                            <label>MISSION_RECORDS</label>
                            <div className="val-group">
                                <h3>{stats?.tasks?.total || 0}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="card-accent"></div>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="bento-grid">
                {/* Main Insight: Workflow Velocity */}
                <div className="glass-card bento-item velocity animate-in" style={{ animationDelay: '0.4s' }}>
                    <div className="card-header">
                        <div className="header-group">
                            <span className="header-icon">📈</span>
                            <h3>Execution Velocity</h3>
                        </div>
                        <p>Throughput index across active deployment cycles</p>
                    </div>
                    {renderVelocityChart()}
                    <div className="chart-footer">
                        <div className="timeline-labels">
                            {stats?.trends?.tasks?.map((t, i) => (
                                <span key={i}>{t.date.split('-')[2]}</span>
                            ))}
                        </div>
                        <div className="chart-metrics">
                            <div className="mini-metric">
                                <label>PEAK</label>
                                <span>{Math.max(...(stats?.trends?.tasks?.map(t => t.count) || [0]))} OPS</span>
                            </div>
                            <div className="mini-metric">
                                <label>AVG</label>
                                <span>{((stats?.trends?.tasks?.reduce((a, b) => a + b.count, 0) || 0) / (stats?.trends?.tasks?.length || 1)).toFixed(1)} OPS</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secondary Insight: System Topology */}
                <div className="glass-card bento-item topology animate-in" style={{ animationDelay: '0.5s' }}>
                    <div className="card-header">
                        <div className="header-group">
                            <span className="header-icon">🕸️</span>
                            <h3>Neural Topology</h3>
                        </div>
                        <div className="scan-badge">
                            <div className="scan-line"></div>
                            NOMINAL
                        </div>
                    </div>
                    {renderChakraTopology()}
                </div>

                {/* Tertiary Insight: Resource Allocation */}
                <div className="glass-card bento-item resources animate-in" style={{ animationDelay: '0.6s' }}>
                    <div className="card-header">
                        <div className="header-group">
                            <span className="header-icon">💎</span>
                            <h3>Compute Allocation</h3>
                        </div>
                    </div>
                    <div className="resource-list">
                        <div className="resource-item">
                            <div className="res-label">Inference Cost</div>
                            <div className="res-bar-bg"><div className="res-bar-fill" style={{ width: '65%', background: 'var(--accent-blue)' }}></div></div>
                            <div className="res-value">{(stats?.usage?.cost || 0).toFixed(4)}</div>
                        </div>
                        <div className="resource-item">
                            <div className="res-label">Token Density</div>
                            <div className="res-bar-bg"><div className="res-bar-fill" style={{ width: '42%', background: 'var(--accent-purple)' }}></div></div>
                            <div className="res-value">4.2k</div>
                        </div>
                        <div className="resource-item">
                            <div className="res-label">Queue Pressure</div>
                            <div className="res-bar-bg"><div className="res-bar-fill" style={{ width: '12%', background: 'var(--accent-green)' }}></div></div>
                            <div className="res-value">LOW</div>
                        </div>
                    </div>
                </div>

                {/* Fourth Insight: Intelligence Mix */}
                <div className="glass-card bento-item mix animate-in" style={{ animationDelay: '0.7s' }}>
                    <div className="card-header">
                        <div className="header-group">
                            <span className="header-icon">🧠</span>
                            <h3>Intelligence Mix</h3>
                        </div>
                    </div>
                    <div className="model-grid">
                        <div className="model-chip">GPT-4o <span>45%</span></div>
                        <div className="model-chip">GPT-4o Mini <span>30%</span></div>
                        <div className="model-chip">O1 Series <span>25%</span></div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .analytics-container {
                    padding: 40px;
                    max-width: 1500px;
                    margin: 0 auto;
                }

                .page-header {
                    margin-bottom: 60px;
                    position: relative;
                }

                .header-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .intel-segment {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .intel-tag {
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 4px;
                    color: var(--accent-blue);
                    background: rgba(59, 130, 246, 0.1);
                    padding: 4px 12px;
                    border-radius: 4px;
                    border-left: 3px solid var(--accent-blue);
                }

                .pulse-line {
                    width: 100px;
                    height: 1px;
                    background: linear-gradient(90deg, var(--accent-blue), transparent);
                    position: relative;
                }

                .pulse-line::after {
                    content: '';
                    position: absolute;
                    left: 0; top: -1px;
                    width: 4px; height: 3px;
                    background: white;
                    box-shadow: 0 0 10px white;
                    animation: pulse-move 3s infinite linear;
                }

                @keyframes pulse-move {
                    0% { left: 0; opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { left: 100%; opacity: 0; }
                }

                .dashboard-title {
                    font-size: 72px;
                    font-weight: 950;
                    letter-spacing: -4px;
                    line-height: 0.9;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                }

                .title-alt {
                    font-size: 16px;
                    letter-spacing: 12px;
                    color: var(--text-muted);
                    font-weight: 800;
                    margin-bottom: 8px;
                    padding-left: 4px;
                }

                .title-main {
                    background: linear-gradient(to bottom, #fff 30%, var(--accent-blue) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .header-decoration {
                    position: absolute;
                    bottom: -20px;
                    left: 0; width: 100%;
                    height: 1px;
                    background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 100%);
                }

                .system-status-pill {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 10px;
                    font-weight: 900;
                    color: var(--accent-green);
                    background: rgba(16, 185, 129, 0.05);
                    padding: 10px 20px;
                    border-radius: 4px;
                    border: 1px solid rgba(16, 185, 129, 0.1);
                    letter-spacing: 1.5px;
                }

                .status-dot {
                    width: 6px;
                    height: 6px;
                    background: var(--accent-green);
                    border-radius: 50%;
                    box-shadow: 0 0 15px var(--accent-green);
                    animation: pulse-dot 2s infinite;
                }

                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 40px;
                }

                .stat-card-mini {
                    position: relative;
                    background: rgba(255, 255, 255, 0.01);
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    border-radius: 12px;
                    overflow: hidden;
                    transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
                }

                .stat-card-mini:hover {
                    transform: translateY(-8px);
                    background: rgba(255, 255, 255, 0.03);
                    border-color: rgba(255, 255, 255, 0.1);
                    box-shadow: 0 30px 60px rgba(0,0,0,0.4);
                }

                .stat-card-inner {
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    position: relative;
                    z-index: 2;
                }

                .card-accent {
                    position: absolute;
                    bottom: 0; left: 0;
                    width: 100%; height: 2px;
                    background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent);
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .stat-card-mini:hover .card-accent {
                    opacity: 1;
                }

                .stat-icon-wrapper {
                    width: 52px;
                    height: 52px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.3s;
                }

                .stat-icon-wrapper.blue { color: var(--accent-blue); }
                .stat-icon-wrapper.green { color: var(--accent-green); }
                .stat-icon-wrapper.purple { color: var(--accent-purple); }
                .stat-icon-wrapper.amber { color: var(--accent-amber); }

                .stat-card-mini:hover .stat-icon-wrapper {
                    transform: scale(1.1) rotate(5deg);
                    background: rgba(255, 255, 255, 0.05);
                }

                .stat-data label {
                    display: block;
                    font-size: 9px;
                    font-weight: 950;
                    letter-spacing: 2px;
                    color: var(--text-muted);
                    margin-bottom: 6px;
                }

                .val-group {
                    display: flex;
                    align-items: baseline;
                    gap: 6px;
                }

                .stat-data h3 {
                    font-size: 28px;
                    font-weight: 950;
                    margin: 0;
                    letter-spacing: -1px;
                    color: var(--text-primary);
                }

                .stat-data .unit {
                    font-size: 11px;
                    font-weight: 900;
                    color: var(--text-muted);
                    opacity: 0.6;
                }

                .bento-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    grid-auto-rows: minmax(280px, auto);
                    gap: 24px;
                }
                
                .bento-item.velocity { grid-column: span 2; grid-row: span 2; }
                .bento-item.topology { grid-column: span 1; grid-row: span 2; }
                .bento-item.resources { grid-column: span 1; grid-row: span 1; }
                .bento-item.mix { grid-column: span 2; grid-row: span 1; }

                .card-header {
                    padding: 32px 32px 20px;
                }

                .header-group {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 8px;
                }

                .header-icon {
                    font-size: 20px;
                    width: 40px;
                    height: 40px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .card-header h3 {
                    font-size: 22px;
                    font-weight: 850;
                    margin: 0;
                    letter-spacing: -0.5px;
                }

                .card-header p {
                    font-size: 13px;
                    color: var(--text-muted);
                    margin: 0;
                    opacity: 0.7;
                }

                .chart-footer {
                    padding: 0 32px 32px;
                    margin-top: auto;
                }

                .timeline-labels {
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    font-family: var(--font-mono);
                    color: var(--text-muted);
                    font-weight: 700;
                    margin-bottom: 24px;
                    padding: 0 10px;
                }

                .chart-metrics {
                    display: flex;
                    gap: 32px;
                    padding-top: 24px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                }

                .mini-metric label {
                    display: block;
                    font-size: 9px;
                    font-weight: 950;
                    letter-spacing: 1.5px;
                    color: var(--text-muted);
                    margin-bottom: 4px;
                }

                .mini-metric span {
                    font-size: 18px;
                    font-weight: 900;
                    color: var(--text-primary);
                }

                /* Topology Legend & Stats */
                .chakra-topology-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 32px 32px;
                }

                .topology-footer {
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.03);
                }

                .topology-legend {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 8px;
                    font-weight: 900;
                    color: var(--text-muted);
                    letter-spacing: 1.5px;
                }

                .legend-item .dot {
                    width: 4px; height: 4px;
                    border-radius: 50%;
                    box-shadow: 0 0 8px currentColor;
                }

                .topology-ovr-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    min-width: 100px;
                }

                .ovr-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    padding-bottom: 4px;
                    border-bottom: 1px solid rgba(255,255,255,0.02);
                }

                .ovr-row label {
                    font-size: 7px;
                    font-weight: 950;
                    color: var(--text-muted);
                    letter-spacing: 1px;
                }

                .ovr-value {
                    font-size: 14px;
                    font-weight: 900;
                    color: var(--text-primary);
                    font-family: var(--font-mono);
                }

                .ovr-value.highlight {
                    color: var(--accent-blue);
                }

                .ovr-value small {
                    font-size: 8px;
                    opacity: 0.5;
                    margin-left: 2px;
                }

                .scan-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(16, 185, 129, 0.05);
                    border: 1px solid rgba(16, 185, 129, 0.1);
                    color: var(--accent-green);
                    padding: 6px 14px;
                    border-radius: 30px;
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 1px;
                }

                .scan-line {
                    width: 6px; height: 6px;
                    background: var(--accent-green);
                    border-radius: 50%;
                    box-shadow: 0 0 10px var(--accent-green);
                    animation: pulse-dot 2s infinite;
                }

                /* Resources */
                .resource-list {
                    padding: 0 32px 32px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .resource-item {
                    display: grid;
                    grid-template-columns: 100px 1fr 60px;
                    align-items: center;
                    gap: 16px;
                }

                .res-label { font-size: 12px; font-weight: 700; color: var(--text-secondary); }
                .res-bar-bg { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; }
                .res-bar-fill { height: 100%; border-radius: 2px; box-shadow: 0 0 10px inherit; }
                .res-value { font-size: 13px; font-weight: 800; text-align: right; }

                /* Mix */
                .model-grid {
                    padding: 0 32px 32px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .model-chip {
                    background: var(--bg-glass);
                    border: 1px solid var(--border-glass);
                    padding: 10px 20px;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 800;
                    color: var(--text-primary);
                }

                .model-chip span {
                    color: var(--accent-blue);
                    margin-left: 10px;
                    opacity: 0.8;
                }

                /* Animations */
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .rotate-slow { animation: spin 25s linear infinite; transform-origin: center; }
                .rotate-fast { animation: spin 10s linear infinite; transform-origin: center; }
                
                .core-portal {
                    transform-origin: 150px 150px;
                }

                .data-pulse { animation: pulse-node 4s infinite; }

                @keyframes pulse-node {
                    0%, 100% { r: 3; opacity: 0.3; }
                    50% { r: 5; opacity: 1; }
                }

                @keyframes pulse-dot {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.3); opacity: 1; }
                }

                .loading-container {
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-primary);
                }

                .chakra-loader {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    margin-bottom: 32px;
                }

                .loader-ring {
                    position: absolute;
                    inset: 0;
                    border: 3px solid transparent;
                    border-top-color: var(--accent-blue);
                    border-radius: 50%;
                    animation: spin 1.5s cubic-bezier(0.6, -0.2, 0.4, 1.2) infinite;
                }

                .loader-ring:nth-child(2) {
                    inset: 12px;
                    border-top-color: var(--accent-purple);
                    animation-duration: 2s;
                    animation-direction: reverse;
                }

                .loader-ring:nth-child(3) {
                    inset: 24px;
                    border-top-color: var(--accent-cyan);
                    animation-duration: 2.5s;
                }

                .loader-core {
                    position: absolute;
                    inset: 45px;
                    background: var(--accent-blue);
                    border-radius: 50%;
                    box-shadow: 0 0 30px var(--accent-blue);
                    animation: pulse-dot 2s infinite;
                }

                .loading-text {
                    font-weight: 800;
                    letter-spacing: 4px;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    font-size: 11px;
                    animation: breathe 2s ease-in-out infinite;
                }

                @keyframes breathe { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }

                .animate-in {
                    animation: slideUp 1s cubic-bezier(0.19, 1, 0.22, 1) forwards;
                    opacity: 0;
                }

                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
