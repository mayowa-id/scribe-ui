import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import api from '../lib/api';

interface Project {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(Array.isArray(response.data) ? response.data : response.data.data || []);
      } catch (err: unknown) {
        console.error(err);
        setError('Failed to load projects.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setIsCreating(true);

    try {
      const response = await api.post('/projects', { title: newTitle, description: newDescription });
      const newProject = response.data;
      setProjects([newProject, ...projects]);
      setNewTitle('');
      setNewDescription('');
    } catch (err: unknown) {
      console.error(err);
      setCreateError('Failed to create project.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem' }}>
      <Head>
        <title>Scribe - Your Library</title>
      </Head>

      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', color: 'var(--ink)' }}>The Scribe</h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--slate)', maxWidth: '600px', margin: '0 auto' }}>
          Your prophetic voice, amplified. Manage your manuscripts and let the Scribe assistant help you shape the culture.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '4rem', padding: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--mist)', paddingBottom: '1rem' }}>Commence a New Manuscript</h2>
        <form onSubmit={handleCreateProject} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 300px' }}>
            <label className="form-label" htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              className="form-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              placeholder="e.g. The Call to Reformation"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '2 1 400px' }}>
            <label className="form-label" htmlFor="description">Description (Optional)</label>
            <input
              id="description"
              type="text"
              className="form-input"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="A brief vision for this work..."
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.875rem 2rem' }} disabled={isCreating || !newTitle.trim()}>
            {isCreating ? 'Inscribing...' : 'Begin Project'}
          </button>
        </form>
        {createError && <span className="form-error" style={{ display: 'block', marginTop: '1rem', color: 'var(--crimson)' }}>{createError}</span>}
      </div>

      <h2 style={{ marginBottom: '2rem' }}>Your Library</h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate)' }}>Loading your manuscripts...</div>
      ) : error ? (
        <div style={{ color: 'var(--crimson)', textAlign: 'center', padding: '2rem' }}>{error}</div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', border: '1px dashed var(--gilt-light)', borderRadius: '16px', background: 'rgba(252, 249, 242, 0.5)' }}>
          <h3 style={{ color: 'var(--gilt)', marginBottom: '0.5rem' }}>The page is blank.</h3>
          <p style={{ color: 'var(--slate)' }}>Create your first project above to begin.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', height: '220px', textDecoration: 'none' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--ink)' }}>{project.title}</h3>
              {project.description && (
                <p style={{ color: 'var(--slate)', fontSize: '0.95rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {project.description}
                </p>
              )}
              <div style={{ fontSize: '0.8rem', color: 'var(--gilt)', marginTop: 'auto', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Initiated {new Date(project.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
