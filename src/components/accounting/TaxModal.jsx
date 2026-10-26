// Tax Modal - Create/Edit tax rates
import { useState, useEffect } from 'react';
import '../../styles/Accounting.css';

function TaxModal({ tax, onSave, onClose }) {
  const [form, setForm] = useState({ name: '', rate: 0, type: 'IGST' });
  useEffect(() => { if (tax) setForm({ ...tax }); }, [tax]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...tax, ...form, rate: Number(form.rate) });
  };

  return (
    <div className="acc-modal-overlay" onClick={onClose}>
      <div className="acc-modal" style={{maxWidth:'450px'}} onClick={(e) => e.stopPropagation()}>
        <div className="acc-modal-header">
          <h2>{tax ? 'Edit Tax' : 'Add Tax Rate'}</h2>
          <button className="acc-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="acc-modal-body">
            <div className="acc-form-group"><label>Tax Name *</label><input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g., GST 18%" required /></div>
            <div className="acc-form-row">
              <div className="acc-form-group"><label>Rate (%) *</label><input type="number" min="0" max="100" step="0.01" value={form.rate} onChange={(e) => setForm({...form, rate: e.target.value})} required /></div>
              <div className="acc-form-group"><label>Tax Type *</label>
                <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                  <option value="CGST">CGST</option><option value="SGST">SGST</option><option value="IGST">IGST</option>
                </select>
              </div>
            </div>
          </div>
          <div className="acc-modal-footer">
            <button type="button" className="acc-btn acc-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="acc-btn acc-btn-primary">{tax ? 'Update' : 'Add'} Tax</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaxModal;

