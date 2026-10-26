// Quotation List — feature-rich with quick print, duplicate, convert to invoice
import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import Layout from '../../components/Layout';
import { getQuotations, getQuotation, deleteQuotation, duplicateQuotation, convertQuotationToProforma, getAccountingSettings } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import useSnackbar from '../../utils/useSnackbar';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';
import QuotationPrintView from '../../components/accounting/QuotationPrintView';

// Inline SVG action icons
const ACT = {
  eye: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  edit: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  printer: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  copy: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  proforma: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="18" x2="13" y2="18"/></svg>,
  rupee: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
};

const actionBtnStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '30px', height: '30px', borderRadius: '6px', border: '1px solid transparent',
  background: 'transparent', color: 'var(--neutral-500)', cursor: 'pointer', transition: 'all 0.15s',
  padding: 0, fontFamily: 'inherit',
};

// Soft-tint badges matching the app's own design tokens (src/index.css),
// same visual pattern as .acc-status-badge in Accounting.css.
const STATUS_COLORS = {
  draft: { bg: '#F3F4F6', color: '#4B5563' },     // neutral-100 / neutral-600
  sent: { bg: 'var(--primary-50)', color: 'var(--primary-700)' },      // primary-50 / primary-700
  accepted: { bg: '#F0FDF9', color: '#0F766E' },  // success-50 / success-700
  rejected: { bg: '#FEF2F2', color: '#DC2626' },  // error-50 / error-600
  expired: { bg: '#FEF3C7', color: '#D97706' },   // warning-100 / warning-600
  converted: { bg: '#FAF5FF', color: '#7E22CE' }, // accent-50 / accent-700
};

function QuotationList() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { data: quotations, setData: setQuotations, loading } = useAccountingFetch(getQuotations, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [printingId, setPrintingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const companyRef = useRef(null);
  const quotationSettingsRef = useRef(null);

  // Prefetch company info for quick print
  useEffect(() => {
    let cancelled = false;
    const fetchPrintData = async () => {
      try {
        const sRes = await getAccountingSettings();
        if (cancelled) return;
        const raw = sRes.data?.data || sRes.data;
        if (raw?.company) companyRef.current = raw.company;
        if (raw?.quotation) quotationSettingsRef.current = raw.quotation;
      } catch { /* fallback */ }
    };
    fetchPrintData();
    return () => { cancelled = true; };
  }, []);

  const formatCurrency = (amount, currency = 'INR') =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount) || 0);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const normalizeQuotation = (q) => {
    let customerName = 'Unknown';
    if (typeof q.customer === 'string' && q.customer) customerName = q.customer;
    else if (q.customer?.name) customerName = q.customer.name;
    else if (q.customerName) customerName = q.customerName;
    else if (q.customer_name) customerName = q.customer_name;

    // Determine effective status (auto-expire on client)
    let status = q.status || 'draft';
    const validUntil = q.validUntil || q.valid_until;
    if (validUntil && (status === 'draft' || status === 'sent') && new Date(validUntil) < new Date()) {
      status = 'expired';
    }

    return {
      ...q,
      quotationNumber: q.quotationNumber || q.quotation_number || '',
      customer: customerName,
      date: q.date || '',
      validUntil: validUntil || '',
      status,
      currency: q.currency || 'INR',
      total: Number(q.total) || 0,
      itemCount: Array.isArray(q.items) ? q.items.length : (Number(q.items) || 0),
    };
  };

  const normalizeForPrint = (q) => {
    const customerObj = (q.customer && typeof q.customer === 'object') ? q.customer : null;
    let customerName = 'Unknown';
    if (typeof q.customer === 'string' && q.customer) customerName = q.customer;
    else if (customerObj?.name) customerName = customerObj.name;
    else if (q.customerName) customerName = q.customerName;
    else if (q.customer_name) customerName = q.customer_name;
    return {
      ...q,
      quotationNumber: q.quotationNumber || q.quotation_number || '',
      customer: customerName,
      customerAddress: q.customerAddress || customerObj?.address || '',
      customerGst: q.customerGst || customerObj?.gstNumber || customerObj?.gst_number || '',
      customerEmail: q.customerEmail || customerObj?.email || '',
      customerPhone: q.customerPhone || customerObj?.phone || '',
      customerState: q.customerState || customerObj?.state || '',
      date: q.date || '',
      validUntil: q.validUntil || q.valid_until || '',
      status: q.status || 'draft',
      currency: q.currency || 'INR',
      total: Number(q.total) || 0,
      subtotal: Number(q.subtotal) || 0,
      tax: Number(q.tax) || 0,
      discount: Number(q.discount) || 0,
      exchangeRate: Number(q.exchangeRate || q.exchange_rate) || 1,
      items: Array.isArray(q.items) ? q.items.map(item => ({
        ...item,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice || item.unit_price || item.price) || 0,
        price: Number(item.unitPrice || item.unit_price || item.price) || 0,
        taxRate: Number(item.taxRate || item.tax_rate) || 0,
        tax: Number(item.taxAmount || item.tax_amount || item.tax) || 0,
        discount: Number(item.discount) || 0,
        total: Number(item.total) || 0,
      })) : [],
    };
  };

  const normalized = quotations.map(normalizeQuotation);

  const filtered = normalized.filter(q => {
    const searchStr = `${q.quotationNumber} ${q.customer}`.toLowerCase();
    const matchesSearch = !searchQuery || searchStr.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAll = normalized.reduce((s, q) => s + q.total, 0);
  const totalAccepted = normalized.filter(q => q.status === 'accepted').reduce((s, q) => s + q.total, 0);
  const totalPending = normalized.filter(q => q.status === 'draft' || q.status === 'sent').reduce((s, q) => s + q.total, 0);
  const totalExpired = normalized.filter(q => q.status === 'expired').reduce((s, q) => s + q.total, 0);

  // Quick print
  const handleQuickPrint = useCallback(async (e, qId) => {
    e.stopPropagation();
    setPrintingId(qId);
    try {
      const response = await getQuotation(qId);
      const raw = response.data?.data || response.data;
      if (!raw?.id) { setPrintingId(null); return; }
      const q = normalizeForPrint(raw);

      const styleSheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
      const stylesHTML = styleSheets.map(s => s.tagName === 'LINK' ? s.outerHTML : `<style>${s.innerHTML}</style>`).join('\n');

      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (!printWindow) { alert('Please allow popups to print.'); setPrintingId(null); return; }

      printWindow.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${q.quotationNumber} — Quotation</title>
${stylesHTML}
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{background:var(--neutral-100);font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased}
  .inv-print{background:#fff!important;box-shadow:0 1px 3px rgba(0,0,0,.08);margin:24px auto;border-radius:2px}
  @media print{html,body{background:#fff}.inv-print{box-shadow:none;margin:0;padding:0;border-radius:0;max-width:100%}.no-print{display:none!important}}
  @page{size:A4;margin:12mm 14mm}
</style></head><body>
<div class="no-print" style="display:flex;gap:10px;justify-content:center;padding:14px;background:#fff;border-bottom:1px solid var(--neutral-200)">
  <button onclick="window.print()" style="padding:9px 24px;background:var(--neutral-800);color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit">Print</button>
  <button onclick="window.print()" style="padding:9px 24px;background:#fff;color:var(--neutral-800);border:1px solid var(--neutral-200);border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit">Save as PDF</button>
  <button onclick="window.close()" style="padding:9px 24px;background:#fff;color:var(--neutral-500);border:1px solid var(--neutral-200);border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit">Close</button>
</div>
<div id="print-root"></div></body></html>`);
      printWindow.document.close();

      const printRoot = printWindow.document.getElementById('print-root');
      if (printRoot) {
        const root = createRoot(printRoot);
        root.render(<QuotationPrintView quotation={q} company={companyRef.current} quotationSettings={quotationSettingsRef.current} />);
      }
      printWindow.focus();
    } catch { /* ignore */ }
    setPrintingId(null);
  }, []);

  const handleDelete = async (e, id, quotationNumber) => {
    e.stopPropagation();
    if (window.confirm(`Delete quotation ${quotationNumber || ''}? This cannot be undone.`)) {
      try {
        await deleteQuotation(id);
        setQuotations(quotations.filter(q => q.id !== id));
        showSnackbar('Quotation deleted.', 'success');
      } catch (err) {
        showSnackbar(err.response?.data?.message || 'Could not delete this quotation. Please try again.', 'error');
      }
    }
  };

  const handleDuplicate = async (e, id) => {
    e.stopPropagation();
    setActionLoading(id);
    try {
      const res = await duplicateQuotation(id);
      const newQ = res.data?.data || res.data;
      if (newQ?.id) {
        navigate(`/quotations/${newQ.id}/edit`);
      } else {
        showSnackbar('Could not duplicate this quotation — unexpected response.', 'error');
      }
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Could not duplicate this quotation. Please try again.', 'error');
    }
    setActionLoading(null);
  };

  const handleConvertToProforma = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Convert this quotation to a proforma invoice? This cannot be undone.')) return;
    setActionLoading(id);
    try {
      const res = await convertQuotationToProforma(id);
      const pf = res.data?.data?.proforma || res.data?.proforma || res.data?.data || res.data;
      if (pf?.id) {
        showSnackbar('Quotation converted to proforma invoice.', 'success');
        navigate(`/proforma-invoices/${pf.id}`);
      } else {
        setQuotations(quotations.map(q => q.id === id ? { ...q, status: 'converted' } : q));
        showSnackbar('Quotation converted successfully.', 'success');
      }
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Could not convert this quotation. Please try again.', 'error');
    }
    setActionLoading(null);
  };

  const handleView = (e, id) => {
    e.stopPropagation();
    navigate(`/quotations/${id}`);
  };

  const handleEdit = (e, id) => {
    e.stopPropagation();
    navigate(`/quotations/${id}/edit`);
  };

  const getStatusBadge = (status) => {
    const s = STATUS_COLORS[status] || STATUS_COLORS.draft;
    return (
      <span style={{
        display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '11px',
        fontWeight: 500, background: s.bg, color: s.color, textTransform: 'capitalize',
      }}>
        {status}
      </span>
    );
  };

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">{ICONS.quotation}</div>
            <div>
              <h1 className="page-title">Quotations</h1>
              <p className="page-subtitle">Manage quotations · {normalized.length} total</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="acc-btn acc-btn-primary" onClick={() => navigate('/quotations/create')}>
              {ICONS.plus} New Quotation
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="acc-kpi-grid" style={{gridTemplateColumns:'repeat(4, 1fr)'}}>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ACT.rupee}</div></div>
            <p className="kpi-value">{formatCurrency(totalAll)}</p>
            <p className="kpi-label">Total Quoted</p>
          </div>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ICONS.checkCircle}</div></div>
            <p className="kpi-value">{formatCurrency(totalAccepted)}</p>
            <p className="kpi-label">Accepted ({normalized.filter(q => q.status === 'accepted').length})</p>
          </div>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ICONS.clock}</div></div>
            <p className="kpi-value">{formatCurrency(totalPending)}</p>
            <p className="kpi-label">Pending ({normalized.filter(q => q.status === 'draft' || q.status === 'sent').length})</p>
          </div>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ICONS.alertTriangle}</div></div>
            <p className="kpi-value" style={{color: totalExpired > 0 ? 'var(--error-600)' : undefined}}>{formatCurrency(totalExpired)}</p>
            <p className="kpi-label">Expired ({normalized.filter(q => q.status === 'expired').length})</p>
          </div>
        </div>

        <div className="acc-table-container">
          <div className="acc-table-toolbar">
            <div className="toolbar-left">
              <input className="acc-search-input" type="text" placeholder="Search quotations..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <select className="acc-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
                <option value="converted">Converted</option>
              </select>
            </div>
            <div style={{fontSize:'12px', color:'var(--neutral-500)'}}>
              {filtered.length} quotation{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
          {loading ? (
            <div className="acc-loading"><span className="spinner"></span> Loading...</div>
          ) : (
            <>
            {/* Desktop Table */}
            <div className="acc-desktop-table">
            <table className="acc-table">
              <thead>
                <tr>
                  <th>Quotation #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                  <th style={{textAlign:'right'}}>Amount</th>
                  <th style={{textAlign:'center', width:'160px'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="7" style={{textAlign:'center',padding:'48px 20px',color:'var(--neutral-400)',fontSize:'14px'}}>
                    <div style={{marginBottom:'8px'}}>
                      {ICONS.quotation}
                    </div>
                    {normalized.length === 0 ? 'No quotations yet. Create your first quotation to get started.' : 'No quotations match your filters.'}
                  </td></tr>
                ) : filtered.map(q => {
                  const isExpired = q.status === 'expired';
                  return (
                    <tr key={q.id} onClick={() => navigate(`/quotations/${q.id}`)} style={{cursor:'pointer'}}>
                      <td style={{fontWeight:500, color:'var(--neutral-800)', whiteSpace:'nowrap'}}>{q.quotationNumber}</td>
                      <td style={{maxWidth:'180px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{q.customer}</td>
                      <td style={{whiteSpace:'nowrap', color:'var(--neutral-500)', fontSize:'12px'}}>{formatDate(q.date)}</td>
                      <td style={{whiteSpace:'nowrap', color: isExpired ? '#dc2626' : 'var(--neutral-500)', fontSize:'12px'}}>{formatDate(q.validUntil)}</td>
                      <td>{getStatusBadge(q.status)}</td>
                      <td style={{textAlign:'right', fontWeight:500, fontVariantNumeric:'tabular-nums'}}>
                        {formatCurrency(q.total, q.currency)}
                      </td>
                      <td style={{textAlign:'center'}} onClick={(e) => e.stopPropagation()}>
                        <div style={{display:'flex', gap:'2px', justifyContent:'center'}}>
                          <button style={actionBtnStyle} title="View" onClick={(e) => handleView(e, q.id)}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--neutral-100)'; e.currentTarget.style.color = 'var(--neutral-800)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--neutral-500)'; }}
                          >{ACT.eye}</button>
                          {q.status !== 'converted' && (
                            <button style={actionBtnStyle} title="Edit" onClick={(e) => handleEdit(e, q.id)}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--neutral-100)'; e.currentTarget.style.color = 'var(--neutral-800)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--neutral-500)'; }}
                            >{ACT.edit}</button>
                          )}
                          <button style={actionBtnStyle} title="Print" disabled={printingId === q.id}
                            onClick={(e) => handleQuickPrint(e, q.id)}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--neutral-100)'; e.currentTarget.style.color = 'var(--neutral-800)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--neutral-500)'; }}
                          >{printingId === q.id ? <span className="spinner" style={{width:14,height:14}}></span> : ACT.printer}</button>
                          <button style={actionBtnStyle} title="Duplicate" disabled={actionLoading === q.id}
                            onClick={(e) => handleDuplicate(e, q.id)}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--neutral-100)'; e.currentTarget.style.color = 'var(--neutral-800)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--neutral-500)'; }}
                          >{ACT.copy}</button>
                          {(q.status === 'accepted' || q.status === 'sent' || q.status === 'draft') && q.status !== 'converted' && (
                            <button style={{...actionBtnStyle}} title="Convert to Proforma Invoice" disabled={actionLoading === q.id}
                              onClick={(e) => handleConvertToProforma(e, q.id)}
                              onMouseEnter={e => { e.currentTarget.style.background = '#fef3c7'; e.currentTarget.style.color = '#b45309'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--neutral-500)'; }}
                            >{ACT.proforma}</button>
                          )}
                          <button style={{...actionBtnStyle}} title="Delete"
                            onClick={(e) => handleDelete(e, q.id, q.quotationNumber)}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--neutral-500)'; }}
                          >{ACT.trash}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

            {/* Mobile Card View */}
            <div className="acc-mobile-cards">
              {filtered.length === 0 ? (
                <div style={{textAlign:'center', padding:'40px 16px', color:'var(--neutral-400)', fontSize:'13px'}}>
                  {normalized.length === 0 ? 'No quotations yet.' : 'No quotations match your filters.'}
                </div>
              ) : filtered.map(q => (
                <div key={q.id} className="acc-mobile-card" onClick={() => navigate(`/quotations/${q.id}`)}>
                  <div className="acc-mc-top">
                    <div>
                      <span className="acc-mc-number">{q.quotationNumber}</span>
                      <span style={{marginLeft:'8px'}}>{getStatusBadge(q.status)}</span>
                    </div>
                    <span className="acc-mc-amount">{formatCurrency(q.total, q.currency)}</span>
                  </div>
                  <div className="acc-mc-customer">{q.customer}</div>
                  <div className="acc-mc-meta">
                    <span>{formatDate(q.date)}</span>
                    <span style={{color:'var(--neutral-400)'}}>→</span>
                    <span style={{color: q.status === 'expired' ? '#dc2626' : 'var(--neutral-500)'}}>Valid: {formatDate(q.validUntil)}</span>
                  </div>
                  <div className="acc-mc-bottom">
                    <span style={{fontSize:'12px', color:'var(--neutral-500)'}}>{q.itemCount} item{q.itemCount !== 1 ? 's' : ''}</span>
                    <div className="acc-mc-actions" onClick={e => e.stopPropagation()}>
                      <button className="acc-mc-btn" onClick={(e) => handleView(e, q.id)} title="View">{ACT.eye}</button>
                      {q.status !== 'converted' && (
                        <button className="acc-mc-btn" onClick={(e) => handleEdit(e, q.id)} title="Edit">{ACT.edit}</button>
                      )}
                      <button className="acc-mc-btn" onClick={(e) => handleQuickPrint(e, q.id)} title="Print" disabled={printingId === q.id}>
                        {printingId === q.id ? <span className="spinner" style={{width:13,height:13}}></span> : ACT.printer}
                      </button>
                      {(q.status === 'accepted' || q.status === 'sent' || q.status === 'draft') && q.status !== 'converted' && (
                        <button className="acc-mc-btn" onClick={(e) => handleConvertToProforma(e, q.id)} title="Convert to Proforma Invoice" disabled={actionLoading === q.id}>{ACT.proforma}</button>
                      )}
                      <button className="acc-mc-btn acc-mc-btn-del" onClick={(e) => handleDelete(e, q.id, q.quotationNumber)} title="Delete">{ACT.trash}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default QuotationList;

