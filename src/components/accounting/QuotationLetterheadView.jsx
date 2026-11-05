// Letterhead quotation: the company's own header/footer artwork (or one built
// from company details), "To" + quote number, items with product pictures and
// feature bullets, totals, and an editable Terms & Conditions page with the
// bank details table and signatory.
//
// On screen each sheet shows its own header/footer. In print the header and
// footer are position:fixed, so Chrome repeats them on every page, and the
// table's thead/tfoot spacers (also repeated per page) keep content clear of them.
import { useCallback, useLayoutEffect, useRef } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { API_ORIGIN } from '../../utils/api';
import { useFitLevel } from './useFitLevel';
import { amountInWords, fmt, fmtDateNumeric, fmtQty, fmtSigned, gstLabel, gstLines, num, splitKeyValues, stateFromGstin } from './invoiceFormat';
import { renderTermsHtml } from './richText';
import '../../styles/QuotationLetterhead.css';

const src = (path) => `${API_ORIGIN}/storage/${path}`;

const PICTURE_SIZES = ['72mm', '58mm', '48mm', '40mm'];
const PX_PER_MM = 96 / 25.4;
const A4_HEIGHT_PX = 297 * PX_PER_MM;
const SAFETY_PX = 1.5 * PX_PER_MM; // rounding between measuring and printing

// Would print put the totals alone at the top of a new page? They can't split, but
// everything above them flows from page to page, with the table heading repeated.
// Works from the screen layout too: head and foot are real there, ghosts in print.
function totalsStranded(root) {
  const sheet = root.querySelector('.qlh-sheet');
  const content = sheet?.querySelector('.qlh-content');
  const totals = sheet?.querySelector('.qlh-totals');
  if (!content || !totals) return false;

  const scale = root.getBoundingClientRect().width / root.offsetWidth || 1; // the preview may be zoomed
  const outer = (a, b) => Math.max(sheet.querySelector(a)?.offsetHeight || 0, sheet.querySelector(b)?.offsetHeight || 0);
  const usable = A4_HEIGHT_PX - outer('.qlh-head.qlh-screen', '.qlh-flow > thead') - outer('.qlh-foot.qlh-screen', '.qlh-flow > tfoot');
  const heading = sheet.querySelector('.qlh-items > thead')?.offsetHeight || 0;

  const itemsEnd = (totals.getBoundingClientRect().top - content.getBoundingClientRect().top) / scale;
  const paddingBottom = parseFloat(root.ownerDocument.defaultView.getComputedStyle(content).paddingBottom) || 0;
  const needed = totals.getBoundingClientRect().height / scale + paddingBottom + SAFETY_PX;

  if (itemsEnd <= usable) return usable - itemsEnd < needed;
  const perPage = usable - heading;
  return perPage - ((itemsEnd - usable) % perPage) < needed;
}

function CompanyHeader({ co }) {
  const address = (co.address || '').trim();
  return (
    <div className="qlh-cohead">
      <div className="qlh-cohead-brand">
        {co.companyLogo && <img src={src(co.companyLogo)} alt={co.companyName} />}
        {!co.companyLogo && <strong>{co.companyName}</strong>}
      </div>
      <div className="qlh-cohead-contact">
        {address && <p><MapPin size={13} aria-hidden="true" /><span>{address}</span></p>}
        {(co.phone || co.mobile) && <p><Phone size={13} aria-hidden="true" /><span>{[co.phone, co.mobile].filter(Boolean).join(', ')}</span></p>}
        {co.email && <p><Mail size={13} aria-hidden="true" /><span>{co.email}</span></p>}
      </div>
    </div>
  );
}

function Header({ qs, co }) {
  if (qs.headerType === 'none') return null;
  if (qs.headerType === 'image' && qs.headerImage) return <img className="qlh-art" src={src(qs.headerImage)} alt="" />;
  return <CompanyHeader co={co} />;
}

function Footer({ qs }) {
  if (qs.footerType === 'image' && qs.footerImage) return <img className="qlh-art" src={src(qs.footerImage)} alt="" />;
  if (qs.footerType === 'text' && qs.footerText) return <p className="qlh-foot-text">{qs.footerText}</p>;
  return null;
}

function BankTable({ co }) {
  const rows = splitKeyValues(co.bankDetails);
  if (!rows.length) return null;
  return (
    <table className="qlh-bank">
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={i}>{k == null ? <td colSpan={2}>{v}</td> : <><th>{k}</th><td>{v}</td></>}</tr>
        ))}
      </tbody>
    </table>
  );
}

function Signature({ co, quotation }) {
  return (
    <div className="qlh-sign">
      <p className="qlh-sign-for">FOR {(co.companyName || 'THE COMPANY').toUpperCase()}</p>
      <div className="qlh-sign-space">
        {co.sealSignatureImage && quotation?.useSignature !== false && <img src={src(co.sealSignatureImage)} alt="Seal & signature" />}
      </div>
      <p className="qlh-sign-label">AUTHORIZED SIGNATORY</p>
    </div>
  );
}

function Terms({ qs, co, quotation }) {
  const extra = (quotation.termsAndConditions || '').trim();
  if ((qs.termsHtml || '').trim()) {
    return (
      <>
        <div className="qlh-rich" dangerouslySetInnerHTML={{ __html: renderTermsHtml(qs.termsHtml, co.bankDetails) }} />
        {extra && <p className="qlh-rich-extra"><b>ADDITIONAL TERMS:</b> <span className="qlh-pre">{extra}</span></p>}
      </>
    );
  }
  const terms = [...(qs.terms || [])];
  if (extra) terms.push({ title: 'ADDITIONAL TERMS', text: extra });
  if (!terms.length) return null;
  return (
    <ol className="qlh-terms">
      {terms.map((t, i) => (
        <li key={i}>
          {t.title && <b>{t.title}: </b>}
          <span className="qlh-pre">{t.text}</span>
          {t.showBank && <BankTable co={co} />}
        </li>
      ))}
    </ol>
  );
}

// One A4 sheet: its own header/footer on screen. In print, thead/tfoot hold
// invisible copies of the header/footer, so the space they reserve on every
// page is exactly the artwork's height — no measuring needed.
function Sheet({ qs, co, children, last }) {
  return (
    <section className={`qlh-sheet ${last ? 'is-last' : ''}`}>
      <div className="qlh-head qlh-screen"><Header qs={qs} co={co} /></div>
      <table className="qlh-flow">
        <thead><tr><td><div className="qlh-ghost" aria-hidden="true"><Header qs={qs} co={co} /></div></td></tr></thead>
        <tfoot><tr><td><div className="qlh-ghost" aria-hidden="true"><Footer qs={qs} /></div></td></tr></tfoot>
        <tbody><tr><td><div className="qlh-content">{children}</div></td></tr></tbody>
      </table>
      <div className="qlh-foot qlh-screen"><Footer qs={qs} /></div>
    </section>
  );
}

function QuotationLetterheadView({ quotation, company, settings }) {
  const co = company || {};
  const qs = settings;
  const items = quotation.items || [];
  const discount = num(quotation.discount);
  const cur = quotation.currency && quotation.currency !== 'INR' ? quotation.currency : '₹';
  const hasTerms = (qs.termsHtml || '').trim() || (qs.terms || []).length > 0 || quotation.termsAndConditions;
  const termsOnOwnPage = qs.termsPage && (hasTerms || qs.showSignature);

  // Smaller product pictures, step by step, if the totals would otherwise be left alone on the next page
  const contentKey = JSON.stringify([quotation.quotationNumber, items, quotation.total, quotation.notes, quotation.customerAddress, qs]);
  const { level, done, strand, restart } = useFitLevel(contentKey, PICTURE_SIZES.length);
  const rootRef = useRef(null);

  const measure = useCallback(() => {
    const root = rootRef.current;
    if (root && root.querySelector('.qlh-item-img') && totalsStranded(root)) strand();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- strand only changes with contentKey, level and done
  }, [contentKey, level, done]);

  useLayoutEffect(() => {
    measure();
    const root = rootRef.current;
    if (!root) return undefined;
    // The print window renders before its stylesheet has loaded, and pictures arrive
    // late, so measure again on both. Its own window's observer: another's won't fire.
    const doc = root.ownerDocument;
    const observer = new doc.defaultView.ResizeObserver(measure);
    observer.observe(root.querySelector('.qlh-content'));
    const onSheetLoad = () => { if (!restart()) measure(); };
    const sheets = [...doc.querySelectorAll('link[rel="stylesheet"]')];
    sheets.forEach((link) => link.addEventListener('load', onSheetLoad));
    return () => {
      observer.disconnect();
      sheets.forEach((link) => link.removeEventListener('load', onSheetLoad));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only matters through measure's level and done
  }, [measure]);

  const body = (
    <>
      <div className="qlh-meta">
        <div className="qlh-to">
          <p className="qlh-to-label">To:</p>
          <p className="qlh-to-name">{quotation.customer || '—'}</p>
          {quotation.customerAddress && <p className="qlh-pre">{quotation.customerAddress}</p>}
          {quotation.customerPhone && <p>Phone: {quotation.customerPhone}</p>}
          {quotation.customerGst && <p>GSTIN: {quotation.customerGst}</p>}
        </div>
        <table className="qlh-ref">
          <tbody>
            <tr><th>QTN NO</th><td>: {quotation.quotationNumber}</td></tr>
            <tr><th>DATE</th><td>: {fmtDateNumeric(quotation.date)}</td></tr>
            {quotation.validUntil && <tr><th>VALID TILL</th><td>: {fmtDateNumeric(quotation.validUntil)}</td></tr>}
          </tbody>
        </table>
      </div>

      <h1 className="qlh-title">{qs.title || 'QUOTATION'}</h1>

      <table className="qlh-items">
        <thead>
          <tr>
            <th className="qlh-c-sn">SN</th>
            <th>MODEL WITH DESCRIPTION</th>
            <th className="qlh-c-amt">UNIT PRICE</th>
            <th className="qlh-c-qty">QTY</th>
            <th className="qlh-c-amt">TOTAL AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const p = item.product || {};
            const features = qs.showFeatures ? String(p.features || '').split('\n').map((l) => l.trim()).filter(Boolean) : [];
            const lineAmount = num(item.quantity) * num(item.unitPrice);
            return (
              <tr key={item.id || idx}>
                <td className="qlh-c-sn">{idx + 1}</td>
                <td className="qlh-desc">
                  <p className="qlh-item-name">{item.description || p.name}</p>
                  {(p.brand || p.model) && <p className="qlh-item-model">{[p.brand, p.model].filter(Boolean).join(' · ')}</p>}
                  {qs.showProductImages && p.image && <img className="qlh-item-img" src={src(p.image)} alt={item.description || p.name} />}
                  {qs.showFeatures && p.description && <p className="qlh-item-text">{p.description}</p>}
                  {features.length > 0 && (
                    <>
                      <p className="qlh-item-head">PRODUCT DESCRIPTION:</p>
                      <ul className="qlh-features">{features.map((f, i) => <li key={i}>{f}</li>)}</ul>
                    </>
                  )}
                </td>
                <td className="qlh-num">{fmt(item.unitPrice)}</td>
                <td className="qlh-num qlh-c-qty">{fmtQty(item.quantity)}</td>
                <td className="qlh-num">{fmt(lineAmount)}</td>
              </tr>
            );
          })}
        </tbody>
        {qs.showTotals && (
          <tbody className="qlh-totals">
            <tr><th colSpan={4}>TOTAL</th><td className="qlh-num">{fmt(num(quotation.subtotal))}</td></tr>
            {discount > 0 && <tr><th colSpan={4}>SPECIAL DISCOUNT</th><td className="qlh-num">− {fmt(discount)}</td></tr>}
            {discount > 0 && <tr><th colSpan={4}>SUB TOTAL</th><td className="qlh-num">{fmt(num(quotation.subtotal) - discount)}</td></tr>}
            {gstLines(items, quotation.tax, co.state || stateFromGstin(co.gstNumber), quotation.customerState || stateFromGstin(quotation.customerGst)).map((t) => <tr key={gstLabel(t)}><th colSpan={4}>{gstLabel(t).toUpperCase()}</th><td className="qlh-num">{fmt(t.amount)}</td></tr>)}
            {num(quotation.roundOff) !== 0 && <tr><th colSpan={4}>ROUND OFF</th><td className="qlh-num">{fmtSigned(quotation.roundOff)}</td></tr>}
            <tr className="qlh-grand"><th colSpan={4}>NET AMOUNT ({cur})</th><td className="qlh-num">{fmt(quotation.total)}</td></tr>
            <tr className="qlh-words"><td colSpan={5}>Amount in words: <b>{amountInWords(quotation.total)}</b></td></tr>
          </tbody>
        )}
      </table>

      {quotation.notes && <p className="qlh-note"><b>Note:</b> <span className="qlh-pre">{quotation.notes}</span></p>}

      {!termsOnOwnPage && (
        <>
          {hasTerms && <h2 className="qlh-terms-title">{qs.termsTitle || 'TERMS AND CONDITIONS'}</h2>}
          <Terms qs={qs} co={co} quotation={quotation} />
          {qs.showSignature && <Signature co={co} quotation={quotation} />}
        </>
      )}
    </>
  );

  return (
    <div className="inv-print qlh-doc" ref={rootRef} style={{ '--qlh-img-max': PICTURE_SIZES[level] }}>
      {/* Edge-to-edge artwork: no browser margins (and so no browser header/footer) */}
      <style>{'@page { size: A4; margin: 0; }'}</style>
      <div className="qlh-head qlh-print-fixed qlh-print-top"><Header qs={qs} co={co} /></div>
      <div className="qlh-foot qlh-print-fixed qlh-print-bottom"><Footer qs={qs} /></div>

      <Sheet qs={qs} co={co} last={!termsOnOwnPage}>{body}</Sheet>
      {termsOnOwnPage && (
        <Sheet qs={qs} co={co} last>
          <h2 className="qlh-terms-title">{qs.termsTitle || 'TERMS AND CONDITIONS'}</h2>
          <Terms qs={qs} co={co} quotation={quotation} />
          {qs.showSignature && <Signature co={co} quotation={quotation} />}
        </Sheet>
      )}
    </div>
  );
}

export default QuotationLetterheadView;
