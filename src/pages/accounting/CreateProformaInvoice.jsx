// Create / Edit Proforma Invoice — form with line items, customer search, validity period
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { createProformaInvoice, updateProformaInvoice, getProformaInvoice, getAccountingCustomers } from '../../utils/accountingApi';
import ProductPicker from '../../components/accounting/ProductPicker';
import { GstSelect } from '../../components/accounting/GstInputs';
import LinePriceInput from '../../components/accounting/LinePriceInput';
import CustomerTaxHint from '../../components/accounting/CustomerTaxHint';
import LineDiscountInput from '../../components/accounting/LineDiscountInput';
import { NO_DISCOUNT, discountFromSaved, documentTotals, lineAmounts } from '../../components/accounting/lineAmounts';
import DocumentTotals from '../../components/accounting/DocumentTotals';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

function getDefaultValidUntil() {
  const d = new Date();
  d.setDate(d.getDate() + 15);
  return d.toISOString().split('T')[0];
}

function CreateProformaInvoice() {
  const navigate = useNavigate();
  const { id } = useParams(); // edit mode if id exists
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [roundTotal, setRoundTotal] = useState(true);
  const [loadingProforma, setLoadingProforma] = useState(false);
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
    { description: '', hsnCode: '', quantity: 1, unitPrice: 0, taxRate: 0, ...NO_DISCOUNT },
  ]);

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

  useEffect(() => {
    if (!isEdit) return;
    setLoadingProforma(true);
    const fetchProforma = async () => {
      try {
        const res = await getProformaInvoice(id);
        const p = res.data?.data || res.data;
        if (p) {
          let customerName = '';
          if (typeof p.customer === 'string') customerName = p.customer;
          else if (p.customer?.name) customerName = p.customer.name;
          else if (p.customerName || p.customer_name) customerName = p.customerName || p.customer_name;

          setForm({
            customer: customerName,
            customerId: p.customerId || p.customer_id || null,
            currency: p.currency || 'INR',
            exchangeRate: Number(p.exchangeRate || p.exchange_rate) || 1,
            date: p.date ? p.date.split('T')[0] : new Date().toISOString().split('T')[0],
            validUntil: (p.validUntil || p.valid_until) ? (p.validUntil || p.valid_until).split('T')[0] : getDefaultValidUntil(),
            notes: p.notes || '',
            termsAndConditions: p.termsAndConditions || p.terms_and_conditions || '',
            branch: p.branch || '',
            useSignature: (p.useSignature ?? p.use_signature) !== false,
          });
          setCustomerSearch(customerName);
          setRoundTotal(Number(p.roundOff) !== 0);

          if (Array.isArray(p.items) && p.items.length > 0) {
            setItems(p.items.map(item => ({
              description: item.description || '',
              hsnCode: item.hsnCode || item.hsn_code || '',
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice || item.unit_price || item.price) || 0,
              taxRate: Number(item.taxRate || item.tax_rate) || 0,
              ...discountFromSaved(item),
            })));
          }
        }
      } catch { /* use defaults */ }
      setLoadingProforma(false);
    };
    fetchProforma();
  }, [id, isEdit]);

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

  const addItem = () => setItems([...items, { description: '', hsnCode: '', quantity: 1, unitPrice: 0, taxRate: 0, ...NO_DISCOUNT }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const selectProductForItem = (idx, product) => {
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      description: product.name,
      hsnCode: product.hsnCode || product.hsn_code || '',
      unitPrice: Number(product.unitPrice || product.unit_price) || 0,
      taxRate: Number(product.taxRate || product.tax_rate) || 0,
    };
    setItems(updated);
  };

  const calculateItemTotal = (item) => {
    const line = lineAmounts(item);
    return { subtotal: line.gross, discountAmount: line.discount, taxableAmount: line.net, taxAmount: line.tax, total: line.total };
  };

  const updateItemDiscount = (idx, patchValues) => setItems(items.map((it, i) => (i === idx ? { ...it, ...patchValues } : it)));

  const { subtotal, discount: totalDiscount, tax: totalTax, total: grandTotal } = documentTotals(items, roundTotal);

  const problem = !form.customer.trim() ? 'Choose or type a customer.' : !items.some((i) => i.description.trim() && Number(i.unitPrice) > 0) ? 'Add at least one item with a price.' : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (problem) { alert(problem); return; }
    setSaving(true);
    try {
      const preparedItems = items.map(item => {
        const calc = calculateItemTotal(item);
        return {
          description: item.description,
          hsnCode: item.hsnCode || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: calc.discountAmount,
          taxRate: Number(item.taxRate) || 0,
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
        roundTotal,
        items: preparedItems,
        subtotal,
        tax: totalTax,
        discount: totalDiscount,
        total: grandTotal,
      };

      if (isEdit) {
        await updateProformaInvoice(id, payload);
      } else {
        await createProformaInvoice(payload);
      }
      navigate('/proforma-invoices');
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save this proforma invoice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: form.currency, maximumFractionDigits: 2 }).format(amount);

  if (loadingProforma) {
    return (
      <Layout>
        <div className="accounting-page">
          <div className="acc-loading"><span className="spinner"></span> Loading proforma invoice...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="accounting-page">
        <Link to="/proforma-invoices" className="acc-back-link">← Back to Proforma Invoices</Link>
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">{ICONS.quotation}</div>
            <div>
              <h1 className="page-title">{isEdit ? 'Edit Proforma Invoice' : 'Create Proforma Invoice'}</h1>
              <p className="page-subtitle">{isEdit ? 'Update proforma invoice details' : 'New proforma invoice for advance payment / order confirmation'}</p>
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
                {form.customerId && <CustomerTaxHint customer={customers.find((c) => c.id === form.customerId)} />}
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
                <label>Date</label>
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
                  <th style={{width:'25%'}}>Description</th>
                  <th style={{width:'7%'}}>Qty</th>
                  <th style={{width:'16%'}}>Price</th>
                  <th style={{width:'12%'}}>Tax</th>
                  <th style={{width:'8%'}}>Disc. %</th>
                  <th style={{width:'12%'}} title="Amount off the price including GST">Disc. ₹ (with GST)</th>
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
                          onChange={(val) => updateItem(idx, 'description', val)}
                          onSelectProduct={(p) => selectProductForItem(idx, p)}
                          placeholder="Search products or type a description"
                        />
                        {item.hsnCode && <span style={{fontSize:'11px',color:'var(--neutral-500)',display:'block',marginTop:'2px'}}>HSN: {item.hsnCode}</span>}
                      </td>
                      <td><input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} /></td>
                      <td><LinePriceInput price={item.unitPrice} rate={item.taxRate} currency={form.currency} onChange={(price) => updateItem(idx, 'unitPrice', price)} /></td>
                      <td>
                        <GstSelect value={item.taxRate} onChange={(rate) => updateItem(idx, 'taxRate', rate)} />
                      </td>
                      <td><LineDiscountInput field="percent" item={item} onChange={(v) => updateItemDiscount(idx, v)} /></td>
                      <td><LineDiscountInput field="amount" item={item} onChange={(v) => updateItemDiscount(idx, v)} /></td>
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

            <DocumentTotals items={items} roundTotal={roundTotal} onRoundTotalChange={setRoundTotal}
              currency={form.currency} exchangeRate={form.exchangeRate} />
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

          <div className="doc-actionbar">
            <div className="doc-actionbar-total">
              <small>Net amount</small>
              <strong>{formatCurrency(grandTotal)}</strong>
              {problem && <span className="doc-actionbar-hint">{problem}</span>}
            </div>
            <div className="doc-actionbar-buttons">
              <button type="button" className="acc-btn acc-btn-secondary" onClick={() => navigate('/proforma-invoices')}>Cancel</button>
              <button type="submit" className="acc-btn acc-btn-primary" disabled={saving}>
                {saving ? 'Saving...' : isEdit ? 'Update Proforma Invoice' : 'Create Proforma Invoice'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default CreateProformaInvoice;
