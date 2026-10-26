// Notifications — full list view (same data source as the header's notification dropdown)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import '../styles/Accounting.css';

const TYPE_LABELS = {
  invoice_overdue: 'Overdue Invoice',
  invoice_due: 'Invoice Due Soon',
  bill_overdue: 'Overdue Bill',
  quotation_expiring: 'Quotation Expiring',
};

function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (cancelled) return;
        setItems(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchNotifications();
    return () => { cancelled = true; };
  }, []);

  const handleClick = (notif) => {
    // api.js camelCases response keys (invoice_id → invoiceId)
    if (notif.invoiceId) navigate(`/invoices/${notif.invoiceId}`);
    else if (notif.billId) navigate(`/bills/${notif.billId}`);
    else if (notif.quotationId) navigate(`/quotations/${notif.quotationId}`);
  };

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left">
            <div>
              <h1 className="page-title">Notifications</h1>
              <p className="page-subtitle">{items.length} notification{items.length === 1 ? '' : 's'}</p>
            </div>
          </div>
        </div>

        <div className="acc-table-container">
          {loading ? (
            <div className="acc-loading"><span className="spinner"></span> Loading...</div>
          ) : items.length === 0 ? (
            <div style={{textAlign:'center',padding:'48px 20px',color:'var(--neutral-400)'}}>You're all caught up — no notifications.</div>
          ) : (
            <table className="acc-table">
              <thead><tr><th>Type</th><th>Message</th><th>When</th></tr></thead>
              <tbody>
                {items.map(notif => (
                  <tr key={notif.id} onClick={() => handleClick(notif)} style={{cursor: (notif.invoice_id || notif.bill_id || notif.lead_id) ? 'pointer' : 'default'}}>
                    <td><span className={`acc-status-badge ${notif.type?.includes('overdue') ? 'overdue' : 'pending'}`}>{TYPE_LABELS[notif.type] || notif.title}</span></td>
                    <td>{notif.message}</td>
                    <td style={{color:'var(--neutral-500)',fontSize:'13px'}}>{notif.time || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Notifications;
