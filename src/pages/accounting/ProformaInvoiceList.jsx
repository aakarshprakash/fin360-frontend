// Proforma Invoice List — feature-rich with quick print, duplicate, convert to invoice
import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import Layout from '../../components/Layout';
import { getProformaInvoices, getProformaInvoice, deleteProformaInvoice, duplicateProformaInvoice, convertProformaToInvoice, getAccountingSettings } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import useSnackbar from '../../utils/useSnackbar';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';
import ProformaInvoicePrintView from '../../components/accounting/ProformaInvoicePrintView';

// Inline SVG action icons
const ACT = {
  eye: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  printer: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  copy: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  convert: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  rupee: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
};

const actionBtnStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '30px', height: '30px', borderRadius: '6px', border: '1px solid transparent',
  background: 'transparent', color: 'var(--neutral-500)', cursor: 'pointer', transition: 'all 0.15s',
  padding: 0, fontFamily: 'inherit',
};

const STATUS_COLORS = {
  draft: { bg: '#F3F4F6', color: '#4B5563' },
  sent: { bg: 'var(--primary-50)', color: 'var(--primary-700)' },
  accepted: { bg: '#F0FDF9', color: '#0F766E' },
  rejected: { bg: '#FEF2F2', color: '#DC2626' },
  expired: { bg: '#FEF3C7', color: '#D97706' },
  converted: { bg: '#FAF5FF', color: '#7E22CE' },
};

function ProformaInvoiceList() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { data: proformas, setData: setProformas, loading } = useAccountingFetch(getProformaInvoices, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [printingId, setPrintingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const companyRef = useRef(null);
  const quotationSettingsRef = useRef(null);

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

  const normalizeProforma = (p) => {
    let customerName = 'Unknown';
    if (typeof p.customer === 'string' && p.customer) customerName = p.customer;
    else if (p.customer?.name) customerName = p.customer.name;
    else if (p.customerName) customerName = p.customerName;
    else if (p.customer_name) customerName = p.customer_name;

    let status = p.status || 'draft';
    const validUntil = p.validUntil || p.valid_until;
    if (validUntil && (status === 'draft' || status === 'sent') && new Date(validUntil) < new Date()) {
      status = 'expired';
    }

    return {
      ...p,
      proformaNumber: p.proformaNumber || p.proforma_number || '',
      customer: customerName,
      date: p.date || '',
      validUntil: validUntil || '',
      status,
      currency: p.currency || 'INR',
      total: Number(p.total) || 0,
      itemCount: Array.isArray(p.items) ? p.items.length : (Number(p.items) || 0),
    };
  };

  const normalizeForPrint = (p) => {
    const customerObj = (p.customer && typeof p.customer === 'object') ? p.customer : null;
    let customerName = 'Unknown';
    if (typeof p.customer === 'string' && p.customer) customerName = p.customer;
    else if (customerObj?.name) customerName = customerObj.name;
    else if (p.customerName) customerName = p.customerName;
    else if (p.customer_name) customerName = p.customer_name;
    return {
      ...p,
      proformaNumber: p.proformaNumber || p.proforma_number || '',
      quotationNumber: p.quotation?.quotationNumber || p.quotation?.quotation_number || '',
      customer: customerName,
      customerAddress: p.customerAddress || customerObj?.address || '',
      customerGst: p.customerGst || customerObj?.gstNumber || customerObj?.gst_number || '',
      customerEmail: p.customerEmail || customerObj?.email || '',
      customerPhone: p.customerPhone || customerObj?.phone || '',
      customerState: p.customerState || customerObj?.state || '',
      date: p.date || '',
      validUntil: p.validUntil || p.valid_until || '',
      status: p.status || 'draft',
      currency: p.currency || 'INR',
      total: Number(p.total) || 0,
      subtotal: Number(p.subtotal) || 0,
      tax: Number(p.tax) || 0,
      discount: Number(p.discount) || 0,
      exchangeRate: Number(p.exchangeRate || p.exchange_rate) || 1,
      items: Array.isArray(p.items) ? p.items.map(item => ({
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

  const normalized = proformas.map(normalizeProforma);

  const filtered = normalized.filter(p => {
    const searchStr = `${p.proformaNumber} ${p.customer}`.toLowerCase();
    const matchesSearch = !searchQuery || searchStr.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAll = normalized.reduce((s, p) => s + p.total, 0);
  const totalAccepted = normalized.filter(p => p.status === 'accepted').reduce((s, p) => s + p.total, 0);
  const totalPending = normalized.filter(p => p.status === 'draft' || p.status === 'sent').reduce((s, p) => s + p.total, 0);
  const totalExpired = normalized.filter(p => p.status === 'expired').reduce((s, p) => s + p.total, 0);

  const handleQuickPrint = useCallback(async (e, pId) => {
    e.stopPropagation();
    setPrintingId(pId);
    try {
      const response = await getProformaInvoice(pId);
      const raw = response.data?.data || response.data;
      if (!raw?.id) { setPrintingId(null); return; }
      const p = normalizeForPrint(raw);

      const styleSheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
      const stylesHTML = styleSheets.map(s => s.tagName === 'LINK' ? s.outerHTML : `<style>${s.innerHTML}</style>`).join('\n');

      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (!printWindow) { alert('Please allow popups to print.'); setPrintingId(null); return; }

      printWindow.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${p.proformaNumber} — Proforma Invoice</title>
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
        root.render(<ProformaInvoicePrintView proforma={p} company={companyRef.current} quotationSettings={quotationSettingsRef.current} />);
      }
      printWindow.focus();
    } catch { /* ignore */ }
    setPrintingId(null);
  }, []);

  const handleDelete = async (e, id, proformaNumber) => {
    e.stopPropagation();
    if (window.confirm(`Delete proforma invoice ${proformaNumber || ''}? This cannot be undone.`)) {
      try {
        await deleteProformaInvoice(id);
        setProformas(proformas.filter(p => p.id !== id));
        showSnackbar('Proforma invoice deleted.', 'success');
      } catch (err) {
        showSnackbar(err.response?.data?.message || 'Could not delete this proforma invoice. Please try again.', 'error');
      }
    }
  };

  const handleDuplicate = async (e, id) => {
    e.stopPropagation();
    setActionLoading(id);
    try {
      const res = await duplicateProformaInvoice(id);
      const newP = res.data?.data || res.data;
      if (newP?.id) {
        navigate(`/proforma-invoices/${newP.id}/edit`);
      } else {
        showSnackbar('Could not duplicate this proforma invoice — unexpected response.', 'error');
      }
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Could not duplicate this proforma invoice. Please try again.', 'error');
    }
    setActionLoading(null);
  };

  const handleConvertToInvoice = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Convert this proforma invoice to an invoice? This cannot be undone.')) return;
    setActionLoading(id);
    try {
      const res = await convertProformaToInvoice(id);
      const inv = res.data?.data?.invoice || res.data?.invoice || res.data?.data || res.data;
      if (inv?.id) {
        showSnackbar('Proforma invoice converted to invoice.', 'success');
        navigate(`/invoices/${inv.id}`);
      } else {
        setProformas(proformas.map(p => p.id === id ? { ...p, status: 'converted' } : p));
        showSnackbar('Proforma invoice converted successfully.', 'success');
      }
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Could not convert this proforma invoice. Please try again.', 'error');
    }
    setActionLoading(null);
  };

  const handleView = (e, id) => {
    e.stopPropagation();
    navigate(`/proforma-invoices/${id}`);
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
              <h1 className="page-title">Proforma Invoices</h1>
              <p className="page-subtitle">Manage proforma invoices · {normalized.length} total</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="acc-btn acc-btn-primary" onClick={() => navigate('/proforma-invoices/create')}>
              {ICONS.plus} New Proforma Invoice
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="acc-kpi-grid" style={{gridTemplateColumns:'repeat(4, 1fr)'}}>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ACT.rupee}</div></div>
            <p className="kpi-value">{formatCurrency(totalAll)}</p>
            <p className="kpi-label">Total Value</p>
          </div>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ICONS.checkCircle}</div></div>
            <p className="kpi-value">{formatCurrency(totalAccepted)}</p>
            <p className="kpi-label">Accepted ({normalized.filter(p => p.status === 'accepted').length})</p>
          </div>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ICONS.clock}</div></div>
            <p className="kpi-value">{formatCurrency(totalPending)}</p>
            <p className="kpi-label">Pending ({normalized.filter(p => p.status === 'draft' || p.status === 'sent').length})</p>
          </div>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ICONS.alertTriangle}</div></div>
            <p className="kpi-value" style={{color: totalExpired > 0 ? 'var(--error-600)' : undefined}}>{formatCurrency(totalExpired)}</p>
            <p className="kpi-label">Expired ({normalized.filter(p => p.status === 'expired').length})</p>
          </div>
        </div>

        <div className="acc-table-container">
          <div className="acc-table-toolbar">
            <div className="toolbar-left">
              <input className="acc-search-input" type="text" placeholder="Search proforma invoices..."
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
              {filtered.length} proforma invoice{filtered.length !== 1 ? 's' : ''}
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
                  <th>Proforma #</th>
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
                    {normalized.length === 0 ? 'No proforma invoices yet. Create one, or convert an accepted quotation.' : 'No proforma invoices match your filters.'}
                  </td></tr>
                ) : filtered.map(p => {
                  const isExpired = p.status === 'expired';
                  return (
                    <tr key={p.id} onClick={() => navigate(`/proforma-invoices/${p.id}`)} style={{cursor:'pointer'}}>
                      <td style={{fontWeight:500, color:'var(--neutral-800)', whiteSpace:'nowrap'}}>{p.proformaNumber}</td>
                      <td style={{maxWidth:'180px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.customer}</td>
                      <td style={{whiteSpace:'nowrap', color:'var(--neutral-500)', fontSize:'12px'}}>{formatDate(p.date)}</td>
                      <td style={{whiteSpace:'nowrap', color: isExpired ? '#dc2626' : 'var(--neutral-500)', fontSize:'12px'}}>{formatDate(p.validUntil)}</td>
                      <td>{getStatusBadge(p.status)}</td>
                      <td style={{textAlign:'right', fontWeight:500, fontVariantNumeric:'tabular-nums'}}>
                        {formatCurrency(p.total, p.currency)}
                      </td>
                      <td style={{textAlign:'center'}} onClick={(e) => e.stopPropagation()}>
                        <div style={{display:'flex', gap:'2px', justifyContent:'center'}}>
                          <button style={actionBtnStyle} title="View" onClick={(e) => handleView(e, p.id)}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--neutral-100)'; e.currentTarget.style.color = 'var(--neutral-800)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--neutral-500)'; }}
                          >{ACT.eye}</button>
                          <button style={actionBtnStyle} title="Print" disabled={printingId === p.id}
                            onClick={(e) => handleQuickPrint(e, p.id)}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--neutral-100)'; e.currentTarget.style.color = 'var(--neutral-800)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--neutral-500)'; }}
                          >{printingId === p.id ? <span className="spinner" style={{width:14,height:14}}></span> : ACT.printer}</button>
                          <button style={actionBtnStyle} title="Duplicate" disabled={actionLoading === p.id}
                            onClick={(e) => handleDuplicate(e, p.id)}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--neutral-100)'; e.currentTarget.style.color = 'var(--neutral-800)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--neutral-500)'; }}
                          >{ACT.copy}</button>
                          {(p.status === 'accepted' || p.status === 'sent' || p.status === 'draft') && p.status !== 'converted' && (
                            <button style={{...actionBtnStyle}} title="Convert to Invoice" disabled={actionLoading === p.id}
                              onClick={(e) => handleConvertToInvoice(e, p.id)}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-100)'; e.currentTarget.style.color = '#4338ca'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--neutral-500)'; }}
                            >{ACT.convert}</button>
                          )}
                          <button style={{...actionBtnStyle}} title="Delete"
                            onClick={(e) => handleDelete(e, p.id, p.proformaNumber)}
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
                  {normalized.length === 0 ? 'No proforma invoices yet.' : 'No proforma invoices match your filters.'}
                </div>
              ) : filtered.map(p => (
                <div key={p.id} className="acc-mobile-card" onClick={() => navigate(`/proforma-invoices/${p.id}`)}>
                  <div className="acc-mc-top">
                    <div>
                      <span className="acc-mc-number">{p.proformaNumber}</span>
                      <span style={{marginLeft:'8px'}}>{getStatusBadge(p.status)}</span>
                    </div>
                    <span className="acc-mc-amount">{formatCurrency(p.total, p.currency)}</span>
                  </div>
                  <div className="acc-mc-customer">{p.customer}</div>
                  <div className="acc-mc-meta">
                    <span>{formatDate(p.date)}</span>
                    <span style={{color:'var(--neutral-400)'}}>→</span>
                    <span style={{color: p.status === 'expired' ? '#dc2626' : 'var(--neutral-500)'}}>Valid: {formatDate(p.validUntil)}</span>
                  </div>
                  <div className="acc-mc-bottom">
                    <span style={{fontSize:'12px', color:'var(--neutral-500)'}}>{p.itemCount} item{p.itemCount !== 1 ? 's' : ''}</span>
                    <div className="acc-mc-actions" onClick={e => e.stopPropagation()}>
                      <button className="acc-mc-btn" onClick={(e) => handleView(e, p.id)} title="View">{ACT.eye}</button>
                      <button className="acc-mc-btn" onClick={(e) => handleQuickPrint(e, p.id)} title="Print" disabled={printingId === p.id}>
                        {printingId === p.id ? <span className="spinner" style={{width:13,height:13}}></span> : ACT.printer}
                      </button>
                      {(p.status === 'accepted' || p.status === 'sent' || p.status === 'draft') && p.status !== 'converted' && (
                        <button className="acc-mc-btn" onClick={(e) => handleConvertToInvoice(e, p.id)} title="Convert to Invoice" disabled={actionLoading === p.id}>{ACT.convert}</button>
                      )}
                      <button className="acc-mc-btn acc-mc-btn-del" onClick={(e) => handleDelete(e, p.id, p.proformaNumber)} title="Delete">{ACT.trash}</button>
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

export default ProformaInvoiceList;
