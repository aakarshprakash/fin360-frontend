// Top bar: menu toggle (mobile), page search, notifications and account menu.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, UserRound } from 'lucide-react';
import api from '../../utils/api';
import { apiLogout, getCurrentUser } from '../../utils/auth';
import { hasAnyPermission } from '../../utils/permissions';
import { NAV_GROUPS, EXTRA_DESTINATIONS } from './navConfig';

const NOTIF_ROUTE = {
  invoiceId: (id) => `/invoices/${id}`,
  billId: (id) => `/bills/${id}`,
  quotationId: (id) => `/quotations/${id}`,
};

function useClickOutside(ref, onOutside, active) {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onOutside(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside, active]);
}

function PageSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  useClickOutside(boxRef, () => setOpen(false), open);

  const destinations = useMemo(() => (
    [...NAV_GROUPS.flatMap((g) => g.items), ...EXTRA_DESTINATIONS]
      .filter((d) => hasAnyPermission(d.anyOf))
  ), []);

  const q = query.trim().toLowerCase();
  const results = q ? destinations.filter((d) => d.label.toLowerCase().includes(q)).slice(0, 7) : [];

  // Ctrl/Cmd+K focuses the search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (d) => {
    navigate(d.path);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => (c + 1) % results.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => (c - 1 + results.length) % results.length); }
    if (e.key === 'Enter') { e.preventDefault(); go(results[cursor] || results[0]); }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className="fx-search" ref={boxRef}>
      <Search size={17} className="fx-search-icon" />
      <input
        ref={inputRef}
        type="search"
        placeholder="Search pages and actions…"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setCursor(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        aria-label="Search pages and actions"
      />
      <kbd className="fx-search-kbd">Ctrl K</kbd>
      {open && q && (
        <div className="fx-popover fx-search-results" role="listbox">
          {results.length === 0 ? (
            <p className="fx-popover-empty">No pages match “{query}”</p>
          ) : results.map((d, i) => {
            const Icon = d.icon;
            return (
              <button
                type="button"
                key={d.path}
                role="option"
                aria-selected={i === cursor}
                className={`fx-search-item ${i === cursor ? 'is-active' : ''}`}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(d)}
              >
                <Icon size={16} />
                <span>{d.label}</span>
                <small>{d.path}</small>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NotificationsMenu() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  useEffect(() => {
    let cancelled = false;
    api.get('/notifications')
      .then((res) => { if (!cancelled) setItems(Array.isArray(res.data?.data) ? res.data.data : []); })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, []);

  const openItem = (n) => {
    const key = Object.keys(NOTIF_ROUTE).find((k) => n[k]);
    setOpen(false);
    if (key) navigate(NOTIF_ROUTE[key](n[key]));
  };

  return (
    <div className="fx-menu" ref={ref}>
      <button
        type="button"
        className="fx-icon-btn"
        aria-label={`Notifications${items.length ? ` (${items.length})` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={19} />
        {items.length > 0 && <span className="fx-dot-count">{items.length > 9 ? '9+' : items.length}</span>}
      </button>
      {open && (
        <div className="fx-popover fx-notif-pop">
          <div className="fx-popover-head">
            <strong>Notifications</strong>
            <Link to="/notifications" onClick={() => setOpen(false)}>View all</Link>
          </div>
          {items.length === 0 ? (
            <p className="fx-popover-empty">You’re all caught up.</p>
          ) : items.slice(0, 6).map((n) => (
            <button type="button" key={n.id} className="fx-notif-item" onClick={() => openItem(n)}>
              <span className={`fx-notif-dot ${String(n.type).includes('overdue') ? 'is-danger' : ''}`} />
              <span className="fx-notif-text">
                <strong>{n.title}</strong>
                <span>{n.message}</span>
              </span>
              {n.time && <small>{n.time}</small>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountMenu() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  const initials = (user?.name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const role = typeof user?.role === 'string' ? user.role : user?.roleData?.name;

  const logout = async () => {
    await apiLogout();
    navigate('/login');
  };

  return (
    <div className="fx-menu" ref={ref}>
      <button type="button" className="fx-account-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="fx-avatar">{initials}</span>
        <span className="fx-account-text">
          <strong>{user?.name || 'Account'}</strong>
          {role && <small>{role}</small>}
        </span>
        <ChevronDown size={15} className="fx-account-caret" />
      </button>
      {open && (
        <div className="fx-popover fx-account-pop">
          <Link to="/settings/profile" onClick={() => setOpen(false)}><UserRound size={16} /> My profile</Link>
          <Link to="/settings" onClick={() => setOpen(false)}><Settings size={16} /> Settings</Link>
          <button type="button" onClick={logout} className="is-danger"><LogOut size={16} /> Sign out</button>
        </div>
      )}
    </div>
  );
}

function TopBar({ onMenu }) {
  return (
    <header className="fx-topbar">
      <button type="button" className="fx-icon-btn fx-menu-toggle" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <Link to="/dashboard" className="fx-topbar-mark" aria-label="Fin360 home">
        <img src="/brand/fin360-mark.png" alt="" />
      </Link>
      <PageSearch />
      <div className="fx-topbar-actions">
        <NotificationsMenu />
        <AccountMenu />
      </div>
    </header>
  );
}

export default TopBar;
