import { Outlet, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import DemoBanner from './DemoBanner';
import AIAdvisorPanel from './ui/AIAdvisorPanel';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  // Auth & loading are now strictly handled by PrivateRoute

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <DemoBanner />
      <Navbar />
      <main className="fade-in" style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <Outlet />
      </main>
      <AIAdvisorPanel />
    </div>
  );
}
