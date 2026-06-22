import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import api from '../lib/api';
import axios from 'axios';

export default function VerifyEmail() {
  const router = useRouter();
  const { email } = router.query as { email?: string };

  // Store each digit in its own slot for the OTP-style input
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // allow only single digit or empty
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...digits];
    pasted.split('').forEach((char, i) => { next[i] = char; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/verify-email', { email, code });
      setSuccess('Email verified! Redirecting to login…');
      setTimeout(() => router.push('/login?verified=true'), 1800);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Invalid verification code. Please try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <Head>
        <title>Verify Email - Scribe</title>
      </Head>
      <div className="auth-card card">
        <h1 className="auth-title" style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
          Check Your Inbox
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--slate)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
          We sent a 6-digit code to{' '}
          <strong style={{ color: 'var(--ink)' }}>{email || 'your email'}</strong>.
          <br />Enter it below to activate your account.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* OTP digit boxes */}
          <div
            style={{
              display: 'flex',
              gap: '0.6rem',
              justifyContent: 'center',
              marginBottom: '1.75rem',
            }}
            onPaste={handlePaste}
          >
            {digits.map((d, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="form-input"
                style={{
                  width: '3rem',
                  height: '3.5rem',
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  padding: '0',
                  letterSpacing: 0,
                }}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          {error && (
            <span className="form-error" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              {error}
            </span>
          )}
          {success && (
            <span style={{ color: 'var(--gilt)', fontSize: '0.875rem', display: 'flex', justifyContent: 'center', marginBottom: '1rem', fontWeight: 500 }}>
              {success}
            </span>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading || !!success}
          >
            {loading ? 'Verifying…' : 'Verify Email'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          Wrong email?{' '}
          <Link href="/register" style={{ fontWeight: 600 }}>
            Register again
          </Link>
        </div>
      </div>
    </div>
  );
}
