'use client';
import { useState } from 'react';
import Link from 'next/link';
import { login as apiLogin } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await apiLogin({ email, password });
            login(data.user, data.token);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-card auth-card animate-in">
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--gradient-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        margin: '0 auto 16px',
                        boxShadow: 'var(--shadow-glow-blue)',
                    }}>
                        🧠
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>Welcome Back</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Log in to your Command Center</p>
                </div>

                {error && (
                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--accent-red)',
                        fontSize: '14px',
                        marginBottom: '24px',
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="name@company.com"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '14px' }}>
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Don't have an account? <Link href="/signup" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Create one</Link>
                </p>
            </div>
        </div>
    );
}
