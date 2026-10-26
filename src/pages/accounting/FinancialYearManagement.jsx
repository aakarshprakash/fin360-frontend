// Financial Year Management - SRS Section 25
import { useState } from 'react';
import Layout from '../../components/Layout';
import { ICONS } from '../../components/accounting/AccountingIcons';
import { getFinancialYears, openFinancialYear, closeFinancialYear } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import '../../styles/Accounting.css';

function FinancialYearManagement() {
  const { data: years, setData: setYears, loading, error } = useAccountingFetch(getFinancialYears, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' });
  const [closing, setClosing] = useState(null);


  // Auto-suggest next FY when opening the form
  const suggestNext = () => {
    const sorted = [...years].sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    if (sorted.length > 0) {
      const lastEnd = new Date(sorted[0].endDate);
      const nextStart = new Date(lastEnd);
      nextStart.setDate(nextStart.getDate() + 1);
      const nextEnd = new Date(nextStart);
      nextEnd.setFullYear(nextEnd.getFullYear() + 1);
      nextEnd.setDate(nextEnd.getDate() - 1);
      const startYear = nextStart.getFullYear();
      const endYear = nextEnd.getFullYear();
      setForm({
        name: `FY ${startYear}–${endYear}`,
        startDate: nextStart.toISOString().split('T')[0],
        endDate: nextEnd.toISOString().split('T')[0],
      });
    } else {
      // Default: current April to next March
      const now = new Date();
      const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      setForm({
        name: `FY ${year}–${year + 1}`,
        startDate: `${year}-04-01`,
        endDate: `${year + 1}-03-31`,
      });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    // Validate no overlap
    const newStart = new Date(form.startDate);
    const newEnd = new Date(form.endDate);
    const overlap = years.some(y => {
      const s = new Date(y.startDate), e2 = new Date(y.endDate);
      return newStart <= e2 && newEnd >= s;
    });
    if (overlap) { alert('Financial years cannot overlap.'); return; }
    if (newEnd <= newStart) { alert('End date must be after start date.'); return; }

    const newYear = {
      ...form,
      id: Date.now(),
      status: 'open',
      createdBy: 'Admin',
      createdDate: new Date().toISOString().split('T')[0],
      isDefault: years.length === 0,
    };
    try {
      const r = await openFinancialYear(form);
      if (r.data) Object.assign(newYear, r.data);
    } catch { /* fallback */ }
    setYears([...years, newYear]);
    setShowForm(false);
  };

  const handleClose = async (id) => {
    const fy = years.find(y => y.id === id);
    if (!fy) return;
    if (!window.confirm(`Close ${fy.name}?\n\nThis will:\n• Finalize all transactions\n• Lock the financial year\n• Carry forward balances to next year\n\nThis action cannot be undone.`)) return;
    setClosing(id);
    try { await closeFinancialYear(id); } catch { /* fallback */ }
    setYears(years.map(y => y.id === id ? { ...y, status: 'closed', isDefault: false } : y));
    setClosing(null);
  };

  const handleSetDefault = (id) => {
    const fy = years.find(y => y.id === id);
    if (fy?.status === 'closed') { alert('Cannot set a closed financial year as default.'); return; }
    setYears(years.map(y => ({ ...y, isDefault: y.id === id })));
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const activeYear = years.find(y => y.isDefault);
  const openYears = years.filter(y => y.status === 'open');
  const closedYears = years.filter(y => y.status === 'closed');

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">{ICONS.repeat}</div>
            <div>
              <h1 className="page-title">Financial Year Management</h1>
              <p className="page-subtitle">Manage accounting periods and year-end closing</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="acc-btn acc-btn-primary" onClick={() => { suggestNext(); setShowForm(true); }}>
              + New Financial Year
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="acc-kpi-grid">
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ICONS.checkCircle}</div></div>
            <p className="kpi-value" style={{fontSize:'16px'}}>{activeYear?.name || 'None'}</p>
            <p className="kpi-label">Active Financial Year</p>
          </div>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ICONS.repeat}</div></div>
            <p className="kpi-value">{years.length}</p>
            <p className="kpi-label">Total Years</p>
          </div>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ICONS.clock}</div></div>
            <p className="kpi-value">{openYears.length}</p>
            <p className="kpi-label">Open</p>
          </div>
          <div className="acc-kpi-card">
            <div className="kpi-header"><div className="kpi-icon">{ICONS.fileText}</div></div>
            <p className="kpi-value">{closedYears.length}</p>
            <p className="kpi-label">Closed</p>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="acc-table-container" style={{padding:'24px',marginBottom:'20px',borderColor:'var(--primary-400)'}}>
            <h3 style={{margin:'0 0 16px',fontSize:'15px',fontWeight:600}}>Create New Financial Year</h3>
            <form onSubmit={handleCreate}>
              <div className="acc-form-group">
                <label>Financial Year Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required placeholder="e.g., FY 2026–2027" />
              </div>
              <div className="acc-form-row">
                <div className="acc-form-group">
                  <label>Start Date *</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({...form, startDate: e.target.value})} required />
                </div>
                <div className="acc-form-group">
                  <label>End Date *</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({...form, endDate: e.target.value})} required />
                </div>
              </div>
              {form.startDate && form.endDate && (
                <div className="acc-entry-preview">
                  <h4>{ICONS.repeat} Preview</h4>
                  <p style={{margin:'4px 0',fontSize:'13px',color:'var(--neutral-700)'}}>
                    <strong>{form.name}</strong> — {formatDate(form.startDate)} to {formatDate(form.endDate)}
                    {' '}({Math.round((new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24))} days)
                  </p>
                </div>
              )}
              <div style={{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'16px'}}>
                <button type="button" className="acc-btn acc-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="acc-btn acc-btn-primary">Create Financial Year</button>
              </div>
            </form>
          </div>
        )}

        {/* Financial Years List */}
        <div className="acc-table-container">
          <div className="acc-table-toolbar">
            <h3 style={{margin:0,fontSize:'15px',fontWeight:600}}>All Financial Years</h3>
          </div>
          {loading ? <div className="acc-loading"><span className="spinner"></span> Loading...</div> : error ? (
            <div style={{padding:'16px 20px',borderRadius:'8px',background:'var(--error-50)',border:'1px solid var(--error-200)',color:'var(--error-700)',fontSize:'13px'}}>
              Couldn't load this data. Please check your connection and try again.
            </div>
          ) : (
            <table className="acc-table">
              <thead>
                <tr>
                  <th>Financial Year</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Default</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {years.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)).map(fy => {
                  const days = Math.round((new Date(fy.endDate) - new Date(fy.startDate)) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={fy.id}>
                      <td style={{fontWeight:500}}>{fy.name}</td>
                      <td>{formatDate(fy.startDate)}</td>
                      <td>{formatDate(fy.endDate)}</td>
                      <td style={{fontSize:'12px',color:'var(--neutral-500)'}}>{days} days</td>
                      <td>
                        <span className={`acc-status-badge ${fy.status === 'open' ? 'active' : 'draft'}`}>
                          {fy.status === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td>
                        {fy.isDefault ? (
                          <span className="acc-status-badge active">Active</span>
                        ) : fy.status === 'open' ? (
                          <button className="acc-status-badge draft" style={{cursor:'pointer',border:'none'}} onClick={() => handleSetDefault(fy.id)}>
                            Set Active
                          </button>
                        ) : (
                          <span style={{fontSize:'12px',color:'var(--neutral-400)'}}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{display:'flex',gap:'6px'}}>
                          {fy.status === 'open' && (
                            <button
                              className="acc-btn acc-btn-danger"
                              style={{padding:'4px 10px',fontSize:'12px'}}
                              onClick={() => handleClose(fy.id)}
                              disabled={closing === fy.id}
                            >
                              {closing === fy.id ? 'Closing...' : 'Close Year'}
                            </button>
                          )}
                          {fy.status === 'closed' && (
                            <span style={{fontSize:'12px',color:'var(--neutral-400)',padding:'4px 0',display:'flex',alignItems:'center',gap:'4px'}}>
                              {ICONS.checkCircle} Finalized
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {years.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{textAlign:'center',padding:'40px',color:'var(--neutral-400)'}}>
                      No financial years configured. Create your first financial year.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Help Section */}
        <div className="acc-entry-preview" style={{marginTop:'24px'}}>
          <h4>{ICONS.fileText} Financial Year Guidelines</h4>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',fontSize:'13px',color:'var(--neutral-700)'}}>
            <div>
              <p style={{margin:'0 0 8px',fontWeight:500}}>Year Closing Process</p>
              <ul style={{margin:0,paddingLeft:'18px',lineHeight:'1.8',color:'var(--neutral-600)'}}>
                <li>Finalize all transactions in the period</li>
                <li>Lock the financial year permanently</li>
                <li>Opening balances carry forward to next year</li>
                <li>Closed years cannot be edited</li>
              </ul>
            </div>
            <div>
              <p style={{margin:'0 0 8px',fontWeight:500}}>Validation Rules</p>
              <ul style={{margin:0,paddingLeft:'18px',lineHeight:'1.8',color:'var(--neutral-600)'}}>
                <li>Financial years cannot overlap</li>
                <li>Only admins can close financial years</li>
                <li>Transactions outside FY range are rejected</li>
                <li>One FY must always be active</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default FinancialYearManagement;

