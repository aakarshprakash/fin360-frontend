// "Boxed" invoice design: the ruled, all-boxes GST tax invoice (letterhead,
// CIN/GSTIN/PAN beside the invoice details, Bill To / Ship To, item grid whose
// column rules run to the foot of the page, totals, declaration, receiver's
// note and signatory). Receives the model built by InvoicePrintView.
import { useLayoutEffect, useRef, useState } from 'react';
import {
  BoxedDetailsRow, BoxedFieldsRow, BoxedGridTotalRow, BoxedItemHead, BoxedItemRow, BoxedNoteRows, BoxedParties,
  BoxedSignRow, BoxedTitle, BoxedTotalsRow, BoxedWordsRow,
} from './InvoiceBoxedParts';
import { splitColumnWidths } from './invoiceFormat';

const A4_HEIGHT_PX = (297 / 25.4) * 96;

function InvoiceBoxedView({ M }) {
  const { co, L, items, cols } = M;
  const docRef = useRef(null);
  const [pages, setPages] = useState(1);

  // The page number sits at the end of the document, i.e. on its last page
  const showPageNumber = L.sections.pageNumber;
  useLayoutEffect(() => {
    const el = docRef.current;
    if (!showPageNumber || !el) return undefined;
    const measure = () => setPages(Math.max(1, Math.ceil((el.offsetHeight - 4) / A4_HEIGHT_PX)));
    measure();
    // Its own window's observer, for the print window
    const ro = new el.ownerDocument.defaultView.ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showPageNumber]);

  const phoneLine = [co.phone && `Phone No: ${co.phone}`, co.mobile && `Cell: ${co.mobile}`].filter(Boolean).join(', ');
  const webLine = [co.email && `Email: ${co.email}`, co.website && `Web: ${co.website}`].filter(Boolean).join('   ');
  const stateLine = co.state ? `State: ${co.state}${M.companyStateCode ? `, State Code: ${M.companyStateCode}` : ''}` : '';
  const colCount = 5 + [cols.hsn, cols.uom, cols.discount, cols.taxable, cols.rate, cols.gst, cols.gross].filter(Boolean).length
    + (cols.split ? 2 : 0);

  return (
    <div
      ref={docRef}
      className={`inv-print inv-doc bx-doc bx-logo-${L.logo.position}`}
      style={M.docStyle}
    >
      <div className="bx-box">
        {/* ── Letterhead ─────────────────────────────────────── */}
        <header className={`bx-head ${M.logoSrc ? 'has-logo' : ''}`}>
          {M.logoSrc && L.logo.position !== 'center' && <img className="bx-logo" src={M.logoSrc} alt="" />}
          <div className="bx-co">
            {M.logoSrc && L.logo.position === 'center' && <img className="bx-logo" src={M.logoSrc} alt="" />}
            {co.companyName && <h1>{co.companyName}</h1>}
            {L.header.tagline && <p className="bx-tagline">{L.header.tagline}</p>}
            {L.header.showAddress && co.address && <p className="bx-pre bx-co-big">{co.address}</p>}
            {L.header.showContact && phoneLine && <p className="bx-co-big">{phoneLine}</p>}
            {L.header.showContact && webLine && <p className="bx-co-big">{webLine}</p>}
            {L.header.showState && stateLine && <p className="bx-co-big">{stateLine}</p>}
          </div>
        </header>

        <BoxedTitle M={M} />
        <BoxedDetailsRow M={M} />
        <BoxedParties M={M} />

        {/* ── Items: column rules run down to the totals ─────── */}
        <div className="bx-items">
          <table className={cols.split ? 'bx-split-table' : ''}>
            {cols.split && <colgroup>{splitColumnWidths(cols).map((w, i) => <col key={i} style={w ? { width: w } : undefined} />)}</colgroup>}
            <thead><BoxedItemHead M={M} /></thead>
            <tbody>
              {items.map((item, idx) => <BoxedItemRow key={item.id || idx} M={M} item={item} index={idx} />)}
              <tr className="bx-fill">
                {Array.from({ length: colCount }, (_, i) => <td key={i} />)}
              </tr>
              <BoxedGridTotalRow M={M} />
            </tbody>
          </table>
        </div>

        <BoxedTotalsRow M={M} />
        <BoxedWordsRow M={M} />
        <BoxedFieldsRow M={M} />
        <BoxedNoteRows M={M} />
        <BoxedSignRow M={M} />
      </div>

      <div className="bx-below">
        <span>{L.sections.computerGenerated ? 'This is a computer-generated invoice.' : ''}</span>
        <span>{L.sections.pageNumber ? `Page ${pages} of ${pages}` : ''}</span>
      </div>
    </div>
  );
}

export default InvoiceBoxedView;
