// Product Modal - Create/Edit catalog products
import { useState, useEffect } from 'react';
import '../../styles/Accounting.css';

function ProductModal({ product, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', description: '', hsnCode: '', category: '', unit: 'NOS', unitPrice: 0, taxRate: 0,
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        hsnCode: product.hsnCode || product.hsn_code || '',
        category: product.category || '',
        unit: product.unit || 'NOS',
        unitPrice: Number(product.unitPrice || product.unit_price) || 0,
        taxRate: Number(product.taxRate || product.tax_rate) || 0,
      });
    }
  }, [product]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...product,
      name: form.name,
      description: form.description,
      hsnCode: form.hsnCode,
      category: form.category,
      unit: form.unit,
      unitPrice: Number(form.unitPrice),
      taxRate: Number(form.taxRate),
    });
  };

  return (
    <div className="acc-modal-overlay" onClick={onClose}>
      <div className="acc-modal" style={{maxWidth:'520px'}} onClick={(e) => e.stopPropagation()}>
        <div className="acc-modal-header">
          <h2>{product ? 'Edit Product' : 'Add Product'}</h2>
          <button className="acc-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="acc-modal-body">
            <div className="acc-form-group">
              <label>Product / Service Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="e.g., Electric Nail Drill Model PEDIMAX" required />
            </div>
            <div className="acc-form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Optional additional detail" rows={2} />
            </div>
            <div className="acc-form-row">
              <div className="acc-form-group">
                <label>HSN/SAC Code</label>
                <input type="text" value={form.hsnCode} onChange={(e) => setForm({...form, hsnCode: e.target.value})} placeholder="e.g., 90181290" />
              </div>
              <div className="acc-form-group">
                <label>Category</label>
                <input type="text" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} placeholder="e.g., Footcare Products" />
              </div>
            </div>
            <div className="acc-form-row">
              <div className="acc-form-group">
                <label>Unit</label>
                <input type="text" value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} placeholder="NOS / Box / Hrs" />
              </div>
              <div className="acc-form-group">
                <label>List Price (₹) *</label>
                <input type="number" min="0" step="0.01" value={form.unitPrice} onChange={(e) => setForm({...form, unitPrice: e.target.value})} required />
              </div>
              <div className="acc-form-group">
                <label>GST %</label>
                <input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={(e) => setForm({...form, taxRate: e.target.value})} />
              </div>
            </div>
          </div>
          <div className="acc-modal-footer">
            <button type="button" className="acc-btn acc-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="acc-btn acc-btn-primary">{product ? 'Update' : 'Add'} Product</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductModal;
