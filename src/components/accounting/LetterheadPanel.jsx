// Full-page letterhead settings, shared by the invoice and quotation builders:
// upload the artwork (a PDF or an image) and set the clear area text prints in.
// PDFs are turned into an A4 image here in the browser. The upload saves at
// once; the margins save with the page's Save button.
import { useRef, useState } from 'react';
import { FileUp, Trash2 } from 'lucide-react';
import { API_ORIGIN } from '../../utils/api';
import { deleteLetterhead, uploadLetterhead } from '../../utils/accountingApi';
import { Panel } from './TemplateBuilderParts';

const A4_WIDTH_PX = 2480; // 300 dpi
const MAX_UPLOAD_MB = 10;

// First page of a PDF → image file at print resolution
async function pdfToImage(file) {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const page = await doc.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: A4_WIDTH_PX / base.width });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  await page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport }).promise;
  const toBlob = (type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  let blob = await toBlob('image/png');
  let name = 'letterhead.png';
  // Photographic artwork can make a large PNG; many hosts cap uploads
  if (blob.size > 2 * 1024 * 1024) {
    blob = await toBlob('image/jpeg', 0.92);
    name = 'letterhead.jpg';
  }
  return { image: new File([blob], name, { type: blob.type }), pages: doc.numPages };
}

function MarginSlider({ label, value, min, max, onChange }) {
  return (
    <label className="itb-field">
      <span className="itb-label">{label} <b>{value} mm</b></span>
      <input type="range" min={min} max={max} step="1" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function LetterheadPanel({ company, onCompanyChange }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ text: '', error: false });
  const co = company || {};
  const set = (key) => (value) => onCompanyChange({ ...co, [key]: value });

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    setMessage({ text: '', error: false });
    try {
      let image = file;
      let note = '';
      if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
        const converted = await pdfToImage(file);
        image = converted.image;
        if (converted.pages > 1) note = ` The PDF has ${converted.pages} pages; page 1 is used.`;
      } else if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
        throw new Error('Use a PDF, PNG, JPG or WebP file.');
      }
      if (image.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`The file must be under ${MAX_UPLOAD_MB} MB.`);
      const res = await uploadLetterhead(image);
      onCompanyChange({ ...co, letterheadImage: res.data?.path || '' });
      setMessage({ text: `Letterhead uploaded.${note}`, error: false });
    } catch (err) {
      const body = err.response?.data;
      setMessage({ text: (body?.errors && Object.values(body.errors)[0]?.[0]) || body?.message || err.message || 'Upload failed.', error: true });
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteLetterhead();
      onCompanyChange({ ...co, letterheadImage: '' });
      setMessage({ text: '', error: false });
    } catch {
      setMessage({ text: 'Could not remove the letterhead.', error: true });
    }
    setBusy(false);
  };

  return (
    <Panel title="Letterhead" open>
      {co.letterheadImage ? (
        <div className="qtb-art lhpanel-art">
          <img src={`${API_ORIGIN}/storage/${co.letterheadImage}`} alt="Current letterhead" />
          <div className="qtb-art-actions">
            <button type="button" className="itb-link" onClick={() => fileRef.current?.click()} disabled={busy}>{busy ? 'Working…' : 'Replace'}</button>
            <button type="button" className="itb-link qtb-danger" onClick={remove} disabled={busy}><Trash2 size={13} /> Remove</button>
          </div>
        </div>
      ) : (
        <button type="button" className="qtb-upload" onClick={() => fileRef.current?.click()} disabled={busy}>
          <FileUp size={20} aria-hidden="true" />
          <span>{busy ? 'Preparing letterhead…' : 'Upload letterhead'}</span>
          <small>A4 PDF or image · used for both invoices and quotations</small>
        </button>
      )}
      <input ref={fileRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" hidden onChange={(e) => upload(e.target.files?.[0])} />
      {message.text && <p className={message.error ? 'qtb-error' : 'itb-hint'} role={message.error ? 'alert' : undefined}>{message.text}</p>}
      <p className="itb-hint">Text prints inside these margins, so it stays clear of your header and footer on every page.</p>
      <MarginSlider label="Space for header" value={Number(co.letterheadTop ?? 52)} min={0} max={120} onChange={set('letterheadTop')} />
      <MarginSlider label="Space for footer" value={Number(co.letterheadBottom ?? 35)} min={0} max={120} onChange={set('letterheadBottom')} />
      <MarginSlider label="Left & right" value={Number(co.letterheadSide ?? 15)} min={5} max={40} onChange={set('letterheadSide')} />
    </Panel>
  );
}

export default LetterheadPanel;
