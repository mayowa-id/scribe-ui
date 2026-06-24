import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Editor } from '@tiptap/react';
import api from '../../../../lib/api';
import { TiptapEditor } from '../../../../components/TiptapEditor';
import { GenerationPanel } from '../../../../components/GenerationPanel';
import { AssistantChat } from '../../../../components/AssistantChat';

interface Chapter {
  id: string;
  projectId: string;
  title: string;
  content: string;
}

export default function ChapterEditor() {
  const router = useRouter();
  const { id, chapterId } = router.query;
  
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Ref to hold the Tiptap editor instance for imperative updates
  const editorRef = useRef<Editor | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id || !chapterId) return;

    const fetchChapter = async () => {
      try {
        const response = await api.get(`/chapter/${chapterId}`);
        setChapter(response.data);
      } catch (err: unknown) {
        console.error(err);
        setError('Failed to load chapter.');
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [id, chapterId]);

  const handleContentChange = (newContent: string) => {
    setChapter((prev) => prev ? { ...prev, content: newContent } : null);

    // Auto-save logic
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (!chapterId) return;
      try {
        await api.put(`/chapter/${chapterId}`, { content: newContent });
        console.log('Autosaved');
      } catch (err) {
        console.error('Failed to autosave', err);
      }
    }, 2000);
  };

  const handleStreamContent = (textChunk: string) => {
    if (editorRef.current) {
      // Insert text at current cursor position
      // Using commands.insertContent to handle streaming
      editorRef.current.commands.insertContent(textChunk);
    }
  };

  const handleStreamComplete = () => {
    // Sync the final content to state
    if (editorRef.current) {
      handleContentChange(editorRef.current.getHTML());
    }
  };

  if (loading) return <div>Loading editor...</div>;
  if (error || !chapter) return <div className="form-error">{error || 'Chapter not found'}</div>;

  return (
    <div className="animate-fade-in" style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--vellum-dark)' }}>
      <Head>
        <title>{chapter.title} - Scribe</title>
      </Head>

      <div style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--mist)', backgroundColor: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)' }}>
        <div>
          <Link href={`/projects/${id}`} style={{ fontSize: '0.875rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'none' }}>
            &larr; Return to Manuscript
          </Link>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--ink)', margin: '0.25rem 0 0 0' }}>{chapter.title}</h1>
        </div>
        <div style={{ color: 'var(--slate)', fontSize: '0.875rem' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--gilt)', marginRight: '0.5rem' }}></span>
          Auto-saving
        </div>
      </div>

      <div className="editor-layout" style={{ margin: '0', padding: '2rem', height: 'calc(100vh - 80px)' }}>
        <div className="editor-pane" style={{ position: 'relative' }}>
          <TiptapEditor
            content={chapter.content || ''}
            onChange={handleContentChange}
            onEditorReady={(editor) => {
              editorRef.current = editor;
            }}
          />
        </div>

        <div className="generation-pane">
          <div style={{ flex: '0 0 auto' }}>
            <GenerationPanel
              chapterId={chapterId as string}
              onStreamContent={handleStreamContent}
              onStreamComplete={handleStreamComplete}
            />
          </div>
          <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <AssistantChat chapterId={chapterId as string} />
          </div>
        </div>
      </div>
    </div>
  );
}
