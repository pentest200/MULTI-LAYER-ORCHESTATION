'use client';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showModal]);

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
            {showModal && createPortal(
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal agent-init-modal animate-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-technical-header">
                            <div className="title-group">
                                <span className="m-tag">{editAgent ? 'EDIT_NEURAL_v2' : 'INIT_AGENT_v4'}</span>
                                <h2>{editAgent ? 'Edit Neural Operative' : 'Initialize New Operative'}</h2>
                            </div>
                            <button className="close-x" onClick={() => setShowModal(false)}>&times;</button>
                        </div>

                        <div className="modal-body agent-form-body">
                            <form id="agent-form" onSubmit={handleSubmit} className="technical-form">
                                <div className="form-grid">
                                    <div className="form-row-2">
                                        <div className="form-item">
                                            <label>OPERATIVE_NAME_TAG *</label>
                                            <input className="tech-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Analysis Unit" />
                                        </div>
                                        <div className="form-item">
                                            <label>OPERATIONAL_BRIEF</label>
                                            <input className="tech-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Mission context" />
                                        </div>
                                    </div>
                                    <div className="form-row-2">
                                        <div className="form-item">
                                            <label>NEURAL_ARCHITECTURE</label>
                                            <select className="tech-select" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}>
                                                <option value="gpt-4o">GPT-4o</option>
                                                <option value="gpt-4o-mini">GPT-4o Mini</option>
                                                <option value="o1">O1_HEAVY</option>
                                                <option value="o1-mini">O1_MINI</option>
                                                <option value="gpt-4-turbo">GPT-4_TURBO</option>
                                            </select>
                                        </div>
                                        <div className="form-item">
                                            <label>COGNITIVE_TEMP ({form.temperature})</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <input type="range" min="0" max="2" step="0.1" value={form.temperature}
                                                    onChange={e => setForm({ ...form, temperature: e.target.value })}
                                                    className="tech-range" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-item full">
                                        <label>SUBSYSTEM_CAPABILITIES</label>
                                        <input className="tech-input" value={form.capabilities} onChange={e => setForm({ ...form, capabilities: e.target.value })}
                                            placeholder="news, coding, searching, creative..." />
                                    </div>
                                    <div className="form-item full">
                                        <label>PRIMARY_LOGIC_DIRECTIVE</label>
                                        <textarea className="tech-textarea" value={form.system_prompt} onChange={e => setForm({ ...form, system_prompt: e.target.value })}
                                            placeholder="Define core agent behavior and constraints..." />
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-technical-actions">
                            <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>ABORT_INIT</button>
                            <button type="submit" form="agent-form" className="btn-launch-sequence">COMMIT_NEURAL_STAKE</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <style jsx global>{`
                .modal-overlay { position: fixed; inset: 0; width: 100vw; height: 100vh; background: rgba(5, 6, 10, 0.98); backdrop-filter: blur(24px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 24px; overflow: hidden; }
                .modal { background: #0d0f17; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; box-shadow: 0 40px 120px rgba(0,0,0,0.95); width: 100%; display: flex; flex-direction: column; overflow: hidden; }
                .animate-in { animation: scaleIn 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
                @keyframes scaleIn { from { transform: scale(0.95) translateY(-12px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }

                .modal-technical-header { background: rgba(255,255,255,0.02); padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
                .m-tag { font-size: 9px; font-weight: 950; letter-spacing: 5px; color: var(--accent-blue); display: block; margin-bottom: 6px; }
                .modal-technical-header h2 { font-size: 20px; font-weight: 950; color: #fff; margin: 0; letter-spacing: -0.5px; }
                .close-x { background: transparent; border: none; color: var(--text-muted); font-size: 24px; cursor: pointer; line-height: 1; padding: 8px; transition: all 0.2s; flex-shrink: 0; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; }
                .close-x:hover { color: #fff; background: rgba(255,255,255,0.06); }

                .modal-body { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 0; }
                .agent-form-body { max-height: calc(100vh - 120px); }
                .modal-technical-actions { padding: 24px 32px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; gap: 16px; flex-shrink: 0; background: rgba(13, 15, 23, 0.8); }
                .agent-init-modal { max-width: 760px; margin: auto; }
                .technical-form { padding: 32px 40px; }
                .form-grid { display: flex; flex-direction: column; gap: 24px; }
                .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                .form-item.full { width: 100%; }
                .form-item label { display: block; font-size: 9px; font-weight: 950; color: var(--text-muted); opacity: 0.8; letter-spacing: 2.5px; margin-bottom: 12px; text-transform: uppercase; }

                .tech-input, .tech-select, .tech-textarea { width: 100%; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 14px 18px; color: #fff; font-size: 14px; font-weight: 500; outline: none; transition: all 0.2s; font-family: inherit; }
                .tech-input:focus, .tech-select:focus, .tech-textarea:focus { border-color: var(--accent-blue); background: rgba(59, 130, 246, 0.05); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15); }
                .tech-select option { background: #05060a; color: #fff; }
                .tech-textarea { min-height: 120px; max-height: 200px; resize: vertical; font-family: var(--font-mono); font-size: 13px; line-height: 1.6; }
                .tech-range { width: 100%; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; outline: none; appearance: none; margin-top: 8px; }
                .tech-range::-webkit-slider-thumb { appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--accent-blue); cursor: pointer; box-shadow: 0 0 12px var(--accent-blue); }

                .btn-cancel { flex: 1; height: 48px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: var(--text-muted); font-weight: 950; font-size: 10px; letter-spacing: 3px; cursor: pointer; transition: all 0.2s; }
                .btn-cancel:hover { background: rgba(255,255,255,0.06); color: #fff; }
                .btn-launch-sequence { flex: 2; height: 48px; background: var(--accent-blue); border: none; border-radius: 8px; color: #000; font-weight: 950; font-size: 10px; letter-spacing: 3px; cursor: pointer; transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1); }
                .btn-launch-sequence:hover { transform: translateY(-2px); box-shadow: 0 0 40px rgba(59, 130, 246, 0.5); }

                .status-badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 8px; font-size: 10px; font-weight: 700; }
                .status-active { background: rgba(16, 185, 129, 0.1); color: var(--accent-green); border: 1px solid rgba(16, 185, 129, 0.2); }
                .status-idle { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
            `}</style>

        </div>
    );
}
