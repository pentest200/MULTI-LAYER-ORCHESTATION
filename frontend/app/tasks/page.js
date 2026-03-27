'use client';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
    }, [form.title, showModal, handleSuggest, suggesting]);

    useEffect(() => {
        if (showModal || showLogs || showGraph) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showModal, showLogs, showGraph]);

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
        <div className="tasks-container">
            <header className="page-header animate-in">
                <div className="header-meta">
                    <div className="intel-segment">
                        <span className="intel-tag">TASK_CONTROL_v3.4</span>
                        <div className="pulse-line"></div>
                    </div>
                    <div className="system-status-pill">
                        <div className="status-dot"></div>
                        <span>KERNEL_READY_ORCH</span>
                    </div>
                </div>
                <h1 className="dashboard-title">
                    <span className="title-alt">CHAKRAVIEW</span>
                    <span className="title-main">MISSION HUB</span>
                </h1>
                <div className="header-decoration"></div>
            </header>

            {/* Operational Metrics Sub-Header */}
            <div className="ops-metrics-row animate-in" style={{ animationDelay: '0.1s' }}>
                <div className="metric-box">
                    <div className="metric-icon blue">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" /></svg>
                    </div>
                    <div className="metric-data">
                        <label>MISSION_VOLUME</label>
                        <span>{tasks.length} <small>TOTAL</small></span>
                    </div>
                </div>
                <div className="metric-box">
                    <div className="metric-icon green">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    </div>
                    <div className="metric-data">
                        <label>SUCCESS_INDEX</label>
                        <span>{Math.round((tasks.filter(t => t.status === 'completed').length / (tasks.length || 1)) * 100)}%</span>
                    </div>
                </div>
                <div className="metric-box">
                    <div className="metric-icon purple">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    </div>
                    <div className="metric-data">
                        <label>ACTIVE_NODES</label>
                        <span>{tasks.filter(t => t.status === 'running').length} <small>LIVE</small></span>
                    </div>
                </div>
                <button className="launch-mission-btn" onClick={() => setShowModal(true)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    INIT_NEW_MISSION
                </button>
            </div>

            {/* Filters */}
            <div className="filters-container animate-in" style={{ animationDelay: '0.2s' }}>
                <div className="filter-group">
                    {statusFilters.map(s => (
                        <button key={s} className={`filter-chip ${filter === s ? 'active' : ''}`}
                            onClick={() => setFilter(s)}>
                            {s ? s.replace('_', ' ').toUpperCase() : 'ALL_MESSAGES'}
                        </button>
                    ))}
                </div>
            </div>

            {tasks.length === 0 ? (
                <div className="glass-card empty-state-hub animate-in" style={{ animationDelay: '0.3s' }}>
                    <div className="empty-visual-container">
                        <div className="pulse-ring"></div>
                        <div className="pulse-ring delay-1"></div>
                        <div className="empty-icon-wrapper">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
                                <polyline points="7.5 19.79 7.5 14.6 3 12" />
                            </svg>
                        </div>
                    </div>
                    <div className="empty-content">
                        <label className="m-tag">{filter ? `FILTERED_PROTOCOL_${filter.toUpperCase()}` : 'CORE_SYSTEM_READY'}</label>
                        <h3>{filter ? 'NO_MATCHING_INTEL' : 'MISSION_DECK_VACANT'}</h3>
                        <p>{filter ? `No tasks found matching the ${filter} status protocol.` : 'Orchestration core idle. Awaiting user-defined mission parameters.'}</p>

                        <div className="empty-actions">
                            <button className="btn-technical primary-glow" onClick={() => setShowModal(true)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                BOOT_MISSION_INITIATOR
                            </button>
                            {filter && (
                                <button className="btn-technical-secondary" onClick={() => setFilter('')}>
                                    RESET_DRILLED_FILTERS
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass-card section-card-hub animate-in" style={{ animationDelay: '0.3s' }}>
                    <div className="table-wrapper">
                        <table className="technical-hub-table">
                            <thead>
                                <tr>
                                    <th>MISSION_TAG</th>
                                    <th>OPERATIVE_ID</th>
                                    <th>PRIORITY_LVL</th>
                                    <th>COGNITIVE_LOAD</th>
                                    <th>STATUS_REF</th>
                                    <th>ACTIONS_MGR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map(task => (
                                    <tr key={task.id} className={`status-row-${task.status}`}>
                                        <td>
                                            <div className="mission-title" title={task.description}>{task.title}</div>
                                            <div className="mission-id">ID_{task.id.slice(0, 8).toUpperCase()}</div>
                                        </td>
                                        <td>
                                            <div className="operative-badge">
                                                <div className="op-dot"></div>
                                                {task.agent_name || 'AUTO_KERNEL'}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`prio-tag prio-${task.priority}`}>
                                                {task.priority.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="progress-hub-container">
                                                <div className="progress-hub-meta">
                                                    <span>{task.progress || 0}%</span>
                                                    <label>LOAD_INDEX</label>
                                                </div>
                                                <div className="progress-hub-bar">
                                                    <div className={`fill fill-${task.status}`} style={{ width: `${task.progress || 0}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`status-hub-badge badge-${task.status}`}>
                                                <div className="dot"></div>
                                                {task.status.toUpperCase()}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="hub-actions">
                                                <button className="action-btn flow-btn" title="View flow" onClick={() => setShowGraph(task.id)}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                                                </button>
                                                <button className="action-btn log-btn" title="View logs" onClick={() => viewLogs(task.id)}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                                </button>
                                                {(task.status === 'pending' || task.status === 'running') && (
                                                    <button className="action-btn kill-btn" title="Abort mission" onClick={() => handleCancel(task.id)}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Launch Modal */}
            {showModal && createPortal(
                <div className="modal-overlay modal-overlay-top" onClick={() => setShowModal(false)}>
                    <div className="modal technical-init-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-technical-header">
                            <div className="title-group">
                                <span className="m-tag">INIT_SEQUENCE_v4</span>
                                <h2>Mission Initialization</h2>
                            </div>
                            <button className="close-x" onClick={() => setShowModal(false)}>&times;</button>
                        </div>

                        <div className="modal-body">
                            <form id="launch-form" onSubmit={handleLaunch} className="technical-form">
                                <div className="form-grid">
                                    <div className="form-item full">
                                        <label>MISSION_OBJECTIVE_TAG</label>
                                        <input className="tech-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                                            placeholder="Deploy secondary neural cluster..." />
                                    </div>
                                    <div className="form-item full">
                                        <label>MISSION_PARAMETERS (OPTIONAL)</label>
                                        <input className="tech-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                            placeholder="Brief contextual directive" />
                                    </div>
                                    <div className="form-item full">
                                        <div className="split-label">
                                            <label>COGNITIVE_DIRECTIVES</label>
                                            <button type="button" className="ai-assist-btn" onClick={handleSuggest} disabled={suggesting || !form.title}>
                                                {suggesting ? 'SYNTHESIZING...' : 'AI_AUTOFILL_OK'}
                                            </button>
                                        </div>
                                        <textarea className="tech-textarea" value={form.input} onChange={e => setForm({ ...form, input: e.target.value })}
                                            placeholder="Enter detailed execution instructions..." />
                                    </div>
                                    <div className="form-row-2">
                                        <div className="form-item">
                                            <label>OPERATIVE_ASSIGNMENT</label>
                                            <select className="tech-select" value={form.agentId} onChange={e => setForm({ ...form, agentId: e.target.value })}>
                                                <option value="">AUTO_KERNEL_SELECT</option>
                                                {agents.map(a => <option key={a.id} value={a.id}>{a.name.toUpperCase()}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-item">
                                            <label>THREAT_PRIORITY_LVL</label>
                                            <select className="tech-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                                <option value="low">LOW</option>
                                                <option value="medium">MEDIUM</option>
                                                <option value="high">HIGH</option>
                                                <option value="critical">CRITICAL_V1</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-technical-actions">
                            <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>ABORT_SEQ</button>
                            <button type="submit" form="launch-form" className="btn-launch-sequence">EXECUTE_DEPLOYMENT_OK</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Mission Logs Modal */}
            {showLogs && createPortal(
                <div className="modal-overlay" onClick={() => setShowLogs(null)}>
                    <div className="modal info-modal logs-modal animate-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-technical-header">
                            <div className="title-group">
                                <span className="m-tag">LOG_MANIFEST_{showLogs.slice(0, 8).toUpperCase()}</span>
                                <h2>Mission Manifest</h2>
                            </div>
                            <button className="close-x" onClick={() => setShowLogs(null)}>&times;</button>
                        </div>
                        <div className="modal-body log-body">
                            {logs.length === 0 ? (
                                <div className="empty-logs">ZERO_MANIFEST_DATA_RETURNED</div>
                            ) : (
                                <div className="technical-log-container">
                                    {logs.map((log, i) => (
                                        <div key={i} className="tech-log-row">
                                            <span className="log-ts">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                                            <span className={`log-lvl lvl-${log.level.toLowerCase()}`}>{log.level.toUpperCase()}</span>
                                            <span className="log-msg">{log.message}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-technical-actions">
                            <button className="btn-cancel" onClick={() => setShowLogs(null)}>DISMISS_MANIFEST</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Execution Topology Modal */}
            {showGraph && createPortal(
                <div className="modal-overlay" onClick={() => setShowGraph(null)}>
                    <div className="modal info-modal flow-modal animate-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-technical-header">
                            <div className="title-group">
                                <span className="m-tag">DEPLOY_FLOW_OVR</span>
                                <h2>Execution Topology</h2>
                            </div>
                            <button className="close-x" onClick={() => setShowGraph(null)}>&times;</button>
                        </div>
                        <div className="modal-body flow-body">
                            <div className="flow-graph-wrapper">
                                <TaskGraph taskId={showGraph} />
                            </div>
                        </div>
                        <div className="modal-technical-actions">
                            <button className="btn-cancel" onClick={() => setShowGraph(null)}>CLOSE_TOPOLOGY</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <style jsx global>{`
                .tasks-container { min-height: 100vh; }

                /* Header & Meta */
                .page-header { margin-bottom: 40px; }
                .header-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .intel-segment { display: flex; align-items: center; gap: 15px; }
                .intel-tag { font-size: 10px; font-weight: 950; letter-spacing: 4px; color: var(--accent-blue); background: rgba(59, 130, 246, 0.1); padding: 4px 12px; border-radius: 4px; border-left: 3px solid var(--accent-blue); }
                .pulse-line { width: 100px; height: 1px; background: linear-gradient(90deg, var(--accent-blue), transparent); position: relative; }
                .pulse-line::after { content: ''; position: absolute; left: 0; top: -1px; width: 4px; height: 3px; background: white; box-shadow: 0 0 10px white; animation: pulse-move 3s infinite linear; }
                @keyframes pulse-move { 0% { left: 0; opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { left: 100%; opacity: 0; } }

                .dashboard-title { font-size: 64px; font-weight: 950; letter-spacing: -4px; line-height: 0.9; margin: 0; display: flex; flex-direction: column; }
                .title-alt { font-size: 14px; letter-spacing: 12px; color: var(--text-muted); font-weight: 800; margin-bottom: 8px; padding-left: 4px; }
                .title-main { background: linear-gradient(to bottom, #fff 30%, var(--accent-blue) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .system-status-pill { display: flex; align-items: center; gap: 10px; font-size: 10px; font-weight: 900; color: var(--accent-green); background: rgba(16, 185, 129, 0.05); padding: 8px 16px; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.1); }
                .status-dot { width: 6px; height: 6px; background: var(--accent-green); border-radius: 50%; box-shadow: 0 0 10px var(--accent-green); animation: pulse-dot 2s infinite; }

                /* Ops Metrics Bar */
                .ops-metrics-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
                .metric-box { background: var(--bg-glass); border: 1px solid rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; display: flex; align-items: center; gap: 20px; backdrop-filter: blur(24px); }
                .metric-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); }
                .metric-icon.blue { color: var(--accent-blue); }
                .metric-icon.green { color: var(--accent-green); }
                .metric-icon.purple { color: var(--accent-purple); }
                .metric-data label { display: block; font-size: 9px; font-weight: 950; color: var(--text-muted); letter-spacing: 1px; margin-bottom: 4px; }
                .metric-data span { font-size: 24px; font-weight: 950; color: #fff; letter-spacing: -1px; }
                .metric-data span small { font-size: 10px; color: var(--text-muted); }

                .launch-mission-btn { background: var(--accent-blue); border: none; border-radius: 12px; color: #000; font-weight: 950; font-size: 12px; letter-spacing: 2px; display: flex; align-items: center; justify-content: center; gap: 12px; cursor: pointer; transition: all 0.3s; box-shadow: 0 0 20px rgba(59, 130, 246, 0.2); }
                .launch-mission-btn:hover { transform: translateY(-2px); box-shadow: 0 0 40px rgba(59, 130, 246, 0.4); }

                /* Filters */
                .filters-container { margin-bottom: 32px; }
                .filter-group { display: flex; gap: 12px; flex-wrap: wrap; }
                .filter-chip { background: transparent; border: 1px solid rgba(255,255,255,0.08); color: var(--text-muted); padding: 8px 16px; border-radius: 6px; font-size: 10px; font-weight: 950; letter-spacing: 2px; cursor: pointer; transition: all 0.3s; }
                .filter-chip:hover { border-color: rgba(255,255,255,0.3); color: #fff; }
                .filter-chip.active { background: #fff; color: #000; border-color: #fff; }

                /* Mission Hub Table */
                .technical-hub-table { width: 100%; border-collapse: separate; border-spacing: 0 12px; margin-top: -12px; }
                .technical-hub-table th { text-align: left; font-size: 9px; font-weight: 950; color: var(--text-muted); letter-spacing: 3px; padding: 0 24px 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .technical-hub-table td { padding: 24px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.03); }
                .technical-hub-table tr:hover td { background: rgba(255,255,255,0.04); }
                .technical-hub-table td:first-child { border-radius: 12px 0 0 12px; border-left: 1px solid rgba(255,255,255,0.03); }
                .technical-hub-table td:last-child { border-radius: 0 12px 12px 0; border-right: 1px solid rgba(255,255,255,0.03); }

                .mission-title { font-size: 13px; font-weight: 900; color: #fff; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 350px; }
                .mission-id { font-size: 8px; font-family: var(--font-mono); color: var(--accent-blue); opacity: 0.6; letter-spacing: 1px; }
                .operative-badge { display: flex; align-items: center; gap: 8px; font-size: 10px; font-weight: 700; color: var(--text-secondary); background: rgba(255,255,255,0.02); padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); width: fit-content; }
                .op-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--accent-blue); box-shadow: 0 0 10px var(--accent-blue); }

                .prio-tag { font-size: 8px; font-weight: 950; letter-spacing: 1px; padding: 4px 10px; border-radius: 4px; }
                .prio-critical { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
                .prio-high { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
                .prio-medium { background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1); }

                .progress-hub-container { width: 140px; }
                .progress-hub-meta { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
                .progress-hub-meta span { font-size: 12px; font-family: var(--font-mono); font-weight: 900; color: #fff; }
                .progress-hub-meta label { font-size: 7px; font-weight: 950; color: var(--text-muted); letter-spacing: 1px; }
                .progress-hub-bar { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
                .progress-hub-bar .fill { height: 100%; width: 0; background: var(--accent-blue); transition: width 0.6s cubic-bezier(0.19, 1, 0.22, 1); }
                .progress-hub-bar .fill.fill-completed { background: var(--accent-green); }
                .progress-hub-bar .fill.fill-failed { background: var(--accent-red); }

                .status-hub-badge { display: flex; align-items: center; gap: 8px; font-size: 9px; font-weight: 950; letter-spacing: 1px; color: var(--text-muted); background: rgba(255,255,255,0.03); padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); width: fit-content; }
                .status-hub-badge .dot { width: 5px; height: 5px; border-radius: 50%; background: #ccc; }
                .badge-running { color: var(--accent-blue); border-color: rgba(59, 130, 246, 0.2); }
                .badge-running .dot { background: var(--accent-blue); box-shadow: 0 0 10px var(--accent-blue); animation: pulse-dot 2s infinite; }
                .badge-completed { color: var(--accent-green); border-color: rgba(16, 185, 129, 0.2); }
                .badge-completed .dot { background: var(--accent-green); }
                .badge-failed { color: var(--accent-red); border-color: rgba(239, 68, 68, 0.2); }
                .badge-failed .dot { background: var(--accent-red); }

                .hub-actions { display: flex; gap: 10px; }
                .action-btn { width: 32px; height: 32px; border-radius: 6px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
                .action-btn:hover { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.3); }
                .flow-btn:hover { color: var(--accent-blue); border-color: var(--accent-blue); }
                .kill-btn:hover { color: var(--accent-red); border-color: var(--accent-red); }

                /* ===== MODAL OVERLAYS ===== */
                .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(5, 6, 10, 0.98); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px; overflow: hidden; }
                .modal-overlay-top { align-items: flex-start; padding-top: 60px; overflow-y: auto; }
                .terminal-overlay { background: rgba(0, 0, 0, 0.98); }

                .modal { background: #0d0f17; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; box-shadow: 0 40px 120px rgba(0,0,0,0.9); width: 100%; display: flex; flex-direction: column; overflow: hidden; animation: scaleIn 0.35s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
                @keyframes scaleIn { from { transform: scale(0.96) translateY(-16px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }

                .modal-technical-header { background: rgba(255,255,255,0.02); padding: 20px 28px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
                .m-tag { font-size: 8px; font-weight: 950; letter-spacing: 4px; color: var(--accent-blue); display: block; margin-bottom: 4px; }
                .modal-technical-header h2 { font-size: 18px; font-weight: 950; color: #fff; margin: 0; letter-spacing: -0.5px; }
                .close-x { background: transparent; border: none; color: var(--text-muted); font-size: 22px; cursor: pointer; line-height: 1; padding: 4px 8px; transition: color 0.2s; flex-shrink: 0; }
                .close-x:hover { color: #fff; }

                .modal-body { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 0; }
                .modal-technical-actions { padding: 18px 28px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; gap: 16px; flex-shrink: 0; background: rgba(13, 15, 23, 0.6); }

                /* ===== MISSION INFO MODALS (Logs/Topology) ===== */
                /* ===== MISSION INFO MODALS (Logs/Topology) ===== */
                .info-modal { width: 95vw; max-width: 1200px; height: 85vh; border: 1px solid rgba(59, 130, 246, 0.3); box-shadow: 0 0 100px rgba(0,0,0,0.9); margin: auto; flex-shrink: 0; }
                .flow-modal { max-width: 1300px; }
                
                .technical-log-container { padding: 24px; display: flex; flex-direction: column; gap: 4px; font-family: var(--font-mono); font-size: 13px; background: rgba(0,0,0,0.2); }
                .tech-log-row { display: flex; gap: 16px; padding: 8px 12px; border-radius: 6px; transition: background 0.2s; }
                .tech-log-row:hover { background: rgba(255,255,255,0.02); }
                .log-ts { color: var(--accent-blue); opacity: 0.6; min-width: 85px; font-size: 11px; }
                .log-lvl { font-weight: 800; min-width: 50px; }
                .lvl-info { color: #06b6d4; }
                .lvl-error { color: #ef4444; }
                .lvl-warn { color: #f59e0b; }
                .log-msg { color: #d4d4d8; word-break: break-word; }
                .empty-logs { padding: 100px; text-align: center; color: var(--text-muted); font-weight: 950; letter-spacing: 2px; opacity: 0.3; font-size: 12px; }

                .flow-graph-wrapper { padding: 32px; position: relative; }
                .flow-graph-wrapper::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px); background-size: 30px 30px; pointer-events: none; }

                /* ===== MISSION INITIATOR MODAL ===== */
                .technical-init-modal { max-width: 760px; max-height: calc(100vh - 120px); }
                .modal-body { padding: 0; }
                .form-grid { display: flex; flex-direction: column; gap: 24px; padding: 32px; }
                .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                .form-item label { display: block; font-size: 10px; font-weight: 950; color: var(--text-muted); letter-spacing: 1.5px; margin-bottom: 10px; text-transform: uppercase; }

                .tech-input, .tech-select, .tech-textarea { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 12px 16px; color: #fff; font-size: 14px; font-weight: 500; outline: none; transition: all 0.2s; font-family: inherit; }
                .tech-input:focus, .tech-select:focus, .tech-textarea:focus { border-color: var(--accent-blue); background: rgba(59, 130, 246, 0.05); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12); }
                .tech-select option { background: #0d0f17; }
                .tech-textarea { min-height: 100px; max-height: 160px; resize: vertical; font-family: var(--font-mono); font-size: 12px; line-height: 1.6; }

                .split-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                .ai-assist-btn { background: rgba(59, 130, 246, 0.1); color: var(--accent-blue); border: 1px solid rgba(59, 130, 246, 0.2); padding: 4px 10px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; cursor: pointer; transition: all 0.2s; }
                .ai-assist-btn:hover:not(:disabled) { background: var(--accent-blue); color: #000; }

                .btn-cancel { flex: 1; height: 42px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; color: var(--text-muted); font-weight: 950; font-size: 10px; letter-spacing: 2px; cursor: pointer; transition: all 0.2s; }
                .btn-launch-sequence { flex: 2; height: 42px; background: var(--accent-blue); border: none; border-radius: 6px; color: #000; font-weight: 950; font-size: 10px; letter-spacing: 2px; cursor: pointer; transition: all 0.2s; }
                .btn-launch-sequence:hover { transform: translateY(-1px); box-shadow: 0 0 30px rgba(59, 130, 246, 0.4); }

                .empty-state-hub { padding: 120px 40px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 450px; background: radial-gradient(circle at center, rgba(59, 130, 246, 0.05) 0%, transparent 70%); }
                .empty-visual-container { position: relative; width: 120px; height: 120px; margin-bottom: 40px; display: flex; align-items: center; justify-content: center; }
                .empty-icon-wrapper { position: relative; z-index: 2; color: var(--accent-blue); filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.4)); }
                
                .pulse-ring { position: absolute; width: 100%; height: 100%; border: 1px solid var(--accent-blue); border-radius: 50%; opacity: 0; animation: pulse-out 3s infinite cubic-bezier(0.19, 1, 0.22, 1); }
                .pulse-ring.delay-1 { animation-delay: 1.5s; }
                @keyframes pulse-out { 0% { transform: scale(0.5); opacity: 0; } 50% { opacity: 0.3; } 100% { transform: scale(1.5); opacity: 0; } }

                .empty-content { max-width: 500px; }
                .empty-content h3 { font-size: 24px; font-weight: 950; color: #fff; margin: 12px 0 16px; letter-spacing: -0.5px; }
                .empty-content p { color: var(--text-muted); line-height: 1.6; font-size: 15px; margin-bottom: 32px; }
                
                .empty-actions { display: flex; gap: 16px; justify-content: center; }
                .btn-technical.primary-glow { background: var(--accent-blue); color: #000; box-shadow: 0 0 40px rgba(59, 130, 246, 0.2); border: none; font-size: 11px; padding: 12px 24px; height: 44px; display: flex; align-items: center; border-radius: 6px; font-weight: 950; letter-spacing: 1px; cursor: pointer; transition: all 0.3s; }
                .btn-technical.primary-glow:hover { transform: translateY(-2px); box-shadow: 0 0 50px rgba(59, 130, 246, 0.4); }
                .btn-technical-secondary { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: var(--text-muted); letter-spacing: 1px; font-size: 9px; font-weight: 950; border-radius: 6px; padding: 0 20px; cursor: pointer; transition: all 0.2s; height: 44px; }
                .btn-technical-secondary:hover { background: rgba(255,255,255,0.08); color: #fff; border-color: rgba(255,255,255,0.2); }

                .animate-in { animation: slideUp 1s cubic-bezier(0.19, 1, 0.22, 1) forwards; opacity: 0; }
                @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

                .glass-card { background: var(--bg-glass); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; backdrop-filter: blur(24px); position: relative; overflow: hidden; }
                .btn-technical { background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); color: #fff; padding: 14px; border-radius: 8px; font-size: 11px; font-weight: 950; letter-spacing: 2px; cursor: pointer; }
            `}</style>


        </div>
    );
}