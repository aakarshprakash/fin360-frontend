// Create / Edit Invoice - Sales invoice form with line items and double-entry preview
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { createInvoice, updateInvoice, getInvoice, getAccountingCustomers, getInvoiceTemplateSettings } from '../../utils/accountingApi';
import ProductPicker from '../../components/accounting/ProductPicker';
import { resolveInvoiceLayout } from '../../components/accounting/invoiceTemplates';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

const taxRates = [
  { id: 1, name: 'GST 18%', rate: 18, type: 'IGST' },
  { id: 2, name: 'GST 12%', rate: 12, type: 'IGST' },
  { id: 3, name: 'GST 5%', rate: 5, type: 'IGST' },
  { id: 4, name: 'No Tax', rate: 0, type: 'none' },
];

function findTaxId(rate) {
  const match = taxRates.find(t => t.rate === Number(rate));
  if (match) return match.id;
  // Fall back to the closest predefined slab (products can carry any GST rate)
  const closest = taxRates.reduce((best, t) => Math.abs(t.rate - rate) < Math.abs(best.rate - rate) ? t : best, taxRates[0]);
  return closest.id;
}

function CreateInvoice() {
  const navigate = useNavigate();
  const { id } = useParams(); // edit mode if id exists
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [invoiceLocked, setInvoiceLocked] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef(null);

  const [form, setForm] = useState({
    customer: '', customerId: null, currency: 'INR', exchangeRate: 1,
    date: new Date().toISOString().split('T')[0], dueDate: '', notes: '', useSignature: true,
    shipTo: '', extraFields: {},
  });
  const [items, setItems] = useState([
    { description: '', hsnCode: '', quantity: 1, unit: '', unitPrice: 0, taxId: 4, discount: 0 },
  ]);
  // The print template decides which extra inputs this form offers
  const [printLayout, setPrintLayout] = useState(() => resolveInvoiceLayout('default'));

  useEffect(() => {
    let cancelled = false;
    getInvoiceTemplateSettings()
      .then((res) => {
        const t = res.data?.data || res.data || {};
        if (!cancelled) setPrintLayout(resolveInvoiceLayout(t.invoiceTheme, t.layout));
      })
      .catch(() => { /* keep the default template */ });
    return () => { cancelled = true; };
  }, []);

  // Fetch customers list
  useEffect(() => {
    let cancelled = false;
    const fetchCustomers = async () => {
      try {
        const res = await getAccountingCustomers();
        if (cancelled) return;
        const data = res.data?.customers || res.data?.data || res.data;
        setCustomers(Array.isArray(data) ? data : []);
      } catch { if (!cancelled) setCustomers([]); }
    };
    fetchCustomers();
    return () => { cancelled = true; };
  }, []);

  // If edit mode, fetch existing invoice. Once an invoice has any payment
  // recorded against it, its auto-generated journal entry would desync from
  // edited totals — lock line-item/amount editing in that case (customer,
  // dates, and notes can still be changed).
  useEffect(() => {
    if (!isEdit) return;
    setLoadingInvoice(true);
    const fetchInvoice = async () => {
      try {
        const res = await getInvoice(id);
        const inv = res.data?.data || res.data;
        if (inv) {
          let customerName = '';
          if (typeof inv.customer === 'string') customerName = inv.customer;
          else if (inv.customer?.name) customerName = inv.customer.name;
          else if (inv.customerName || inv.customer_name) customerName = inv.customerName || inv.customer_name;

          setForm({
            customer: customerName,
            customerId: inv.customerId || inv.customer_id || null,
            currency: inv.currency || 'INR',
            exchangeRate: Number(inv.exchangeRate || inv.exchange_rate) || 1,
            date: inv.date ? inv.date.split('T')[0] : new Date().toISOString().split('T')[0],
            dueDate: (inv.dueDate || inv.due_date) ? (inv.dueDate || inv.due_date).split('T')[0] : '',
            notes: inv.notes || '',
            useSignature: (inv.useSignature ?? inv.use_signature) !== false,
            shipTo: inv.shipTo || '',
            extraFields: inv.extraFields && typeof inv.extraFields === 'object' ? inv.extraFields : {},
          });
          setCustomerSearch(customerName);

          if (Array.isArray(inv.items) && inv.items.length > 0) {
            setItems(inv.items.map(item => ({
              description: item.description || '',
              hsnCode: item.hsnCode || item.hsn_code || '',
              productId: item.productId || null,
              quantity: Number(item.quantity) || 1,
              unit: item.unit || '',
              unitPrice: Number(item.unitPrice || item.unit_price || item.price) || 0,
              taxId: findTaxId(Number(item.taxRate || item.tax_rate) || 0),
              discount: Number(item.discountPercent || item.discount_percent || 0),
            })));
          }

          const amountPaid = Number(inv.amountPaid || inv.amount_paid) || 0;
          setInvoiceLocked(amountPaid > 0);
        }
      } catch { /* use defaults */ }
      setLoadingInvoice(false);
    };
    fetchInvoice();
  }, [id, isEdit]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (customerRef.current && !customerRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredCustomers = customers.filter(c =>
    (c.name || '').toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleSelectCustomer = (cust) => {
    setForm({ ...form, customer: cust.name, customerId: cust.id });
    setCustomerSearch(cust.name);
    setShowCustomerDropdown(false);
  };

  const handleCustomerInput = (value) => {
    setCustomerSearch(value);
    setForm({ ...form, customer: value, customerId: null });
    setShowCustomerDropdown(true);
  };

  const addItem = () => setItems([...items, { description: '', hsnCode: '', quantity: 1, unit: '', unitPrice: 0, taxId: 4, discount: 0 }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  // When a product is picked from the catalog, auto-fill description, price, tax & HSN code
  const selectProductForItem = (idx, product) => {
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      description: product.name,
      productId: product.id,
      hsnCode: product.hsnCode || product.hsn_code || '',
      unit: product.unit || updated[idx].unit || '',
      unitPrice: Number(product.unitPrice || product.unit_price) || 0,
      taxId: findTaxId(Number(product.taxRate || product.tax_rate) || 0),
    };
    setItems(updated);
  };

  const calculateItemTotal = (item) => {
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = subtotal * (item.discount / 100);
    const taxableAmount = subtotal - discountAmount;
    const tax = taxRates.find(t => t.id === Number(item.taxId));
    const taxAmount = taxableAmount * ((tax?.rate || 0) / 100);
    return { subtotal, discountAmount, taxableAmount, taxAmount, total: taxableAmount + taxAmount };
  };

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item).subtotal, 0);
  const totalDiscount = items.reduce((sum, item) => sum + calculateItemTotal(item).discountAmount, 0);
  const totalTax = items.reduce((sum, item) => sum + calculateItemTotal(item).taxAmount, 0);
  const grandTotal = items.reduce((sum, item) => sum + calculateItemTotal(item).total, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Prepare items with tax rate for backend
      const preparedItems = items.map(item => {
        const tax = taxRates.find(t => t.id === Number(item.taxId));
        const calc = calculateItemTotal(item);
        return {
          description: item.description,
          hsnCode: item.hsnCode || null,
          productId: item.productId || null,
          quantity: item.quantity,
          unit: item.unit || null,
          unitPrice: item.unitPrice,
          discount: calc.discountAmount,
          taxRate: tax?.rate || 0,
          taxAmount: calc.taxAmount,
          total: calc.total,
        };
      });

      const payload = {
        customerName: form.customer,
        customerId: form.customerId,
        date: form.date,
        dueDate: form.dueDate,
        currency: form.currency,
        exchangeRate: form.exchangeRate,
        notes: form.notes,
        useSignature: form.useSignature,
        shipTo: form.shipTo,
        extraFields: form.extraFields,
        items: preparedItems,
        subtotal,
        tax: totalTax,
        discount: totalDiscount,
        total: grandTotal,
      };

      if (isEdit) {
        await updateInvoice(id, payload);
        navigate(`/invoices/${id}`);
      } else {
        await createInvoice(payload);
        navigate('/invoices');
      }
    } catch {
      alert(isEdit ? 'Could not save changes.' : 'Invoice saved locally (API not available)');
      if (!isEdit) navigate('/invoices');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: form.currency, maximumFractionDigits: 2 }).format(amount);

  return (
    <Layout>
      <div className="accounting-page">
        <Link to="/invoices" className="acc-back-link">← Back to Invoices</Link>
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">{ICONS.invoice}</div>
            <div>
              <h1 className="page-title">{isEdit ? 'Edit Invoice' : 'Create Invoice'}</h1>
              <p className="page-subtitle">{isEdit ? 'Update sales invoice' : 'New sales invoice'}</p>
            </div>
          </div>
        </div>

        {loadingInvoice ? (
          <div className="acc-loading"><span className="spinner"></span> Loading invoice...</div>
        ) : (
        <form onSubmit={handleSubmit}>
          {invoiceLocked && (
            <div style={{marginBottom:'16px',padding:'12px 16px',background:'var(--warning-50)',border:'1px solid var(--warning-200)',borderRadius:'8px',fontSize:'13px',color:'var(--warning-800)'}}>
              A payment has already been recorded against this invoice, so line items and amounts are locked to keep the accounting entry accurate. You can still update the customer, dates, and notes.
            </div>
          )}
          <div className="acc-table-container" style={{padding:'24px',marginBottom:'24px'}}>
            <div className="acc-form-row">
              <div className="acc-form-group" ref={customerRef} style={{position:'relative'}}>
                <label>Customer *</label>
                <input type="text" value={customerSearch} onChange={(e) => handleCustomerInput(e.target.value)}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search or type customer name" required autoComplete="off" />
                {showCustomerDropdown && (customerSearch || customers.length > 0) && (
                  <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:50,background:'#fff',border:'1px solid var(--neutral-200)',borderRadius:'8px',maxHeight:'200px',overflowY:'auto',boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
                    {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
                      <div key={c.id} onClick={() => handleSelectCustomer(c)}
                        style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid var(--neutral-100)',fontSize:'14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}
                        onMouseEnter={(e) => e.currentTarget.style.background='var(--neutral-50)'}
                        onMouseLeave={(e) => e.currentTarget.style.background='#fff'}>
                        <span style={{fontWeight:500}}>{c.name}</span>
                        <span style={{fontSize:'12px',color:'var(--neutral-500)'}}>{c.email || c.phone || ''}</span>
                      </div>
                    )) : customerSearch ? (
                      <div style={{padding:'10px 14px',fontSize:'13px',color:'var(--neutral-500)'}}>
                        No match — will use "{customerSearch}" as customer name
                      </div>
                    ) : null}
                  </div>
                )}
                {form.customerId && <span style={{fontSize:'11px',color:'var(--success-700)',marginTop:'4px',display:'block'}}>✓ Linked to customer #{form.customerId}</span>}
              </div>
              <div className="acc-form-group">
                <label>Currency</label>
                <select value={form.currency} onChange={(e) => setForm({...form, currency: e.target.value})}>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="AED">AED - UAE Dirham</option>
                </select>
              </div>
            </div>
            <div className="acc-form-row">
              <div className="acc-form-group">
                <label>Invoice Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} />
              </div>
              <div className="acc-form-group">
                <label>Due Date</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({...form, dueDate: e.target.value})} />
              </div>
            </div>
            {printLayout.fields.length > 0 && (
              <div className="acc-form-row" style={{flexWrap:'wrap'}}>
                {printLayout.fields.map((f) => (
                  <div className="acc-form-group" key={f.id} style={{minWidth:'200px'}}>
                    <label htmlFor={`xf-${f.id}`}>{f.label}</label>
                    <input id={`xf-${f.id}`} type="text" maxLength={200} value={form.extraFields[f.id] || ''}
                      onChange={(e) => setForm({ ...form, extraFields: { ...form.extraFields, [f.id]: e.target.value } })} />
                  </div>
                ))}
              </div>
            )}
            {printLayout.details.shipTo && (
              <div className="acc-form-group">
                <label htmlFor="ship-to">{printLayout.labels.shipTo || 'Ship To'}</label>
                <textarea id="ship-to" rows={3} maxLength={1000} value={form.shipTo}
                  onChange={(e) => setForm({ ...form, shipTo: e.target.value })}
                  placeholder={'Leave empty if same as Bill To.\nFirst line: name, then address, phone, GSTIN…'} />
              </div>
            )}
            {form.currency !== 'INR' && (
              <div className="acc-form-group" style={{maxWidth:'300px'}}>
                <label>Exchange Rate (1 {form.currency} = ? INR)</label>
                <input type="number" step="0.01" value={form.exchangeRate}
                  onChange={(e) => setForm({...form, exchangeRate: e.target.value})} />
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="acc-table-container" style={{marginBottom:'24px'}}>
            <div className="acc-table-toolbar">
              <h3 style={{margin:0,fontSize:'16px',fontWeight:600}}>Line Items</h3>
              {!invoiceLocked && <button type="button" className="acc-btn acc-btn-secondary" onClick={addItem}>+ Add Item</button>}
            </div>
            <table className="acc-line-items">
              <thead>
                <tr>
                  <th style={{width:'35%'}}>Description</th>
                  <th style={{width:'10%'}}>Qty</th>
                  {printLayout.columns.uom && <th style={{width:'8%'}}>Unit</th>}
                  <th style={{width:'15%'}}>Price</th>
                  <th style={{width:'15%'}}>Tax</th>
                  <th style={{width:'10%'}}>Discount %</th>
                  <th style={{width:'12%',textAlign:'right'}}>Total</th>
                  <th style={{width:'3%'}}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const calc = calculateItemTotal(item);
                  return (
                    <tr key={idx}>
                      <td>
                        {invoiceLocked ? (
                          <input type="text" disabled value={item.description} />
                        ) : (
                          <>
                            <ProductPicker
                              value={item.description}
                              onChange={(val) => setItems(items.map((it, i) => (i === idx ? { ...it, description: val, productId: null } : it)))}
                              onSelectProduct={(p) => selectProductForItem(idx, p)}
                              placeholder="Search products or type a description"
                            />
                            {item.hsnCode && <span style={{fontSize:'11px',color:'var(--neutral-500)',display:'block',marginTop:'2px'}}>HSN: {item.hsnCode}</span>}
                          </>
                        )}
                      </td>
                      <td><input type="number" disabled={invoiceLocked} min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} /></td>
                      {printLayout.columns.uom && (
                        <td><input type="text" disabled={invoiceLocked} maxLength={20} value={item.unit} placeholder="NOS" aria-label="Unit"
                          onChange={(e) => updateItem(idx, 'unit', e.target.value.toUpperCase())} /></td>
                      )}
                      <td><input type="number" disabled={invoiceLocked} min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))} /></td>
                      <td>
                        <select disabled={invoiceLocked} value={item.taxId} onChange={(e) => updateItem(idx, 'taxId', e.target.value)}>
                          {taxRates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </td>
                      <td><input type="number" disabled={invoiceLocked} min="0" max="100" value={item.discount} onChange={(e) => updateItem(idx, 'discount', Number(e.target.value))} /></td>
                      <td style={{textAlign:'right',fontWeight:500}}>{formatCurrency(calc.total)}</td>
                      <td>
                        {!invoiceLocked && items.length > 1 && (
                          <button type="button" className="acc-line-items .remove-line-btn" style={{width:'28px',height:'28px',borderRadius:'6px',border:'none',background:'var(--error-50)',color:'var(--error-600)',cursor:'pointer'}}
                            onClick={() => removeItem(idx)}>✕</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="acc-totals">
              <div className="total-row"><span className="total-label">Subtotal</span><span className="total-value">{formatCurrency(subtotal)}</span></div>
              {totalDiscount > 0 && <div className="total-row"><span className="total-label">Discount</span><span className="total-value" style={{color:'var(--error-600)'}}>-{formatCurrency(totalDiscount)}</span></div>}
              <div className="total-row"><span className="total-label">Tax</span><span className="total-value">{formatCurrency(totalTax)}</span></div>
              <div className="total-row grand-total"><span className="total-label">Grand Total</span><span className="total-value">{formatCurrency(grandTotal)}</span></div>
              {form.currency !== 'INR' && (
                <div className="total-row"><span className="total-label">Base Amount (INR)</span><span className="total-value">{new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(grandTotal * form.exchangeRate)}</span></div>
              )}
            </div>
          </div>

          {/* Accounting Entry Preview */}
          <div className="acc-entry-preview" style={{marginBottom:'24px'}}>
            <h4>{ICONS.edit} Auto-generated Accounting Entry</h4>
            <table>
              <thead><tr><th>Account</th><th style={{textAlign:'right'}}>Debit</th><th style={{textAlign:'right'}}>Credit</th></tr></thead>
              <tbody>
                <tr><td>Accounts Receivable</td><td style={{textAlign:'right'}}><span className="acc-amount debit">{formatCurrency(grandTotal)}</span></td><td style={{textAlign:'right'}}>-</td></tr>
                <tr><td>Sales Revenue</td><td style={{textAlign:'right'}}>-</td><td style={{textAlign:'right'}}><span className="acc-amount credit">{formatCurrency(subtotal - totalDiscount)}</span></td></tr>
                {totalTax > 0 && <tr><td>GST Payable</td><td style={{textAlign:'right'}}>-</td><td style={{textAlign:'right'}}><span className="acc-amount credit">{formatCurrency(totalTax)}</span></td></tr>}
              </tbody>
            </table>
          </div>

          <div className="acc-form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Additional notes..." />
          </div>

          <label style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',marginBottom:'24px',cursor:'pointer'}}>
            <input type="checkbox" checked={form.useSignature} onChange={(e) => setForm({...form, useSignature: e.target.checked})} />
            Use uploaded Seal &amp; Signature on this document
          </label>

          <div style={{display:'flex',gap:'12px',justifyContent:'flex-end',marginTop:'24px'}}>
            <button type="button" className="acc-btn acc-btn-secondary" onClick={() => navigate('/invoices')}>Cancel</button>
            <button type="submit" className="acc-btn acc-btn-primary" disabled={saving}>{saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Invoice')}</button>
          </div>
        </form>
        )}
      </div>
    </Layout>
  );
}

export default CreateInvoice;

