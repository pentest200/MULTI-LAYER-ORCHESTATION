'use client';
import { useState, useEffect, useCallback } from 'react';
import TaskGraph from '@/components/TaskGraph';
import { getTasks, launchTask, cancelTask, getTaskLogs, getAgents, suggestInput } from '@/lib/api';
import { useWebSocket } from '@/lib/websocket';

export default function TasksPage() {
    const [tasks, setTasks] = useState([]);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showLogs, setShowLogs] = useState(null);
    const [showGraph, setShowGraph] = useState(null);
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState('');
    const [form, setForm] = useState({ title: '', description: '', input: '', agentId: '', priority: 'medium' });
    const { subscribe } = useWebSocket();

    const loadTasks = useCallback(async () => {
        try {
            const params = {};
            if (filter) params.status = filter;
            const data = await getTasks(params);
            setTasks(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [filter]);

    const loadAgents = useCallback(async () => {
        try {
            const data = await getAgents();
            setAgents(data);
            // Auto-select first agent if none selected
            if (data.length > 0 && !form.agentId) {
                setForm(prev => ({ ...prev, agentId: data[0].id }));
            }
        } catch { }
    }, [form.agentId]);

    useEffect(() => { loadTasks(); loadAgents(); }, [loadTasks, loadAgents]);
    useEffect(() => {
        const unsubs = [
            subscribe('task:update', loadTasks),
            subscribe('task:created', loadTasks),
        ];
        return () => unsubs.forEach(u => u());
    }, [subscribe, loadTasks]);

    const handleLaunch = async (e) => {
        e.preventDefault();
        try {
            await launchTask(form);
            setShowModal(false);
            setForm({ title: '', description: '', input: '', agentId: '', priority: 'medium' });
            loadTasks();
        } catch (e) { alert(e.message); }
    };

    const [suggesting, setSuggesting] = useState(false);
    const handleSuggest = async () => {
        if (!form.title) return alert('Enter a title first');
        setSuggesting(true);
        try {
            const { suggestion } = await suggestInput(form.title, form.description);
            setForm({ ...form, input: suggestion });
        } catch (e) { console.error(e); }
        finally { setSuggesting(false); }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (form.title && form.title.length > 5 && !form.input && !suggesting && showModal) {
                handleSuggest();
            }
        }, 1200);
        return () => clearTimeout(timer);
    }, [form.title, showModal]);

    const handleCancel = async (id) => {
        if (!confirm('Cancel this task?')) return;
        try { await cancelTask(id); loadTasks(); } catch (e) { alert(e.message); }
    };

    const viewLogs = async (taskId) => {
        try {
            const data = await getTaskLogs(taskId);
            setLogs(data);
            setShowLogs(taskId);
        } catch (e) { alert(e.message); }
    };

    const statusFilters = ['', 'pending', 'running', 'completed', 'failed', 'awaiting_approval', 'cancelled'];

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ color: 'var(--text-secondary)' }}>Loading tasks...</div>
        </div>
    );

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <h1>Task Control</h1>
                    <p>Launch, monitor, and manage AI agent tasks</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>⚡ Launch Task</button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {statusFilters.map(s => (
                    <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setFilter(s)}>
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {tasks.length === 0 ? (
                <div className="glass-card-static empty-state">
                    <div className="empty-icon">⚡</div>
                    <h3>No Tasks {filter ? `with status "${filter}"` : 'Yet'}</h3>
                    <p>Launch your first task to see AI agents in action</p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>Launch Task</button>
                </div>
            ) : (
                <div className="glass-card-static" style={{ overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Task</th>
                                <th>Agent</th>
                                <th>Priority</th>
                                <th>Progress</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => (
                                <tr key={task.id}>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{task.title}</div>
                                        {task.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{task.description.slice(0, 60)}</div>}
                                    </td>
                                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{task.agent_name || '—'}</td>
                                    <td>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                                            background: task.priority === 'critical' ? 'var(--accent-red-glow)' :
                                                task.priority === 'high' ? 'var(--accent-amber-glow)' : 'var(--bg-glass)',
                                            color: task.priority === 'critical' ? 'var(--accent-red)' :
                                                task.priority === 'high' ? 'var(--accent-amber)' : 'var(--text-secondary)',
                                        }}>{task.priority}</span>
                                    </td>
                                    <td style={{ minWidth: '100px' }}>
                                        <div className="progress-bar">
                                            <div className={`progress-fill ${task.status === 'completed' ? 'progress-complete' : task.status === 'failed' ? 'progress-error' : ''}`}
                                                style={{ width: `${task.progress || 0}%` }} />
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{task.progress || 0}%</div>
                                    </td>
                                    <td><span className={`status-badge status-${task.status}`}>{task.status}</span></td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                        {new Date(task.created_at).toLocaleString()}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button className="btn btn-primary btn-sm" onClick={() => setShowGraph(task.id)}>Flow</button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => viewLogs(task.id)}>Logs</button>
                                            {(task.status === 'pending' || task.status === 'running') && (
                                                <button className="btn btn-danger btn-sm" onClick={() => handleCancel(task.id)}>Cancel</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Launch Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Launch New Task</h2>
                        <form onSubmit={handleLaunch}>
                            <div className="form-group">
                                <label className="form-label">Task Title *</label>
                                <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                                    placeholder="e.g. Write blog post about AI trends" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Brief description" />
                            </div>
                            <div className="form-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label className="form-label" style={{ margin: 0 }}>Input / Instructions</label>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={handleSuggest}
                                        disabled={suggesting || !form.title}
                                        style={{ color: 'var(--accent-blue)', fontWeight: 700 }}
                                    >
                                        {suggesting ? '✨ Thinking...' : '✨ Auto-Fill Instructions'}
                                    </button>
                                </div>
                                <textarea className="form-textarea" value={form.input} onChange={e => setForm({ ...form, input: e.target.value })}
                                    placeholder="Detailed instructions for the AI agent..." style={{ minHeight: '120px' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Assign Agent</label>
                                    <select className="form-select" value={form.agentId} onChange={e => setForm({ ...form, agentId: e.target.value })}>
                                        <option value="">Auto (Default)</option>
                                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Priority</label>
                                    <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">⚡ Launch</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Logs Modal */}
            {showLogs && (
                <div className="modal-overlay" onClick={() => setShowLogs(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <h2>Task Logs</h2>
                        {logs.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)' }}>No logs available yet.</p>
                        ) : (
                            <div className="log-viewer">
                                {logs.map((log, i) => (
                                    <div key={i} className="log-entry">
                                        <span className="log-time">{new Date(log.created_at).toLocaleTimeString()}</span>
                                        <span className={`log-level ${log.level}`}>{log.level}</span>
                                        <span className="log-message">{log.message}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowLogs(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Flow Graph Modal */}
            {showGraph && (
                <div className="modal-overlay" onClick={() => setShowGraph(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
                        <h2>Execution Flow — Task {showGraph.slice(0, 8)}</h2>
                        <TaskGraph taskId={showGraph} />
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowGraph(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
