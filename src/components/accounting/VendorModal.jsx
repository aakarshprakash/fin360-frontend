// Vendor Modal - Create/Edit vendors
import { useState, useEffect } from 'react';
import '../../styles/Accounting.css';

function VendorModal({ vendor, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', gstNumber: '', address: '', phone: '', email: '', paymentTerms: 'Net 30', balance: 0,
  });

  useEffect(() => {
    if (vendor) setForm({ ...vendor });
  }, [vendor]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...vendor, ...form, balance: Number(form.balance) });
  };

  return (
    <div className="acc-modal-overlay" onClick={onClose}>
      <div className="acc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="acc-modal-header">
          <h2>{vendor ? 'Edit Vendor' : 'Add Vendor'}</h2>
          <button className="acc-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="acc-modal-body">
            <div className="acc-form-group">
              <label>Vendor Name *</label>
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
              <label>GST Number</label>
              <input type="text" value={form.gstNumber} onChange={(e) => setForm({...form, gstNumber: e.target.value})} />
            </div>
            <div className="acc-form-group">
              <label>Address</label>
              <textarea value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
            </div>
            <div className="acc-form-group">
              <label>Payment Terms</label>
              <select value={form.paymentTerms} onChange={(e) => setForm({...form, paymentTerms: e.target.value})}>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="Due on Receipt">Due on Receipt</option>
              </select>
            </div>
          </div>
          <div className="acc-modal-footer">
            <button type="button" className="acc-btn acc-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="acc-btn acc-btn-primary">{vendor ? 'Update' : 'Add'} Vendor</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VendorModal;

