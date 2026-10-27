// Create / Edit Quotation — form with line items, customer search, validity period
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { createQuotation, updateQuotation, getQuotation, getAccountingCustomers } from '../../utils/accountingApi';
import ProductPicker from '../../components/accounting/ProductPicker';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

const taxRates = [
  { id: 1, name: 'GST 18%', rate: 18, type: 'IGST' },
  { id: 2, name: 'GST 12%', rate: 12, type: 'IGST' },
  { id: 3, name: 'GST 5%', rate: 5, type: 'IGST' },
  { id: 4, name: 'No Tax', rate: 0, type: 'none' },
];

function getDefaultValidUntil() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

function CreateQuotation() {
  const navigate = useNavigate();
  const { id } = useParams(); // edit mode if id exists
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [loadingQuotation, setLoadingQuotation] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef(null);

  const [form, setForm] = useState({
    customer: '', customerId: null, currency: 'INR', exchangeRate: 1,
    date: new Date().toISOString().split('T')[0], validUntil: getDefaultValidUntil(),
    notes: '', termsAndConditions: '', branch: '', useSignature: true,
  });
  const [items, setItems] = useState([
    { description: '', hsnCode: '', quantity: 1, unitPrice: 0, taxId: 4, discount: 0 },
  ]);

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

  // If edit mode, fetch existing quotation
  useEffect(() => {
    if (!isEdit) return;
    setLoadingQuotation(true);
    const fetchQuotation = async () => {
      try {
        const res = await getQuotation(id);
        const q = res.data?.data || res.data;
        if (q) {
          let customerName = '';
          if (typeof q.customer === 'string') customerName = q.customer;
          else if (q.customer?.name) customerName = q.customer.name;
          else if (q.customerName || q.customer_name) customerName = q.customerName || q.customer_name;

          setForm({
            customer: customerName,
            customerId: q.customerId || q.customer_id || null,
            currency: q.currency || 'INR',
            exchangeRate: Number(q.exchangeRate || q.exchange_rate) || 1,
            date: q.date ? q.date.split('T')[0] : new Date().toISOString().split('T')[0],
            validUntil: (q.validUntil || q.valid_until) ? (q.validUntil || q.valid_until).split('T')[0] : getDefaultValidUntil(),
            notes: q.notes || '',
            termsAndConditions: q.termsAndConditions || q.terms_and_conditions || '',
            branch: q.branch || '',
            useSignature: (q.useSignature ?? q.use_signature) !== false,
          });
          setCustomerSearch(customerName);

          if (Array.isArray(q.items) && q.items.length > 0) {
            setItems(q.items.map(item => ({
              description: item.description || '',
              hsnCode: item.hsnCode || item.hsn_code || '',
              productId: item.productId || null,
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice || item.unit_price || item.price) || 0,
              taxId: findTaxId(Number(item.taxRate || item.tax_rate) || 0),
              discount: Number(item.discountPercent || item.discount_percent || 0),
            })));
          }
        }
      } catch { /* use defaults */ }
      setLoadingQuotation(false);
    };
    fetchQuotation();
  }, [id, isEdit]);

  function findTaxId(rate) {
    const exact = taxRates.find(t => t.rate === rate);
    if (exact) return exact.id;
    // Fall back to the closest predefined slab (products can carry any GST rate)
    const closest = taxRates.reduce((best, t) => Math.abs(t.rate - rate) < Math.abs(best.rate - rate) ? t : best, taxRates[0]);
    return closest.id;
  }

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

  const addItem = () => setItems([...items, { description: '', hsnCode: '', quantity: 1, unitPrice: 0, taxId: 4, discount: 0 }]);
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
      const preparedItems = items.map(item => {
        const tax = taxRates.find(t => t.id === Number(item.taxId));
        const calc = calculateItemTotal(item);
        return {
          description: item.description,
          hsnCode: item.hsnCode || null,
          productId: item.productId || null,
          quantity: item.quantity,
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
        validUntil: form.validUntil,
        currency: form.currency,
        exchangeRate: form.exchangeRate,
        notes: form.notes,
        termsAndConditions: form.termsAndConditions,
        branch: form.branch,
        useSignature: form.useSignature,
        items: preparedItems,
        subtotal,
        tax: totalTax,
        discount: totalDiscount,
        total: grandTotal,
      };

      if (isEdit) {
        await updateQuotation(id, payload);
      } else {
        await createQuotation(payload);
      }
      navigate('/quotations');
    } catch {
      alert('Quotation saved locally (API not available)');
      navigate('/quotations');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: form.currency, maximumFractionDigits: 2 }).format(amount);

  if (loadingQuotation) {
    return (
      <Layout>
        <div className="accounting-page">
          <div className="acc-loading"><span className="spinner"></span> Loading quotation...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="accounting-page">
        <Link to="/quotations" className="acc-back-link">← Back to Quotations</Link>
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">{ICONS.quotation}</div>
            <div>
              <h1 className="page-title">{isEdit ? 'Edit Quotation' : 'Create Quotation'}</h1>
              <p className="page-subtitle">{isEdit ? 'Update quotation details' : 'New price quotation'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
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
                        No match — will use &quot;{customerSearch}&quot; as customer name
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
                <label>Quotation Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} />
              </div>
              <div className="acc-form-group">
                <label>Valid Until</label>
                <input type="date" value={form.validUntil} onChange={(e) => setForm({...form, validUntil: e.target.value})} />
              </div>
            </div>
            <div className="acc-form-row">
              <div className="acc-form-group">
                <label>Branch (optional)</label>
                <input type="text" value={form.branch} onChange={(e) => setForm({...form, branch: e.target.value})} placeholder="e.g. Mumbai, Kochi" />
              </div>
              {form.currency !== 'INR' && (
                <div className="acc-form-group">
                  <label>Exchange Rate (1 {form.currency} = ? INR)</label>
                  <input type="number" step="0.01" value={form.exchangeRate}
                    onChange={(e) => setForm({...form, exchangeRate: e.target.value})} />
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="acc-table-container" style={{marginBottom:'24px'}}>
            <div className="acc-table-toolbar">
              <h3 style={{margin:0,fontSize:'16px',fontWeight:600}}>Line Items</h3>
              <button type="button" className="acc-btn acc-btn-secondary" onClick={addItem}>+ Add Item</button>
            </div>
            <table className="acc-line-items">
              <thead>
                <tr>
                  <th style={{width:'35%'}}>Description</th>
                  <th style={{width:'10%'}}>Qty</th>
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
                        <ProductPicker
                          value={item.description}
                          onChange={(val) => setItems(items.map((it, i) => (i === idx ? { ...it, description: val, productId: null } : it)))}
                          onSelectProduct={(p) => selectProductForItem(idx, p)}
                          placeholder="Search products or type a description"
                        />
                        {item.hsnCode && <span style={{fontSize:'11px',color:'var(--neutral-500)',display:'block',marginTop:'2px'}}>HSN: {item.hsnCode}</span>}
                      </td>
                      <td><input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} /></td>
                      <td><input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))} /></td>
                      <td>
                        <select value={item.taxId} onChange={(e) => updateItem(idx, 'taxId', e.target.value)}>
                          {taxRates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </td>
                      <td><input type="number" min="0" max="100" value={item.discount} onChange={(e) => updateItem(idx, 'discount', Number(e.target.value))} /></td>
                      <td style={{textAlign:'right',fontWeight:500}}>{formatCurrency(calc.total)}</td>
                      <td>
                        {items.length > 1 && (
                          <button type="button" style={{width:'28px',height:'28px',borderRadius:'6px',border:'none',background:'var(--error-50)',color:'var(--error-600)',cursor:'pointer'}}
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

          {/* Notes & Terms */}
          <div className="acc-table-container" style={{padding:'24px',marginBottom:'24px'}}>
            <div className="acc-form-row">
              <div className="acc-form-group">
                <label>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Additional notes for the customer..." rows={3} />
              </div>
              <div className="acc-form-group">
                <label>Terms & Conditions</label>
                <textarea value={form.termsAndConditions} onChange={(e) => setForm({...form, termsAndConditions: e.target.value})} placeholder="Terms and conditions..." rows={3} />
              </div>
            </div>
            <label style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',marginTop:'8px',cursor:'pointer'}}>
              <input type="checkbox" checked={form.useSignature} onChange={(e) => setForm({...form, useSignature: e.target.checked})} />
              Use uploaded Seal &amp; Signature on this document
            </label>
          </div>

          <div style={{display:'flex',gap:'12px',justifyContent:'flex-end',marginTop:'24px'}}>
            <button type="button" className="acc-btn acc-btn-secondary" onClick={() => navigate('/quotations')}>Cancel</button>
            <button type="submit" className="acc-btn acc-btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Quotation' : 'Create Quotation'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default CreateQuotation;

