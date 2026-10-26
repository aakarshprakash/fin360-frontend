// Create / Edit Bill - Purchase bill form
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { createBill, updateBill, getBill, getVendors } from '../../utils/accountingApi';
import ProductPicker from '../../components/accounting/ProductPicker';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

const taxRates = [
  { id: 1, name: 'GST 18%', rate: 18 },
  { id: 2, name: 'GST 12%', rate: 12 },
  { id: 3, name: 'GST 5%', rate: 5 },
  { id: 4, name: 'No Tax', rate: 0 },
];

function findTaxId(rate) {
  const match = taxRates.find(t => t.rate === Number(rate));
  if (match) return match.id;
  const closest = taxRates.reduce((best, t) => Math.abs(t.rate - rate) < Math.abs(best.rate - rate) ? t : best, taxRates[0]);
  return closest.id;
}

function CreateBill() {
  const navigate = useNavigate();
  const { id } = useParams(); // edit mode if id exists
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [loadingBill, setLoadingBill] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const vendorRef = useRef(null);

  const [form, setForm] = useState({ vendor: '', vendorId: null, date: new Date().toISOString().split('T')[0], dueDate: '', notes: '' });
  const [items, setItems] = useState([{ description: '', hsnCode: '', quantity: 1, unitPrice: 0, taxId: 4 }]);

  useEffect(() => {
    let cancelled = false;
    const fetchVendors = async () => {
      try {
        const res = await getVendors();
        if (cancelled) return;
        const data = res.data?.vendors || res.data?.data || res.data;
        setVendors(Array.isArray(data) ? data : []);
      } catch { if (!cancelled) setVendors([]); }
    };
    fetchVendors();
    return () => { cancelled = true; };
  }, []);

  // If edit mode, fetch existing bill
  useEffect(() => {
    if (!isEdit) return;
    setLoadingBill(true);
    const fetchBill = async () => {
      try {
        const res = await getBill(id);
        const b = res.data?.data || res.data;
        if (b) {
          let vendorName = '';
          if (typeof b.vendor === 'string') vendorName = b.vendor;
          else if (b.vendor?.name) vendorName = b.vendor.name;

          setForm({
            vendor: vendorName,
            vendorId: b.vendorId || b.vendor_id || null,
            date: b.date ? b.date.split('T')[0] : new Date().toISOString().split('T')[0],
            dueDate: (b.dueDate || b.due_date) ? (b.dueDate || b.due_date).split('T')[0] : '',
            notes: b.notes || '',
          });
          setVendorSearch(vendorName);

          if (Array.isArray(b.items) && b.items.length > 0) {
            setItems(b.items.map(item => ({
              description: item.description || '',
              hsnCode: item.hsnCode || item.hsn_code || '',
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice || item.unit_price || item.price) || 0,
              taxId: findTaxId(Number(item.taxRate || item.tax_rate) || 0),
            })));
          }
        }
      } catch { /* use defaults */ }
      setLoadingBill(false);
    };
    fetchBill();
  }, [id, isEdit]);

  useEffect(() => {
    const handleClick = (e) => {
      if (vendorRef.current && !vendorRef.current.contains(e.target)) setShowVendorDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredVendors = vendors.filter(v => (v.name || '').toLowerCase().includes(vendorSearch.toLowerCase()));

  const handleSelectVendor = (v) => {
    setForm({ ...form, vendor: v.name, vendorId: v.id });
    setVendorSearch(v.name);
    setShowVendorDropdown(false);
  };

  const handleVendorInput = (value) => {
    setVendorSearch(value);
    setForm({ ...form, vendor: value, vendorId: null });
    setShowVendorDropdown(true);
  };

  const addItem = () => setItems([...items, { description: '', hsnCode: '', quantity: 1, unitPrice: 0, taxId: 4 }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) => { const u = [...items]; u[idx] = { ...u[idx], [field]: value }; setItems(u); };

  // When a product is picked from the catalog, auto-fill description, price, tax & HSN code
  const selectProductForItem = (idx, product) => {
    const u = [...items];
    u[idx] = {
      ...u[idx],
      description: product.name,
      hsnCode: product.hsnCode || product.hsn_code || '',
      unitPrice: Number(product.unitPrice || product.unit_price) || 0,
      taxId: findTaxId(Number(product.taxRate || product.tax_rate) || 0),
    };
    setItems(u);
  };

  const calcItem = (item) => {
    const sub = item.quantity * item.unitPrice;
    const tax = taxRates.find(t => t.id === Number(item.taxId));
    const taxAmt = sub * ((tax?.rate || 0) / 100);
    return { sub, taxAmt, total: sub + taxAmt };
  };

  const subtotal = items.reduce((s, i) => s + calcItem(i).sub, 0);
  const totalTax = items.reduce((s, i) => s + calcItem(i).taxAmt, 0);
  const grandTotal = subtotal + totalTax;

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const preparedItems = items.map(item => {
        const tax = taxRates.find(t => t.id === Number(item.taxId));
        const calc = calcItem(item);
        return {
          description: item.description,
          hsnCode: item.hsnCode || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: tax?.rate || 0,
          taxAmount: calc.taxAmt,
          total: calc.total,
        };
      });
      const payload = {
        vendorName: form.vendor,
        vendorId: form.vendorId,
        date: form.date,
        dueDate: form.dueDate,
        notes: form.notes,
        items: preparedItems,
        subtotal,
        tax: totalTax,
        total: grandTotal,
      };
      if (isEdit) {
        await updateBill(id, payload);
        navigate(`/bills/${id}`);
      } else {
        await createBill(payload);
        navigate('/bills');
      }
    } catch { navigate('/bills'); } finally { setSaving(false); }
  };

  return (
    <Layout>
      <div className="accounting-page">
        <Link to="/bills" className="acc-back-link">← Back to Bills</Link>
        <div className="accounting-header">
          <div className="header-left"><div className="header-icon">{ICONS.bill}</div><div><h1 className="page-title">{isEdit ? 'Edit Bill' : 'Create Bill'}</h1><p className="page-subtitle">{isEdit ? 'Update purchase bill' : 'New purchase bill'}</p></div></div>
        </div>

        {loadingBill ? (
          <div className="acc-loading"><span className="spinner"></span> Loading bill...</div>
        ) : (
        <form onSubmit={handleSubmit}>
          <div className="acc-table-container" style={{padding:'24px',marginBottom:'24px'}}>
            <div className="acc-form-row">
              <div className="acc-form-group" ref={vendorRef} style={{position:'relative'}}>
                <label>Vendor *</label>
                <input type="text" value={vendorSearch} onChange={(e) => handleVendorInput(e.target.value)}
                  onFocus={() => setShowVendorDropdown(true)} placeholder="Search or type vendor name" required autoComplete="off" />
                {showVendorDropdown && (vendorSearch || vendors.length > 0) && (
                  <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:50,background:'#fff',border:'1px solid var(--neutral-200)',borderRadius:'8px',maxHeight:'200px',overflowY:'auto',boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
                    {filteredVendors.length > 0 ? filteredVendors.map(v => (
                      <div key={v.id} onClick={() => handleSelectVendor(v)}
                        style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid var(--neutral-100)',fontSize:'14px',display:'flex',justifyContent:'space-between'}}
                        onMouseEnter={(e) => e.currentTarget.style.background='var(--neutral-50)'}
                        onMouseLeave={(e) => e.currentTarget.style.background='#fff'}>
                        <span style={{fontWeight:500}}>{v.name}</span>
                        <span style={{fontSize:'12px',color:'var(--neutral-500)'}}>{v.email || v.phone || ''}</span>
                      </div>
                    )) : vendorSearch ? (
                      <div style={{padding:'10px 14px',fontSize:'13px',color:'var(--neutral-500)'}}>No match — will use "{vendorSearch}" as vendor name</div>
                    ) : null}
                  </div>
                )}
                {form.vendorId && <span style={{fontSize:'11px',color:'var(--success-700)',marginTop:'4px',display:'block'}}>✓ Linked to vendor #{form.vendorId}</span>}
              </div>
              <div className="acc-form-group"><label>Bill Date</label><input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} /></div>
            </div>
            <div className="acc-form-group" style={{maxWidth:'300px'}}><label>Due Date</label><input type="date" value={form.dueDate} onChange={(e) => setForm({...form, dueDate: e.target.value})} /></div>
          </div>

          <div className="acc-table-container" style={{marginBottom:'24px'}}>
            <div className="acc-table-toolbar"><h3 style={{margin:0}}>Line Items</h3><button type="button" className="acc-btn acc-btn-secondary" onClick={addItem}>+ Add Item</button></div>
            <table className="acc-line-items">
              <thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>Tax</th><th style={{textAlign:'right'}}>Total</th><th></th></tr></thead>
              <tbody>
                {items.map((item, idx) => (
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
                    <td><input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx,'quantity',Number(e.target.value))} /></td>
                    <td><input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx,'unitPrice',Number(e.target.value))} /></td>
                    <td><select value={item.taxId} onChange={(e) => updateItem(idx,'taxId',e.target.value)}>{taxRates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></td>
                    <td style={{textAlign:'right',fontWeight:500}}>{formatCurrency(calcItem(item).total)}</td>
                    <td>{items.length > 1 && <button type="button" onClick={() => removeItem(idx)} style={{width:'28px',height:'28px',borderRadius:'6px',border:'none',background:'var(--error-50)',color:'var(--error-600)',cursor:'pointer'}}>✕</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="acc-totals">
              <div className="total-row"><span className="total-label">Subtotal</span><span className="total-value">{formatCurrency(subtotal)}</span></div>
              <div className="total-row"><span className="total-label">Tax</span><span className="total-value">{formatCurrency(totalTax)}</span></div>
              <div className="total-row grand-total"><span className="total-label">Grand Total</span><span className="total-value">{formatCurrency(grandTotal)}</span></div>
            </div>
          </div>

          <div className="acc-entry-preview" style={{marginBottom:'24px'}}>
            <h4>{ICONS.edit} Auto-generated Accounting Entry</h4>
            <table>
              <thead><tr><th>Account</th><th style={{textAlign:'right'}}>Debit</th><th style={{textAlign:'right'}}>Credit</th></tr></thead>
              <tbody>
                <tr><td>Expense / Inventory</td><td style={{textAlign:'right'}}><span className="acc-amount debit">{formatCurrency(subtotal)}</span></td><td>-</td></tr>
                {totalTax > 0 && <tr><td>Input GST</td><td style={{textAlign:'right'}}><span className="acc-amount debit">{formatCurrency(totalTax)}</span></td><td>-</td></tr>}
                <tr><td>Accounts Payable</td><td>-</td><td style={{textAlign:'right'}}><span className="acc-amount credit">{formatCurrency(grandTotal)}</span></td></tr>
              </tbody>
            </table>
          </div>

          <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
            <button type="button" className="acc-btn acc-btn-secondary" onClick={() => navigate('/bills')}>Cancel</button>
            <button type="submit" className="acc-btn acc-btn-primary" disabled={saving}>{saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Bill')}</button>
          </div>
        </form>
        )}
      </div>
    </Layout>
  );
}

export default CreateBill;

