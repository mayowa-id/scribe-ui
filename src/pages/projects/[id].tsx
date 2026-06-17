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
    <div>
      <Head>
        <title>{project.title} - Scribe</title>
      </Head>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link href="/" style={{ fontSize: '0.875rem', color: 'var(--slate)', textDecoration: 'underline', marginBottom: '1rem', display: 'inline-block' }}>
            &larr; Back to Library
          </Link>
          <h1 className="page-title">{project.title}</h1>
          {project.description && <p className="page-subtitle">{project.description}</p>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: '300px' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Chapters</h2>
          {project.chapters && project.chapters.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {project.chapters.map((chapter) => (
                <Link key={chapter.id} href={`/projects/${id}/chapters/${chapter.id}`} className="card card-hover" style={{ padding: '1.5rem', textDecoration: 'none' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Chapter {chapter.order}: {chapter.title}</h3>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ padding: '3rem', border: '1px dashed var(--mist)', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: 'var(--slate)' }}>No chapters yet. Start writing!</p>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: '250px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Add Chapter</h3>
            <form onSubmit={handleCreateChapter}>
              <div className="form-group">
                <label className="form-label" htmlFor="chapterTitle">Chapter Title</label>
                <input
                  id="chapterTitle"
                  type="text"
                  className="form-input"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="e.g. A New Beginning"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isCreatingChapter}>
                {isCreatingChapter ? 'Adding...' : 'Add Chapter'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
