import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import api from '../lib/api';

interface QuestionResponse {
  questionId?: string;
  questionText?: string;
  complete: boolean;
}

export default function Interview() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionResponse | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const startInterview = async () => {
      try {
        const response = await api.post('/interview/start');
        const newSessionId = response.data.sessionId;
        setSessionId(newSessionId);
        fetchNextQuestion(newSessionId);
      } catch (err: unknown) {
        console.error(err);
        setError('Failed to start the interview session.');
        setLoading(false);
      }
    };

    startInterview();
  }, []);

  async function fetchNextQuestion(sid: string) {
    try {
      const response = await api.get(`/interview/next-question?sessionId=${sid}`);
      setCurrentQuestion(response.data);
      if (response.data.complete) {
        handleComplete(sid);
      }
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to fetch the next question.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (sid: string) => {
    try {
      await api.post('/interview/complete', { sessionId: sid });
      // Redirect to dashboard after completion
      router.push('/');
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to complete the interview.');
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !currentQuestion?.questionId || !answer.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      await api.post('/interview/answer', {
        sessionId,
        questionId: currentQuestion.questionId,
        answerText: answer,
      });
      setAnswer('');
      await fetchNextQuestion(sessionId);
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stepper-wrapper">
      <Head>
        <title>Voice Profile Interview - Scribe</title>
      </Head>
      <div className="stepper-card card">
        <h1 className="auth-title" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Voice Profiling</h1>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading interview...</div>
        ) : error ? (
          <div className="form-error" style={{ textAlign: 'center' }}>{error}</div>
        ) : currentQuestion?.complete ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Interview Complete</h2>
            <p style={{ color: 'var(--slate)' }}>We are analyzing your voice profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitAnswer}>
            <div className="stepper-question">
              {currentQuestion?.questionText}
            </div>
            <div className="form-group">
              <textarea
                className="form-input"
                rows={5}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                required
                disabled={submitting}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting || !answer.trim()}>
                {submitting ? 'Submitting...' : 'Next'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
