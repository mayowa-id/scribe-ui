import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantChatProps {
  chapterId: string;
}

export const AssistantChat: React.FC<AssistantChatProps> = ({ chapterId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsStreaming(true);

    // Add empty assistant message to append to
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      // Note: Using native fetch for streaming POST response
      // Axios doesn't easily support streaming responses in the browser
      const token = // We would normally get this from useAuth or a cookie
        (document.cookie.match(/(?:^|; )accessToken=([^;]*)/) || [])[1]; 
        
      // For this simplified version, we rely on the interceptors for regular calls,
      // but for fetch we might need to manually pass the token if it's stored in memory.
      // Assuming withCredentials is enough if using cookies, or we could expose the token via api.ts.

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/scribe-assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`, // If using bearer token
        },
        body: JSON.stringify({
          chapterId,
          message: userMsg,
        }),
        credentials: 'include', // Important if using cookies
      });

      if (!response.body) throw new Error('No readable stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        
        // SSE parsing
        const lines = chunkValue.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              done = true;
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  const lastMsg = newMsgs[newMsgs.length - 1];
                  lastMsg.content += data.text;
                  return newMsgs;
                });
              }
            } catch (e) {
              // Not JSON, just append
              setMessages((prev) => {
                const newMsgs = [...prev];
                const lastMsg = newMsgs[newMsgs.length - 1];
                lastMsg.content += dataStr;
                return newMsgs;
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error.' },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.5rem', backgroundColor: 'rgba(252, 249, 242, 0.95)' }}>
      <h3 style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--mist)', color: 'var(--ink)' }}>
        Scribe Assistant
      </h3>
      
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
        {messages.length === 0 ? (
          <p style={{ color: 'var(--slate)', fontSize: '0.9rem', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto', fontStyle: 'italic' }}>
            How can I refine your manuscript today?
          </p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ 
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.role === 'user' ? 'var(--ink)' : 'var(--vellum)',
              color: msg.role === 'user' ? 'var(--vellum)' : 'var(--ink)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--mist)',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              borderBottomRightRadius: msg.role === 'user' ? '2px' : '12px',
              borderBottomLeftRadius: msg.role === 'assistant' ? '2px' : '12px',
              maxWidth: '85%',
              fontSize: '0.95rem',
              boxShadow: msg.role === 'user' ? 'var(--shadow-sm)' : 'none',
              lineHeight: '1.5'
            }}>
              {msg.content}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          type="text"
          className="form-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Scribe for guidance..."
          disabled={isStreaming}
          style={{ flex: 1, borderRadius: '24px', paddingLeft: '1.25rem' }}
        />
        <button type="submit" className="btn btn-primary" disabled={isStreaming || !input.trim()} style={{ borderRadius: '24px', padding: '0.75rem 1.5rem' }}>
          Ask
        </button>
      </form>
    </div>
  );
};
