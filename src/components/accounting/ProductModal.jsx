// Product Modal — create/edit a catalogue product: picture, identity (SKU,
// brand, model), pricing, the feature list printed on quotations, and stock
// tracking, with a live product card. Saves itself (product first, then the
// picture) and hands the saved product back through onSaved.
import { useEffect, useRef, useState } from 'react';
import {
  Camera, ImagePlus, IndianRupee, ListChecks, Package, Tag, Trash2, Warehouse, X,
} from 'lucide-react';
import { API_ORIGIN } from '../../utils/api';
import { createProduct, deleteProductImage, updateProduct, uploadProductImage } from '../../utils/accountingApi';
import { invalidateProductsCache } from './ProductPicker';
import '../../styles/Accounting.css';
import '../../styles/Products.css';

const MAX_IMAGE_MB = 4;
const UNITS = ['NOS', 'PCS', 'SET', 'BOX', 'PAIR', 'KG', 'LTR', 'MTR', 'HRS', 'VISIT'];
const GST_RATES = [0, 5, 12, 18, 28];

const toForm = (p) => ({
  name: p?.name || '',
  sku: p?.sku || '',
  brand: p?.brand || '',
  model: p?.model || '',
  category: p?.category || '',
  unit: p?.unit || 'NOS',
  hsnCode: p?.hsnCode || '',
  description: p?.description || '',
  features: p?.features || '',
  unitPrice: p ? Number(p.unitPrice) || 0 : '',
  purchasePrice: p?.purchasePrice != null ? Number(p.purchasePrice) : '',
  taxRate: p ? Number(p.taxRate) || 0 : 18,
  trackStock: !!p?.trackStock,
  openingStock: '',
  reorderLevel: p?.reorderLevel != null ? Number(p.reorderLevel) : '',
});

const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function Section({ icon, title, hint, children }) {
  const Icon = icon;
  return (
    <section className="pm-card">
      <header className="pm-card-head">
        <span className="pm-card-icon"><Icon size={16} aria-hidden="true" /></span>
        <div>
          <h3>{title}</h3>
          {hint && <p>{hint}</p>}
        </div>
      </header>
      <div className="pm-card-body">{children}</div>
    </section>
  );
}

function Field({ id, label, required, hint, children, className = '' }) {
  return (
    <div className={`pm-field ${className}`}>
      <label htmlFor={id}>{label}{required && <span className="pm-req" aria-hidden="true"> *</span>}</label>
      {children}
      {hint && <span className="pm-hint">{hint}</span>}
    </div>
  );
}

function ProductModal({ product, categories = [], onSaved, onClose }) {
  const [form, setForm] = useState(() => toForm(product));
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [preview, setPreview] = useState(product?.image ? `${API_ORIGIN}/storage/${product.image}` : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  // Revoke object URLs made for local previews
  useEffect(() => () => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);

  // Esc closes
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const pickImage = (file) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) { setError('Use a PNG, JPG or WebP image.'); return; }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) { setError(`The image must be under ${MAX_IMAGE_MB} MB.`); return; }
    setError('');
    setImageFile(file);
    setRemoveImage(false);
    setPreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setRemoveImage(!!product?.image);
    setPreview('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const price = Number(form.unitPrice) || 0;
  const cost = form.purchasePrice === '' ? null : Number(form.purchasePrice);
  const margin = cost != null && price > 0 ? ((price - cost) / price) * 100 : null;
  const features = form.features.split('\n').map((l) => l.trim()).filter(Boolean);
  const priceWithGst = price * (1 + (Number(form.taxRate) || 0) / 100);
  const stockNow = product ? Number(product.stockQuantity || 0) : Number(form.openingStock || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      brand: form.brand.trim() || null,
      model: form.model.trim() || null,
      category: form.category.trim() || null,
      unit: form.unit.trim().toUpperCase() || 'NOS',
      hsnCode: form.hsnCode.trim() || null,
      description: form.description.trim() || null,
      features: features.join('\n') || null,
      unitPrice: price,
      purchasePrice: cost,
      taxRate: Number(form.taxRate) || 0,
      trackStock: form.trackStock,
      reorderLevel: form.trackStock && form.reorderLevel !== '' ? Number(form.reorderLevel) : null,
      ...(!product && form.trackStock && Number(form.openingStock) > 0 ? { openingStock: Number(form.openingStock) } : {}),
    };
    try {
      const res = product ? await updateProduct(product.id, payload) : await createProduct(payload);
      let saved = res.data?.data || res.data;
      // The picture goes up once the product exists
      if (imageFile) saved = (await uploadProductImage(saved.id, imageFile)).data?.data || saved;
      else if (removeImage) saved = (await deleteProductImage(saved.id)).data?.data || saved;
      invalidateProductsCache();
      onSaved(saved, !product);
    } catch (err) {
      const body = err.response?.data;
      setError((body?.errors && Object.values(body.errors)[0]?.[0]) || body?.message || 'Could not save this product. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="acc-modal-overlay" onClick={onClose}>
      <div className="pm" role="dialog" aria-modal="true" aria-labelledby="pm-title" onClick={(e) => e.stopPropagation()}>
        <header className="pm-head">
          <span className="pm-head-icon"><Package size={20} aria-hidden="true" /></span>
          <div>
            <h2 id="pm-title">{product ? 'Edit product' : 'New product'}</h2>
            <p>Picture, pricing, features and stock — used on invoices and quotations</p>
          </div>
          <button type="button" className="pm-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>

        <form onSubmit={handleSubmit} className="pm-form">
          <div className="pm-body">
            {/* Picture + live card */}
            <aside className="pm-aside">
              <div
                className={`pm-photo ${preview ? 'has-image' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); pickImage(e.dataTransfer.files?.[0]); }}
              >
                {preview ? (
                  <>
                    <img src={preview} alt={form.name || 'Product'} />
                    <button type="button" className="pm-photo-change" onClick={() => fileRef.current?.click()}>
                      <Camera size={15} aria-hidden="true" /> Change picture
                    </button>
                  </>
                ) : (
                  <button type="button" className="pm-photo-empty" onClick={() => fileRef.current?.click()}>
                    <span className="pm-photo-empty-icon"><ImagePlus size={22} aria-hidden="true" /></span>
                    <strong>Add a picture</strong>
                    <small>Drop an image here or click · PNG, JPG, WebP up to {MAX_IMAGE_MB} MB</small>
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => pickImage(e.target.files?.[0])} />
              {preview && (
                <button type="button" className="pm-photo-remove" onClick={clearImage}><Trash2 size={13} aria-hidden="true" /> Remove picture</button>
              )}

              <div className="pm-summary" aria-live="polite">
                <p className="pm-summary-name">{form.name || 'Product name'}</p>
                <div className="pm-chips">
                  {form.sku && <span className="pm-chip">{form.sku}</span>}
                  {(form.brand || form.model) && <span className="pm-chip">{[form.brand, form.model].filter(Boolean).join(' · ')}</span>}
                  {form.category && <span className="pm-chip is-soft">{form.category}</span>}
                </div>
                <div className="pm-summary-price">
                  <strong>{inr(price)}</strong>
                  <span>per {form.unit || 'unit'} · {inr(priceWithGst)} with {Number(form.taxRate) || 0}% GST</span>
                </div>
                <dl className="pm-summary-stats">
                  <div>
                    <dt>Margin</dt>
                    <dd className={margin == null ? '' : margin < 0 ? 'is-neg' : 'is-pos'}>{margin == null ? '—' : `${margin.toFixed(1)}%`}</dd>
                  </div>
                  <div>
                    <dt>Stock</dt>
                    <dd>{form.trackStock ? `${stockNow.toLocaleString('en-IN')} ${form.unit || ''}` : 'Not tracked'}</dd>
                  </div>
                  <div>
                    <dt>Features</dt>
                    <dd>{features.length}</dd>
                  </div>
                </dl>
              </div>
            </aside>

            <div className="pm-main">
              <Section icon={Tag} title="Basic information" hint="How the product is named and found">
                <Field id="p-name" label="Product / service name" required className="pm-span-3">
                  <input id="p-name" type="text" maxLength={255} value={form.name} onChange={set('name')} placeholder="e.g., Diabetik Autolab" required autoFocus />
                </Field>
                <Field id="p-sku" label="SKU / item code"><input id="p-sku" type="text" maxLength={60} value={form.sku} onChange={set('sku')} placeholder="DFC-AL-01" /></Field>
                <Field id="p-brand" label="Brand"><input id="p-brand" type="text" maxLength={120} value={form.brand} onChange={set('brand')} placeholder="Manufacturer" /></Field>
                <Field id="p-model" label="Model"><input id="p-model" type="text" maxLength={120} value={form.model} onChange={set('model')} placeholder="Model no." /></Field>
                <Field id="p-cat" label="Category">
                  <input id="p-cat" type="text" maxLength={150} list="prod-categories" value={form.category} onChange={set('category')} placeholder="Choose or type" />
                  <datalist id="prod-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
                </Field>
                <Field id="p-unit" label="Unit">
                  <input id="p-unit" type="text" maxLength={30} list="prod-units" value={form.unit} onChange={set('unit')} placeholder="NOS" />
                  <datalist id="prod-units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
                </Field>
                <Field id="p-hsn" label="HSN / SAC"><input id="p-hsn" type="text" maxLength={20} value={form.hsnCode} onChange={set('hsnCode')} placeholder="90189019" /></Field>
              </Section>

              <Section icon={IndianRupee} title="Pricing & tax" hint="Purchase price gives you margin and stock value">
                <Field id="p-price" label="Selling price" required>
                  <div className="pm-adorn"><span>₹</span><input id="p-price" type="number" min="0" step="0.01" value={form.unitPrice} onChange={set('unitPrice')} required placeholder="0.00" /></div>
                </Field>
                <Field id="p-cost" label="Purchase price">
                  <div className="pm-adorn"><span>₹</span><input id="p-cost" type="number" min="0" step="0.01" value={form.purchasePrice} onChange={set('purchasePrice')} placeholder="0.00" /></div>
                </Field>
                <Field id="p-gst" label="GST rate">
                  <div className="pm-adorn is-suffix"><input id="p-gst" type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={set('taxRate')} /><span>%</span></div>
                  <div className="pm-quick" role="group" aria-label="Common GST rates">
                    {GST_RATES.map((r) => (
                      <button type="button" key={r} className={Number(form.taxRate) === r ? 'is-on' : ''} onClick={() => setForm({ ...form, taxRate: r })}>{r}%</button>
                    ))}
                  </div>
                </Field>
              </Section>

              <Section icon={ListChecks} title="Description & features" hint="Printed under the product on letterhead quotations">
                <Field id="p-desc" label="Short description" className="pm-span-3">
                  <textarea id="p-desc" rows={2} maxLength={2000} value={form.description} onChange={set('description')} placeholder="One or two lines about the product" />
                </Field>
                <Field id="p-features" label="Features — one per line" className="pm-span-3">
                  <div className="pm-features">
                    <textarea id="p-features" rows={6} maxLength={5000} value={form.features} onChange={set('features')}
                      placeholder={'Automated blood pressure measurement\nAutomated Doppler waveform recording\nBuilt-in pump'} />
                    <div className="pm-features-preview" aria-label="Bullet preview">
                      <span className="pm-features-label">Prints as</span>
                      {features.length ? <ul>{features.map((f, i) => <li key={i}>{f}</li>)}</ul> : <p>Bullet points appear here.</p>}
                    </div>
                  </div>
                </Field>
              </Section>

              <Section icon={Warehouse} title="Inventory" hint="Invoices deduct sold quantities automatically">
                <label className="pm-switch pm-span-3">
                  <input type="checkbox" role="switch" checked={form.trackStock} onChange={set('trackStock')} />
                  <i aria-hidden="true" />
                  <span>Track stock for this product</span>
                </label>
                {form.trackStock && (
                  <>
                    {product ? (
                      <Field id="p-current" label="Current stock" hint="Adjust with “Stock” on the product list">
                        <p id="p-current" className="pm-readonly">{Number(product.stockQuantity || 0).toLocaleString('en-IN')} {form.unit}</p>
                      </Field>
                    ) : (
                      <Field id="p-open" label="Opening stock">
                        <div className="pm-adorn is-suffix"><input id="p-open" type="number" min="0" step="any" value={form.openingStock} onChange={set('openingStock')} placeholder="0" /><span>{form.unit || 'NOS'}</span></div>
                      </Field>
                    )}
                    <Field id="p-reorder" label="Reorder level" hint="Flag as low stock at or below this">
                      <div className="pm-adorn is-suffix"><input id="p-reorder" type="number" min="0" step="any" value={form.reorderLevel} onChange={set('reorderLevel')} placeholder="0" /><span>{form.unit || 'NOS'}</span></div>
                    </Field>
                  </>
                )}
              </Section>
            </div>
          </div>

          <footer className="pm-foot">
            {error ? <p className="pm-error" role="alert">{error}</p> : <p className="pm-foot-hint"><span className="pm-req">*</span> Required</p>}
            <div className="pm-foot-actions">
              <button type="button" className="acc-btn acc-btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="acc-btn acc-btn-primary" disabled={saving}>{saving ? 'Saving…' : product ? 'Save changes' : 'Add product'}</button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default ProductModal;
