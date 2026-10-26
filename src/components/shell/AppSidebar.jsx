// Left navigation for every signed-in page. On narrow screens it becomes an
// off-canvas drawer controlled by Layout (open / onClose).
import { useCallback, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Settings, X } from 'lucide-react';
import { hasAnyPermission } from '../../utils/permissions';
import { getAccountingDashboard } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import { NAV_GROUPS, isPathActive } from './navConfig';

function AppSidebar({ open, onClose }) {
  const location = useLocation();
  const { data: counts } = useAccountingFetch(
    useCallback(() => getAccountingDashboard(), []),
    { pendingInvoices: 0, overdueBills: 0 }
  );

  const groups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => hasAnyPermission(i.anyOf)) }))
    .filter((g) => g.items.length > 0);

  // Collapsible groups start open when they contain the current page
  const [expanded, setExpanded] = useState(() =>
    Object.fromEntries(groups.filter((g) => g.collapsible).map((g) => [
      g.id, g.items.some((i) => isPathActive(location.pathname, i.path)),
    ]))
  );

  return (
    <aside className={`fx-sidebar ${open ? 'is-open' : ''}`} aria-label="Main navigation">
      <div className="fx-sidebar-brand">
        <Link to="/dashboard" className="fx-sidebar-logo" onClick={onClose}>
          <img src="/brand/fin360-logo.png" alt="Fin360 by SYSNAC" />
        </Link>
        <button type="button" className="fx-sidebar-close" onClick={onClose} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <nav className="fx-sidebar-nav">
        {groups.map((group) => {
          const isOpen = !group.collapsible || expanded[group.id];
          return (
            <div className="fx-nav-group" key={group.id}>
              {group.title && (
                group.collapsible ? (
                  <button
                    type="button"
                    className="fx-nav-group-title is-toggle"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded((e) => ({ ...e, [group.id]: !e[group.id] }))}
                  >
                    {group.title}
                    <ChevronDown size={14} className={isOpen ? 'is-rotated' : ''} />
                  </button>
                ) : (
                  <p className="fx-nav-group-title">{group.title}</p>
                )
              )}
              {isOpen && group.items.map((item) => {
                const Icon = item.icon;
                const badge = item.badgeKey ? Number(counts?.[item.badgeKey]) || 0 : 0;
                const active = isPathActive(location.pathname, item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`fx-nav-link ${active ? 'is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={onClose}
                  >
                    <Icon size={18} strokeWidth={1.9} className="fx-nav-icon" />
                    <span className="fx-nav-label">{item.label}</span>
                    {badge > 0 && (
                      <span className={`fx-nav-badge ${item.badgeTone || ''}`}>{badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="fx-sidebar-bottom">
        <Link
          to="/settings"
          className={`fx-nav-link ${location.pathname.startsWith('/settings') ? 'is-active' : ''}`}
          onClick={onClose}
        >
          <Settings size={18} strokeWidth={1.9} className="fx-nav-icon" />
          <span className="fx-nav-label">Settings</span>
        </Link>
      </div>

      <div className="fx-sidebar-foot">
        <img src="/brand/fin360-mark.png" alt="" className="fx-sidebar-foot-mark" />
        <div>
          <strong>Complete financial control.</strong>
          <span>Fin360 by SYSNAC</span>
        </div>
      </div>
    </aside>
  );
}

export default AppSidebar;
