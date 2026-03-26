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

        // Client-side validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

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
            <div className="glass-card auth-card animate-in" style={{
                backdropFilter: 'blur(32px)',
                background: 'rgba(13, 15, 23, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), var(--shadow-glow-purple)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--gradient-purple)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '36px',
                        margin: '0 auto 20px',
                        boxShadow: 'var(--shadow-glow-purple)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        🏢
                    </div>
                    <h2 style={{
                        fontSize: '28px',
                        fontWeight: 800,
                        letterSpacing: '-1px',
                        background: 'linear-gradient(135deg, #fff 0%, #9499b3 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>Join the Grid</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '15px' }}>Initialize your secure command workspace</p>
                </div>

                {error && (
                    <div style={{
                        padding: '14px 18px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        color: '#ff6b6b',
                        fontSize: '14px',
                        marginBottom: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        animation: 'fadeIn 0.3s ease'
                    }}>
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Full Name</label>
                        <input
                            type="text"
                            className="form-control"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="John Doe"
                            style={{ background: 'rgba(0, 0, 0, 0.2)' }}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Email Address</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="name@company.com"
                            style={{ background: 'rgba(0, 0, 0, 0.2)' }}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Minimum 8 characters"
                            style={{ background: 'rgba(0, 0, 0, 0.2)' }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{
                        padding: '16px',
                        fontSize: '15px',
                        background: 'var(--gradient-purple)',
                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.25)',
                        marginTop: '12px'
                    }}>
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="spinner" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                Creating Core account...
                            </span>
                        ) : 'Establish Workspace'}
                    </button>
                </form>

                <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Registered user?</span>{' '}
                    <Link href="/login" style={{ color: 'var(--accent-purple)', fontWeight: 600, textDecoration: 'none' }}>Sign in here</Link>
                </div>

                <style jsx>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );

}
