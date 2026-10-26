// Split-screen frame for sign-in, forgot-password and reset-password pages:
// brand story on the left, the form on the right (brand panel hides on mobile).
import { ChartColumn, Gem, Layers, PieChart } from 'lucide-react';

const PILLARS = [
  { icon: ChartColumn, title: 'Track everything', text: 'Income, expenses, invoices and bills in one ledger.' },
  { icon: PieChart, title: 'Make better decisions', text: 'Live dashboards and GST-ready reports.' },
  { icon: Gem, title: 'Grow your business', text: 'Quotes to invoices to payments, without the busywork.' },
  { icon: Layers, title: 'All in one place', text: 'Banking, journals and masters under one roof.' },
];

function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <aside className="auth-brand" aria-hidden="true">
        <img src="/brand/fin360-logo-dark.png" alt="" className="auth-brand-logo" />
        <div className="auth-brand-copy">
          <h2>Complete<br />financial control.</h2>
          <p>Manage your income, expenses, accounting, invoices and more — all in one place.</p>
        </div>
        <ul className="auth-pillars">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <li key={p.title}>
                <span className="auth-pillar-icon"><Icon size={18} /></span>
                <span>
                  <strong>{p.title}</strong>
                  <small>{p.text}</small>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="auth-brand-foot">Fin360 by SYSNAC</p>
      </aside>
      <main className="auth-main">
        <img src="/brand/fin360-logo.png" alt="Fin360 by SYSNAC" className="auth-logo" />
        {children}
      </main>
    </div>
  );
}

export default AuthLayout;
