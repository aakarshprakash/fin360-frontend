// Products - Catalog used by the invoice/bill/quotation line-item picker
import { useState } from 'react';
import Layout from '../../components/Layout';
import ProductModal from '../../components/accounting/ProductModal';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../utils/accountingApi';
import { useAccountingFetch } from '../../utils/useAccountingFetch';
import useSnackbar from '../../utils/useSnackbar';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';

function Products() {
  const { showSnackbar } = useSnackbar();
  const { data: products, setData: setProducts, loading, error } = useAccountingFetch(
    () => getProducts({ per_page: 200 }), []
  );
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(amount) || 0);

  const filtered = products.filter(p => {
    const s = `${p.name || ''} ${p.hsnCode || p.hsn_code || ''} ${p.category || ''}`.toLowerCase();
    return !searchQuery || s.includes(searchQuery.toLowerCase());
  });

  const handleSave = async (product) => {
    try {
      if (editingProduct) {
        const response = await updateProduct(editingProduct.id, product);
        const updated = response.data?.data || response.data;
        setProducts(products.map(p => p.id === editingProduct.id ? updated : p));
      } else {
        const response = await createProduct(product);
        const created = response.data?.data || response.data;
        if (created?.id) setProducts([created, ...products]);
      }
      showSnackbar(editingProduct ? 'Product updated.' : 'Product added.', 'success');
      setShowModal(false); setEditingProduct(null);
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Could not save this product. Please try again.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product from the catalog? This cannot be undone.')) {
      try {
        await deleteProduct(id);
        setProducts(products.filter(p => p.id !== id));
        showSnackbar('Product deleted.', 'success');
      } catch (err) {
        showSnackbar(err.response?.data?.message || 'Could not delete this product. Please try again.', 'error');
      }
    }
  };

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left">
            <div className="header-icon">{ICONS.chartOfAccounts}</div>
            <div><h1 className="page-title">Products</h1><p className="page-subtitle">Catalog used when adding items to invoices, bills & quotations</p></div>
          </div>
          <div className="header-actions">
            <button className="acc-btn acc-btn-primary" onClick={() => { setEditingProduct(null); setShowModal(true); }}>{ICONS.plus} Add Product</button>
          </div>
        </div>

        <div className="acc-table-container">
          <div className="acc-table-toolbar">
            <div className="toolbar-left">
              <input className="acc-search-input" type="text" placeholder="Search products, HSN code, category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div style={{fontSize:'12px', color:'var(--neutral-500)'}}>{filtered.length} product{filtered.length !== 1 ? 's' : ''}</div>
          </div>
          {loading ? <div className="acc-loading"><span className="spinner"></span> Loading...</div> : error ? (
            <div style={{padding:'16px 20px',borderRadius:'8px',background:'var(--error-50)',border:'1px solid var(--error-200)',color:'var(--error-700)',fontSize:'13px'}}>
              Couldn't load products. Please check your connection and try again.
            </div>
          ) : (
            <table className="acc-table">
              <thead><tr><th>Name</th><th>Category</th><th>HSN/SAC</th><th>Unit</th><th style={{textAlign:'right'}}>Price</th><th style={{textAlign:'right'}}>GST %</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{textAlign:'center',color:'var(--neutral-400)',padding:'32px'}}>
                    {products.length === 0 ? 'No products yet. Add your first product to start selecting it in invoices/quotations.' : 'No products match your search.'}
                  </td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{fontWeight:500}}>{p.name}</td>
                    <td>{p.category || '—'}</td>
                    <td style={{fontFamily:'monospace',fontSize:'12px'}}>{p.hsnCode || p.hsn_code || '—'}</td>
                    <td>{p.unit || 'NOS'}</td>
                    <td style={{textAlign:'right'}}>{formatCurrency(p.unitPrice || p.unit_price)}</td>
                    <td style={{textAlign:'right'}}>{Number(p.taxRate || p.tax_rate || 0)}%</td>
                    <td>
                      <div style={{display:'flex',gap:'8px'}}>
                        <button className="acc-btn acc-btn-secondary" style={{padding:'4px 12px',fontSize:'12px'}} onClick={() => { setEditingProduct(p); setShowModal(true); }}>Edit</button>
                        <button className="acc-btn acc-btn-danger" style={{padding:'4px 12px',fontSize:'12px'}} onClick={() => handleDelete(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {showModal && <ProductModal product={editingProduct} onSave={handleSave} onClose={() => { setShowModal(false); setEditingProduct(null); }} />}
      </div>
    </Layout>
  );
}

export default Products;
