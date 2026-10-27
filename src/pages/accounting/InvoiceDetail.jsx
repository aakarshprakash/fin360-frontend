// Invoice Detail - View invoice with items, accounting entry, payment recording, print & save
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import Layout from '../../components/Layout';
import { getInvoice, updateInvoice, deleteInvoice, voidInvoicePayment, voidCreditNote } from '../../utils/accountingApi';
import { FileMinus, Wallet } from 'lucide-react';
import InvoicePaymentModal from '../../components/accounting/InvoicePaymentModal';
import CreditNoteModal from '../../components/accounting/CreditNoteModal';
import '../../styles/InvoiceSettlement.css';
import { loadInvoicePrintData, PRINT_PAGE_CSS } from '../../utils/invoicePrintData';
import useSnackbar from '../../utils/useSnackbar';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';
import InvoicePrintView from '../../components/accounting/InvoicePrintView';


const taxRateOptions = [
  { id: 1, name: 'GST 18%', rate: 18 },
  { id: 2, name: 'GST 12%', rate: 12 },
  { id: 3, name: 'GST 5%', rate: 5 },
  { id: 4, name: 'No Tax', rate: 0 },
];

// Inline SVG micro-icons for line items section
const LI_ICONS = {
  package: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="m16.5 9.4-9-5.19"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/>
    </svg>
  ),
  pencil: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  hash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
    </svg>
  ),
};

function LineItemsSection({ invoice, setInvoice, invoiceId, formatCurrency, normalizeInvoice, showSnackbar }) {
  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const items = Array.isArray(invoice.items) ? invoice.items : [];

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

  const cancelEdit = () => {
    setEditing(false);
    setEditItems([]);
  };

  const updateEditItem = (idx, field, value) => {
    const updated = [...editItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setEditItems(updated);
  };

  const addEditItem = () => {
    setEditItems([...editItems, { description: '', quantity: 1, unitPrice: 0, taxRate: 0, discount: 0 }]);
  };

  const removeEditItem = (idx) => {
    if (editItems.length <= 1) return;
    setEditItems(editItems.filter((_, i) => i !== idx));
  };

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
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: calc.discount,
          taxRate: item.taxRate,
          taxAmount: calc.taxAmount,
          total: calc.total,
        };
      });

      const payload = {
        items: preparedItems,
        subtotal: editSubtotal,
        tax: editTax,
        discount: editDiscount,
        total: editTotal,
      };

      const response = await updateInvoice(invoiceId, payload);
      const raw = response.data?.data || response.data;
      if (raw?.id) {
        setInvoice(normalizeInvoice(raw));
      } else {
        // Backend accepted the request but didn't echo the updated invoice —
        // reflect what we sent, since the save itself is confirmed successful.
        setInvoice({
          ...invoice,
          items: preparedItems.map(it => ({
            ...it,
            price: it.unitPrice,
            tax: it.taxAmount,
          })),
          subtotal: editSubtotal,
          tax: editTax,
          discount: editDiscount,
          total: editTotal,
        });
      }
      setEditing(false);
      setEditItems([]);
    } catch (err) {
      // Do NOT apply the edit locally — the save actually failed, so showing
      // it as applied would hide real data loss from the user.
      showSnackbar(err.response?.data?.message || 'Could not save line items. Please try again.', 'error');
    }
    setSaving(false);
  };

  // Styles
  const sectionStyle = {
    marginBottom: '24px',
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid var(--neutral-200)',
    overflow: 'hidden',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--neutral-100)',
  };

  const titleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--neutral-800)',
    margin: 0,
  };

  const editBtnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--neutral-600)',
    background: 'var(--neutral-50)',
    border: '1px solid var(--neutral-200)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'inherit',
  };

  const saveBtnStyle = {
    ...editBtnStyle,
    color: '#fff',
    background: 'var(--neutral-800)',
    border: '1px solid var(--neutral-800)',
  };

  const cancelBtnStyle = {
    ...editBtnStyle,
  };

  const itemCardStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '0',
  };

  const itemRowStyle = (isLast) => ({
    display: 'grid',
    gridTemplateColumns: '36px 1fr 80px 100px 80px 100px',
    gap: '0',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: isLast ? 'none' : '1px solid var(--neutral-50)',
    transition: 'background 0.1s',
    fontSize: '13px',
  });

  const colHeaderStyle = {
    display: 'grid',
    gridTemplateColumns: '36px 1fr 80px 100px 80px 100px',
    gap: '0',
    padding: '8px 20px',
    background: 'var(--neutral-50)',
    borderBottom: '1px solid var(--neutral-100)',
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--neutral-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const numCellStyle = {
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  };

  const indexStyle = {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    background: 'var(--neutral-100)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--neutral-500)',
  };

  const totalsStyle = {
    padding: '16px 20px',
    borderTop: '1px solid var(--neutral-100)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px',
  };

  const totalRowStyle = (isGrand) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '24px',
    fontSize: isGrand ? '15px' : '13px',
    fontWeight: isGrand ? 700 : 400,
    color: isGrand ? 'var(--neutral-900)' : 'var(--neutral-600)',
    paddingTop: isGrand ? '8px' : 0,
    borderTop: isGrand ? '1px solid var(--neutral-200)' : 'none',
    width: '260px',
  });

  const totalLabelStyle = {
    minWidth: '100px',
    textAlign: 'right',
  };

  const totalValueStyle = {
    minWidth: '110px',
    textAlign: 'right',
    fontWeight: 500,
    fontVariantNumeric: 'tabular-nums',
  };

  // Edit mode input style
  const inputStyle = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid var(--neutral-200)',
    borderRadius: '6px',
    fontSize: '12px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fff',
  };

  const editItemRowStyle = (isLast) => ({
    display: 'grid',
    gridTemplateColumns: '28px 1fr 70px 90px 70px 90px 32px',
    gap: '8px',
    alignItems: 'center',
    padding: '8px 20px',
    borderBottom: isLast ? 'none' : '1px solid var(--neutral-50)',
    fontSize: '13px',
  });

  const editColHeaderStyle = {
    display: 'grid',
    gridTemplateColumns: '28px 1fr 70px 90px 70px 90px 32px',
    gap: '8px',
    padding: '8px 20px',
    background: 'var(--neutral-50)',
    borderBottom: '1px solid var(--neutral-100)',
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--neutral-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const rmBtnStyle = {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '6px',
    background: 'transparent',
    color: 'var(--neutral-400)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  // ─── VIEW MODE ─────────────────────────────────
  if (!editing) {
    return (
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>
            {LI_ICONS.package}
            <span>Line Items</span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--neutral-400)', marginLeft: '4px' }}>
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          </h3>
          {invoice.status !== 'paid' && (
            <button style={editBtnStyle} onClick={startEdit}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--neutral-100)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--neutral-50)'; }}>
              {LI_ICONS.pencil} Edit Items
            </button>
          )}
        </div>

        {/* Column Headers */}
        <div style={colHeaderStyle}>
          <div>#</div>
          <div>Description</div>
          <div style={numCellStyle}>Qty</div>
          <div style={numCellStyle}>Rate</div>
          <div style={numCellStyle}>Tax</div>
          <div style={numCellStyle}>Amount</div>
        </div>

        {/* Item Rows */}
        <div style={itemCardStyle}>
          {items.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--neutral-400)', fontSize: '13px' }}>
              No line items found
            </div>
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

        {/* Totals */}
        <div style={totalsStyle}>
          <div style={totalRowStyle(false)}>
            <span style={totalLabelStyle}>Subtotal</span>
            <span style={totalValueStyle}>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.tax > 0 && (
            <div style={totalRowStyle(false)}>
              <span style={totalLabelStyle}>Tax</span>
              <span style={totalValueStyle}>{formatCurrency(invoice.tax)}</span>
            </div>
          )}
          {invoice.discount > 0 && (
            <div style={totalRowStyle(false)}>
              <span style={{...totalLabelStyle}}>Discount</span>
              <span style={{...totalValueStyle, color: 'var(--error-600)'}}>−{formatCurrency(invoice.discount)}</span>
            </div>
          )}
          <div style={totalRowStyle(true)}>
            <span style={totalLabelStyle}>Total</span>
            <span style={totalValueStyle}>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── EDIT MODE ─────────────────────────────────
  return (
    <div style={{ ...sectionStyle, border: '1px solid var(--neutral-300)' }}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>
          {LI_ICONS.pencil}
          <span>Editing Line Items</span>
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={cancelBtnStyle} onClick={cancelEdit} disabled={saving}>
            {LI_ICONS.x} Cancel
          </button>
          <button style={saveBtnStyle} onClick={saveEdit} disabled={saving}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
            {saving ? 'Saving...' : <>{LI_ICONS.check} Save Changes</>}
          </button>
        </div>
      </div>

      {/* Edit Column Headers */}
      <div style={editColHeaderStyle}>
        <div>#</div>
        <div>Description</div>
        <div>Qty</div>
        <div>Rate</div>
        <div>Tax %</div>
        <div style={numCellStyle}>Amount</div>
        <div></div>
      </div>

      {/* Editable Item Rows */}
      <div style={itemCardStyle}>
        {editItems.map((item, idx) => {
          const calc = calcEditItemTotal(item);
          return (
            <div key={idx} style={editItemRowStyle(idx === editItems.length - 1)}>
              <div><span style={{ ...indexStyle, width: '22px', height: '22px', fontSize: '10px' }}>{idx + 1}</span></div>
              <div>
                <input style={inputStyle} type="text" placeholder="Item description"
                  value={item.description} onChange={e => updateEditItem(idx, 'description', e.target.value)} />
              </div>
              <div>
                <input style={{ ...inputStyle, textAlign: 'right' }} type="number" min="1" step="1"
                  value={item.quantity} onChange={e => updateEditItem(idx, 'quantity', Number(e.target.value))} />
              </div>
              <div>
                <input style={{ ...inputStyle, textAlign: 'right' }} type="number" min="0" step="0.01"
                  value={item.unitPrice} onChange={e => updateEditItem(idx, 'unitPrice', Number(e.target.value))} />
              </div>
              <div>
                <select style={{ ...inputStyle, padding: '6px 4px' }}
                  value={item.taxRate} onChange={e => updateEditItem(idx, 'taxRate', Number(e.target.value))}>
                  {taxRateOptions.map(t => <option key={t.id} value={t.rate}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ ...numCellStyle, fontWeight: 500, fontSize: '13px' }}>
                {formatCurrency(calc.total)}
              </div>
              <div>
                {editItems.length > 1 && (
                  <button style={rmBtnStyle} onClick={() => removeEditItem(idx)} title="Remove item"
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--error-600)'; e.currentTarget.style.background = 'var(--error-50)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--neutral-400)'; e.currentTarget.style.background = 'transparent'; }}>
                    {LI_ICONS.trash}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Item Button */}
      <div style={{ padding: '8px 20px', borderTop: '1px solid var(--neutral-50)' }}>
        <button onClick={addEditItem}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '6px 14px', fontSize: '12px', fontWeight: 500,
            color: 'var(--neutral-500)', background: 'transparent',
            border: '1px dashed var(--neutral-300)', borderRadius: '6px',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--neutral-700)'; e.currentTarget.style.borderColor = 'var(--neutral-400)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--neutral-500)'; e.currentTarget.style.borderColor = 'var(--neutral-300)'; }}>
          {LI_ICONS.plus} Add line item
        </button>
      </div>

      {/* Edit Totals */}
      <div style={totalsStyle}>
        <div style={totalRowStyle(false)}>
          <span style={totalLabelStyle}>Subtotal</span>
          <span style={totalValueStyle}>{formatCurrency(editSubtotal)}</span>
        </div>
        {editDiscount > 0 && (
          <div style={totalRowStyle(false)}>
            <span style={totalLabelStyle}>Discount</span>
            <span style={{...totalValueStyle, color: 'var(--error-600)'}}>−{formatCurrency(editDiscount)}</span>
          </div>
        )}
        {editTax > 0 && (
          <div style={totalRowStyle(false)}>
            <span style={totalLabelStyle}>Tax</span>
            <span style={totalValueStyle}>{formatCurrency(editTax)}</span>
          </div>
        )}
        <div style={totalRowStyle(true)}>
          <span style={totalLabelStyle}>Total</span>
          <span style={totalValueStyle}>{formatCurrency(editTotal)}</span>
        </div>
      </div>
    </div>
  );
}

function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null); // 'payment' | 'credit'
  const [actionLoading, setActionLoading] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [paymentMethodsList, setPaymentMethodsList] = useState([]);
  const [printTemplate, setPrintTemplate] = useState('default');

  // Normalize API response to match frontend expectations
  const normalizeInvoice = (inv) => {
    const customerObj = (inv.customer && typeof inv.customer === 'object') ? inv.customer : null;
    let customerName = 'Unknown';
    if (typeof inv.customer === 'string' && inv.customer) customerName = inv.customer;
    else if (customerObj?.name) customerName = customerObj.name;
    else if (inv.customerName) customerName = inv.customerName;

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
      exchangeRate: Number(inv.exchangeRate) || 1,
      items: Array.isArray(inv.items) ? inv.items.map(item => ({
        ...item,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice || item.unit_price || item.price) || 0,
        price: Number(item.unitPrice || item.unit_price || item.price) || 0,
        taxRate: Number(item.taxRate || item.tax_rate) || 0,
        tax: Number(item.taxAmount || item.tax_amount || item.tax) || 0,
        discount: Number(item.discount) || 0,
        total: Number(item.total) || 0,
      })) : inv.items || [],
      payments: Array.isArray(inv.payments) ? inv.payments.map(p => ({
        ...p,
        amount: Number(p.amount) || 0,
      })) : inv.payments || [],
      creditNotes: Array.isArray(inv.creditNotes) ? inv.creditNotes.map(c => ({
        ...c,
        total: Number(c.total) || 0,
      })) : [],
    };
  };

  useEffect(() => {
    let cancelled = false;
    const fetchInvoice = async () => {
      try {
        const response = await getInvoice(id);
        if (cancelled) return;
        const raw = response.data?.data || response.data;
        if (raw?.id) {
          setInvoice(normalizeInvoice(raw));
        } else {
          setInvoice(null);
        }
      } catch {
        if (cancelled) return;
        setInvoice(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchInvoice();
    return () => { cancelled = true; };
  }, [id]);

  // Fetch company info and payment methods for print view
  useEffect(() => {
    let cancelled = false;
    const fetchPrintData = async () => {
      const data = await loadInvoicePrintData();
      if (cancelled) return;
      if (data.company) setCompanyInfo(data.company);
      setPaymentMethodsList(data.methods);
      setPrintTemplate(data.template);
    };
    fetchPrintData();
    return () => { cancelled = true; };
  }, []);

  // Print invoice in a new window — works reliably for Print & Save as PDF
  const handlePrint = useCallback(() => {
    if (!invoice) return;

    // Collect all stylesheets from current page
    const styleSheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
    const stylesHTML = styleSheets.map(s => {
      if (s.tagName === 'LINK') return s.outerHTML;
      return `<style>${s.innerHTML}</style>`;
    }).join('\n');

    // Open new window
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) { alert('Please allow popups to print the invoice.'); return; }

    // Write the document shell
    printWindow.document.write(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${invoice.invoiceNumber}</title>
${stylesHTML}
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: var(--neutral-100); margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; }
  .inv-print { background: #fff !important; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin: 24px auto; border-radius: 2px; }
  ${PRINT_PAGE_CSS}
</style>
</head><body>
<div class="no-print" style="display:flex;gap:10px;justify-content:center;padding:14px;background:#fff;border-bottom:1px solid var(--neutral-200);">
  <button onclick="window.print()" style="padding:9px 24px;background:var(--neutral-800);color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;letter-spacing:0.3px;">Print Invoice</button>
  <button onclick="window.print()" style="padding:9px 24px;background:#fff;color:var(--neutral-800);border:1px solid var(--neutral-200);border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;">Save as PDF</button>
  <button onclick="window.close()" style="padding:9px 24px;background:#fff;color:var(--neutral-500);border:1px solid var(--neutral-200);border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;">Close</button>
</div>
<div id="print-root"></div>
</body></html>`);
    printWindow.document.close();

    // Render InvoicePrintView into the new window
    const printRoot = printWindow.document.getElementById('print-root');
    if (printRoot) {
      const root = createRoot(printRoot);
      root.render(
        <InvoicePrintView
          invoice={invoice}
          company={companyInfo}
          paymentMethods={paymentMethodsList}
          template={printTemplate}
        />
      );
    }

    // Focus the new window
    printWindow.focus();
  }, [invoice, companyInfo, paymentMethodsList, printTemplate]);

  const handleSavePDF = useCallback(() => {
    // Same flow — user selects "Save as PDF" in the print dialog
    handlePrint();
  }, [handlePrint]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: invoice?.currency || 'INR', maximumFractionDigits: 0 }).format(Number(amount) || 0);

  // A payment or credit note was saved: the server sends back the updated invoice
  const handleSettled = (raw, message) => {
    if (raw?.id) setInvoice(normalizeInvoice(raw));
    setDialog(null);
    showSnackbar(message, 'success');
  };

  const handleVoid = async (entry) => {
    const what = entry.kind === 'payment'
      ? `the ${formatCurrency(entry.amount)} payment of ${new Date(entry.date).toLocaleDateString('en-IN')}`
      : `credit note ${entry.number}`;
    if (!window.confirm(`Void ${what}? Its accounting entry is reversed and the invoice balance goes back up.`)) return;
    setActionLoading(true);
    try {
      const res = entry.kind === 'payment'
        ? await voidInvoicePayment(id, entry.id)
        : await voidCreditNote(id, entry.id);
      if (res.data?.invoice?.id) setInvoice(normalizeInvoice(res.data.invoice));
      showSnackbar(entry.kind === 'payment' ? 'Payment voided.' : 'Credit note voided.', 'success');
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Could not void it. Please try again.', 'error');
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete invoice ${invoice?.invoiceNumber || ''}? This cannot be undone.`)) {
      try {
        await deleteInvoice(id);
        navigate('/invoices');
      } catch (err) {
        showSnackbar(err.response?.data?.message || 'Could not delete this invoice. Please try again.', 'error');
      }
    }
  };

  if (loading) return <Layout><div className="accounting-page"><div className="acc-loading"><span className="spinner"></span> Loading...</div></div></Layout>;

  if (!invoice) return (
    <Layout>
      <div className="accounting-page">
        <Link to="/invoices" className="acc-back-link">← Back to Invoices</Link>
        <div style={{textAlign:'center',padding:'60px 20px'}}>
          <div style={{fontSize:'48px',marginBottom:'16px',opacity:0.3}}>{ICONS.invoice}</div>
          <h2 style={{fontSize:'18px',fontWeight:500,color:'var(--neutral-700)',margin:'0 0 8px'}}>Invoice Not Found</h2>
          <p style={{fontSize:'14px',color:'var(--neutral-500)',margin:0}}>The invoice you're looking for doesn't exist or could not be loaded.</p>
        </div>
      </div>
    </Layout>
  );

  const balanceDue = Math.max(0, Math.round((invoice.total - invoice.amountPaid - invoice.amountCredited) * 100) / 100);
  const canSettle = balanceDue > 0.005 && !['cancelled', 'draft'].includes(invoice.status);
  const fmtDay = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
  const statusLabel = invoice.status === 'paid' ? 'Paid'
    : invoice.amountPaid + invoice.amountCredited > 0 && ['pending', 'overdue'].includes(invoice.status)
      ? `Partially paid${invoice.status === 'overdue' ? ' · overdue' : ''}`
      : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
  const pct = (v) => (invoice.total > 0 ? Math.min(100, (v / invoice.total) * 100) : 0);
  const history = [
    ...invoice.payments.map((p) => ({ kind: 'payment', id: p.id, date: p.date, amount: p.amount, label: p.method || 'Payment', ref: p.reference, note: p.notes })),
    ...invoice.creditNotes.map((c) => ({ kind: 'credit', id: c.id, date: c.date || c.createdAt, amount: c.total, number: c.creditNoteNumber, label: c.creditNoteNumber, ref: c.reason, note: null })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <Layout>
      <div className="accounting-page">
        <Link to="/invoices" className="acc-back-link">← Back to Invoices</Link>
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">{ICONS.invoice}</div>
            <div>
              <h1 className="page-title">{invoice.invoiceNumber}</h1>
              <p className="page-subtitle">{invoice.customer}</p>
            </div>
          </div>
          <div className="header-actions" style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
            <button className="acc-btn acc-btn-secondary" onClick={() => setShowPrintPreview(true)}>
              {ICONS.printer} Preview
            </button>
            <button className="acc-btn acc-btn-secondary" onClick={handleSavePDF}>
              {ICONS.download} Save PDF
            </button>
            {canSettle && (
              <button className="acc-btn acc-btn-secondary" onClick={() => setDialog('credit')} disabled={actionLoading}>
                <FileMinus size={15} aria-hidden="true" /> Credit note
              </button>
            )}
            {canSettle && (
              <button className="acc-btn acc-btn-primary" onClick={() => setDialog('payment')} disabled={actionLoading}>
                <Wallet size={15} aria-hidden="true" /> Record payment
              </button>
            )}
            <button className="acc-btn acc-btn-danger" onClick={handleDelete} disabled={actionLoading} style={{padding:'8px 14px',fontSize:'13px'}}>
              {ICONS.trash}
            </button>
          </div>
        </div>

        <div className="st-summary">
          <div className="st-summary-card">
            <span>Invoice total</span>
            <strong>{formatCurrency(invoice.total)}</strong>
            <small>Issued {fmtDay(invoice.date)} · Due {fmtDay(invoice.dueDate)}</small>
          </div>
          <div className="st-summary-card is-received">
            <span>Received</span>
            <strong>{formatCurrency(invoice.amountPaid)}</strong>
            <small>{invoice.payments.length} payment{invoice.payments.length === 1 ? '' : 's'}</small>
          </div>
          <div className="st-summary-card is-credited">
            <span>Credited</span>
            <strong>{formatCurrency(invoice.amountCredited)}</strong>
            <small>{invoice.creditNotes.length} credit note{invoice.creditNotes.length === 1 ? '' : 's'}</small>
          </div>
          <div className={`st-summary-card ${balanceDue > 0.005 ? 'is-due' : 'is-clear'}`}>
            <span>Balance due</span>
            <strong>{formatCurrency(balanceDue)}</strong>
            <span className={`acc-status-badge ${statusLabel.startsWith('Partially') ? 'partial' : invoice.status}`} style={{ marginTop: '6px', display: 'inline-block' }}>{statusLabel}</span>
            <div className="st-progress" aria-hidden="true">
              <i className="is-paid" style={{ width: `${pct(invoice.amountPaid)}%` }} />
              <i className="is-credit" style={{ width: `${pct(invoice.amountCredited)}%` }} />
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <div className="acc-table-container st-history" style={{ marginBottom: '24px' }}>
            <div className="acc-table-toolbar"><h3 style={{ margin: 0 }}>Payments &amp; credit notes</h3></div>
            <table className="acc-table">
              <thead><tr><th>Date</th><th>Type</th><th>Details</th><th style={{ textAlign: 'right' }}>Amount</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {history.map((h) => (
                  <tr key={`${h.kind}-${h.id}`}>
                    <td>{fmtDay(h.date)}</td>
                    <td><span className={`st-kind ${h.kind === 'payment' ? 'is-payment' : 'is-credit'}`}>{h.kind === 'payment' ? 'Payment' : 'Credit note'}</span></td>
                    <td>
                      {h.label}{h.ref ? ` · ${h.ref}` : ''}
                      {h.note && <span className="st-sub">{h.note}</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}><span className={`acc-amount ${h.kind === 'payment' ? 'credit' : ''}`}>{h.kind === 'credit' ? '− ' : ''}{formatCurrency(h.amount)}</span></td>
                    <td style={{ textAlign: 'right' }}><button type="button" className="st-void" onClick={() => handleVoid(h)} disabled={actionLoading}>Void</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <LineItemsSection
          invoice={invoice}
          setInvoice={setInvoice}
          invoiceId={id}
          formatCurrency={formatCurrency}
          normalizeInvoice={normalizeInvoice}
          showSnackbar={showSnackbar}
        />

        <div className="acc-entry-preview">
          <h4>{ICONS.edit} Accounting Entry</h4>
          <table>
            <thead><tr><th>Account</th><th style={{textAlign:'right'}}>Debit</th><th style={{textAlign:'right'}}>Credit</th></tr></thead>
            <tbody>
              <tr><td>Accounts Receivable</td><td style={{textAlign:'right'}}><span className="acc-amount debit">{formatCurrency(invoice.total)}</span></td><td>-</td></tr>
              <tr><td>Sales Revenue</td><td>-</td><td style={{textAlign:'right'}}><span className="acc-amount credit">{formatCurrency(invoice.subtotal - (invoice.discount || 0))}</span></td></tr>
              {invoice.tax > 0 && <tr><td>GST Payable</td><td>-</td><td style={{textAlign:'right'}}><span className="acc-amount credit">{formatCurrency(invoice.tax)}</span></td></tr>}
            </tbody>
          </table>
        </div>

        {invoice.notes && <div style={{marginTop:'24px',padding:'16px',background:'var(--neutral-50)',borderRadius:'10px',fontSize:'14px',color:'var(--neutral-600)'}}><strong>Notes:</strong> {invoice.notes}</div>}

        {dialog === 'payment' && (
          <InvoicePaymentModal invoice={invoice} outstanding={balanceDue} onDone={handleSettled} onClose={() => setDialog(null)} />
        )}
        {dialog === 'credit' && (
          <CreditNoteModal invoice={invoice} outstanding={balanceDue} onDone={handleSettled} onClose={() => setDialog(null)} />
        )}

        {/* Print Preview Modal */}
        {showPrintPreview && (
          <div className="invoice-preview-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowPrintPreview(false); }}>
            <div className="invoice-preview-container">
              <div className="invoice-preview-toolbar">
                <div className="invoice-preview-toolbar-title">
                  {ICONS.invoice} Invoice Preview — {invoice.invoiceNumber}
                </div>
                <div className="invoice-preview-toolbar-actions">
                  <button className="acc-btn acc-btn-primary" onClick={() => { handlePrint(); }}>
                    {ICONS.printer} Print
                  </button>
                  <button className="acc-btn acc-btn-secondary" onClick={() => { handleSavePDF(); }}>
                    {ICONS.download} Save PDF
                  </button>
                  <button className="acc-btn acc-btn-secondary" onClick={() => setShowPrintPreview(false)}>
                    {ICONS.close}
                  </button>
                </div>
              </div>
              <div className="invoice-preview-body">
                <InvoicePrintView
                  invoice={invoice}
                  company={companyInfo}
                  paymentMethods={paymentMethodsList}
                  template={printTemplate}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default InvoiceDetail;

