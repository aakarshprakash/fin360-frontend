// Vendor List Page
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import VendorModal from '../../components/accounting/VendorModal';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

function VendorList() {
  const navigate = useNavigate();
  const { data: vendors, setData: setVendors, loading, error } = useAccountingFetch(getVendors, []);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');


  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const filtered = vendors.filter(v =>
    (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.gstNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async (vendor) => {
    try {
      if (editingVendor) {
        const response = await updateVendor(editingVendor.id, vendor);
        const updated = response.data || vendor;
        setVendors(vendors.map(v => v.id === updated.id ? updated : v));
      } else {
        const response = await createVendor(vendor);
        const created = response.data || { ...vendor, id: Date.now() };
        setVendors([...vendors, created]);
      }
    } catch {
      if (editingVendor) {
        setVendors(vendors.map(v => v.id === vendor.id ? vendor : v));
      } else {
        setVendors([...vendors, { ...vendor, id: Date.now() }]);
      }
    }
    setShowModal(false);
    setEditingVendor(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this vendor?')) {
      try { await deleteVendor(id); } catch { /* fallback */ }
      setVendors(vendors.filter(v => v.id !== id));
    }
  };

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">{ICONS.vendor}</div>
            <div>
              <h1 className="page-title">Vendors / Suppliers</h1>
              <p className="page-subtitle">Manage vendor accounts • {vendors.length} vendors</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="acc-btn acc-btn-primary" onClick={() => { setEditingVendor(null); setShowModal(true); }}>+ Add Vendor</button>
          </div>
        </div>

        <div className="acc-kpi-grid">
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon" >{ICONS.vendor}</div></div>
            <p className="kpi-value">{vendors.length}</p>
            <p className="kpi-label">Total Vendors</p>
          </div>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon" >{ICONS.creditCard}</div></div>
            <p className="kpi-value">{formatCurrency(vendors.reduce((s,v) => s + (Number(v.balance) || 0), 0))}</p>
            <p className="kpi-label">Total Payable</p>
          </div>
        </div>

        <div className="acc-table-container">
          <div className="acc-table-toolbar">
            <input className="acc-search-input" type="text" placeholder="Search vendors..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          {loading ? (
            <div className="acc-loading"><span className="spinner"></span> Loading...</div>
          ) : error ? (
            <div style={{padding:'16px 20px',borderRadius:'8px',background:'var(--error-50)',border:'1px solid var(--error-200)',color:'var(--error-700)',fontSize:'13px'}}>
              Couldn't load this data. Please check your connection and try again.
            </div>
          ) : (
            <table className="acc-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>GST Number</th>
                  <th>Payment Terms</th>
                  <th style={{textAlign:'right'}}>Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(vendor => (
                  <tr key={vendor.id} onClick={() => navigate(`/vendors/${vendor.id}`)}>
                    <td>
                      <div><strong>{vendor.name}</strong></div>
                      <div style={{fontSize:'12px',color:'var(--neutral-500)'}}>{vendor.email}</div>
                    </td>
                    <td style={{fontFamily:'monospace',fontSize:'12px'}}>{vendor.gstNumber || '-'}</td>
                    <td><span className="acc-status-badge active">{vendor.paymentTerms}</span></td>
                    <td style={{textAlign:'right'}}><span className="acc-amount debit">{formatCurrency(vendor.balance)}</span></td>
                    <td>
                      <div style={{display:'flex',gap:'8px'}}>
                        <button className="acc-btn acc-btn-secondary" style={{padding:'4px 10px',fontSize:'12px'}}
                          onClick={(e) => { e.stopPropagation(); setEditingVendor(vendor); setShowModal(true); }}>Edit</button>
                        <button className="acc-btn acc-btn-danger" style={{padding:'4px 10px',fontSize:'12px'}}
                          onClick={(e) => { e.stopPropagation(); handleDelete(vendor.id); }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showModal && (
          <VendorModal vendor={editingVendor} onSave={handleSave}
            onClose={() => { setShowModal(false); setEditingVendor(null); }} />
        )}
      </div>
    </Layout>
  );
}

export default VendorList;

