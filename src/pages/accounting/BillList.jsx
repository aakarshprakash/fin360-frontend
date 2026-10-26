// Bill List - Purchase module
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getBills, deleteBill } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import useSnackbar from '../../utils/useSnackbar';
import Pagination from '../../components/accounting/Pagination';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

function BillList() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, perPage]);

  const fetchBillsPage = useCallback(() => getBills({
    page, per_page: perPage,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  }), [page, perPage, statusFilter]);

  const { data: bills, setData: setBills, loading, error, meta } = useAccountingFetch(
    fetchBillsPage, [], { deps: [page, perPage, statusFilter] }
  );

  // Separate whole-dataset fetch for KPI totals, independent of the paginated table
  const { data: statsBills } = useAccountingFetch(
    useCallback(() => getBills({ per_page: 1000 }), []), []
  );

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount) || 0);

  const normalizeBill = (b) => {
    let vendorName = 'Unknown';
    if (typeof b.vendor === 'string' && b.vendor) vendorName = b.vendor;
    else if (b.vendor?.name) vendorName = b.vendor.name;
    else if (b.vendorName) vendorName = b.vendorName;

    return {
      ...b,
      vendor: vendorName,
      total: Number(b.total) || 0,
    };
  };

  const normalized = useMemo(() => bills.map(normalizeBill), [bills]);
  const statsNormalized = useMemo(() => statsBills.map(normalizeBill), [statsBills]);

  // Search still applied client-side within the current page (backend BillController
  // has no `search` param), status filtering is server-side via statusFilter above.
  const filtered = normalized.filter(b => {
    const searchStr = `${b.billNumber || ''} ${b.vendor || ''}`.toLowerCase();
    return !searchQuery || searchStr.includes(searchQuery.toLowerCase());
  });

  const handleDelete = async (e, id, billNumber) => {
    e.stopPropagation();
    if (window.confirm(`Delete bill ${billNumber || ''}? This cannot be undone.`)) {
      try {
        await deleteBill(id);
        setBills(bills.filter(b => b.id !== id));
        showSnackbar('Bill deleted.', 'success');
      } catch (err) {
        showSnackbar(err.response?.data?.message || 'Could not delete this bill. Please try again.', 'error');
      }
    }
  };

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">{ICONS.bill}</div>
            <div><h1 className="page-title">Purchase Bills</h1><p className="page-subtitle">Manage bills • {meta?.total ?? statsNormalized.length} total</p></div>
          </div>
          <div className="header-actions">
            <button className="acc-btn acc-btn-primary" onClick={() => navigate('/bills/create')}>+ New Bill</button>
          </div>
        </div>

        <div className="acc-kpi-grid">
          <div className="acc-kpi-card"><div className="kpi-header"><div className="kpi-icon" >{ICONS.clock}</div></div><p className="kpi-value">{formatCurrency(statsNormalized.filter(b=>b.status==='pending').reduce((s,b)=>s+b.total,0))}</p><p className="kpi-label">Pending</p></div>
          <div className="acc-kpi-card"><div className="kpi-header"><div className="kpi-icon" >{ICONS.checkCircle}</div></div><p className="kpi-value">{formatCurrency(statsNormalized.filter(b=>b.status==='paid').reduce((s,b)=>s+b.total,0))}</p><p className="kpi-label">Paid</p></div>
          <div className="acc-kpi-card"><div className="kpi-header"><div className="kpi-icon" >{ICONS.alertTriangle}</div></div><p className="kpi-value">{formatCurrency(statsNormalized.filter(b=>b.status==='overdue').reduce((s,b)=>s+b.total,0))}</p><p className="kpi-label">Overdue</p></div>
        </div>

        <div className="acc-table-container">
          <div className="acc-table-toolbar">
            <div className="toolbar-left">
              <input className="acc-search-input" type="text" placeholder="Search bills..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <select className="acc-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          {loading ? <div className="acc-loading"><span className="spinner"></span> Loading...</div> : error ? (
            <div style={{padding:'16px 20px',borderRadius:'8px',background:'var(--error-50)',border:'1px solid var(--error-200)',color:'var(--error-700)',fontSize:'13px'}}>
              Couldn't load bills. Please check your connection and try again.
            </div>
          ) : (
            <table className="acc-table">
              <thead><tr><th>Bill #</th><th>Vendor</th><th>Date</th><th>Due Date</th><th>Status</th><th style={{textAlign:'right'}}>Amount</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{textAlign:'center',padding:'32px',color:'var(--neutral-400)'}}>No bills match your filters.</td></tr>
                ) : filtered.map(bill => (
                  <tr key={bill.id} onClick={() => navigate(`/bills/${bill.id}`)} style={{cursor:'pointer'}}>
                    <td style={{fontWeight:500,color:'var(--primary-600)'}}>{bill.billNumber}</td>
                    <td>{bill.vendor}</td>
                    <td>{new Date(bill.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td>{new Date(bill.dueDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                    <td><span className={`acc-status-badge ${bill.status}`}>{bill.status.charAt(0).toUpperCase()+bill.status.slice(1)}</span></td>
                    <td style={{textAlign:'right'}}><span className="acc-amount">{formatCurrency(bill.total)}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className="acc-btn acc-btn-danger" style={{padding:'4px 10px',fontSize:'12px'}} onClick={(e) => handleDelete(e, bill.id, bill.billNumber)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination meta={meta} page={page} onPageChange={setPage} perPage={perPage} onPerPageChange={setPerPage} />
        </div>
      </div>
    </Layout>
  );
}

export default BillList;
