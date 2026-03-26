'use client';
import { useState } from 'react';
import Link from 'next/link';
import { signup as apiSignup } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function SignupPage() {
    const [name, setName] = useState('');
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
            const data = await apiSignup({ name, email, password });
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
                        background: 'var(--gradient-purple)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        margin: '0 auto 16px',
                        boxShadow: 'var(--shadow-glow-purple)',
                    }}>
                        🏢
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>Get Started</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Create your account and workspace</p>
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
                        <label>Full Name</label>
                        <input
                            type="text"
                            className="form-control"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="John Doe"
                        />
                    </div>
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
                            placeholder="Minimum 8 characters"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '14px' }}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Already have an account? <Link href="/login" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}
