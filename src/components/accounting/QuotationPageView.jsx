// Quotation printed on the company's full-page letterhead: To + reference,
// items with product pictures and feature bullets, totals, then the editable
// Terms & Conditions. Each piece is its own block, so a long feature list or
// terms page breaks between lines, never through the letterhead.
import { API_ORIGIN } from '../../utils/api';
import LetterheadDocument from './LetterheadDocument';
import { amountInWords, fmt, fmtDateNumeric, fmtQty, fmtSigned, gstLabel, gstLines, num, stateFromGstin } from './invoiceFormat';
import { splitTermsHtml, termsToHtml } from './richText';

const src = (path) => `${API_ORIGIN}/storage/${path}`;

function QuotationPageView({ quotation, company, settings: qs }) {
  const co = company || {};
  const items = quotation.items || [];
  const discount = num(quotation.discount);
  const cur = quotation.currency && quotation.currency !== 'INR' ? quotation.currency : '₹';

  const groups = {
    items: {
      cols: ['10mm', null, '26mm', '13mm', '28mm'],
      head: (
        <tr>
          <th className="lhp-center">SN</th>
          <th className="lhp-center">MODEL WITH DESCRIPTION</th>
          <th className="lhp-num">UNIT PRICE</th>
          <th className="lhp-center">QTY</th>
          <th className="lhp-num">TOTAL AMOUNT</th>
        </tr>
      ),
    },
  };

  // A row inside an item: only the description cell has content
  const descRow = (key, cell, { keepWithNext = true } = {}) => ({
    key,
    group: 'items',
    keepWithNext,
    node: (
      <tr>
        <td className="lhp-tight" />
        <td className="lhp-tight">{cell}</td>
        <td className="lhp-tight" />
        <td className="lhp-tight" />
        <td className="lhp-tight" />
      </tr>
    ),
  });

  const itemBlocks = items.flatMap((item, idx) => {
    const p = item.product || {};
    const key = item.id || idx;
    const features = qs.showFeatures ? String(p.features || '').split('\n').map((l) => l.trim()).filter(Boolean) : [];
    const description = qs.showFeatures ? (p.description || '').trim() : '';
    const image = qs.showProductImages && p.image;
    const hasMore = !!(image || description || features.length);
    const lineAmount = num(item.quantity) * num(item.unitPrice);
    const rows = [{
      key: `item-${key}`,
      group: 'items',
      keepWithNext: hasMore,
      node: (
        <tr className={idx === 0 ? '' : 'lhp-row-first'}>
          <td className="lhp-center">{idx + 1}</td>
          <td>
            <p className="lhp-item-name">{item.description || p.name}</p>
            {(p.brand || p.model) && <p className="lhp-item-model">{[p.brand, p.model].filter(Boolean).join(' · ')}</p>}
          </td>
          <td className="lhp-num">{fmt(item.unitPrice)}</td>
          <td className="lhp-center">{fmtQty(item.quantity)}</td>
          <td className="lhp-num lhp-strong">{fmt(lineAmount)}</td>
        </tr>
      ),
    }];
    if (image) {
      rows.push(descRow(`img-${key}`, <img className="lhp-item-img" src={src(p.image)} alt={item.description || p.name} />, { keepWithNext: false }));
    }
    if (description) {
      rows.push(descRow(`desc-${key}`, <p>{description}</p>, { keepWithNext: false }));
    }
    if (features.length) {
      rows.push(descRow(`feat-head-${key}`, <p className="lhp-item-head">PRODUCT DESCRIPTION:</p>));
      features.forEach((f, i) => {
        rows.push(descRow(`feat-${key}-${i}`, <ul className="lhp-feature"><li>{f}</li></ul>, { keepWithNext: false }));
      });
    }
    return rows;
  });

  const totalRow = (key, label, value, className = '', keepWithNext = true) => ({
    key,
    group: 'items',
    keepWithNext,
    node: (
      <tr className={`lhp-row-first ${className}`}>
        <td colSpan={4} className="lhp-total-label">{label}</td>
        <td className="lhp-num">{value}</td>
      </tr>
    ),
  });

  const totals = qs.showTotals ? [
    totalRow('t-sub', 'TOTAL', fmt(num(quotation.subtotal))),
    discount > 0 && totalRow('t-disc', 'SPECIAL DISCOUNT', `− ${fmt(discount)}`),
    discount > 0 && totalRow('t-taxable', 'SUB TOTAL', fmt(num(quotation.subtotal) - discount)),
    ...gstLines(items, quotation.tax, co.state || stateFromGstin(co.gstNumber), quotation.customerState || stateFromGstin(quotation.customerGst)).map((t) => totalRow(`t-gst-${gstLabel(t)}`, gstLabel(t).toUpperCase(), fmt(t.amount))),
    num(quotation.roundOff) !== 0 && totalRow('t-round', 'ROUND OFF', fmtSigned(quotation.roundOff)),
    totalRow('t-grand', `NET AMOUNT (${cur})`, fmt(quotation.total), 'lhp-grand-row'),
    {
      key: 't-words',
      group: 'items',
      node: <tr className="lhp-row-first lhp-words-row"><td colSpan={5}>Amount in words: <b>{amountInWords(quotation.total)}</b></td></tr>,
    },
  ].filter(Boolean) : [];

  const termsHtml = (qs.termsHtml || '').trim() || termsToHtml(qs.terms);
  const termParts = splitTermsHtml(termsHtml, co.bankDetails);
  const extra = (quotation.termsAndConditions || '').trim();
  const hasTerms = termParts.length > 0 || !!extra;

  const blocks = [
    {
      key: 'meta',
      keepWithNext: true,
      node: (
        <div className="lhp-parties no-ship">
          <div className="lhp-party">
            <p className="lhp-label">To</p>
            <p className="lhp-party-name">{quotation.customer || '—'}</p>
            {quotation.customerAddress && <p className="lhp-pre">{quotation.customerAddress}</p>}
            {quotation.customerPhone && <p>Phone: {quotation.customerPhone}</p>}
            {quotation.customerGst && <p>GSTIN: {quotation.customerGst}</p>}
          </div>
          <table className="lhp-kv">
            <tbody>
              <tr><th>QTN NO</th><td>{quotation.quotationNumber}</td></tr>
              <tr><th>DATE</th><td>{fmtDateNumeric(quotation.date)}</td></tr>
              {quotation.validUntil && <tr><th>VALID TILL</th><td>{fmtDateNumeric(quotation.validUntil)}</td></tr>}
            </tbody>
          </table>
        </div>
      ),
    },
    { key: 'title', keepWithNext: true, node: <div className="lhp-title"><h2>{qs.title || 'QUOTATION'}</h2></div> },
    ...itemBlocks,
    ...totals,
    quotation.notes && { key: 'notes', node: <p className="lhp-para"><b>Note:</b> <span className="lhp-pre">{quotation.notes}</span></p> },
    hasTerms && {
      key: 'terms-title',
      keepWithNext: true,
      breakBefore: qs.termsPage,
      node: <h2 className="lhp-terms-title" style={qs.termsPage ? undefined : { paddingTop: '4mm' }}>{qs.termsTitle || 'TERMS AND CONDITIONS'}</h2>,
    },
    ...termParts.map((html, i) => ({
      key: `term-${i}`,
      node: <div className="lhp-rich" dangerouslySetInnerHTML={{ __html: html }} />,
    })),
    extra && { key: 'term-extra', node: <p className="lhp-para"><b>ADDITIONAL TERMS:</b> <span className="lhp-pre">{extra}</span></p> },
    qs.showSignature && {
      key: 'sign',
      breakBefore: qs.termsPage && !hasTerms,
      node: (
        <div className="lhp-signrow">
          <div className="lhp-sign" style={{ marginLeft: 0 }}>
            <p className="lhp-sign-for">FOR {(co.companyName || 'THE COMPANY').toUpperCase()}</p>
            <div className="lhp-sign-space">
              {co.sealSignatureImage && quotation?.useSignature !== false && <img src={src(co.sealSignatureImage)} alt="Seal & signature" />}
            </div>
            <p className="lhp-sign-label">AUTHORIZED SIGNATORY</p>
          </div>
        </div>
      ),
    },
  ].filter(Boolean);

  const contentKey = JSON.stringify([quotation.quotationNumber, items, quotation.total, quotation.notes, quotation.termsAndConditions, quotation.customer, quotation.customerAddress, qs, co.bankDetails, co.companyName]);

  return <LetterheadDocument company={co} blocks={blocks} groups={groups} contentKey={contentKey} />;
}

export default QuotationPageView;
