// Quotation Detail — view, edit items, convert to invoice, print/PDF, status management
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import Layout from '../../components/Layout';
import { getQuotation, updateQuotation, updateQuotationStatus, deleteQuotation, convertQuotationToProforma, getAccountingSettings } from '../../utils/accountingApi';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';
import QuotationPrintView from '../../components/accounting/QuotationPrintView';

const taxRateOptions = [
  { id: 1, name: 'GST 18%', rate: 18 },
  { id: 2, name: 'GST 12%', rate: 12 },
  { id: 3, name: 'GST 5%', rate: 5 },
  { id: 4, name: 'No Tax', rate: 0 },
];

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

// Inline SVG micro-icons
const LI_ICONS = {
  package: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="m16.5 9.4-9-5.19"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>,
  pencil: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
};

// ── Editable Line Items Section ──
function LineItemsSection({ quotation, setQuotation, quotationId, formatCurrency, normalizeQuotation }) {
  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const items = Array.isArray(quotation.items) ? quotation.items : [];

  const startEdit = () => {
    setEditItems(items.map(item => ({
      ...item,
      description: item.description || '',
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice || item.price) || 0,
      taxRate: Number(item.taxRate || 0),
      discount: Number(item.discount) || 0,
    })));
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setEditItems([]); };

  const updateEditItem = (idx, field, value) => {
    const updated = [...editItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditItems(updated);
  };

  const addEditItem = () => setEditItems([...editItems, { description: '', quantity: 1, unitPrice: 0, taxRate: 0, discount: 0 }]);
  const removeEditItem = (idx) => { if (editItems.length <= 1) return; setEditItems(editItems.filter((_, i) => i !== idx)); };

  const calcEditItemTotal = (item) => {
    const sub = Number(item.quantity) * Number(item.unitPrice);
    const disc = Number(item.discount) || 0;
    const taxable = sub - disc;
    const taxAmt = taxable * (Number(item.taxRate) / 100);
    return { subtotal: sub, discount: disc, taxAmount: taxAmt, total: taxable + taxAmt };
  };

  const editSubtotal = editItems.reduce((s, item) => s + calcEditItemTotal(item).subtotal, 0);
  const editDiscount = editItems.reduce((s, item) => s + calcEditItemTotal(item).discount, 0);
  const editTax = editItems.reduce((s, item) => s + calcEditItemTotal(item).taxAmount, 0);
  const editTotal = editItems.reduce((s, item) => s + calcEditItemTotal(item).total, 0);

  const saveEdit = async () => {
    setSaving(true);
    try {
      const preparedItems = editItems.map(item => {
        const calc = calcEditItemTotal(item);
        return { description: item.description, quantity: item.quantity, unitPrice: item.unitPrice, discount: calc.discount, taxRate: item.taxRate, taxAmount: calc.taxAmount, total: calc.total };
      });
      const payload = { items: preparedItems, subtotal: editSubtotal, tax: editTax, discount: editDiscount, total: editTotal };
      const response = await updateQuotation(quotationId, payload);
      const raw = response.data?.data || response.data;
      if (raw?.id) { setQuotation(normalizeQuotation(raw)); }
      else { setQuotation({ ...quotation, items: preparedItems.map(it => ({ ...it, price: it.unitPrice, tax: it.taxAmount })), subtotal: editSubtotal, tax: editTax, discount: editDiscount, total: editTotal }); }
    } catch {
      const preparedItems = editItems.map(item => { const calc = calcEditItemTotal(item); return { description: item.description, quantity: item.quantity, unitPrice: item.unitPrice, price: item.unitPrice, discount: calc.discount, taxRate: item.taxRate, taxAmount: calc.taxAmount, tax: calc.taxAmount, total: calc.total }; });
      setQuotation({ ...quotation, items: preparedItems, subtotal: editSubtotal, tax: editTax, discount: editDiscount, total: editTotal });
    }
    setEditing(false); setEditItems([]); setSaving(false);
  };

  const sectionStyle = { marginBottom: '24px', background: '#fff', borderRadius: '12px', border: '1px solid var(--neutral-200)', overflow: 'hidden' };
  const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--neutral-100)' };
  const titleStyle = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 };
  const editBtnStyle = { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', fontSize: '12px', fontWeight: 500, color: 'var(--neutral-600)', background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' };
  const saveBtnStyle = { ...editBtnStyle, color: '#fff', background: 'var(--neutral-800)', border: '1px solid var(--neutral-800)' };
  const numCellStyle = { textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
  const indexStyle = { width: '24px', height: '24px', borderRadius: '6px', background: 'var(--neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 500, color: 'var(--neutral-500)' };
  const colHeaderStyle = { display: 'grid', gridTemplateColumns: '36px 1fr 80px 100px 80px 100px', gap: '0', padding: '8px 20px', background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-100)', fontSize: '11px', fontWeight: 500, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.5px' };
  const itemRowStyle = (isLast) => ({ display: 'grid', gridTemplateColumns: '36px 1fr 80px 100px 80px 100px', gap: '0', alignItems: 'center', padding: '12px 20px', borderBottom: isLast ? 'none' : '1px solid var(--neutral-50)', transition: 'background 0.1s', fontSize: '13px' });
  const totalsStyle = { padding: '16px 20px', borderTop: '1px solid var(--neutral-100)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' };
  const totalRowStyle = (isGrand) => ({ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '24px', fontSize: isGrand ? '15px' : '13px', fontWeight: isGrand ? 700 : 400, color: isGrand ? 'var(--neutral-900)' : 'var(--neutral-600)', paddingTop: isGrand ? '8px' : 0, borderTop: isGrand ? '1px solid var(--neutral-200)' : 'none', width: '260px' });
  const totalLabelStyle = { minWidth: '100px', textAlign: 'right' };
  const totalValueStyle = { minWidth: '110px', textAlign: 'right', fontWeight: 500, fontVariantNumeric: 'tabular-nums' };
  const inputStyle = { width: '100%', padding: '6px 8px', border: '1px solid var(--neutral-200)', borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' };
  const editItemRowStyle = (isLast) => ({ display: 'grid', gridTemplateColumns: '28px 1fr 70px 90px 70px 90px 32px', gap: '8px', alignItems: 'center', padding: '8px 20px', borderBottom: isLast ? 'none' : '1px solid var(--neutral-50)', fontSize: '13px' });
  const editColHeaderStyle = { display: 'grid', gridTemplateColumns: '28px 1fr 70px 90px 70px 90px 32px', gap: '8px', padding: '8px 20px', background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-100)', fontSize: '11px', fontWeight: 500, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.5px' };
  const rmBtnStyle = { width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '6px', background: 'transparent', color: 'var(--neutral-400)', cursor: 'pointer', transition: 'all 0.15s' };

  if (!editing) {
    return (
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>{LI_ICONS.package} <span>Line Items</span> <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--neutral-400)', marginLeft: '4px' }}>({items.length} {items.length === 1 ? 'item' : 'items'})</span></h3>
          {quotation.status !== 'converted' && (
            <button style={editBtnStyle} onClick={startEdit}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--neutral-100)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--neutral-50)'; }}>
              {LI_ICONS.pencil} Edit Items
            </button>
          )}
        </div>
        <div style={colHeaderStyle}><div>#</div><div>Description</div><div style={numCellStyle}>Qty</div><div style={numCellStyle}>Rate</div><div style={numCellStyle}>Tax</div><div style={numCellStyle}>Amount</div></div>
        <div>
          {items.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--neutral-400)', fontSize: '13px' }}>No line items found</div>
          ) : items.map((item, idx) => (
            <div key={idx} style={itemRowStyle(idx === items.length - 1)}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--neutral-25, #fafafa)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              <div><span style={indexStyle}>{idx + 1}</span></div>
              <div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{item.description || '—'}</div>
              <div style={{ ...numCellStyle, color: 'var(--neutral-600)' }}>{item.quantity}</div>
              <div style={numCellStyle}>{formatCurrency(item.unitPrice || item.price)}</div>
              <div style={{ ...numCellStyle, color: 'var(--neutral-500)', fontSize: '12px' }}>{formatCurrency(item.tax)}</div>
              <div style={{ ...numCellStyle, fontWeight: 500, color: 'var(--neutral-800)' }}>{formatCurrency(item.total)}</div>
            </div>
          ))}
        </div>
        <div style={totalsStyle}>
          <div style={totalRowStyle(false)}><span style={totalLabelStyle}>Subtotal</span><span style={totalValueStyle}>{formatCurrency(quotation.subtotal)}</span></div>
          {quotation.tax > 0 && <div style={totalRowStyle(false)}><span style={totalLabelStyle}>Tax</span><span style={totalValueStyle}>{formatCurrency(quotation.tax)}</span></div>}
          {quotation.discount > 0 && <div style={totalRowStyle(false)}><span style={totalLabelStyle}>Discount</span><span style={{...totalValueStyle, color: 'var(--error-600)'}}>−{formatCurrency(quotation.discount)}</span></div>}
          <div style={totalRowStyle(true)}><span style={totalLabelStyle}>Total</span><span style={totalValueStyle}>{formatCurrency(quotation.total)}</span></div>
        </div>
      </div>
    );
  }

  // ── EDIT MODE ──
  return (
    <div style={{ ...sectionStyle, border: '1px solid var(--neutral-300)' }}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>{LI_ICONS.pencil} <span>Editing Line Items</span></h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={editBtnStyle} onClick={cancelEdit} disabled={saving}>{LI_ICONS.x} Cancel</button>
          <button style={saveBtnStyle} onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : <>{LI_ICONS.check} Save Changes</>}</button>
        </div>
      </div>
      <div style={editColHeaderStyle}><div>#</div><div>Description</div><div>Qty</div><div>Rate</div><div>Tax %</div><div style={numCellStyle}>Amount</div><div></div></div>
      <div>
        {editItems.map((item, idx) => {
          const calc = calcEditItemTotal(item);
          return (
            <div key={idx} style={editItemRowStyle(idx === editItems.length - 1)}>
              <div><span style={{ ...indexStyle, width: '22px', height: '22px', fontSize: '10px' }}>{idx + 1}</span></div>
              <div><input style={inputStyle} type="text" placeholder="Item description" value={item.description} onChange={e => updateEditItem(idx, 'description', e.target.value)} /></div>
              <div><input style={{ ...inputStyle, textAlign: 'right' }} type="number" min="1" step="1" value={item.quantity} onChange={e => updateEditItem(idx, 'quantity', Number(e.target.value))} /></div>
              <div><input style={{ ...inputStyle, textAlign: 'right' }} type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateEditItem(idx, 'unitPrice', Number(e.target.value))} /></div>
              <div>
                <select style={{ ...inputStyle, padding: '6px 4px' }} value={item.taxRate} onChange={e => updateEditItem(idx, 'taxRate', Number(e.target.value))}>
                  {taxRateOptions.map(t => <option key={t.id} value={t.rate}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ ...numCellStyle, fontWeight: 500, fontSize: '13px' }}>{formatCurrency(calc.total)}</div>
              <div>{editItems.length > 1 && (<button style={rmBtnStyle} onClick={() => removeEditItem(idx)} title="Remove item" onMouseEnter={e => { e.currentTarget.style.color = 'var(--error-600)'; e.currentTarget.style.background = 'var(--error-50)'; }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--neutral-400)'; e.currentTarget.style.background = 'transparent'; }}>{LI_ICONS.trash}</button>)}</div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: '8px 20px', borderTop: '1px solid var(--neutral-50)' }}>
        <button onClick={addEditItem} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', fontSize: '12px', fontWeight: 500, color: 'var(--neutral-500)', background: 'transparent', border: '1px dashed var(--neutral-300)', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--neutral-700)'; e.currentTarget.style.borderColor = 'var(--neutral-400)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--neutral-500)'; e.currentTarget.style.borderColor = 'var(--neutral-300)'; }}>
          {LI_ICONS.plus} Add line item
        </button>
      </div>
      <div style={totalsStyle}>
        <div style={totalRowStyle(false)}><span style={totalLabelStyle}>Subtotal</span><span style={totalValueStyle}>{formatCurrency(editSubtotal)}</span></div>
        {editDiscount > 0 && <div style={totalRowStyle(false)}><span style={totalLabelStyle}>Discount</span><span style={{...totalValueStyle, color: 'var(--error-600)'}}>−{formatCurrency(editDiscount)}</span></div>}
        {editTax > 0 && <div style={totalRowStyle(false)}><span style={totalLabelStyle}>Tax</span><span style={totalValueStyle}>{formatCurrency(editTax)}</span></div>}
        <div style={totalRowStyle(true)}><span style={totalLabelStyle}>Total</span><span style={totalValueStyle}>{formatCurrency(editTotal)}</span></div>
      </div>
    </div>
  );
}

// ── Main QuotationDetail Component ──
function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [quotationSettings, setQuotationSettings] = useState(null);

  const normalizeQuotation = (q) => {
    const customerObj = (q.customer && typeof q.customer === 'object') ? q.customer : null;
    let customerName = 'Unknown';
    if (typeof q.customer === 'string' && q.customer) customerName = q.customer;
    else if (customerObj?.name) customerName = customerObj.name;
    else if (q.customerName) customerName = q.customerName;
    else if (q.customer_name) customerName = q.customer_name;

    let status = q.status || 'draft';
    const validUntil = q.validUntil || q.valid_until || '';
    if (validUntil && (status === 'draft' || status === 'sent') && new Date(validUntil) < new Date()) {
      status = 'expired';
    }

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
      validUntil,
      status,
      currency: q.currency || 'INR',
      total: Number(q.total) || 0,
      subtotal: Number(q.subtotal) || 0,
      tax: Number(q.tax) || 0,
      discount: Number(q.discount) || 0,
      exchangeRate: Number(q.exchangeRate || q.exchange_rate) || 1,
      notes: q.notes || '',
      termsAndConditions: q.terms_and_conditions || q.termsAndConditions || '',
      convertedInvoiceId: q.converted_invoice_id || q.convertedInvoiceId || null,
      convertedProformaId: q.converted_proforma_id || q.convertedProformaId || null,
      items: Array.isArray(q.items) ? q.items.map(item => ({
        ...item,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice || item.unit_price || item.price) || 0,
        price: Number(item.unitPrice || item.unit_price || item.price) || 0,
        taxRate: Number(item.taxRate || item.tax_rate) || 0,
        tax: Number(item.taxAmount || item.tax_amount || item.tax) || 0,
        discount: Number(item.discount) || 0,
        total: Number(item.total) || 0,
      })) : q.items || [],
    };
  };

  useEffect(() => {
    let cancelled = false;
    const fetchQuotation = async () => {
      try {
        const response = await getQuotation(id);
        if (cancelled) return;
        const raw = response.data?.data || response.data;
        if (raw?.id) { setQuotation(normalizeQuotation(raw)); }
        else { setQuotation(null); }
      } catch { if (!cancelled) setQuotation(null); }
      finally { if (!cancelled) setLoading(false); }
    };
    fetchQuotation();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const fetchPrintData = async () => {
      try {
        const settingsRes = await getAccountingSettings();
        if (cancelled) return;
        const sRaw = settingsRes.data?.data || settingsRes.data;
        if (sRaw?.company) setCompanyInfo(sRaw.company);
        if (sRaw?.quotation) setQuotationSettings(sRaw.quotation);
      } catch { /* fallback */ }
    };
    fetchPrintData();
    return () => { cancelled = true; };
  }, []);

  const handlePrint = useCallback(() => {
    if (!quotation) return;
    const styleSheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
    const stylesHTML = styleSheets.map(s => s.tagName === 'LINK' ? s.outerHTML : `<style>${s.innerHTML}</style>`).join('\n');

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) { alert('Please allow popups to print.'); return; }

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${quotation.quotationNumber} — Quotation</title>
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
      root.render(<QuotationPrintView quotation={quotation} company={companyInfo} quotationSettings={quotationSettings} />);
    }
    printWindow.focus();
  }, [quotation, companyInfo, quotationSettings]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: quotation?.currency || 'INR', maximumFractionDigits: 0 }).format(Number(amount) || 0);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try { await updateQuotationStatus(id, newStatus); } catch { /* fallback */ }
    setQuotation({ ...quotation, status: newStatus });
    setActionLoading(false);
  };

  const handleConvertToProforma = async () => {
    if (!window.confirm('Convert this quotation to a proforma invoice? The quotation will be marked as converted.')) return;
    setActionLoading(true);
    try {
      const res = await convertQuotationToProforma(id);
      const pf = res.data?.data?.proforma || res.data?.proforma || res.data?.data || res.data;
      if (pf?.id) { navigate(`/proforma-invoices/${pf.id}`); }
      else { setQuotation({ ...quotation, status: 'converted' }); alert('Converted to proforma invoice successfully.'); }
    } catch {
      alert('Convert to proforma invoice API not available yet.');
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try { await deleteQuotation(id); } catch { /* fallback */ }
      navigate('/quotations');
    }
  };

  const getStatusBadge = (status) => {
    const s = STATUS_COLORS[status] || STATUS_COLORS.draft;
    return (
      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 500, background: s.bg, color: s.color, textTransform: 'capitalize' }}>
        {status}
      </span>
    );
  };

  if (loading) return <Layout><div className="accounting-page"><div className="acc-loading"><span className="spinner"></span> Loading...</div></div></Layout>;

  if (!quotation) return (
    <Layout>
      <div className="accounting-page">
        <Link to="/quotations" className="acc-back-link">← Back to Quotations</Link>
        <div style={{textAlign:'center',padding:'60px 20px'}}>
          <div style={{fontSize:'48px',marginBottom:'16px',opacity:0.3}}>{ICONS.quotation}</div>
          <h2 style={{fontSize:'18px',fontWeight:500,color:'var(--neutral-700)',margin:'0 0 8px'}}>Quotation Not Found</h2>
          <p style={{fontSize:'14px',color:'var(--neutral-500)',margin:0}}>The quotation you&apos;re looking for doesn&apos;t exist or could not be loaded.</p>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="accounting-page">
        <Link to="/quotations" className="acc-back-link">← Back to Quotations</Link>
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">{ICONS.quotation}</div>
            <div>
              <h1 className="page-title">{quotation.quotationNumber}</h1>
              <p className="page-subtitle">{quotation.customer}</p>
            </div>
          </div>
          <div className="header-actions" style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
            <button className="acc-btn acc-btn-secondary" onClick={() => setShowPrintPreview(true)}>
              {ICONS.printer} Preview
            </button>
            <button className="acc-btn acc-btn-secondary" onClick={handlePrint}>
              {ICONS.download} Save PDF
            </button>
            {quotation.status !== 'converted' && (
              <button className="acc-btn acc-btn-secondary" onClick={() => navigate(`/quotations/${id}/edit`)}>
                {ICONS.edit} Edit
              </button>
            )}
            {(quotation.status === 'draft' || quotation.status === 'sent' || quotation.status === 'accepted') && quotation.status !== 'converted' && (
              <button className="acc-btn acc-btn-primary" onClick={handleConvertToProforma} disabled={actionLoading}>
                {ICONS.repeat} Convert to Proforma Invoice
              </button>
            )}
            <button className="acc-btn acc-btn-danger" onClick={handleDelete} disabled={actionLoading} style={{padding:'8px 14px',fontSize:'13px'}}>
              {ICONS.trash}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="acc-kpi-grid">
          <div className="acc-kpi-card">
            <p className="kpi-label">Quotation Date</p>
            <p className="kpi-value" style={{fontSize:'18px'}}>{formatDate(quotation.date)}</p>
          </div>
          <div className="acc-kpi-card">
            <p className="kpi-label">Valid Until</p>
            <p className="kpi-value" style={{fontSize:'18px', color: quotation.status === 'expired' ? 'var(--error-600)' : undefined}}>{formatDate(quotation.validUntil)}</p>
          </div>
          <div className="acc-kpi-card">
            <p className="kpi-label">Total Amount</p>
            <p className="kpi-value" style={{color:'var(--primary-600)'}}>{formatCurrency(quotation.total)}</p>
          </div>
          <div className="acc-kpi-card">
            <p className="kpi-label">Status</p>
            <div style={{marginTop:'4px'}}>{getStatusBadge(quotation.status)}</div>
            {quotation.convertedInvoiceId && (
              <Link to={`/invoices/${quotation.convertedInvoiceId}`} style={{fontSize:'11px',color:'var(--primary-600)',marginTop:'6px',display:'block'}}>
                View Invoice →
              </Link>
            )}
            {!quotation.convertedInvoiceId && quotation.convertedProformaId && (
              <Link to={`/proforma-invoices/${quotation.convertedProformaId}`} style={{fontSize:'11px',color:'var(--primary-600)',marginTop:'6px',display:'block'}}>
                View Proforma Invoice →
              </Link>
            )}
          </div>
        </div>

        {/* Status Actions Bar */}
        {quotation.status !== 'converted' && (
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 20px', marginBottom:'20px', borderRadius:'8px', background:'var(--neutral-50)', border:'1px solid var(--neutral-200)', flexWrap:'wrap' }}>
            <span style={{fontSize:'13px', fontWeight:500, color:'var(--neutral-700)', marginRight:'8px'}}>Change Status:</span>
            {quotation.status === 'draft' && (
              <button className="acc-btn acc-btn-secondary" style={{padding:'5px 14px',fontSize:'12px'}} onClick={() => handleStatusChange('sent')} disabled={actionLoading}>
                {ICONS.send} Mark as Sent
              </button>
            )}
            {(quotation.status === 'draft' || quotation.status === 'sent') && (
              <>
                <button className="acc-btn acc-btn-success" style={{padding:'5px 14px',fontSize:'12px'}} onClick={() => handleStatusChange('accepted')} disabled={actionLoading}>
                  {ICONS.checkCircle} Accept
                </button>
                <button className="acc-btn acc-btn-danger" style={{padding:'5px 14px',fontSize:'12px'}} onClick={() => handleStatusChange('rejected')} disabled={actionLoading}>
                  {ICONS.close} Reject
                </button>
              </>
            )}
            {quotation.status === 'rejected' && (
              <button className="acc-btn acc-btn-secondary" style={{padding:'5px 14px',fontSize:'12px'}} onClick={() => handleStatusChange('draft')} disabled={actionLoading}>
                Reopen as Draft
              </button>
            )}
          </div>
        )}

        {/* Line Items Section */}
        <LineItemsSection
          quotation={quotation}
          setQuotation={setQuotation}
          quotationId={id}
          formatCurrency={formatCurrency}
          normalizeQuotation={normalizeQuotation}
        />

        {/* Notes & Terms */}
        {(quotation.notes || quotation.termsAndConditions) && (
          <div style={{display:'flex',gap:'20px',marginTop:'24px',flexWrap:'wrap'}}>
            {quotation.notes && (
              <div style={{flex:1,minWidth:'240px',padding:'16px',background:'var(--neutral-50)',borderRadius:'10px',fontSize:'14px',color:'var(--neutral-600)'}}>
                <strong>Notes:</strong> {quotation.notes}
              </div>
            )}
            {quotation.termsAndConditions && (
              <div style={{flex:1,minWidth:'240px',padding:'16px',background:'var(--neutral-50)',borderRadius:'10px',fontSize:'14px',color:'var(--neutral-600)'}}>
                <strong>Terms & Conditions:</strong> {quotation.termsAndConditions}
              </div>
            )}
          </div>
        )}

        {/* Print Preview Modal */}
        {showPrintPreview && (
          <div className="invoice-preview-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowPrintPreview(false); }}>
            <div className="invoice-preview-container">
              <div className="invoice-preview-toolbar">
                <div className="invoice-preview-toolbar-title">
                  {ICONS.quotation} Quotation Preview — {quotation.quotationNumber}
                </div>
                <div className="invoice-preview-toolbar-actions">
                  <button className="acc-btn acc-btn-primary" onClick={handlePrint}>{ICONS.printer} Print</button>
                  <button className="acc-btn acc-btn-secondary" onClick={handlePrint}>{ICONS.download} Save PDF</button>
                  <button className="acc-btn acc-btn-secondary" onClick={() => setShowPrintPreview(false)}>{ICONS.close}</button>
                </div>
              </div>
              <div className="invoice-preview-body">
                <QuotationPrintView quotation={quotation} company={companyInfo} quotationSettings={quotationSettings} />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default QuotationDetail;

