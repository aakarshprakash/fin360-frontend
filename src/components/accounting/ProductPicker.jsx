// Product Picker — searchable line-item description field that can either
// select a product from the catalog (auto-filling price/tax/HSN) or accept
// plain free-text for one-off items/services.
import { useState, useRef, useEffect } from 'react';
import { getProducts } from '../../utils/accountingApi';

// Module-level cache so the product list is fetched once per page load,
// not once per line-item row.
let _cache = null;
let _fetching = false;
let _listeners = [];

function notifyListeners(data) {
  _cache = data;
  _listeners.forEach(fn => fn(data));
}

function fetchOnce() {
  if (_cache || _fetching) return;
  _fetching = true;
  getProducts({ per_page: 500 })
    .then(res => {
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      notifyListeners(Array.isArray(data) ? data : []);
    })
    .catch(() => { /* keep empty — free-text entry still works */ })
    .finally(() => { _fetching = false; });
}

export function invalidateProductsCache() {
  _cache = null;
  fetchOnce();
}

function useProducts() {
  const [products, setProducts] = useState(_cache || []);
  useEffect(() => {
    const listener = (data) => setProducts(data);
    _listeners.push(listener);
    fetchOnce();
    return () => { _listeners = _listeners.filter(fn => fn !== listener); };
  }, []);
  return products;
}

function ProductPicker({ value, onChange, onSelectProduct, placeholder }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const products = useProducts();
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const q = (value || '').toLowerCase();
  const filtered = q
    ? products.filter(p =>
        `${p.name || ''} ${p.sku || ''} ${p.brand || ''} ${p.model || ''} ${p.hsnCode || p.hsn_code || ''} ${p.category || ''}`
          .toLowerCase().includes(q))
    : products;

  const formatPrice = (p) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(p.unitPrice || p.unit_price || 0));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setShowDropdown(true); }}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder || 'Search products or type a description'}
        autoComplete="off"
        required
      />
      {showDropdown && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, minWidth: '280px', zIndex: 60,
          background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: '8px',
          maxHeight: '240px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        }}>
          {filtered.slice(0, 30).map(p => (
            <div
              key={p.id}
              onClick={() => { onSelectProduct(p); setShowDropdown(false); }}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--neutral-100)', fontSize: '13px' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--neutral-50)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontWeight: 500 }}>{p.name}</span>
                <span style={{ color: 'var(--primary-600)', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatPrice(p)}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>
                {[p.sku, p.category, (p.hsnCode || p.hsn_code) && `HSN: ${p.hsnCode || p.hsn_code}`].filter(Boolean).join(' · ')}
                {p.trackStock && (
                  <span style={{ marginLeft: '6px', fontWeight: 600, color: Number(p.stockQuantity) > 0 ? 'var(--success-700)' : 'var(--error-600)' }}>
                    · {Number(p.stockQuantity || 0).toLocaleString('en-IN')} {p.unit || 'NOS'} in stock
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductPicker;
