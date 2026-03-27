'use client';
import { useState, useEffect, useCallback } from 'react';
import { getAgents, createAgent, updateAgent, deleteAgent } from '@/lib/api';
import { useWebSocket } from '@/lib/websocket';

export default function AgentsPage() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editAgent, setEditAgent] = useState(null);
    const [form, setForm] = useState({
        name: '', description: '', system_prompt: 'You are a helpful AI assistant.',
        model: 'gpt-4o-mini', capabilities: '', max_tokens: 4096, temperature: 0.7,
    });
    const { subscribe } = useWebSocket();

    const loadAgents = useCallback(async () => {
        try {
            const data = await getAgents();
            setAgents(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadAgents(); }, [loadAgents]);
    useEffect(() => {
        const unsub = subscribe('agent:update', loadAgents);
        return unsub;
    }, [subscribe, loadAgents]);

    const openCreate = () => {
        setEditAgent(null);
        setForm({
            name: '', description: '', system_prompt: 'You are a helpful AI assistant.',
            model: 'gpt-4o-mini', capabilities: '', max_tokens: 4096, temperature: 0.7,
        });
        setShowModal(true);
    };

    const openEdit = (agent) => {
        setEditAgent(agent);
        setForm({
            name: agent.name,
            description: agent.description || '',
            system_prompt: agent.system_prompt || '',
            model: agent.model || 'gpt-4o-mini',
            capabilities: Array.isArray(agent.capabilities) ? agent.capabilities.join(', ') : '',
            max_tokens: agent.max_tokens || 4096,
            temperature: agent.temperature ?? 0.7,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            capabilities: form.capabilities.split(',').map(s => s.trim()).filter(Boolean),
            max_tokens: parseInt(form.max_tokens),
            temperature: parseFloat(form.temperature),
        };
        try {
            if (editAgent) {
                await updateAgent(editAgent.id, payload);
            } else {
                await createAgent(payload);
            }
            setShowModal(false);
            loadAgents();
        } catch (e) { alert(e.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this agent?')) return;
        try {
            await deleteAgent(id);
            loadAgents();
        } catch (e) { alert(e.message); }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ color: 'var(--text-secondary)' }}>Loading agents...</div>
        </div>
    );

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <h1>AI Agents</h1>
                    <p>Configure and manage your AI agent fleet</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>+ New Agent</button>
            </div>

            {agents.length === 0 ? (
                <div className="glass-card-static empty-state">
                    <div className="empty-icon" style={{ color: 'var(--accent-blue)', opacity: 0.4 }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /><circle cx="9" cy="14" r="1.5" fill="currentColor" /><circle cx="15" cy="14" r="1.5" fill="currentColor" />
                        </svg>
                    </div>
                    <h3 style={{ marginTop: '16px' }}>No Active Agents</h3>
                    <p>Your workspace is ready for neural deployment. Create your first agent.</p>
                    <button className="btn btn-primary" onClick={openCreate}>Initialize Agent</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
                    {agents.map(agent => (
                        <div key={agent.id} className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        background: 'linear-gradient(135deg, var(--accent-blue-glow), transparent)',
                                        border: '1px solid rgba(59, 130, 246, 0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--accent-blue)',
                                    }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 8V4H8" /><rect x="4" y="8" width="16" height="12" rx="2" /><circle cx="9" cy="14" r="1.5" fill="currentColor" /><circle cx="15" cy="14" r="1.5" fill="currentColor" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>{agent.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                            <span className={`status-badge status-${agent.status}`} style={{ fontSize: '10px', padding: '2px 8px' }}>{agent.status}</span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>ID: {agent.id.slice(0, 8)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {agent.description && (
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6', minHeight: '44px' }}>
                                    {agent.description}
                                </p>
                            )}

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                                <span style={{
                                    padding: '4px 12px', borderRadius: '8px', fontSize: '11px',
                                    background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-purple)', fontWeight: 700,
                                    border: '1px solid rgba(139, 92, 246, 0.15)', textTransform: 'uppercase'
                                }}>{agent.model}</span>
                                <span style={{
                                    padding: '4px 12px', borderRadius: '8px', fontSize: '11px',
                                    background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-secondary)', fontWeight: 700,
                                    border: '1px solid var(--border-glass)',
                                }}>TEMP: {agent.temperature}</span>
                                {(Array.isArray(agent.capabilities) ? agent.capabilities : []).map(cap => (
                                    <span key={cap} style={{
                                        padding: '4px 12px', borderRadius: '8px', fontSize: '11px',
                                        background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', fontWeight: 700,
                                        border: '1px solid rgba(16, 185, 129, 0.15)', textTransform: 'uppercase'
                                    }}>{cap}</span>
                                ))}
                            </div>

                            <div style={{
                                padding: '16px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)',
                                fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                                border: '1px solid var(--border-glass)',
                                maxHeight: '80px', overflow: 'hidden', marginBottom: '24px',
                                position: 'relative'
                            }}>
                                <div style={{ opacity: 0.8 }}>{agent.system_prompt}</div>
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '20px',
                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.3))'
                                }} />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(agent)} style={{ flex: 1, fontWeight: 700 }}>Configure</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(agent.id)} style={{ padding: '8px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', padding: '0', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-glass)' }}>
                            <h2 style={{ margin: 0, fontSize: '20px' }}>{editAgent ? 'Edit Neural Agent' : 'Initialize New Agent'}</h2>
                        </div>

                        <div style={{ padding: '32px', overflowY: 'auto', maxHeigh: 'calc(90vh - 140px)' }}>
                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                                    {/* Left Column */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label className="form-label">Agent Name *</label>
                                            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Analysis Unit" />
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label className="form-label">Description</label>
                                            <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Operational brief" />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label">Model</label>
                                                <select className="form-select" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}>
                                                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                                                    <option value="gpt-4o">GPT-4o</option>
                                                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                                </select>
                                            </div>
                                            <div className="form-group" style={{ margin: 0 }}>
                                                <label className="form-label">Temp ({form.temperature})</label>
                                                <input type="range" min="0" max="2" step="0.1" value={form.temperature}
                                                    onChange={e => setForm({ ...form, temperature: e.target.value })}
                                                    style={{ width: '100%', marginTop: '10px' }} />
                                            </div>
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <label className="form-label">Capabilities</label>
                                            <input className="form-input" value={form.capabilities} onChange={e => setForm({ ...form, capabilities: e.target.value })}
                                                placeholder="news, coding, search..." />
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div className="form-group" style={{ margin: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            <label className="form-label">System Prompt / Logic</label>
                                            <textarea className="form-textarea" value={form.system_prompt} onChange={e => setForm({ ...form, system_prompt: e.target.value })}
                                                placeholder="Define agent behavior..."
                                                style={{ flex: 1, minHeight: '220px', fontSize: '13px', lineHeight: '1.5' }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-actions" style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-glass)' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }}>
                                        {editAgent ? 'Save Changes' : 'Initialize Agent'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
