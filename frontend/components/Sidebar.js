'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWebSocket } from '@/lib/websocket';
import { useAuth } from '@/lib/auth';

const navItems = [
    { href: '/', label: 'Overview', icon: '📊' },
    { href: '/agents', label: 'Agents', icon: '🤖' },
    { href: '/tasks', label: 'Tasks', icon: '⚡' },
    { href: '/workflows', label: 'Workflows', icon: '🔄' },
    { href: '/oversight', label: 'Oversight', icon: '👁️' },
    { href: '/analytics', label: 'Analytics', icon: '📈' },
    { href: '/billing', label: 'Billing', icon: '💳' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { connected } = useWebSocket();
    const { user, logout } = useAuth();

    return (
        <aside style={{
            position: 'fixed',
            left: 12,
            top: 12,
            bottom: 12,
            width: 'var(--sidebar-width)',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-lg)',
            backdropFilter: 'blur(32px)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            boxShadow: 'var(--shadow-lg)',
        }}>
            {/* Logo */}
            <div style={{ padding: '32px 24px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--gradient-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        boxShadow: 'var(--shadow-glow-blue)',
                    }}>
                        🧠
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.5px' }}>
                            Antigravity
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Orchestrator
                        </div>
                    </div>
                </div>

                {/* Workspace Switcher */}
                <div style={{
                    marginTop: '32px',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all var(--transition-base)',
                }} className="hover-glass">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-purple)', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user?.workspace_name || 'Standard Workspace'}
                        </span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>▼</span>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {navItems.map(item => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={isActive ? 'nav-item-active' : 'nav-item'}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                padding: '12px 18px',
                                borderRadius: 'var(--radius-sm)',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                border: isActive ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
                                transition: 'all var(--transition-base)',
                            }}
                        >
                            <span style={{ fontSize: '20px', filter: isActive ? 'drop-shadow(0 0 5px var(--accent-blue))' : 'none' }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile & Status */}
            <div style={{ padding: '24px', borderTop: '1px solid var(--border-glass)' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'var(--gradient-purple)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'white',
                        }}>
                            {user?.name?.[0] || 'U'}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user?.name || 'User'}
                            </div>
                            <div className={`ws-indicator ${connected ? 'ws-connected' : 'ws-disconnected'}`} style={{ padding: '0', background: 'none' }}>
                                <span style={{
                                    width: '6px', height: '6px', borderRadius: '50%',
                                    background: connected ? 'var(--accent-green)' : 'var(--accent-red)',
                                    animation: connected ? 'pulse-dot 2s infinite' : 'none',
                                    display: 'inline-block',
                                    marginRight: '6px'
                                }} />
                                <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>{connected ? 'Live' : 'Offline'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px', fontSize: '12px' }}
                >
                    🚪 Logout
                </button>
            </div>
        </aside>
    );
}
