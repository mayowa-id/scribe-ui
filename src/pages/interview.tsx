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

  const MOCK_QUESTIONS = [
    { questionId: 'q1', questionText: 'Can you share a bit about your journey and how you found your voice in ministry?', complete: false },
    { questionId: 'q2', questionText: 'What core theological themes do you find yourself returning to most often?', complete: false },
    { questionId: 'q3', questionText: 'Share a defining moment in your life that deeply shaped your perspective on faith.', complete: false },
    { questionId: 'complete', questionText: '', complete: true },
  ];

  // Helper for mock state
  const getMockQuestion = (index: number) => MOCK_QUESTIONS[index] || MOCK_QUESTIONS[MOCK_QUESTIONS.length - 1];

  useEffect(() => {
    const startInterview = async () => {
      try {
        const response = await api.post('/interview/start');
        const newSessionId = response.data.sessionId;
        setSessionId(newSessionId);
        fetchNextQuestion(newSessionId, 0);
      } catch (err: unknown) {
        console.warn('Backend failed, falling back to mock interview for demo.');
        setSessionId('mock-session-123');
        setCurrentQuestion(getMockQuestion(0));
        setLoading(false);
      }
    };

    startInterview();
  }, []);

  async function fetchNextQuestion(sid: string, mockIndexOverride?: number) {
    try {
      const response = await api.get(`/interview/next-question?sessionId=${sid}`);
      setCurrentQuestion(response.data);
      if (response.data.complete) {
        handleComplete(sid);
      }
    } catch (err: unknown) {
      // Mock fallback
      if (sid === 'mock-session-123' && mockIndexOverride !== undefined) {
        const nextQ = getMockQuestion(mockIndexOverride);
        setCurrentQuestion(nextQ);
        if (nextQ.complete) {
          handleComplete(sid);
        }
      } else {
        setError('Failed to fetch the next question.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (sid: string) => {
    try {
      if (sid !== 'mock-session-123') {
        await api.post('/interview/complete', { sessionId: sid });
      }
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
      if (sessionId !== 'mock-session-123') {
        await api.post('/interview/answer', {
          sessionId,
          questionId: currentQuestion.questionId,
          answerText: answer,
        });
        setAnswer('');
        await fetchNextQuestion(sessionId);
      } else {
        // Mock progression
        setAnswer('');
        const currentIndex = MOCK_QUESTIONS.findIndex(q => q.questionId === currentQuestion.questionId);
        await new Promise(resolve => setTimeout(resolve, 500)); // simulate network
        await fetchNextQuestion(sessionId, currentIndex + 1);
      }
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
