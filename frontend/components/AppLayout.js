'use client';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth';

export default function AppLayout({ children }) {
    const { user, loading } = useAuth();

    if (loading) return (
        <div style={{
            height: '100vh',
            background: 'var(--bg-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div className="loading-spinner"></div>
        </div>
    );

    if (!user) {
        return <main>{children}</main>;
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
