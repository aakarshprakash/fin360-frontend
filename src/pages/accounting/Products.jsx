// Products — the catalogue used by invoices, bills and quotations, with
// pictures, feature lists and stock keeping.
import { useMemo, useState } from 'react';
import { AlertTriangle, Boxes, ImageOff, PackageX, Wallet } from 'lucide-react';
import Layout from '../../components/Layout';
import ProductModal from '../../components/accounting/ProductModal';
import StockModal from '../../components/accounting/StockModal';
import { invalidateProductsCache } from '../../components/accounting/ProductPicker';
import { API_ORIGIN } from '../../utils/api';
import { getProducts, deleteProduct } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import useSnackbar from '../../utils/useSnackbar';
import '../../styles/Accounting.css';
import '../../styles/Products.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

const money = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v) || 0);
const qtyFmt = (v) => Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 3 });

function stockState(p) {
  if (!p.trackStock) return 'untracked';
  const qty = Number(p.stockQuantity) || 0;
  if (qty <= 0) return 'out';
  if (p.reorderLevel != null && qty <= Number(p.reorderLevel)) return 'low';
  return 'ok';
}

function StockBadge({ product }) {
  const state = stockState(product);
  if (state === 'untracked') return <span className="prod-stock is-untracked">Not tracked</span>;
  const label = { out: 'Out of stock', low: 'Low', ok: 'In stock' }[state];
  return (
    <span className={`prod-stock is-${state}`}>
      <b>{qtyFmt(product.stockQuantity)}</b> {product.unit || 'NOS'}
      <small>{label}</small>
    </span>
  );
}

function Products() {
  const { showSnackbar } = useSnackbar();
  const { data: products, setData: setProducts, loading, error } = useAccountingFetch(
    () => getProducts({ per_page: 500 }), []
  );
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new
  const [stockFor, setStockFor] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const tracked = products.filter((p) => p.trackStock);
  const stockValue = tracked.reduce((s, p) => s + Math.max(0, Number(p.stockQuantity) || 0) * (Number(p.purchasePrice ?? p.unitPrice) || 0), 0);
  const lowCount = products.filter((p) => stockState(p) === 'low').length;
  const outCount = products.filter((p) => stockState(p) === 'out').length;

  const filtered = products.filter((p) => {
    const hay = `${p.name} ${p.sku || ''} ${p.brand || ''} ${p.model || ''} ${p.hsnCode || ''} ${p.category || ''}`.toLowerCase();
    if (search && !hay.includes(search.toLowerCase())) return false;
    if (category && p.category !== category) return false;
    if (stockFilter && stockState(p) !== stockFilter) return false;
    return true;
  });

  const replace = (saved) => setProducts((list) => list.map((p) => (p.id === saved.id ? saved : p)));

  const handleSaved = (saved, isNew) => {
    setProducts((list) => (isNew ? [saved, ...list] : list.map((p) => (p.id === saved.id ? saved : p))));
    showSnackbar(isNew ? 'Product added.' : 'Product updated.', 'success');
    setEditing(undefined);
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete “${p.name}” from the catalogue? Existing invoices and quotations keep their lines.`)) return;
    try {
      await deleteProduct(p.id);
      setProducts((list) => list.filter((x) => x.id !== p.id));
      invalidateProductsCache();
      showSnackbar('Product deleted.', 'success');
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Could not delete this product. Please try again.', 'error');
    }
  };

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon"><Boxes size={22} /></div>
            <div><h1 className="page-title">Products</h1><p className="page-subtitle">Catalogue, pictures and stock for invoices, bills &amp; quotations</p></div>
          </div>
          <div className="header-actions">
            <button className="acc-btn acc-btn-primary" onClick={() => setEditing(null)}>{ICONS.plus} Add Product</button>
          </div>
        </div>

        <div className="acc-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <button type="button" className={`acc-kpi-card prod-kpi ${stockFilter === '' ? 'is-on' : ''}`} onClick={() => setStockFilter('')}>
            <div className="kpi-header"><div className="kpi-icon"><Boxes size={18} /></div></div>
            <p className="kpi-value">{products.length}</p>
            <p className="kpi-label">Products · {tracked.length} with stock tracking</p>
          </button>
          <div className="acc-kpi-card prod-kpi">
            <div className="kpi-header"><div className="kpi-icon"><Wallet size={18} /></div></div>
            <p className="kpi-value">{money(stockValue)}</p>
            <p className="kpi-label">Stock value (at purchase price)</p>
          </div>
          <button type="button" className={`acc-kpi-card prod-kpi ${stockFilter === 'low' ? 'is-on' : ''}`} onClick={() => setStockFilter(stockFilter === 'low' ? '' : 'low')}>
            <div className="kpi-header"><div className="kpi-icon prod-kpi-warn"><AlertTriangle size={18} /></div></div>
            <p className="kpi-value">{lowCount}</p>
            <p className="kpi-label">Low stock</p>
          </button>
          <button type="button" className={`acc-kpi-card prod-kpi ${stockFilter === 'out' ? 'is-on' : ''}`} onClick={() => setStockFilter(stockFilter === 'out' ? '' : 'out')}>
            <div className="kpi-header"><div className="kpi-icon prod-kpi-danger"><PackageX size={18} /></div></div>
            <p className="kpi-value">{outCount}</p>
            <p className="kpi-label">Out of stock</p>
          </button>
        </div>

        <div className="acc-table-container">
          <div className="acc-table-toolbar prod-toolbar">
            <div className="toolbar-left">
              <input className="acc-search-input" type="search" aria-label="Search products" placeholder="Search name, SKU, brand, model, HSN…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className="acc-filter-select" aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="acc-filter-select" aria-label="Stock" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                <option value="">Any stock</option>
                <option value="ok">In stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
                <option value="untracked">Not tracked</option>
              </select>
            </div>
            <div className="prod-count">{filtered.length} of {products.length}</div>
          </div>
          {loading ? <div className="acc-loading"><span className="spinner"></span> Loading...</div> : error ? (
            <div className="prod-load-error">Couldn't load products. Please check your connection and try again.</div>
          ) : (
            <div className="prod-table-wrap">
              <table className="acc-table prod-table">
                <thead>
                  <tr>
                    <th>Product</th><th>Category</th><th>HSN/SAC</th>
                    <th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'right' }}>GST</th>
                    <th>Stock</th><th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="prod-empty">
                      {products.length === 0 ? 'No products yet. Add your first product to pick it on invoices and quotations.' : 'No products match these filters.'}
                    </td></tr>
                  ) : filtered.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="prod-cell">
                          <div className="prod-thumb">
                            {p.image ? <img src={`${API_ORIGIN}/storage/${p.image}`} alt="" loading="lazy" /> : <ImageOff size={16} aria-hidden="true" />}
                          </div>
                          <div className="prod-cell-text">
                            <button type="button" className="prod-name" onClick={() => setEditing(p)}>{p.name}</button>
                            <span className="prod-sub">
                              {[p.sku, [p.brand, p.model].filter(Boolean).join(' ')].filter(Boolean).join(' · ') || '—'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{p.category || '—'}</td>
                      <td className="prod-mono">{p.hsnCode || '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        {money(p.unitPrice)}
                        {p.purchasePrice != null && <span className="prod-sub">Cost {money(p.purchasePrice)}</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>{Number(p.taxRate || 0)}%</td>
                      <td><StockBadge product={p} /></td>
                      <td>
                        <div className="prod-actions">
                          <button className="acc-btn acc-btn-secondary" onClick={() => setStockFor(p)}>Stock</button>
                          <button className="acc-btn acc-btn-secondary" onClick={() => setEditing(p)}>Edit</button>
                          <button className="acc-btn acc-btn-danger" onClick={() => handleDelete(p)} aria-label={`Delete ${p.name}`}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {editing !== undefined && (
          <ProductModal product={editing} categories={categories} onSaved={handleSaved} onClose={() => setEditing(undefined)} />
        )}
        {stockFor && (
          <StockModal
            product={stockFor}
            onUpdated={(saved) => { if (saved) { replace(saved); setStockFor(saved); invalidateProductsCache(); } }}
            onClose={() => setStockFor(null)}
          />
        )}
      </div>
    </Layout>
  );
}

export default Products;
