// Branch Management - Multi-branch support (SRS 23.13)
import { useState } from 'react';
import Layout from '../../components/Layout';
import { ICONS } from '../../components/accounting/AccountingIcons';
import { getBranches, createBranch, updateBranch, deleteBranch } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import '../../styles/Accounting.css';

const emptyForm = { name: '', code: '', address: '', city: '', state: '', country: 'India', phone: '', email: '', gstNumber: '', currency: 'INR', isDefault: false };

function BranchList() {
  const { data: branches, setData: setBranches, loading, error } = useAccountingFetch(getBranches, []);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');


  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const res = await updateBranch(editing.id, form);
        const updated = res.data || { ...form, id: editing.id };
        setBranches(branches.map(b => b.id === editing.id ? updated : b));
      } else {
        const res = await createBranch(form);
        const created = res.data || { ...form, id: Date.now() };
        setBranches([...branches, created]);
      }
    } catch {
      if (editing) setBranches(branches.map(b => b.id === editing.id ? { ...form, id: editing.id } : b));
      else setBranches([...branches, { ...form, id: Date.now() }]);
    }
    setShowForm(false); setEditing(null); setForm(emptyForm);
  };

  const handleEdit = (branch) => {
    setEditing(branch);
    setForm({ ...branch });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const branch = branches.find(b => b.id === id);
    if (branch?.isDefault) { alert('Cannot delete the default branch.'); return; }
    if (window.confirm('Delete this branch?')) {
      try { await deleteBranch(id); } catch { /* fallback */ }
      setBranches(branches.filter(b => b.id !== id));
    }
  };

  const handleSetDefault = async (id) => {
    const updated = branches.map(b => ({ ...b, isDefault: b.id === id }));
    setBranches(updated);
    try { await updateBranch(id, { isDefault: true }); } catch { /* fallback */ }
  };

  const filtered = branches.filter(b =>
    (b.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.city || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">{ICONS.building}</div>
            <div>
              <h1 className="page-title">Branch Management</h1>
              <p className="page-subtitle">Manage business branches and locations</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="acc-btn acc-btn-primary" onClick={() => { setEditing(null); setForm(emptyForm); setShowForm(true); }}>
              + Add Branch
            </button>
          </div>
        </div>

        <div className="acc-kpi-grid">
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ICONS.building}</div></div>
            <p className="kpi-value">{branches.length}</p>
            <p className="kpi-label">Total Branches</p>
          </div>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ICONS.globe}</div></div>
            <p className="kpi-value">{[...new Set(branches.map(b => b.state))].length}</p>
            <p className="kpi-label">States</p>
          </div>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ICONS.checkCircle}</div></div>
            <p className="kpi-value">{branches.find(b => b.isDefault)?.name || '-'}</p>
            <p className="kpi-label">Default Branch</p>
          </div>
        </div>

        {showForm && (
          <div className="acc-table-container" style={{padding:'24px',marginBottom:'20px',borderColor:'var(--primary-400)'}}>
            <h3 style={{margin:'0 0 16px',fontSize:'15px',fontWeight:600}}>{editing ? 'Edit' : 'Add'} Branch</h3>
            <form onSubmit={handleSave}>
              <div className="acc-form-row">
                <div className="acc-form-group"><label>Branch Name *</label><input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required /></div>
                <div className="acc-form-group"><label>Branch Code *</label><input type="text" value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} required placeholder="e.g., BLR" /></div>
              </div>
              <div className="acc-form-group"><label>Address</label><textarea value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} style={{minHeight:'56px'}} /></div>
              <div className="acc-form-row">
                <div className="acc-form-group"><label>City</label><input type="text" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} /></div>
                <div className="acc-form-group"><label>State</label><input type="text" value={form.state} onChange={(e) => setForm({...form, state: e.target.value})} /></div>
              </div>
              <div className="acc-form-row">
                <div className="acc-form-group"><label>Phone</label><input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} /></div>
                <div className="acc-form-group"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
              </div>
              <div className="acc-form-row">
                <div className="acc-form-group"><label>GST Number</label><input type="text" value={form.gstNumber} onChange={(e) => setForm({...form, gstNumber: e.target.value})} /></div>
                <div className="acc-form-group"><label>Currency</label>
                  <select value={form.currency} onChange={(e) => setForm({...form, currency: e.target.value})}>
                    <option>INR</option><option>USD</option><option>EUR</option><option>AED</option>
                  </select>
                </div>
              </div>
              <div style={{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'8px'}}>
                <button type="button" className="acc-btn acc-btn-secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
                <button type="submit" className="acc-btn acc-btn-primary">{editing ? 'Update' : 'Create'} Branch</button>
              </div>
            </form>
          </div>
        )}

        <div className="acc-table-container">
          <div className="acc-table-toolbar">
            <div className="toolbar-left">
              <input className="acc-search-input" type="text" placeholder="Search branches..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          {loading ? <div className="acc-loading"><span className="spinner"></span> Loading...</div> : error ? (
            <div style={{padding:'16px 20px',borderRadius:'8px',background:'var(--error-50)',border:'1px solid var(--error-200)',color:'var(--error-700)',fontSize:'13px'}}>
              Couldn't load this data. Please check your connection and try again.
            </div>
          ) : (
            <table className="acc-table">
              <thead><tr><th>Branch</th><th>Code</th><th>City / State</th><th>GST Number</th><th>Contact</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td style={{fontWeight:500}}>{b.name}</td>
                    <td><span style={{fontVariantNumeric:'tabular-nums',fontSize:'12px',background:'var(--neutral-100)',padding:'2px 8px',borderRadius:'4px'}}>{b.code}</span></td>
                    <td>{b.city}{b.state ? `, ${b.state}` : ''}</td>
                    <td style={{fontSize:'12px',fontVariantNumeric:'tabular-nums'}}>{b.gstNumber || '-'}</td>
                    <td style={{fontSize:'12px'}}>{b.email || b.phone || '-'}</td>
                    <td>
                      {b.isDefault ? (
                        <span className="acc-status-badge active">Default</span>
                      ) : (
                        <button className="acc-status-badge draft" style={{cursor:'pointer',border:'none'}} onClick={() => handleSetDefault(b.id)}>Set Default</button>
                      )}
                    </td>
                    <td>
                      <div style={{display:'flex',gap:'6px'}}>
                        <button className="acc-btn acc-btn-secondary" style={{padding:'4px 10px',fontSize:'12px'}} onClick={() => handleEdit(b)}>Edit</button>
                        {!b.isDefault && <button className="acc-btn acc-btn-danger" style={{padding:'4px 10px',fontSize:'12px'}} onClick={() => handleDelete(b.id)}>Delete</button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan="7" style={{textAlign:'center',padding:'40px',color:'var(--neutral-400)'}}>No branches found</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default BranchList;

