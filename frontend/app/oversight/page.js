'use client';
import { useState, useEffect, useCallback } from 'react';
import { getOversightQueue, approveOversight, rejectOversight } from '@/lib/api';
import { useWebSocket } from '@/lib/websocket';

export default function OversightPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [expandedId, setExpandedId] = useState(null);
    const [notes, setNotes] = useState('');
    const { subscribe } = useWebSocket();

    const loadQueue = useCallback(async () => {
        try {
            const data = await getOversightQueue(filter);
            setItems(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [filter]);

    useEffect(() => { loadQueue(); }, [loadQueue]);
    useEffect(() => {
        const unsubs = [
            subscribe('oversight:new', loadQueue),
            subscribe('oversight:resolved', loadQueue),
        ];
        return () => unsubs.forEach(u => u());
    }, [subscribe, loadQueue]);

    const handleApprove = async (id) => {
        try {
            await approveOversight(id, notes);
            setNotes('');
            setExpandedId(null);
            loadQueue();
        } catch (e) { alert(e.message); }
    };

    const handleReject = async (id) => {
        try {
            await rejectOversight(id, notes);
            setNotes('');
            setExpandedId(null);
            loadQueue();
        } catch (e) { alert(e.message); }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ color: 'var(--text-secondary)' }}>Loading oversight queue...</div>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <h1>Decision Center</h1>
                <p>Strategic review of autonomous agent operations requiring human confirmation</p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                {['pending', 'approved', 'rejected'].map(s => (
                    <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setFilter(s)} style={{ textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                        {s}
                    </button>
                ))}
            </div>

            {items.length === 0 ? (
                <div className="glass-card-static empty-state">
                    <div className="empty-icon" style={{ opacity: 0.3 }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                    </div>
                    <h3 style={{ marginTop: '16px' }}>Queue Terminal Clear</h3>
                    <p style={{ maxWidth: '300px', margin: '8px auto' }}>
                        {filter === 'pending' ? 'No operational decisions currently require manual intervention.' : `No items found in ${filter} logs.`}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {items.map(item => (
                        <div key={item.id} className="glass-card-static" style={{ padding: '24px', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <span className={`status-badge status-${item.status}`}>{item.status}</span>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: '12px', fontSize: '11px',
                                            background: 'var(--accent-purple-glow)', color: 'var(--accent-purple)', fontWeight: 500,
                                        }}>{item.type}</span>
                                    </div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{item.task_title || 'Untitled Task'}</h3>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        Agent: {item.agent_name || 'Default'} · {new Date(item.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Reason */}
                            <div style={{
                                padding: '16px 20px', borderRadius: '12px',
                                background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)',
                                fontSize: '14px', color: 'var(--accent-amber)', marginBottom: '24px',
                                display: 'flex', alignItems: 'center', gap: '12px'
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <span>{item.reason}</span>
                            </div>

                            {/* Task Output Preview */}
                            {item.task_output && (
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>
                                        AI OUTPUT
                                    </label>
                                    <div style={{
                                        padding: '16px', borderRadius: 'var(--radius-sm)',
                                        background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)',
                                        fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7',
                                        maxHeight: expandedId === item.id ? 'none' : '150px', overflow: 'hidden',
                                        position: 'relative',
                                        whiteSpace: 'pre-wrap',
                                    }}>
                                        {item.task_output}
                                        {expandedId !== item.id && item.task_output.length > 300 && (
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
                                                background: 'linear-gradient(transparent, rgba(18,20,30,0.95))',
                                            }} />
                                        )}
                                    </div>
                                    {item.task_output.length > 300 && (
                                        <button className="btn btn-ghost btn-sm" style={{ marginTop: '8px' }}
                                            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                                            {expandedId === item.id ? 'Collapse' : 'Expand'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            {item.status === 'pending' && (
                                <div>
                                    <div className="form-group" style={{ marginBottom: '12px' }}>
                                        <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)}
                                            placeholder="Optional reviewer notes..." style={{ minHeight: '60px' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button className="btn btn-success" onClick={() => handleApprove(item.id)} style={{ flex: 1 }}>
                                            Confirm Strategy
                                        </button>
                                        <button className="btn btn-danger" onClick={() => handleReject(item.id)} style={{ flex: 1 }}>
                                            Intercept / Revoke
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Resolved Info */}
                            {item.status !== 'pending' && item.reviewer_notes && (
                                <div style={{
                                    padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                                    background: 'var(--bg-glass)', fontSize: '13px', color: 'var(--text-secondary)',
                                }}>
                                    <strong>Reviewer Notes:</strong> {item.reviewer_notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
