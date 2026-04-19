import { Outlet } from 'react-router-dom';
import Topnav from '../Topnav';
import SellerSidebar from './SellerSidebar';
import DemoBanner from '../DemoBanner';

import AIAdvisorPanel from '../ui/AIAdvisorPanel';

export default function SellerLayout() {
  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', display: 'flex', flexDirection: 'column' }}>
      <DemoBanner />
      <Topnav />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <SellerSidebar />
        <main className="fade-in" style={{ flex: 1, padding: '32px', maxWidth: '1200px', overflowY: 'auto', height: 'calc(100vh - 56px)' }}>
          <Outlet />
        </main>
      </div>
      <AIAdvisorPanel />
    </div>
  );
}
