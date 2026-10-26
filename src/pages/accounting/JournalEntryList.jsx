// Journal Entry List
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getJournalEntries, deleteJournalEntry } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

function JournalEntryList() {
  const navigate = useNavigate();
  const { data: entries, setData: setEntries, loading, error } = useAccountingFetch(getJournalEntries, []);
  const [searchQuery, setSearchQuery] = useState('');


  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount) || 0);

  const filtered = entries.filter(e =>
    (e.reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (window.confirm('Delete this journal entry?')) {
      try { await deleteJournalEntry(id); } catch { /* fallback */ }
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left"><div className="header-icon">{ICONS.journal}</div><div><h1 className="page-title">Journal Entries</h1><p className="page-subtitle">Manual accounting entries • {entries.length} entries</p></div></div>
          <div className="header-actions"><button className="acc-btn acc-btn-primary" onClick={() => navigate('/journal-entries/create')}>+ New Entry</button></div>
        </div>

        <div className="acc-table-container">
          <div className="acc-table-toolbar">
            <input className="acc-search-input" type="text" placeholder="Search entries..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          {loading ? <div className="acc-loading"><span className="spinner"></span> Loading...</div> : error ? (
            <div style={{padding:'16px 20px',borderRadius:'8px',background:'var(--error-50)',border:'1px solid var(--error-200)',color:'var(--error-700)',fontSize:'13px'}}>
              Couldn't load this data. Please check your connection and try again.
            </div>
          ) : (
            <table className="acc-table">
              <thead><tr><th>Date</th><th>Reference</th><th>Description</th><th style={{textAlign:'right'}}>Debit</th><th style={{textAlign:'right'}}>Credit</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(entry => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td style={{fontWeight:500,color:'var(--primary-600)',fontVariantNumeric:'tabular-nums'}}>{entry.reference}</td>
                    <td>{entry.description}</td>
                    <td style={{textAlign:'right'}}><span className="acc-amount debit">{formatCurrency(entry.debitTotal)}</span></td>
                    <td style={{textAlign:'right'}}><span className="acc-amount credit">{formatCurrency(entry.creditTotal)}</span></td>
                    <td><span className={`acc-status-badge ${entry.status === 'posted' ? 'paid' : 'draft'}`}>{(entry.status || 'draft').charAt(0).toUpperCase()+(entry.status || 'draft').slice(1)}</span></td>
                    <td>
                      {entry.status === 'draft' && <button className="acc-btn acc-btn-danger" style={{padding:'4px 10px',fontSize:'12px'}} onClick={() => handleDelete(entry.id)}>Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default JournalEntryList;

