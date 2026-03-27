'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth';

function PageTransition({ children }) {
    const pathname = usePathname();
    const [displayChildren, setDisplayChildren] = useState(children);
    const [transitionState, setTransitionState] = useState('enter');
    const prevPathname = useRef(pathname);

    useEffect(() => {
        if (prevPathname.current !== pathname) {
            // Route changed — trigger exit then enter
            setTransitionState('exit');

            const exitTimer = setTimeout(() => {
                setDisplayChildren(children);
                setTransitionState('enter');
                prevPathname.current = pathname;
            }, 200); // exit animation duration

            return () => clearTimeout(exitTimer);
        } else {
            setDisplayChildren(children);
        }
    }, [pathname, children]);

    return (
        <div className={`page-transition page-transition-${transitionState}`}>
            {displayChildren}
        </div>
    );
}

export default function AppLayout({ children }) {
    const { user, loading } = useAuth();

    if (loading) return (
        <div style={{
            height: '100vh',
            background: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
        }}>
            <div className="loading-spinner"></div>
            <div style={{
                color: 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.5px',
            }}>
                Loading Chakraview...
            </div>
        </div>
    );

    if (!user) {
        return <main className="animate-in">{children}</main>;
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <PageTransition>
                    {children}
                </PageTransition>
            </main>
        </div>
    );
}
