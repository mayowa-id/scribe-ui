import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const { logout, isLoading, token } = useAuth();

  // Simple auth guard (Temporarily Disabled)
  /*
  if (!isLoading && !token && router.pathname !== '/login' && router.pathname !== '/register' && router.pathname !== '/verify-email') {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }
  */

  // Don't wrap auth pages or interview page in the standard sidebar layout
  if (router.pathname === '/login' || router.pathname === '/register' || router.pathname === '/interview') {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="app-sidebar-logo">
          Scribe
        </div>
        <nav>
          <Link href="/" className={`app-nav-item ${router.pathname === '/' ? 'active' : ''}`}>
            Dashboard
          </Link>
          <Link href="/interview" className="app-nav-item">
            Voice Profile
          </Link>
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="app-main">
        {children}
      </main>
    </div>
  );
};
