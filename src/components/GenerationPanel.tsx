import React, { useState } from 'react';
import api from '../lib/api';

interface GenerationPanelProps {
  chapterId: string;
  voiceProfileId?: string; // Assume we might fetch this from context or pass it down
  onStreamContent: (text: string) => void;
  onStreamComplete: () => void;
}

export const GenerationPanel: React.FC<GenerationPanelProps> = ({
  chapterId,
  voiceProfileId,
  onStreamContent,
  onStreamComplete,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError('');

    try {
      // 1. Start job
      const response = await api.post('/generate', {
        chapterId,
        voiceProfileId,
        userPrompt: prompt,
      });
      const { jobId } = response.data;

      // 2. Connect to SSE Stream
      const streamUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/generate/stream/${jobId}`;
      const eventSource = new EventSource(streamUrl, {
        withCredentials: true,
      });

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.complete) {
            eventSource.close();
            setIsGenerating(false);
            onStreamComplete();
            setPrompt('');
          } else if (data.text) {
            onStreamContent(data.text);
          }
        } catch (e) {
          // If not JSON, maybe just raw text chunk
          onStreamContent(event.data);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE Error:', err);
        eventSource.close();
        setIsGenerating(false);
        setError('Connection lost during generation.');
      };

    } catch (err: unknown) {
      console.error(err);
      setError('Failed to start generation.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ marginBottom: '1rem' }}>Scribe Generator</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--slate)', marginBottom: '1rem' }}>
        Provide instructions for the next section. Scribe will write using your voice profile.
      </p>
      
      <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <textarea
          className="form-input"
          style={{ flex: 1, resize: 'none' }}
          placeholder="e.g. Describe the bustling market in the morning light..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isGenerating}
        />
      </div>

      {error && <span className="form-error" style={{ marginBottom: '1rem' }}>{error}</span>}

      <button
        className="btn btn-primary"
        style={{ width: '100%' }}
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
      >
        {isGenerating ? 'Generating...' : 'Generate Text'}
      </button>
    </div>
  );
};
