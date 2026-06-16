import type { AppProps } from 'next/app';
import { AuthProvider } from '../hooks/useAuth';
import { Layout } from '../components/Layout';
import '../styles/globals.css';
import '../styles/components.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}
