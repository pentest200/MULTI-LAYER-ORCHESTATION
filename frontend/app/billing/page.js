'use client';
import { useState, useEffect } from 'react';
import { getBillingUsage, getBillingStatus } from '@/lib/api';

export default function BillingPage() {
    const [usage, setUsage] = useState(null);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [u, s] = await Promise.all([getBillingUsage(), getBillingStatus()]);
                setUsage(u);
                setStatus(s);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Optimizing cost engine...</div>;

    const spendPercent = Math.min(100, (usage.usage.cost / usage.limit) * 100);

    return (
        <div>
            <div className="page-header">
                <h1>Billing & Usage</h1>
                <p>Manage your subscription and monitor real-time usage costs.</p>
            </div>

            <div className="data-grid data-grid-2">
                <div className="glass-card-static section-card">
                    <div className="section-header">
                        <h3 className="section-title">Current Plan</h3>
                        <span className="status-badge status-completed">{status.subscription.toUpperCase()}</span>
                    </div>
                    <div style={{ padding: '24px 0' }}>
                        <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px' }}>$29.00 <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>/ mo</span></div>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
                            Next billing date: <strong style={{ color: 'var(--text-primary)' }}>{new Date(status.next_billing).toLocaleDateString()}</strong>
                        </p>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%' }}>Manage Subscription</button>
                </div>

                <div className="glass-card-static section-card">
                    <div className="section-header">
                        <h3 className="section-title">Usage Limits</h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Auto-reset monthly</span>
                    </div>
                    <div style={{ padding: '24px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                            <span style={{ fontWeight: 600 }}>Token Spend</span>
                            <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>${usage.usage.cost} / ${usage.limit.toFixed(2)}</span>
                        </div>
                        <div className="progress-bar" style={{ height: '10px' }}>
                            <div className="progress-fill" style={{ width: `${spendPercent}%` }} />
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '16px', fontSize: '12px' }}>
                            Total tokens consumed: <strong style={{ color: 'var(--text-primary)' }}>{Number(usage.usage.tokens).toLocaleString()}</strong>
                        </p>
                    </div>
                </div>
            </div>

            <div className="glass-card-static section-card" style={{ marginTop: '32px' }}>
                <div className="section-header">
                    <h3 className="section-title">Usage History</h3>
                </div>
                {usage.history.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">💸</div>
                        <p>No usage recorded yet.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Task</th>
                                <th>Tokens</th>
                                <th>Estimated Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usage.history.map(log => (
                                <tr key={log.id}>
                                    <td style={{ color: 'var(--text-secondary)' }}>{new Date(log.created_at).toLocaleString()}</td>
                                    <td style={{ fontWeight: 600 }}>{log.task_title || 'Direct API Call'}</td>
                                    <td>{log.tokens_used.toLocaleString()}</td>
                                    <td style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>${log.cost.toFixed(6)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
