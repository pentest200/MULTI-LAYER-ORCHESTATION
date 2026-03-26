'use client';
import { useState, useEffect } from 'react';
import { getDashboardStats } from '@/lib/api';

export default function AnalyticsPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getDashboardStats();
                setStats(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Aggregating system intelligence...</div>;

    const totalTasks = stats.tasks.total || 1;
    const successRate = ((stats.tasks.completed / totalTasks) * 100).toFixed(1);

    return (
        <div>
            <div className="page-header">
                <h1>Analytics & Insights</h1>
                <p>Track system performance, agent usage, and cost efficiency.</p>
            </div>

            <div className="metrics-grid">
                <div className="glass-card metric-card metric-blue">
                    <div className="metric-label">Overall Success Rate</div>
                    <div className="metric-value">{successRate}%</div>
                </div>
                <div className="glass-card metric-card metric-purple">
                    <div className="metric-label">Avg Confidence</div>
                    <div className="metric-value">{Math.round(stats.system.avgConfidence * 100)}%</div>
                </div>
                <div className="glass-card metric-card metric-green">
                    <div className="metric-label">Agent Utilization</div>
                    <div className="metric-value">{stats.agents.total > 0 ? Math.round((stats.agents.active / stats.agents.total) * 100) : 0}%</div>
                </div>
            </div>

            <div className="glass-card-static" style={{ padding: '48px', textAlign: 'center', marginTop: '32px' }}>
                <div style={{ fontSize: '64px', marginBottom: '24px' }}>📈</div>
                <h3 style={{ fontSize: '24px', fontWeight: 800 }}>Intelligence Layer Active</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '16px auto', fontSize: '16px' }}>
                    The orchestrator is currently tracking <strong>{stats.tasks.total}</strong> task nodes across <strong>{stats.workflows.total}</strong> active workflows.
                    Detailed temporal analysis and reasoning audit logs are available in the Tasks drill-down views.
                </p>
                <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                    <div className="glass-card-static" style={{ padding: '16px 24px', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Spend</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-blue)' }}>${stats.system.totalCost}</div>
                    </div>
                    <div className="glass-card-static" style={{ padding: '16px 24px', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Active Nodes</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-purple)' }}>{stats.system.runningProcesses}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
