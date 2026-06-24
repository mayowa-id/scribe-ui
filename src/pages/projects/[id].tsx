import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/api';

interface Chapter {
  id: string;
  title: string;
  order: number;
}

interface Project {
  id: string;
  title: string;
  description?: string;
  chapters?: Chapter[];
}

export default function ProjectDetails() {
  const router = useRouter();
  const { id } = router.query;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isCreatingChapter, setIsCreatingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchProject = async () => {
      try {
        const response = await api.get(`/projects/${id}`);
        setProject(response.data);
      } catch (err: unknown) {
        console.error(err);
        setError('Failed to load project details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newChapterTitle.trim()) return;

    setIsCreatingChapter(true);
    try {
      const response = await api.post(`/chapter`, { projectId: id, title: newChapterTitle, order: (project?.chapters?.length || 0) + 1 });
      const newChapter = response.data;
      setProject((prev) => prev ? { ...prev, chapters: [...(prev.chapters || []), newChapter] } : null);
      setNewChapterTitle('');
    } catch (err: unknown) {
      console.error(err);
      alert('Failed to create chapter.');
    } finally {
      setIsCreatingChapter(false);
    }
  };

  if (loading) {
    return <div>Loading project...</div>;
  }

  if (error || !project) {
    return <div className="form-error">{error || 'Project not found.'}</div>;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
      <Head>
        <title>{project.title} - Scribe</title>
      </Head>

      <div style={{ marginBottom: '3rem' }}>
        <Link href="/" style={{ fontSize: '0.875rem', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem', display: 'inline-block' }}>
          &larr; Return to Library
        </Link>
        <h1 style={{ fontSize: '3.5rem', color: 'var(--ink)' }}>{project.title}</h1>
        {project.description && <p style={{ fontSize: '1.25rem', color: 'var(--slate)', maxWidth: '800px', marginTop: '1rem' }}>{project.description}</p>}
      </div>

      <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 600px' }}>
          <h2 style={{ marginBottom: '2rem', fontSize: '1.75rem', borderBottom: '1px solid var(--mist)', paddingBottom: '1rem' }}>Chapters</h2>
          {project.chapters && project.chapters.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {project.chapters.map((chapter) => (
                <Link key={chapter.id} href={`/projects/${id}/chapters/${chapter.id}`} className="card card-hover" style={{ padding: '2rem', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'var(--ink)', color: 'var(--vellum)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginRight: '1.5rem' }}>
                    {chapter.order}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--ink)' }}>{chapter.title}</h3>
                  <div style={{ marginLeft: 'auto', color: 'var(--gilt)' }}>&rarr;</div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ padding: '4rem', border: '1px dashed var(--gilt-light)', borderRadius: '16px', background: 'rgba(252, 249, 242, 0.5)', textAlign: 'center' }}>
              <p style={{ color: 'var(--slate)', fontSize: '1.1rem' }}>The manuscript awaits its first chapter.</p>
            </div>
          )}
        </div>

        <div style={{ flex: '0 1 350px', position: 'sticky', top: '2rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--ink)' }}>Scribe a New Chapter</h3>
            <form onSubmit={handleCreateChapter}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" htmlFor="chapterTitle">Chapter Title</label>
                <input
                  id="chapterTitle"
                  type="text"
                  className="form-input"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="e.g. Genesis of the Vision"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }} disabled={isCreatingChapter || !newChapterTitle.trim()}>
                {isCreatingChapter ? 'Adding...' : 'Add Chapter'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
