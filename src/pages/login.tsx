import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const verified = router.query.verified === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response.data.data;
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      login(accessToken, user);
      if (typeof window !== 'undefined') {
        window.location.href = '/'; // Hard redirect to ensure state refresh if needed
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
      } else {
        setError('Failed to login. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <Head>
        <title>Login - Scribe</title>
      </Head>
      <div className="auth-card card">
        <h1 className="auth-title">Welcome Back</h1>
        {verified && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            borderRadius: '8px',
            padding: '0.875rem 1.25rem',
            marginBottom: '1.75rem',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#166534',
            fontWeight: 500,
          }}>
            ✓ Email verified successfully — you can now log in.
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <span className="form-error" style={{ marginBottom: '1rem', display: 'block' }}>{error}</span>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Entering...' : 'Log In'}
          </button>
        </form>
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          Don&apos;t have an account? <Link href="/register" style={{ fontWeight: 600 }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}
