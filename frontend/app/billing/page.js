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
        <div className="billing-container">
            <header className="page-header animate-in">
                <div className="header-meta">
                    <div className="intel-segment">
                        <span className="intel-tag">FINANCE_CONTROL_v2.1</span>
                        <div className="pulse-line"></div>
                    </div>
                    <div className="system-status-pill">
                        <div className="status-dot"></div>
                        <span>ACCOUNT_VERIFIED_OVR</span>
                    </div>
                </div>
                <h1 className="dashboard-title">
                    <span className="title-alt">CHAKRAVIEW</span>
                    <span className="title-main">RESOURCE ENGINE</span>
                </h1>
                <div className="header-decoration"></div>
            </header>

            <div className="bento-grid">
                {/* Current Plan Card */}
                <div className="glass-card bento-item plan animate-in" style={{ animationDelay: '0.1s' }}>
                    <div className="card-header">
                        <div className="header-group">
                            <span className="header-icon blue">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            </span>
                            <h3>Current Architecture</h3>
                        </div>
                        <div className="tag-group">
                            <span className="tag status-active">{status.subscription.toUpperCase()}</span>
                            <span className="tag version">PRO_v3</span>
                        </div>
                    </div>

                    <div className="plan-details">
                        <div className="price-display">
                            <span className="currency">$</span>
                            <span className="amount">29</span>
                            <span className="period">/ CYCLE</span>
                        </div>
                        <div className="usage-summary">
                            <div className="summary-row">
                                <label>NEXT_SETTLEMENT</label>
                                <span>{new Date(status.next_billing).toLocaleDateString()}</span>
                            </div>
                            <div className="summary-row">
                                <label>AUTO_RENEW</label>
                                <span className="highlight-green">ENABLED</span>
                            </div>
                        </div>
                    </div>

                    <button className="btn-technical">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        RECONFIGURE_PLAN
                    </button>
                    <div className="card-accent"></div>
                </div>

                {/* Usage Limits Card */}
                <div className="glass-card bento-item limits animate-in" style={{ animationDelay: '0.2s' }}>
                    <div className="card-header">
                        <div className="header-group">
                            <span className="header-icon green">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                            </span>
                            <h3>Compute Allocation</h3>
                        </div>
                        <p>Real-time inference budget monitoring</p>
                    </div>

                    <div className="capacity-section">
                        <div className="capacity-meta">
                            <div className="meta-item">
                                <label>CURRENT_SPEND</label>
                                <span>${Number(usage.usage.cost || 0).toFixed(2)}</span>
                            </div>
                            <div className="meta-item text-right">
                                <label>MONTHLY_MAX</label>
                                <span>${Number(usage.limit || 0).toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="capacity-bar-container">
                            <div className="bar-fill" style={{ width: `${spendPercent}%` }}>
                                <div className="bar-glow"></div>
                            </div>
                        </div>
                        <div className="capacity-tokens">
                            <div className="token-icon">🧠</div>
                            <div className="token-info">
                                <label>TOKEN_DENSITY_CONSUMED</label>
                                <span>{Number(usage.usage.tokens).toLocaleString()} CTX</span>
                            </div>
                        </div>
                    </div>
                    <div className="card-accent" style={{ background: 'var(--accent-green)' }}></div>
                </div>

                {/* AI Spend Prediction */}
                <div className="glass-card bento-item forecast animate-in" style={{ animationDelay: '0.3s' }}>
                    <div className="card-header">
                        <div className="header-group">
                            <span className="header-icon purple">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                            </span>
                            <h3>Spend Forecast</h3>
                        </div>
                        <p>AI-calculated trajectory for current cycle</p>
                    </div>
                    <div className="forecast-display">
                        <div className="predicted-amount">${(Number(usage.usage.cost || 0) * 1.4).toFixed(2)}</div>
                        <div className="forecast-tag">PROJECTED_END_OF_CYCLE</div>
                        <div className="velocity-monitor">
                            <div className="monitor-line">
                                <div className="inner-pulse"></div>
                            </div>
                            <span>TRAJECTORY_STABLE</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inference Mix (New Feature) */}
            <div className="glass-card section-card animate-in" style={{ marginTop: '32px', animationDelay: '0.4s' }}>
                <div className="card-header-main">
                    <div className="header-content">
                        <h3>Inference Distribution</h3>
                        <p>Cost allocation across neural model architectures</p>
                    </div>
                </div>
                <div className="model-mix-grid">
                    <div className="mix-item">
                        <div className="mix-header">
                            <span className="model-name">GPT-4o (Omni)</span>
                            <span className="mix-pct">65%</span>
                        </div>
                        <div className="mix-bar"><div className="mix-fill" style={{ width: '65%', background: 'var(--accent-blue)' }}></div></div>
                    </div>
                    <div className="mix-item">
                        <div className="mix-header">
                            <span className="model-name">O1 (Reasoning)</span>
                            <span className="mix-pct">25%</span>
                        </div>
                        <div className="mix-bar"><div className="mix-fill" style={{ width: '25%', background: 'var(--accent-purple)' }}></div></div>
                    </div>
                    <div className="mix-item">
                        <div className="mix-header">
                            <span className="model-name">GPT-4-Turbo</span>
                            <span className="mix-pct">10%</span>
                        </div>
                        <div className="mix-bar"><div className="mix-fill" style={{ width: '10%', background: 'var(--accent-green)' }}></div></div>
                    </div>
                </div>
            </div>

            <div className="glass-card section-card animate-in" style={{ marginTop: '32px', animationDelay: '0.5s' }}>
                <div className="card-header-main">
                    <div className="header-content">
                        <h3>Transaction Archive</h3>
                        <p>Historical resource consumption and settlement history</p>
                    </div>
                </div>
                {usage.history.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon-wrapper">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                        </div>
                        <p>ZERO_TRANSACTIONS_DETECTED</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="technical-table">
                            <thead>
                                <tr>
                                    <th>TIMESTAMP</th>
                                    <th>DEPLOYMENT_TASK</th>
                                    <th>CTX_UNITS</th>
                                    <th>EST_SETTLEMENT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usage.history.map(log => (
                                    <tr key={log.id}>
                                        <td className="mono">{new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                                        <td className="bold">{log.task_title || 'KERNEL_DIRECT'}</td>
                                        <td className="mono">{(log.tokens_used || 0).toLocaleString()}</td>
                                        <td className="price-tag">${Number(log.cost || 0).toFixed(4)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style jsx>{`
                .billing-container {
                    padding: 40px;
                    max-width: 1500px;
                    margin: 0 auto;
                }

                /* Reuse Page Header Styles */
                .page-header { margin-bottom: 60px; position: relative; }
                .header-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .intel-segment { display: flex; align-items: center; gap: 15px; }
                .intel-tag { font-size: 10px; font-weight: 950; letter-spacing: 4px; color: var(--accent-blue); background: rgba(59, 130, 246, 0.1); padding: 4px 12px; border-radius: 4px; border-left: 3px solid var(--accent-blue); }
                .pulse-line { width: 100px; height: 1px; background: linear-gradient(90deg, var(--accent-blue), transparent); position: relative; }
                .pulse-line::after { content: ''; position: absolute; left: 0; top: -1px; width: 4px; height: 3px; background: white; box-shadow: 0 0 10px white; animation: pulse-move 3s infinite linear; }
                @keyframes pulse-move { 0% { left: 0; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { left: 100%; opacity: 0; } }
                
                .dashboard-title { font-size: 72px; font-weight: 950; letter-spacing: -4px; line-height: 0.9; margin: 0; display: flex; flex-direction: column; }
                .title-alt { font-size: 16px; letter-spacing: 12px; color: var(--text-muted); font-weight: 800; margin-bottom: 8px; padding-left: 4px; }
                .title-main { background: linear-gradient(to bottom, #fff 30%, var(--accent-blue) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                
                .header-decoration { position: absolute; bottom: -20px; left: 0; width: 100%; height: 1px; background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 100%); }
                .system-status-pill { display: flex; align-items: center; gap: 12px; font-size: 10px; font-weight: 900; color: var(--accent-green); background: rgba(16, 185, 129, 0.05); padding: 10px 20px; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.1); letter-spacing: 1.5px; }
                .status-dot { width: 6px; height: 6px; background: var(--accent-green); border-radius: 50%; box-shadow: 0 0 15px var(--accent-green); animation: pulse-dot 2s infinite; }
                @keyframes pulse-dot { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.3); opacity: 1; } }

                .bento-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                    margin-bottom: 40px;
                }

                .bento-item {
                    min-height: 280px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .card-header { padding: 32px 32px 0; }
                .header-group { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
                .header-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); }
                .header-icon.blue { color: var(--accent-blue); }
                .header-icon.green { color: var(--accent-green); }
                .header-icon.purple { color: var(--accent-purple); }
                
                .card-header h3 { font-size: 20px; font-weight: 850; margin: 0; color: #fff; }
                .card-header p { font-size: 13px; color: var(--text-muted); margin: 4px 0 0; }

                .tag-group { display: flex; gap: 8px; margin-top: 12px; }
                .tag { font-size: 9px; font-weight: 900; padding: 4px 10px; border-radius: 4px; letter-spacing: 1px; }
                .tag.status-active { background: rgba(16, 185, 129, 0.1); color: var(--accent-green); border: 1px solid rgba(16, 185, 129, 0.1); }
                .tag.version { background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.05); }

                /* Plan Specifics */
                .plan-details { padding: 0 32px; }
                .price-display { display: flex; align-items: baseline; gap: 4px; margin-bottom: 20px; }
                .currency { font-size: 24px; font-weight: 800; color: var(--text-muted); }
                .amount { font-size: 64px; font-weight: 950; color: #fff; letter-spacing: -4px; line-height: 1; }
                .period { font-size: 14px; font-weight: 800; color: var(--text-muted); letter-spacing: 2px; }

                .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; }
                .summary-row label { color: var(--text-muted); font-weight: 900; letter-spacing: 1px; }
                .summary-row span { font-weight: 800; color: #fff; }
                .highlight-green { color: var(--accent-green) !important; }

                .btn-technical {
                    margin: 0 32px 32px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: #fff;
                    padding: 14px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 950;
                    letter-spacing: 2px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    transition: all 0.3s;
                    cursor: pointer;
                }

                .btn-technical:hover {
                    background: var(--accent-blue);
                    border-color: var(--accent-blue);
                    color: #000;
                    box-shadow: 0 0 30px rgba(59, 130, 246, 0.4);
                }

                /* Capacity / Limits */
                .capacity-section { padding: 0 32px 32px; }
                .capacity-meta { display: flex; justify-content: space-between; margin-bottom: 12px; }
                .meta-item label { display: block; font-size: 8px; font-weight: 950; color: var(--text-muted); margin-bottom: 4px; }
                .meta-item span { font-size: 18px; font-weight: 950; color: #fff; }
                
                .capacity-bar-container { height: 12px; background: rgba(255,255,255,0.04); border-radius: 6px; position: relative; overflow: hidden; margin-bottom: 24px; }
                .bar-fill { height: 100%; background: var(--accent-blue); border-radius: 6px; transition: width 1s cubic-bezier(0.19, 1, 0.22, 1); position: relative; }
                .bar-glow { position: absolute; top: 0; right: 0; bottom: 0; width: 40px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4)); animation: light-scan 2s infinite linear; }
                @keyframes light-scan { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }

                .capacity-tokens { display: flex; gap: 16px; align-items: center; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); }
                .token-icon { font-size: 20px; filter: grayscale(1); opacity: 0.5; }
                .token-info label { display: block; font-size: 8px; font-weight: 950; color: var(--text-muted); margin-bottom: 2px; }
                .token-info span { font-size: 13px; font-weight: 900; color: #fff; }

                /* Forecast */
                .forecast-display { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 32px 32px; }
                .predicted-amount { font-size: 48px; font-weight: 950; color: var(--accent-purple); letter-spacing: -2px; line-height: 1; }
                .forecast-tag { font-size: 9px; font-weight: 950; color: var(--text-muted); margin-top: 8px; letter-spacing: 2px; }
                .velocity-monitor { display: flex; align-items: center; gap: 12px; margin-top: 32px; width: 100%; font-size: 9px; font-weight: 950; color: var(--text-muted); letter-spacing: 1px; }
                .monitor-line { flex: 1; height: 1px; background: rgba(139, 92, 246, 0.2); position: relative; }
                .inner-pulse { position: absolute; left: 0; top: -1px; width: 40px; height: 3px; background: var(--accent-purple); box-shadow: 0 0 10px var(--accent-purple); animation: pulse-move 2s infinite linear; }

                /* Mix Grid */
                .card-header-main { padding: 32px 32px 24px; display: flex; justify-content: space-between; align-items: center; }
                .card-header-main h3 { font-size: 20px; font-weight: 900; margin: 0; color: #fff; }
                .card-header-main p { font-size: 13px; color: var(--text-muted); margin: 4px 0 0; }
                
                .model-mix-grid { padding: 0 32px 32px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
                .mix-item { display: flex; flex-direction: column; gap: 12px; }
                .mix-header { display: flex; justify-content: space-between; font-size: 11px; font-weight: 900; letter-spacing: 1px; }
                .model-name { color: var(--text-muted); }
                .mix-pct { color: #fff; }
                .mix-bar { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
                .mix-fill { height: 100%; border-radius: 2px; }

                /* Table */
                .table-container { padding: 0 32px 24px; }
                .technical-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
                .technical-table th { text-align: left; font-size: 9px; font-weight: 950; color: var(--text-muted); letter-spacing: 2px; padding: 0 16px 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .technical-table td { padding: 16px; background: rgba(255,255,255,0.02); }
                .technical-table tr:hover td { background: rgba(255,255,255,0.04); }
                .technical-table td:first-child { border-radius: 8px 0 0 8px; }
                .technical-table td:last-child { border-radius: 0 8px 8px 0; }
                
                .mono { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }
                .bold { font-weight: 800; color: #fff; font-size: 14px; }
                .price-tag { font-family: var(--font-mono); font-weight: 900; color: var(--accent-blue); }

                .empty-state { padding: 80px; text-align: center; }
                .empty-icon-wrapper { color: var(--text-muted); opacity: 0.2; margin-bottom: 24px; }
                .empty-state p { font-size: 11px; font-weight: 950; color: var(--text-muted); letter-spacing: 4px; }

                .card-accent { position: absolute; top: 0; right: 0; width: 40px; height: 1px; background: var(--accent-blue); box-shadow: 0 0 20px currentColor; }
                
                .animate-in { animation: slideUp 1s cubic-bezier(0.19, 1, 0.22, 1) forwards; opacity: 0; }
                @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}
