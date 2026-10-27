// Customer Modal - Create/Edit accounting customers
import { useState, useEffect } from 'react';
import { GST_STATES, panFromGstin, stateFromGstin } from './invoiceFormat';
import '../../styles/Accounting.css';

function CustomerModal({ customer, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', contactPerson: '', gstNumber: '', pan: '', address: '', state: '',
    currency: 'INR', creditLimit: 0, balance: 0,
  });

  useEffect(() => {
    if (customer) setForm({ ...customer });
  }, [customer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...customer, ...form, creditLimit: Number(form.creditLimit), balance: Number(form.balance) });
  };

  return (
    <div className="acc-modal-overlay" onClick={onClose}>
      <div className="acc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="acc-modal-header">
          <h2>{customer ? 'Edit Customer' : 'Add Customer'}</h2>
          <button className="acc-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="acc-modal-body">
            <div className="acc-form-group">
              <label>Customer Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="acc-form-row">
              <div className="acc-form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
              </div>
              <div className="acc-form-group">
                <label>Phone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
              </div>
            </div>
            <div className="acc-form-group">
              <label htmlFor="cust-contact">Contact Person</label>
              <input id="cust-contact" type="text" maxLength={150} value={form.contactPerson || ''} onChange={(e) => setForm({...form, contactPerson: e.target.value})} placeholder="e.g., Mr. Siby James – 94471 44093" />
            </div>
            <div className="acc-form-row">
              <div className="acc-form-group">
                <label htmlFor="cust-gst">GST Number</label>
                <input id="cust-gst" type="text" value={form.gstNumber || ''} placeholder="e.g., 27AABCU9603R1ZM"
                  onChange={(e) => {
                    const gstNumber = e.target.value.toUpperCase();
                    setForm({ ...form, gstNumber, state: form.state || stateFromGstin(gstNumber) });
                  }} />
              </div>
              <div className="acc-form-group">
                <label htmlFor="cust-pan">PAN</label>
                <input id="cust-pan" type="text" maxLength={20} value={form.pan || ''} onChange={(e) => setForm({...form, pan: e.target.value.toUpperCase()})}
                  placeholder={panFromGstin(form.gstNumber) || 'e.g., AAACU9603R'} />
              </div>
            </div>
            <div className="acc-form-group">
              <label>Address</label>
              <textarea value={form.address || ''} onChange={(e) => setForm({...form, address: e.target.value})} />
            </div>
            <div className="acc-form-group">
              <label htmlFor="cust-state">State</label>
              <select id="cust-state" value={form.state || ''} onChange={(e) => setForm({...form, state: e.target.value})}>
                <option value="">Select state</option>
                {form.state && !GST_STATES.includes(form.state) && <option value={form.state}>{form.state}</option>}
                {GST_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="acc-form-row">
              <div className="acc-form-group">
                <label>Currency</label>
                <select value={form.currency} onChange={(e) => setForm({...form, currency: e.target.value})}>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="AED">AED - UAE Dirham</option>
                </select>
              </div>
              <div className="acc-form-group">
                <label>Credit Limit</label>
                <input type="number" value={form.creditLimit} onChange={(e) => setForm({...form, creditLimit: e.target.value})} />
              </div>
            </div>
          </div>
          <div className="acc-modal-footer">
            <button type="button" className="acc-btn acc-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="acc-btn acc-btn-primary">{customer ? 'Update' : 'Add'} Customer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerModal;

