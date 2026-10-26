// Bill Detail - View bill with items, payment recording, and linked accounting entry
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getBill, updateBillStatus, recordBillPayment, deleteBill } from '../../utils/accountingApi';
import useSnackbar from '../../utils/useSnackbar';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

function normalizeBill(b) {
  let vendorName = 'Unknown';
  if (typeof b.vendor === 'string' && b.vendor) vendorName = b.vendor;
  else if (b.vendor?.name) vendorName = b.vendor.name;
  else if (b.vendorName) vendorName = b.vendorName;

  return {
    ...b,
    billNumber: b.billNumber || b.bill_number || '',
    vendor: vendorName,
    date: b.date || '',
    dueDate: b.dueDate || b.due_date || '',
    status: b.status || 'pending',
    total: Number(b.total) || 0,
    subtotal: Number(b.subtotal) || 0,
    tax: Number(b.tax) || 0,
    amountPaid: Number(b.amountPaid || b.amount_paid) || 0,
    items: Array.isArray(b.items) ? b.items.map(item => ({
      ...item,
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice || item.unit_price || item.price) || 0,
      taxRate: Number(item.taxRate || item.tax_rate) || 0,
      tax: Number(item.taxAmount || item.tax_amount || item.tax) || 0,
      total: Number(item.total) || 0,
    })) : [],
    payments: Array.isArray(b.payments) ? b.payments.map(p => ({ ...p, amount: Number(p.amount) || 0 })) : [],
  };
}

function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: 0, date: new Date().toISOString().split('T')[0], method: 'Bank Transfer', reference: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchBill = async () => {
      try {
        const response = await getBill(id);
        if (cancelled) return;
        const raw = response.data?.data || response.data;
        setBill(raw?.id ? normalizeBill(raw) : null);
      } catch {
        if (!cancelled) setBill(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBill();
    return () => { cancelled = true; };
  }, [id]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount) || 0);

  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try {
      await updateBillStatus(id, newStatus);
      setBill({ ...bill, status: newStatus });
      showSnackbar(`Bill marked as ${newStatus}.`, 'success');
    } catch (err) {
      // Leave status as-is if the backend rejects it (e.g. can't mark paid
      // without a full payment on record) — never show a status the server disagrees with.
      showSnackbar(err.response?.data?.message || 'Could not update status. Please try again.', 'error');
    }
    setActionLoading(false);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    const payment = { ...paymentData, amount: Number(paymentData.amount) };
    try {
      await recordBillPayment(id, payment);
      const res = await getBill(id);
      const raw = res.data?.data || res.data;
      if (raw?.id) setBill(normalizeBill(raw));
      showSnackbar('Payment recorded successfully.', 'success');
      setShowPaymentForm(false);
      setPaymentData({ amount: 0, date: new Date().toISOString().split('T')[0], method: 'Bank Transfer', reference: '' });
    } catch (err) {
      // Keep the form open and the bill untouched — the payment was not saved.
      showSnackbar(err.response?.data?.message || 'Could not record payment. Please try again.', 'error');
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete bill ${bill?.billNumber || ''}? This cannot be undone.`)) {
      try {
        await deleteBill(id);
        navigate('/bills');
      } catch (err) {
        showSnackbar(err.response?.data?.message || 'Could not delete this bill. Please try again.', 'error');
      }
    }
  };

  if (loading) return <Layout><div className="accounting-page"><div className="acc-loading"><span className="spinner"></span> Loading...</div></div></Layout>;

  if (!bill) return (
    <Layout>
      <div className="accounting-page">
        <Link to="/bills" className="acc-back-link">← Back to Bills</Link>
        <div style={{textAlign:'center',padding:'60px 20px'}}>
          <div style={{fontSize:'48px',marginBottom:'16px',opacity:0.3}}>{ICONS.bill}</div>
          <h2 style={{fontSize:'18px',fontWeight:500,color:'var(--neutral-700)',margin:'0 0 8px'}}>Bill Not Found</h2>
          <p style={{fontSize:'14px',color:'var(--neutral-500)',margin:0}}>The bill you're looking for doesn't exist or could not be loaded.</p>
        </div>
      </div>
    </Layout>
  );

  const balanceDue = bill.total - (bill.amountPaid || 0);

  return (
    <Layout>
      <div className="accounting-page">
        <Link to="/bills" className="acc-back-link">← Back to Bills</Link>
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">{ICONS.bill}</div>
            <div>
              <h1 className="page-title">{bill.billNumber}</h1>
              <p className="page-subtitle">{bill.vendor}</p>
            </div>
          </div>
          <div className="header-actions" style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
            {bill.status !== 'paid' && (
              <Link to={`/bills/${id}/edit`} className="acc-btn acc-btn-secondary">
                {ICONS.edit} Edit
              </Link>
            )}
            {bill.status !== 'paid' && (
              <button className="acc-btn acc-btn-primary" onClick={() => { setPaymentData({...paymentData, amount: balanceDue}); setShowPaymentForm(true); }} disabled={actionLoading}>
                {ICONS.creditCard} Record Payment
              </button>
            )}
            {bill.status === 'pending' && (
              <button className="acc-btn acc-btn-success" onClick={() => handleStatusChange('paid')} disabled={actionLoading}>
                {ICONS.checkCircle} Mark Paid
              </button>
            )}
            <button className="acc-btn acc-btn-danger" onClick={handleDelete} disabled={actionLoading} style={{padding:'8px 14px',fontSize:'13px'}}>
              {ICONS.trash}
            </button>
          </div>
        </div>

        <div className="acc-kpi-grid">
          <div className="acc-kpi-card"><p className="kpi-label">Bill Date</p><p className="kpi-value" style={{fontSize:'18px'}}>{bill.date ? new Date(bill.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</p></div>
          <div className="acc-kpi-card"><p className="kpi-label">Due Date</p><p className="kpi-value" style={{fontSize:'18px'}}>{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</p></div>
          <div className="acc-kpi-card"><p className="kpi-label">Total Amount</p><p className="kpi-value" style={{color:'var(--primary-600)'}}>{formatCurrency(bill.total)}</p></div>
          <div className="acc-kpi-card">
            <p className="kpi-label">Balance Due</p>
            <p className="kpi-value" style={{color: balanceDue > 0 ? 'var(--error-600)' : 'var(--success-700)'}}>{formatCurrency(balanceDue)}</p>
            <span className={`acc-status-badge ${bill.status || 'pending'}`} style={{fontSize:'11px',marginTop:'4px'}}>
              {(bill.status || 'pending').charAt(0).toUpperCase() + (bill.status || 'pending').slice(1)}
            </span>
          </div>
        </div>

        {showPaymentForm && (
          <div className="acc-table-container" style={{padding:'24px',marginBottom:'24px',border:'2px solid var(--primary-400)'}}>
            <h3 style={{margin:'0 0 16px',fontSize:'16px',fontWeight:600}}>{ICONS.creditCard} Record Payment</h3>
            <form onSubmit={handleRecordPayment}>
              <div className="acc-form-row">
                <div className="acc-form-group"><label>Amount *</label><input type="number" min="0" step="0.01" value={paymentData.amount} onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})} required /></div>
                <div className="acc-form-group"><label>Date *</label><input type="date" value={paymentData.date} onChange={(e) => setPaymentData({...paymentData, date: e.target.value})} required /></div>
              </div>
              <div className="acc-form-row">
                <div className="acc-form-group"><label>Payment Method</label>
                  <select value={paymentData.method} onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}>
                    <option>Bank Transfer</option><option>Cash</option><option>UPI</option><option>Cheque</option><option>Credit Card</option>
                  </select>
                </div>
                <div className="acc-form-group"><label>Reference</label><input type="text" value={paymentData.reference} onChange={(e) => setPaymentData({...paymentData, reference: e.target.value})} placeholder="e.g., NEFT-001" /></div>
              </div>
              <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
                <button type="button" className="acc-btn acc-btn-secondary" onClick={() => setShowPaymentForm(false)}>Cancel</button>
                <button type="submit" className="acc-btn acc-btn-primary" disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save Payment'}</button>
              </div>
            </form>
          </div>
        )}

        {(bill.payments?.length > 0) && (
          <div className="acc-table-container" style={{marginBottom:'24px'}}>
            <div className="acc-table-toolbar"><h3 style={{margin:0}}>Payment History</h3></div>
            <table className="acc-table">
              <thead><tr><th>Date</th><th>Method</th><th>Reference</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
              <tbody>
                {bill.payments.map((p, idx) => (
                  <tr key={idx}>
                    <td>{p.date ? new Date(p.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
                    <td>{p.method || '—'}</td>
                    <td style={{fontFamily:'monospace'}}>{p.reference || '-'}</td>
                    <td style={{textAlign:'right'}}><span className="acc-amount credit">{formatCurrency(p.amount)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="acc-table-container" style={{marginBottom:'24px'}}>
          <div className="acc-table-toolbar"><h3 style={{margin:0}}>Line Items</h3></div>
          <table className="acc-table">
            <thead><tr><th>#</th><th>Description</th><th style={{textAlign:'right'}}>Qty</th><th style={{textAlign:'right'}}>Rate</th><th style={{textAlign:'right'}}>Tax</th><th style={{textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {bill.items.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:'center',color:'var(--neutral-400)',padding:'24px'}}>No line items</td></tr>
              ) : bill.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{item.description || '—'}</td>
                  <td style={{textAlign:'right'}}>{item.quantity}</td>
                  <td style={{textAlign:'right'}}>{formatCurrency(item.unitPrice)}</td>
                  <td style={{textAlign:'right'}}>{formatCurrency(item.tax)}</td>
                  <td style={{textAlign:'right',fontWeight:500}}>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{padding:'16px 20px',borderTop:'1px solid var(--neutral-100)',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'6px'}}>
            <div style={{display:'flex',justifyContent:'flex-end',gap:'24px',fontSize:'13px',color:'var(--neutral-600)',width:'260px'}}>
              <span style={{minWidth:'100px',textAlign:'right'}}>Subtotal</span><span style={{minWidth:'110px',textAlign:'right',fontWeight:500}}>{formatCurrency(bill.subtotal)}</span>
            </div>
            {bill.tax > 0 && (
              <div style={{display:'flex',justifyContent:'flex-end',gap:'24px',fontSize:'13px',color:'var(--neutral-600)',width:'260px'}}>
                <span style={{minWidth:'100px',textAlign:'right'}}>Tax</span><span style={{minWidth:'110px',textAlign:'right',fontWeight:500}}>{formatCurrency(bill.tax)}</span>
              </div>
            )}
            <div style={{display:'flex',justifyContent:'flex-end',gap:'24px',fontSize:'15px',fontWeight:600,color:'var(--neutral-900)',paddingTop:'8px',borderTop:'1px solid var(--neutral-200)',width:'260px'}}>
              <span style={{minWidth:'100px',textAlign:'right'}}>Total</span><span style={{minWidth:'110px',textAlign:'right'}}>{formatCurrency(bill.total)}</span>
            </div>
          </div>
        </div>

        <div className="acc-entry-preview">
          <h4>{ICONS.edit} Accounting Entry</h4>
          <table>
            <thead><tr><th>Account</th><th style={{textAlign:'right'}}>Debit</th><th style={{textAlign:'right'}}>Credit</th></tr></thead>
            <tbody>
              <tr><td>Purchases</td><td style={{textAlign:'right'}}><span className="acc-amount debit">{formatCurrency(bill.subtotal)}</span></td><td>-</td></tr>
              {bill.tax > 0 && <tr><td>Input GST</td><td style={{textAlign:'right'}}><span className="acc-amount debit">{formatCurrency(bill.tax)}</span></td><td>-</td></tr>}
              <tr><td>Accounts Payable</td><td>-</td><td style={{textAlign:'right'}}><span className="acc-amount credit">{formatCurrency(bill.total)}</span></td></tr>
            </tbody>
          </table>
        </div>

        {bill.notes && <div style={{marginTop:'24px',padding:'16px',background:'var(--neutral-50)',borderRadius:'10px',fontSize:'14px',color:'var(--neutral-600)'}}><strong>Notes:</strong> {bill.notes}</div>}
      </div>
    </Layout>
  );
}

export default BillDetail;
