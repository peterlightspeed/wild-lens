import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Drawer from './Drawer';
import Footer from './Footer';
import AuthGateModal from './AuthGateModal';
import ChatWidget from './ChatWidget';
import { useRipple } from '../hooks/useRipple';
import { useAOS } from '../hooks/useAOS';
import { useServiceWorker } from '../hooks/useServiceWorker';

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useRipple();
  useAOS();
  useServiceWorker();

  // Scroll to top on route change (full page loads did this implicitly)
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  return (
    <>
      <Navbar onOpenDrawer={() => setDrawerOpen(true)} />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main>
        <Outlet />
      </main>
      <Footer />
      <AuthGateModal />
      {/* Ask WildLens — floating chat bubble, site-wide, guest-accessible */}
      {location.pathname !== '/chat' && <ChatWidget />}
    </>
  );
}
