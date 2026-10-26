// Currency Management - Multi-currency support
import { useState } from 'react';
import Layout from '../../components/Layout';
import CurrencyModal from '../../components/accounting/CurrencyModal';
import { getCurrencies, createCurrency, updateCurrency, deleteCurrency } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

function CurrencyManagement() {
  const { data: currencies, setData: setCurrencies, loading, error } = useAccountingFetch(getCurrencies, []);
  const [showModal, setShowModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);


  const handleSave = async (currency) => {
    try {
      if (editingCurrency) {
        const response = await updateCurrency(editingCurrency.id, currency);
        const updated = response.data || currency;
        setCurrencies(currencies.map(c => c.id === updated.id ? updated : c));
      } else {
        const response = await createCurrency(currency);
        const created = response.data || { ...currency, id: Date.now() };
        setCurrencies([...currencies, created]);
      }
    } catch {
      if (editingCurrency) { setCurrencies(currencies.map(c => c.id === currency.id ? currency : c)); }
      else { setCurrencies([...currencies, { ...currency, id: Date.now() }]); }
    }
    setShowModal(false); setEditingCurrency(null);
  };

  const handleDelete = async (id) => {
    const currency = currencies.find(c => c.id === id);
    if (currency?.isBase) { alert('Cannot delete base currency!'); return; }
    if (window.confirm('Delete this currency?')) {
      try { await deleteCurrency(id); } catch { /* fallback */ }
      setCurrencies(currencies.filter(c => c.id !== id));
    }
  };

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left"><div className="header-icon">{ICONS.currency}</div><div><h1 className="page-title">Currency Management</h1><p className="page-subtitle">Multi-currency support with exchange rates</p></div></div>
          <div className="header-actions"><button className="acc-btn acc-btn-primary" onClick={() => { setEditingCurrency(null); setShowModal(true); }}>+ Add Currency</button></div>
        </div>

        <div className="acc-table-container">
          {loading ? <div className="acc-loading"><span className="spinner"></span> Loading...</div> : error ? (
            <div style={{padding:'16px 20px',borderRadius:'8px',background:'var(--error-50)',border:'1px solid var(--error-200)',color:'var(--error-700)',fontSize:'13px'}}>
              Couldn't load this data. Please check your connection and try again.
            </div>
          ) : (
            <table className="acc-table">
              <thead><tr><th>Code</th><th>Name</th><th>Symbol</th><th style={{textAlign:'right'}}>Exchange Rate (to INR)</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {currencies.map(currency => (
                  <tr key={currency.id}>
                    <td style={{fontWeight:600,fontSize:'16px'}}>{currency.code}</td>
                    <td>{currency.name}</td>
                    <td style={{fontSize:'18px'}}>{currency.symbol}</td>
                    <td style={{textAlign:'right',fontFamily:'monospace',fontWeight:500}}>
                      {currency.isBase ? '1.0000 (Base)' : `₹${currency.exchangeRate.toFixed(4)}`}
                    </td>
                    <td>{currency.isBase ? <span className="acc-status-badge paid">Base Currency</span> : <span className="acc-status-badge active">Active</span>}</td>
                    <td>
                      <div style={{display:'flex',gap:'8px'}}>
                        <button className="acc-btn acc-btn-secondary" style={{padding:'4px 12px',fontSize:'12px'}} onClick={() => { setEditingCurrency(currency); setShowModal(true); }}>Edit</button>
                        {!currency.isBase && <button className="acc-btn acc-btn-danger" style={{padding:'4px 12px',fontSize:'12px'}} onClick={() => handleDelete(currency.id)}>Delete</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {showModal && <CurrencyModal currency={editingCurrency} onSave={handleSave} onClose={() => { setShowModal(false); setEditingCurrency(null); }} />}
      </div>
    </Layout>
  );
}

export default CurrencyManagement;

