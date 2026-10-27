// Invoice List - Sales module — feature-rich with quick print & view
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import Layout from '../../components/Layout';
import { getInvoices, getInvoice, deleteInvoice } from '../../utils/accountingApi';
import { loadInvoicePrintData, PRINT_PAGE_CSS } from '../../utils/invoicePrintData';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import useSnackbar from '../../utils/useSnackbar';
import Pagination from '../../components/accounting/Pagination';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';
import InvoicePrintView from '../../components/accounting/InvoicePrintView';

// Inline SVG action icons
const ACT = {
  eye: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  printer: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  download: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  rupee: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
};

const actionBtnStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '30px', height: '30px', borderRadius: '6px', border: '1px solid transparent',
  background: 'transparent', color: 'var(--neutral-500)', cursor: 'pointer', transition: 'all 0.15s',
  padding: 0, fontFamily: 'inherit',
};

// Open invoices with something received or credited show as partially paid
const isPartial = (inv) => ['pending', 'overdue'].includes(inv.status) && inv.amountPaid + inv.amountCredited > 0;
const statusText = (inv) => (isPartial(inv) ? 'Partially paid' : inv.status.charAt(0).toUpperCase() + inv.status.slice(1));

function InvoiceList() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search so it doesn't fire a request on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, perPage]);

  const fetchInvoicesPage = useCallback(() => getInvoices({
    page, per_page: perPage,
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  }), [page, perPage, debouncedSearch, statusFilter]);

  const { data: invoices, setData: setInvoices, loading, meta } = useAccountingFetch(
    fetchInvoicesPage, [], { deps: [page, perPage, debouncedSearch, statusFilter] }
  );

  // Lightweight separate call (large page size) purely to compute KPI totals
  // across the whole dataset, independent of the paginated table above.
  const { data: statsInvoices } = useAccountingFetch(
    useCallback(() => getInvoices({ per_page: 1000 }), []), []
  );

  const [printingId, setPrintingId] = useState(null);
  const companyRef = useRef(null);
  const methodsRef = useRef(null);
  const templateRef = useRef('default');
  // Prefetch company info & payment methods for quick print
  useEffect(() => {
    let cancelled = false;
    const fetchPrintData = async () => {
      const data = await loadInvoicePrintData();
      if (cancelled) return;
      companyRef.current = data.company;
      methodsRef.current = data.methods;
      templateRef.current = data.template;
    };
    fetchPrintData();
    return () => { cancelled = true; };
  }, []);

  const formatCurrency = (amount, currency = 'INR') =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount) || 0);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  // Normalize invoice data from API
  const normalizeInvoice = (inv) => {
    let customerName = 'Unknown';
    if (typeof inv.customer === 'string' && inv.customer) customerName = inv.customer;
    else if (inv.customer?.name) customerName = inv.customer.name;
    else if (inv.customerName) customerName = inv.customerName;
    else if (inv.customer_name) customerName = inv.customer_name;

    return {
      ...inv,
      invoiceNumber: inv.invoiceNumber || inv.invoice_number || '',
      customer: customerName,
      date: inv.date || '',
      dueDate: inv.dueDate || inv.due_date || '',
      status: inv.status || 'pending',
      currency: inv.currency || 'INR',
      total: Number(inv.total) || 0,
      amountPaid: Number(inv.amountPaid || inv.amount_paid) || 0,
      amountCredited: Number(inv.amountCredited) || 0,
      itemCount: Array.isArray(inv.items) ? inv.items.length : (Number(inv.items) || 0),
    };
  };

  // Normalize for print (full invoice with items)
  const normalizeForPrint = (inv) => {
    const customerObj = (inv.customer && typeof inv.customer === 'object') ? inv.customer : null;
    let customerName = 'Unknown';
    if (typeof inv.customer === 'string' && inv.customer) customerName = inv.customer;
    else if (customerObj?.name) customerName = customerObj.name;
    else if (inv.customerName) customerName = inv.customerName;
    else if (inv.customer_name) customerName = inv.customer_name;
    return {
      ...inv,
      invoiceNumber: inv.invoiceNumber || inv.invoice_number || '',
      customer: customerName,
      customerAddress: inv.customerAddress || customerObj?.address || '',
      customerGst: inv.customerGst || customerObj?.gstNumber || customerObj?.gst_number || '',
      customerEmail: inv.customerEmail || customerObj?.email || '',
      customerPhone: inv.customerPhone || customerObj?.phone || '',
      customerState: inv.customerState || customerObj?.state || '',
      customerPan: inv.customerPan || customerObj?.pan || '',
      customerContact: inv.customerContact || customerObj?.contactPerson || '',
      date: inv.date || '',
      dueDate: inv.dueDate || inv.due_date || '',
      status: inv.status || 'pending',
      currency: inv.currency || 'INR',
      total: Number(inv.total) || 0,
      subtotal: Number(inv.subtotal) || 0,
      tax: Number(inv.tax) || 0,
      discount: Number(inv.discount) || 0,
      amountPaid: Number(inv.amountPaid || inv.amount_paid) || 0,
      amountCredited: Number(inv.amountCredited) || 0,
      exchangeRate: Number(inv.exchangeRate || inv.exchange_rate) || 1,
      items: Array.isArray(inv.items) ? inv.items.map(item => ({
        ...item,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice || item.unit_price || item.price) || 0,
        price: Number(item.unitPrice || item.unit_price || item.price) || 0,
        taxRate: Number(item.taxRate || item.tax_rate) || 0,
        tax: Number(item.taxAmount || item.tax_amount || item.tax) || 0,
        discount: Number(item.discount) || 0,
        total: Number(item.total) || 0,
      })) : [],
      payments: Array.isArray(inv.payments) ? inv.payments : [],
    };
  };

  // Table data: already filtered/paginated server-side, no client-side re-filtering needed
  const filtered = useMemo(() => invoices.map(normalizeInvoice), [invoices]);

  // KPI totals: computed from the separate whole-dataset stats fetch, not the current page
  const statsNormalized = useMemo(() => statsInvoices.map(normalizeInvoice), [statsInvoices]);
  const totalAll = statsNormalized.reduce((s, i) => s + i.total, 0);
  const totalPending = statsNormalized.filter(i => i.status === 'pending').reduce((s, i) => s + i.total, 0);
  const totalPaid = statsNormalized.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalOverdue = statsNormalized.filter(i => i.status === 'overdue').reduce((s, i) => s + i.total, 0);
  const totalBalance = statsNormalized.reduce((s, i) => s + (i.total - i.amountPaid - i.amountCredited), 0);

  // Quick print — fetches full invoice, opens print window
  const handleQuickPrint = useCallback(async (e, invId) => {
    e.stopPropagation();
    setPrintingId(invId);
    try {
      const response = await getInvoice(invId);
      const raw = response.data?.data || response.data;
      if (!raw?.id) { setPrintingId(null); return; }
      const inv = normalizeForPrint(raw);

      const styleSheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
      const stylesHTML = styleSheets.map(s => s.tagName === 'LINK' ? s.outerHTML : `<style>${s.innerHTML}</style>`).join('\n');

      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (!printWindow) { alert('Please allow popups to print.'); setPrintingId(null); return; }

      printWindow.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${inv.invoiceNumber}</title>
${stylesHTML}
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{background:var(--neutral-100);font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased}
  .inv-print{background:#fff!important;box-shadow:0 1px 3px rgba(0,0,0,.08);margin:24px auto;border-radius:2px}
  ${PRINT_PAGE_CSS}
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
        root.render(<InvoicePrintView invoice={inv} company={companyRef.current} paymentMethods={methodsRef.current} template={templateRef.current} />);
      }
      printWindow.focus();
    } catch { /* ignore */ }
    setPrintingId(null);
  }, []);

  const handleDelete = async (e, id, invoiceNumber) => {
    e.stopPropagation();
    if (window.confirm(`Delete invoice ${invoiceNumber || ''}? This cannot be undone.`)) {
      try {
        await deleteInvoice(id);
        setInvoices(invoices.filter(i => i.id !== id));
        showSnackbar('Invoice deleted.', 'success');
      } catch (err) {
        showSnackbar(err.response?.data?.message || 'Could not delete this invoice. Please try again.', 'error');
      }
    }
  };

  const handleView = (e, id) => {
    e.stopPropagation();
    navigate(`/invoices/${id}`);
  };

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">{ICONS.invoice}</div>
            <div>
              <h1 className="page-title">Sales Invoices</h1>
              <p className="page-subtitle">Manage invoices · {meta?.total ?? statsNormalized.length} total</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="acc-btn acc-btn-primary" onClick={() => navigate('/invoices/create')}>
              {ICONS.plus} New Invoice
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="acc-kpi-grid" style={{gridTemplateColumns:'repeat(4, 1fr)'}}>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ACT.rupee}</div></div>
            <p className="kpi-value">{formatCurrency(totalAll)}</p>
            <p className="kpi-label">Total Invoiced</p>
          </div>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ICONS.clock}</div></div>
            <p className="kpi-value">{formatCurrency(totalPending)}</p>
            <p className="kpi-label">Pending ({statsNormalized.filter(i => i.status === 'pending').length})</p>
          </div>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ICONS.checkCircle}</div></div>
            <p className="kpi-value">{formatCurrency(totalPaid)}</p>
            <p className="kpi-label">Paid ({statsNormalized.filter(i => i.status === 'paid').length})</p>
          </div>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ICONS.alertTriangle}</div></div>
            <p className="kpi-value" style={{color: totalOverdue > 0 ? 'var(--error-600)' : undefined}}>{formatCurrency(totalOverdue)}</p>
            <p className="kpi-label">Overdue ({statsNormalized.filter(i => i.status === 'overdue').length})</p>
          </div>
        </div>

        {/* Outstanding balance bar */}
        {totalBalance > 0 && (
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'12px 20px', marginBottom:'20px', borderRadius:'8px',
            background:'#fffbeb', border:'1px solid #fde68a',
          }}>
            <span style={{fontSize:'13px', fontWeight:500, color:'#92400e'}}>
              Outstanding Balance
            </span>
            <span style={{fontSize:'15px', fontWeight:600, color:'#92400e'}}>
              {formatCurrency(totalBalance)}
            </span>
          </div>
        )}

        <div className="acc-table-container">
          <div className="acc-table-toolbar">
            <div className="toolbar-left">
              <input className="acc-search-input" type="text" placeholder="Search invoices..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <select className="acc-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="partial">Partial</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div style={{fontSize:'12px', color:'var(--neutral-500)'}}>
              {meta?.total ?? filtered.length} invoice{(meta?.total ?? filtered.length) !== 1 ? 's' : ''}
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
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th style={{textAlign:'right'}}>Amount</th>
                  <th style={{textAlign:'right'}}>Balance</th>
                  <th style={{textAlign:'center', width:'120px'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="8" style={{textAlign:'center',padding:'48px 20px',color:'var(--neutral-400)',fontSize:'14px'}}>
                    <div style={{marginBottom:'8px'}}>
                      {ICONS.invoice}
                    </div>
                    {statsNormalized.length === 0 ? 'No invoices yet. Create your first invoice to get started.' : 'No invoices match your filters.'}
                  </td></tr>
                ) : filtered.map(inv => {
                  const balance = inv.total - inv.amountPaid - inv.amountCredited;
                  const isOverdue = inv.status === 'overdue';
                  return (
                    <tr key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)} style={{cursor:'pointer'}}>
                      <td style={{fontWeight:500, color:'var(--neutral-800)', whiteSpace:'nowrap'}}>{inv.invoiceNumber}</td>
                      <td style={{maxWidth:'180px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{inv.customer}</td>
                      <td style={{whiteSpace:'nowrap', color:'var(--neutral-500)', fontSize:'12px'}}>{formatDate(inv.date)}</td>
                      <td style={{whiteSpace:'nowrap', color: isOverdue ? '#dc2626' : 'var(--neutral-500)', fontSize:'12px'}}>{formatDate(inv.dueDate)}</td>
                      <td>
                        <span className={`acc-status-badge ${isPartial(inv) ? 'partial' : inv.status}`}>
                          {statusText(inv)}
                        </span>
                      </td>
                      <td style={{textAlign:'right', fontWeight:500, fontVariantNumeric:'tabular-nums'}}>
                        {formatCurrency(inv.total, inv.currency)}
                      </td>
                      <td style={{textAlign:'right', fontVariantNumeric:'tabular-nums', fontWeight: balance > 0 ? 600 : 400, color: balance > 0 ? '#dc2626' : '#059669', fontSize:'12px'}}>
                        {balance > 0 ? formatCurrency(balance, inv.currency) : 'Paid'}
                      </td>
                      <td style={{textAlign:'center'}} onClick={(e) => e.stopPropagation()}>
                        <div style={{display:'flex', gap:'2px', justifyContent:'center'}}>
                          <button
                            style={actionBtnStyle}
                            title="View Invoice"
                            onClick={(e) => handleView(e, inv.id)}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--neutral-100)'; e.currentTarget.style.color = 'var(--neutral-800)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--neutral-500)'; }}
                          >{ACT.eye}</button>
                          <button
                            style={actionBtnStyle}
                            title="Print Invoice"
                            disabled={printingId === inv.id}
                            onClick={(e) => handleQuickPrint(e, inv.id)}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--neutral-100)'; e.currentTarget.style.color = 'var(--neutral-800)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--neutral-500)'; }}
                          >{printingId === inv.id ? <span className="spinner" style={{width:14,height:14}}></span> : ACT.printer}</button>
                          <button
                            style={{...actionBtnStyle}}
                            title="Delete Invoice"
                            onClick={(e) => handleDelete(e, inv.id, inv.invoiceNumber)}
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
                  {statsNormalized.length === 0 ? 'No invoices yet.' : 'No invoices match your filters.'}
                </div>
              ) : filtered.map(inv => {
                const balance = inv.total - inv.amountPaid - inv.amountCredited;
                return (
                  <div key={inv.id} className="acc-mobile-card" onClick={() => navigate(`/invoices/${inv.id}`)}>
                    <div className="acc-mc-top">
                      <div>
                        <span className="acc-mc-number">{inv.invoiceNumber}</span>
                        <span className={`acc-status-badge ${isPartial(inv) ? 'partial' : inv.status}`} style={{marginLeft:'8px'}}>
                          {statusText(inv)}
                        </span>
                      </div>
                      <span className="acc-mc-amount">{formatCurrency(inv.total, inv.currency)}</span>
                    </div>
                    <div className="acc-mc-customer">{inv.customer}</div>
                    <div className="acc-mc-meta">
                      <span>{formatDate(inv.date)}</span>
                      <span style={{color:'var(--neutral-400)'}}>→</span>
                      <span style={{color: inv.status === 'overdue' ? '#dc2626' : 'var(--neutral-500)'}}>{formatDate(inv.dueDate)}</span>
                    </div>
                    <div className="acc-mc-bottom">
                      <span className="acc-mc-balance" style={{color: balance > 0 ? '#dc2626' : '#059669', fontWeight:500, fontSize:'12px'}}>
                        {balance > 0 ? `Due: ${formatCurrency(balance, inv.currency)}` : '✓ Paid'}
                      </span>
                      <div className="acc-mc-actions" onClick={e => e.stopPropagation()}>
                        <button className="acc-mc-btn" onClick={(e) => handleView(e, inv.id)} title="View">{ACT.eye}</button>
                        <button className="acc-mc-btn" onClick={(e) => handleQuickPrint(e, inv.id)} title="Print" disabled={printingId === inv.id}>
                          {printingId === inv.id ? <span className="spinner" style={{width:13,height:13}}></span> : ACT.printer}
                        </button>
                        <button className="acc-mc-btn acc-mc-btn-del" onClick={(e) => handleDelete(e, inv.id, inv.invoiceNumber)} title="Delete">{ACT.trash}</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}
          <Pagination meta={meta} page={page} onPageChange={setPage} perPage={perPage} onPerPageChange={setPerPage} />
        </div>
      </div>
    </Layout>
  );
}

export default InvoiceList;

