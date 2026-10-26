// App shell for every signed-in page: sidebar + top bar + content, with a
// bottom tab bar and an off-canvas sidebar on small screens.
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Wallet, ChartColumn, LayoutGrid } from 'lucide-react';
import AppSidebar from './shell/AppSidebar';
import TopBar from './shell/TopBar';
import SettingsFrame from './shell/SettingsFrame';
import FloatingAddButton from './FloatingAddButton';
import { isPathActive } from './shell/navConfig';
import '../styles/AppShell.css';

const MOBILE_TABS = [
  { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Invoices', path: '/invoices', icon: FileText },
  { label: 'Expenses', path: '/expenses', icon: Wallet },
  { label: 'Reports', path: '/reports', icon: ChartColumn },
];

function Layout({ children }) {
  const location = useLocation();
  // The drawer remembers the page it was opened on, so navigating closes it
  const [drawerPath, setDrawerPath] = useState(null);
  const drawerOpen = drawerPath === location.pathname;
  const setDrawerOpen = (open) => setDrawerPath(open ? location.pathname : null);

  useEffect(() => {
    document.body.classList.toggle('fx-drawer-open', drawerOpen);
    return () => document.body.classList.remove('fx-drawer-open');
  }, [drawerOpen]);

  return (
    <div className="fx-shell">
      <AppSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      {drawerOpen && <div className="fx-scrim" onClick={() => setDrawerOpen(false)} aria-hidden="true" />}

      <div className="fx-main">
        <TopBar onMenu={() => setDrawerOpen(true)} />
        <main className="fx-content main-content">
          {location.pathname.startsWith('/settings') ? <SettingsFrame>{children}</SettingsFrame> : children}
        </main>
      </div>

      <FloatingAddButton />

      <nav className="fx-tabbar" aria-label="Quick navigation">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link key={tab.path} to={tab.path} className={`fx-tab ${isPathActive(location.pathname, tab.path) ? 'is-active' : ''}`}>
              <Icon size={20} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
        <button type="button" className="fx-tab" onClick={() => setDrawerOpen(true)}>
          <LayoutGrid size={20} />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}

export default Layout;
