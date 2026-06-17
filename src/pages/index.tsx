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
    <div>
      <Head>
        <title>Dashboard - Scribe</title>
      </Head>

      <div className="page-header">
        <h1 className="page-title">Your Library</h1>
        <p className="page-subtitle">Manage your manuscripts and series.</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2>Start a New Project</h2>
        <form onSubmit={handleCreateProject} style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="form-label" htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              className="form-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              placeholder="e.g. The Winds of Winter"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
            <label className="form-label" htmlFor="description">Description (Optional)</label>
            <input
              id="description"
              type="text"
              className="form-input"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="A brief summary..."
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Project'}
          </button>
        </form>
        {createError && <span className="form-error" style={{ marginTop: '0.5rem' }}>{createError}</span>}
      </div>

      {loading ? (
        <p>Loading your projects...</p>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--mist)', borderRadius: '8px' }}>
          <p style={{ color: 'var(--slate)' }}>No projects found. Create one to begin writing.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="card card-hover" style={{ display: 'block', textDecoration: 'none' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>{project.title}</h3>
              {project.description && <p style={{ color: 'var(--slate)', fontSize: '0.875rem', marginBottom: '1rem' }}>{project.description}</p>}
              <div style={{ fontSize: '0.75rem', color: 'var(--slate)', marginTop: 'auto' }}>
                Created {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
