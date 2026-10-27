// Quotation template builder (Settings › Quotation Template): classic or
// letterhead design, header/footer artwork, what prints, and the editable
// Terms & Conditions page — with a live A4 preview. Artwork uploads save
// immediately; everything else saves with the page's Save button.
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { API_ORIGIN } from '../../utils/api';
import { deleteQuotationImage, getProducts, uploadQuotationImage } from '../../utils/accountingApi';
import QuotationPrintView from './QuotationPrintView';
import { DEFAULT_QUOTATION_TERMS, resolveQuotationSettings } from './quotationTemplates';
import { termsToHtml } from './richText';

// The editor (TipTap) loads only when this settings page needs it
const RichTextEditor = lazy(() => import('./RichTextEditor'));
import { Panel, ScaledPreview, Segmented, TextField, Toggle } from './TemplateBuilderParts';
import '../../styles/InvoiceTemplateBuilder.css';

const SAMPLE_PRODUCT = {
  name: 'DIABETIK AUTOLAB',
  features: 'Automated blood pressure measurement\nAutomated Doppler waveform recording\nEasy ABI without Doppler probe\nBuilt-in pump to measure blood pressure\nBiothesiometry study for hands and feet',
};

const sampleQuotation = (product) => ({
  quotationNumber: 'SHS/01/2026',
  date: new Date().toISOString(),
  customer: 'ENDODIAB CLINIC',
  customerAddress: 'KANNUR',
  items: [{ description: product.name, quantity: 1, unitPrice: 485000, discount: 0, total: 543200, product }],
  subtotal: 485000, discount: 0, tax: 58200, total: 543200,
  notes: '',
});

const CLASSIC_FIELDS = [
  ['validity', 'Validity', 'e.g., 30 Days'], ['gstNote', 'GST note', 'e.g., IGST @ 5% included'],
  ['deliveryTime', 'Delivery time', 'e.g., 2 to 3 weeks'], ['deliveryMode', 'Delivery mode', 'e.g., By courier'],
  ['warranty', 'Warranty', 'e.g., 3 months from the date of supply'], ['paymentTerms', 'Payment', 'e.g., 50% advance, balance against delivery'],
  ['computerConfiguration', 'Computer configuration', 'e.g., Not applicable'], ['training', 'Training', 'e.g., Provided at installation'],
];

function ImageSlot({ slot, path, onChange, hint }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type) || file.size > 4 * 1024 * 1024) {
      setError('Use a PNG, JPG or WebP image under 4 MB.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await uploadQuotationImage(slot, file);
      onChange(res.data?.path || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteQuotationImage(slot);
      onChange('');
    } catch { setError('Could not remove the image.'); }
    setBusy(false);
  };

  return (
    <div className="itb-field">
      <span className="itb-label">{slot === 'header' ? 'Header image' : 'Footer image'}</span>
      {path ? (
        <div className="qtb-art">
          <img src={`${API_ORIGIN}/storage/${path}`} alt="" />
          <div className="qtb-art-actions">
            <button type="button" className="itb-link" onClick={() => fileRef.current?.click()} disabled={busy}>Replace</button>
            <button type="button" className="itb-link qtb-danger" onClick={remove} disabled={busy}><Trash2 size={13} /> Remove</button>
          </div>
        </div>
      ) : (
        <button type="button" className="qtb-upload" onClick={() => fileRef.current?.click()} disabled={busy}>
          <ImagePlus size={20} aria-hidden="true" />
          <span>{busy ? 'Uploading…' : `Upload ${slot} artwork`}</span>
          <small>{hint}</small>
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => upload(e.target.files?.[0])} />
      {error && <p className="qtb-error" role="alert">{error}</p>}
    </div>
  );
}

function QuotationTemplateBuilder({ settings, onChange, company }) {
  const qs = resolveQuotationSettings(settings);
  const set = (key) => (value) => onChange({ ...qs, [key]: value });
  const letterhead = qs.design === 'letterhead';
  // Older settings kept terms as a list; the editor starts from that
  const termsHtml = qs.termsHtml || termsToHtml(qs.terms);

  // Preview with a real catalogue product (picture + features) when there is one
  const [product, setProduct] = useState(SAMPLE_PRODUCT);
  useEffect(() => {
    let cancelled = false;
    getProducts({ per_page: 200 })
      .then((res) => {
        const list = res.data?.data || [];
        const best = list.find((p) => p.image && p.features) || list.find((p) => p.image) || list.find((p) => p.features);
        if (!cancelled && best) setProduct(best);
      })
      .catch(() => { /* keep the sample */ });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={`itb ${letterhead ? 'qtb-wide' : ''}`}>
      <div className="itb-controls">
        <div className="itb-presets">
          <span className="itb-label">Design</span>
          <div className="itb-preset-list qtb-designs" role="radiogroup" aria-label="Design">
            {[['classic', 'Classic', 'Company block, items table, terms table'], ['letterhead', 'Letterhead', 'Your header & footer artwork, product pictures, terms page']].map(([id, label, desc]) => (
              <button type="button" key={id} role="radio" aria-checked={qs.design === id}
                className={`itb-preset ${qs.design === id ? 'is-on' : ''}`} onClick={() => set('design')(id)}>
                <strong>{label}</strong>
                <span className="qtb-design-desc">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {!letterhead && (
          <Panel title="Terms table" open>
            <p className="itb-hint">Rows printed under the items. Leave a field empty to leave its row out. Bank details come from Business &amp; Tax Details.</p>
            {CLASSIC_FIELDS.map(([key, label, ph]) => (
              <TextField key={key} label={label} value={qs[key]} maxLength={500} placeholder={ph} onChange={set(key)} />
            ))}
          </Panel>
        )}

        {letterhead && (
          <>
            <Panel title="Header" open>
              <Segmented label="Header" value={qs.headerType} onChange={set('headerType')}
                options={[['image', 'Image'], ['company', 'Company details'], ['none', 'None']]} />
              {qs.headerType === 'image' && (
                <ImageSlot slot="header" path={qs.headerImage} onChange={set('headerImage')} hint="Full-width banner, about 2480 × 500 px" />
              )}
              {qs.headerType === 'company' && <p className="itb-hint">Logo, address and phone from Business &amp; Tax Details.</p>}
            </Panel>

            <Panel title="Footer">
              <Segmented label="Footer" value={qs.footerType} onChange={set('footerType')}
                options={[['image', 'Image'], ['text', 'Text'], ['none', 'None']]} />
              {qs.footerType === 'image' && (
                <ImageSlot slot="footer" path={qs.footerImage} onChange={set('footerImage')} hint="Full-width banner, about 2480 × 450 px" />
              )}
              {qs.footerType === 'text' && (
                <TextField label="Footer text" value={qs.footerText} maxLength={300} multiline rows={2} onChange={set('footerText')}
                  placeholder="e.g. Authorised distributor of Diabetik Foot Care India Pvt Ltd" />
              )}
              <p className="itb-hint">Header and footer repeat on every printed page.</p>
            </Panel>

            <Panel title="Quotation page">
              <TextField label="Title" value={qs.title} maxLength={60} onChange={set('title')} placeholder="QUOTATION" />
              <Toggle label="Product pictures" checked={qs.showProductImages} onChange={set('showProductImages')} hint="From Products › picture" />
              <Toggle label="Product description & features" checked={qs.showFeatures} onChange={set('showFeatures')} hint="Bullet points from Products › features" />
              <Toggle label="Totals & amount in words" checked={qs.showTotals} onChange={set('showTotals')} />
              <Toggle label="Signature block" checked={qs.showSignature} onChange={set('showSignature')} hint="Seal from Business & Tax Details" />
            </Panel>

            <Panel title="Terms & conditions" open>
              <Toggle label="Print on a separate last page" checked={qs.termsPage} onChange={set('termsPage')} />
              <TextField label="Heading" value={qs.termsTitle} maxLength={80} onChange={set('termsTitle')} placeholder="TERMS AND CONDITIONS" />
              <div className="itb-field">
                <span className="itb-label">
                  Terms page
                  <button type="button" className="itb-link" onClick={() => set('termsHtml')(termsToHtml(DEFAULT_QUOTATION_TERMS))}>Reset to default</button>
                </span>
                <Suspense fallback={<div className="itb-hint">Loading editor…</div>}>
                  <RichTextEditor value={termsHtml} onChange={set('termsHtml')} label="Terms and conditions" minHeight={320} />
                </Suspense>
              </div>
              <p className="itb-hint">Use <b>Bank details</b> in the toolbar to place the bank table. Terms typed on an individual quotation are added at the end as “Additional terms”.</p>
            </Panel>
          </>
        )}
      </div>

      <div className="itb-preview-col">
        <p className="itb-preview-note">Live preview with sample data · A4{letterhead && qs.termsPage ? ' · 2 pages' : ''}</p>
        <ScaledPreview autoHeight>
          <QuotationPrintView quotation={sampleQuotation(product)} company={company} quotationSettings={qs} />
        </ScaledPreview>
      </div>
    </div>
  );
}

export default QuotationTemplateBuilder;
