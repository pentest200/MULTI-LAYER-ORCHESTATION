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
                            <div className={`connector ${nodes[index - 1].status === 'success' ? 'connector-active' : ''}`} />
                        )}
                        <div className={`graph-node glass-card status-${node.status}`}>
                            <div className="node-icon">
                                {node.status === 'running' ? '⏳' :
                                    node.status === 'success' ? '✅' :
                                        node.status === 'failed' ? '❌' :
                                            node.status === 'blocked' ? '✋' : '⚪'}
                            </div>
                            <div className="node-content">
                                <div className="node-name">{node.name}</div>
                                <div className="node-status-text">{node.status}</div>
                                {node.output && <div className="node-output-preview">{node.output.slice(0, 100)}...</div>}
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
                    max-width: 600px;
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
                    padding: 24px;
                    display: flex;
                    gap: 20px;
                    margin: 10px 0;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    background: rgba(13, 15, 23, 0.7);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    z-index: 2;
                }
                .graph-node:hover {
                    transform: translateX(10px) scale(1.02);
                    background: rgba(13, 15, 23, 0.9);
                    border-color: rgba(255, 255, 255, 0.2);
                }
                .status-running {
                    border-color: var(--accent-blue);
                    box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
                    animation: node-pulse 2s infinite;
                }
                .status-success {
                    border-color: var(--accent-green);
                }
                .status-failed {
                    border-color: var(--accent-red);
                }
                .status-blocked {
                    border-color: var(--accent-amber);
                }
                .node-icon {
                    width: 48px;
                    height: 48px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    flex-shrink: 0;
                }
                .node-content {
                    flex: 1;
                }
                .node-name {
                    font-weight: 700;
                    font-size: 15px;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                }
                .node-status-text {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-weight: 800;
                    opacity: 0.6;
                }
                .node-output-preview {
                    margin-top: 12px;
                    padding: 10px;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                    font-size: 12px;
                    color: var(--text-secondary);
                    font-family: var(--font-mono);
                }
                .connector {
                    width: 2px;
                    height: 30px;
                    background: rgba(255, 255, 255, 0.1);
                    position: relative;
                    z-index: 1;
                }
                .connector-active {
                    background: var(--accent-green);
                    box-shadow: 0 0 10px var(--accent-green);
                }
                @keyframes node-pulse {
                    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                }
            `}</style>
        </div>
    );
}
