// Tax Management - GST tax rates
import { useState } from 'react';
import Layout from '../../components/Layout';
import TaxModal from '../../components/accounting/TaxModal';
import { getTaxes, createTax, updateTax, deleteTax } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

function TaxManagement() {
  const { data: taxes, setData: setTaxes, loading, error } = useAccountingFetch(getTaxes, []);
  const [showModal, setShowModal] = useState(false);
  const [editingTax, setEditingTax] = useState(null);


  const handleSave = async (tax) => {
    try {
      if (editingTax) {
        const response = await updateTax(editingTax.id, tax);
        const updated = response.data || tax;
        setTaxes(taxes.map(t => t.id === updated.id ? updated : t));
      } else {
        const response = await createTax(tax);
        const created = response.data || { ...tax, id: Date.now() };
        setTaxes([...taxes, created]);
      }
    } catch {
      if (editingTax) { setTaxes(taxes.map(t => t.id === tax.id ? tax : t)); }
      else { setTaxes([...taxes, { ...tax, id: Date.now() }]); }
    }
    setShowModal(false); setEditingTax(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this tax rate?')) {
      try { await deleteTax(id); } catch { /* fallback */ }
      setTaxes(taxes.filter(t => t.id !== id));
    }
  };

  const typeColors = { CGST: 'var(--primary-600)', SGST: 'var(--accent-500)', IGST: 'var(--success-700)' };

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left"><div className="header-icon">{ICONS.tax}</div><div><h1 className="page-title">Tax Management</h1><p className="page-subtitle">GST tax rates configuration</p></div></div>
          <div className="header-actions"><button className="acc-btn acc-btn-primary" onClick={() => { setEditingTax(null); setShowModal(true); }}>+ Add Tax Rate</button></div>
        </div>

        <div className="acc-kpi-grid">
          {['CGST', 'SGST', 'IGST'].map(type => (
            <div key={type} className="acc-kpi-card">
              <div className="kpi-header"><div className="kpi-icon" style={{background: `${typeColors[type]}15`, color: typeColors[type], fontSize:'14px', fontWeight:600}}>{type}</div></div>
              <p className="kpi-value">{taxes.filter(t => t.type === type).length}</p>
              <p className="kpi-label">{type} Rates</p>
            </div>
          ))}
        </div>

        <div className="acc-table-container">
          {loading ? <div className="acc-loading"><span className="spinner"></span> Loading...</div> : error ? (
            <div style={{padding:'16px 20px',borderRadius:'8px',background:'var(--error-50)',border:'1px solid var(--error-200)',color:'var(--error-700)',fontSize:'13px'}}>
              Couldn't load this data. Please check your connection and try again.
            </div>
          ) : (
            <table className="acc-table">
              <thead><tr><th>Tax Name</th><th>Rate (%)</th><th>Type</th><th>Actions</th></tr></thead>
              <tbody>
                {taxes.map(tax => (
                  <tr key={tax.id}>
                    <td style={{fontWeight:500}}>{tax.name}</td>
                    <td><span style={{fontSize:'18px',fontWeight:600,color: typeColors[tax.type]}}>{tax.rate}%</span></td>
                    <td><span className="acc-type-badge" style={{background: `${typeColors[tax.type]}15`, color: typeColors[tax.type]}}>{tax.type}</span></td>
                    <td>
                      <div style={{display:'flex',gap:'8px'}}>
                        <button className="acc-btn acc-btn-secondary" style={{padding:'4px 12px',fontSize:'12px'}} onClick={() => { setEditingTax(tax); setShowModal(true); }}>Edit</button>
                        <button className="acc-btn acc-btn-danger" style={{padding:'4px 12px',fontSize:'12px'}} onClick={() => handleDelete(tax.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {showModal && <TaxModal tax={editingTax} onSave={handleSave} onClose={() => { setShowModal(false); setEditingTax(null); }} />}
      </div>
    </Layout>
  );
}

export default TaxManagement;

