// Wraps every /settings/* page with a grouped sub-navigation so all master
// data and configuration live in one predictable place.
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { hasAnyPermission } from '../../utils/permissions';
import { SETTINGS_GROUPS, isPathActive } from './navConfig';

function SettingsFrame({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const groups = SETTINGS_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => hasAnyPermission(i.anyOf)) }))
    .filter((g) => g.items.length > 0);
  const current = groups.flatMap((g) => g.items).find((i) => isPathActive(pathname, i.path));

  return (
    <div className="fx-settings">
      <aside className="fx-settings-nav" aria-label="Settings sections">
        <div className="fx-settings-nav-head">
          <h1>Settings</h1>
          <p>Organization, finance masters and access</p>
        </div>

        {/* Small screens: one compact jump menu instead of the full list */}
        <select
          className="fx-settings-jump"
          value={current?.path || ''}
          onChange={(e) => navigate(e.target.value)}
          aria-label="Choose a settings section"
        >
          {groups.map((g) => (
            <optgroup key={g.id} label={g.title}>
              {g.items.map((i) => <option key={i.path} value={i.path}>{i.label}</option>)}
            </optgroup>
          ))}
        </select>

        <nav className="fx-settings-groups">
          {groups.map((g) => (
            <div key={g.id} className="fx-settings-group">
              <p className="fx-settings-group-title">{g.title}</p>
              {g.items.map((item) => {
                const Icon = item.icon;
                const active = isPathActive(pathname, item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`fx-settings-link ${active ? 'is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={16} strokeWidth={1.9} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <section className="fx-settings-body">
        {current && (
          <div className="fx-settings-crumb">
            <span>Settings</span>
            <span aria-hidden="true">/</span>
            <strong>{current.label}</strong>
          </div>
        )}
        {children}
      </section>
    </div>
  );
}

export default SettingsFrame;
