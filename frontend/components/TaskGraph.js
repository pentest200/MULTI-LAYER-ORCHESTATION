'use client';
import { useEffect, useState, useRef } from 'react';
import { getTaskNodes } from '@/lib/api';
import { useWebSocket } from '@/lib/websocket';

export default function TaskGraph({ taskId }) {
    const [nodes, setNodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const { subscribe } = useWebSocket();
    const containerRef = useRef(null);

    const loadNodes = async () => {
        try {
            const data = await getTaskNodes(taskId);
            setNodes(data);
        } catch (e) {
            console.error('Failed to load nodes:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNodes();
        const unsub = subscribe('node:update', (data) => {
            if (data.taskId === taskId) {
                setNodes(prev => prev.map(node =>
                    node.id === data.nodeId ? { ...node, status: data.status } : node
                ));
            }
        });
        return () => unsub();
    }, [taskId, subscribe]);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Initializing graph...</div>;

    if (nodes.length === 0) return (
        <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🕸️</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No Execution Flow Yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Nodes will appear here as the agent starts working.</p>
        </div>
    );

    return (
        <div className="task-graph-container" ref={containerRef}>
            <div className="nodes-flow">
                {nodes.map((node, index) => (
                    <div key={node.id} className="node-wrapper">
                        {index > 0 && (
                            <div className={`connector ${nodes[index - 1].status === 'success' ? 'connector-active' : ''}`}>
                                <div className="connector-pulse"></div>
                            </div>
                        )}
                        <div className={`graph-node glass-card status-${node.status}`}>
                            <div className="node-icon">
                                {node.status === 'running' ? (
                                    <svg className="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                                ) : node.status === 'success' ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                ) : node.status === 'failed' ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                ) : (
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />
                                )}
                            </div>
                            <div className="node-content">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div className="node-step-label">STEP {index + 1}</div>
                                        <div className="node-name">{node.name}</div>
                                    </div>
                                    <div className="node-time">
                                        {node.created_at ? new Date(node.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                                    </div>
                                </div>

                                <div className="node-meta-row">
                                    <span className="node-status-badge">{node.status}</span>
                                    {node.duration && <span className="node-duration">{node.duration}ms</span>}
                                </div>

                                {node.output && (
                                    <div className="node-output-container">
                                        <div className="output-header">CONTENT_OUTPUT</div>
                                        <div className="node-output-preview">{node.output}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .task-graph-container {
                    padding: 40px 20px;
                    overflow-x: auto;
                    min-height: 400px;
                    display: flex;
                    justify-content: center;
                }
                .nodes-flow {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0;
                    width: 100%;
                    max-width: 700px;
                }
                .node-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    position: relative;
                }
                .graph-node {
                    width: 100%;
                    padding: 28px;
                    display: flex;
                    gap: 24px;
                    margin: 12px 0;
                    border: 1px solid var(--border-glass);
                    background: rgba(13, 15, 23, 0.4);
                    backdrop-filter: blur(10px);
                    transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
                    position: relative;
                    z-index: 2;
                    border-radius: 16px;
                }
                .graph-node:hover {
                    transform: translateX(8px);
                    background: rgba(13, 15, 23, 0.6);
                    border-color: rgba(255, 255, 255, 0.2);
                }
                .status-running {
                    border-color: var(--accent-blue);
                    box-shadow: 0 0 30px rgba(59, 130, 246, 0.15);
                    color: var(--accent-blue);
                }
                .status-success {
                    border-color: rgba(16, 185, 129, 0.3);
                    color: var(--accent-green);
                }
                .status-failed {
                    border-color: var(--accent-red);
                    color: var(--accent-red);
                }
                .node-icon {
                    width: 44px;
                    height: 44px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    color: inherit;
                }
                .node-content {
                    flex: 1;
                    min-width: 0;
                }
                .node-step-label {
                    font-size: 9px;
                    font-weight: 900;
                    letter-spacing: 1.5px;
                    opacity: 0.5;
                    margin-bottom: 4px;
                    color: var(--text-primary);
                }
                .node-name {
                    font-weight: 800;
                    font-size: 17px;
                    color: var(--text-primary);
                    letter-spacing: -0.3px;
                }
                .node-time {
                    font-size: 11px;
                    font-family: var(--font-mono);
                    opacity: 0.4;
                    font-weight: 600;
                }
                .node-meta-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-top: 8px;
                }
                .node-status-badge {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-weight: 900;
                    opacity: 0.8;
                }
                .node-duration {
                    font-size: 10px;
                    font-weight: 700;
                    opacity: 0.4;
                    padding-left: 12px;
                    border-left: 1px solid rgba(255,255,255,0.1);
                }
                .node-output-container {
                    margin-top: 20px;
                    background: rgba(0, 0, 0, 0.25);
                    border: 1px solid rgba(255, 255, 255, 0.03);
                    border-radius: 10px;
                    overflow: hidden;
                }
                .output-header {
                    font-size: 8px;
                    font-weight: 900;
                    letter-spacing: 1px;
                    padding: 6px 12px;
                    background: rgba(255,255,255,0.02);
                    opacity: 0.4;
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                }
                .node-output-preview {
                    padding: 12px;
                    font-size: 12px;
                    color: var(--text-secondary);
                    font-family: var(--font-mono);
                    line-height: 1.6;
                    max-height: 120px;
                    overflow-y: auto;
                }
                .connector {
                    width: 2px;
                    height: 24px;
                    background: rgba(255, 255, 255, 0.05);
                    position: relative;
                    z-index: 1;
                }
                .connector-active {
                    background: var(--accent-green);
                    box-shadow: 0 0 15px var(--accent-green);
                }
                .connector-pulse {
                    position: absolute;
                    top: 0; left: 50%;
                    width: 4px; height: 4px;
                    background: white;
                    border-radius: 50%;
                    transform: translateX(-50%);
                    opacity: 0;
                }
                .connector-active .connector-pulse {
                    animation: flow-pulse 2s infinite;
                }
                @keyframes flow-pulse {
                    0% { top: 0; opacity: 0; }
                    50% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 2s linear infinite; }
            `}</style>
        </div>
    );
}
