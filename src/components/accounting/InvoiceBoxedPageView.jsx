// Classic GST invoice printed on the company's full-page letterhead: the same
// ruled rows as InvoiceBoxedView, with the letterhead in place of the company
// block. The item grid's column rules stretch down to the totals, and a long
// invoice carries on to further pages with its headings repeated.
import LetterheadDocument from './LetterheadDocument';
import {
  BoxedDetailsRow, BoxedFieldsRow, BoxedGridTotalRow, BoxedItemHead, BoxedItemRow, BoxedNoteRows, BoxedParties,
  BoxedSignRow, BoxedTitle, BoxedTotalsRow, BoxedWordsRow,
} from './InvoiceBoxedParts';
import { splitColumnWidths } from './invoiceFormat';

function InvoiceBoxedPageView({ M }) {
  const { co, L, items, cols } = M;

  const columns = cols.split ? splitColumnWidths(cols) : [
    '10mm', null,
    ...(cols.hsn ? ['20mm'] : []),
    '15mm',
    ...(cols.uom ? ['14mm'] : []),
    '22mm',
    ...(cols.discount ? ['22mm'] : []),
    ...(cols.taxable ? ['22mm'] : []),
    ...(cols.rate ? ['14mm'] : []),
    ...(cols.gst ? ['22mm'] : []),
    '22mm',
  ];
  const groups = { items: { className: `lhb-items ${cols.split ? 'bx-split-table' : ''}`, cols: columns, head: <BoxedItemHead M={M} /> } };

  // The rows from the totals down stay together, so they move as one if they don't fit
  const tail = [
    ['totals', <BoxedTotalsRow M={M} key="t" />],
    ['words', <BoxedWordsRow M={M} key="w" />],
    ['fields', <BoxedFieldsRow M={M} key="f" />],
    ['notes', <BoxedNoteRows M={M} key="n" />],
    ['sign', <BoxedSignRow M={M} key="s" />],
    L.sections.computerGenerated && ['computer', <p className="lhb-below" key="c">This is a computer-generated invoice.</p>],
  ].filter(Boolean);

  const blocks = [
    { key: 'title', keepWithNext: true, node: <BoxedTitle M={M} /> },
    { key: 'details', keepWithNext: true, node: <BoxedDetailsRow M={M} /> },
    { key: 'parties', keepWithNext: true, node: <BoxedParties M={M} /> },
    ...items.map((item, idx) => ({
      key: `item-${item.id || idx}`,
      group: 'items',
      node: <BoxedItemRow M={M} item={item} index={idx} />,
    })),
    {
      key: 'fill',
      group: 'items',
      fill: true,
      keepWithNext: cols.split, // the TOTAL row under it stays on the same page
      node: (height) => <tr className="lhb-fill">{columns.map((_, i) => <td key={i} style={{ height }} />)}</tr>,
    },
    ...(cols.split ? [{ key: 'gridtotal', group: 'items', keepWithNext: true, node: <BoxedGridTotalRow M={M} /> }] : []),
    ...tail.map(([key, node], i) => ({ key, node, keepWithNext: i < tail.length - 1 })),
  ];

  return (
    <LetterheadDocument
      company={co}
      blocks={blocks}
      groups={groups}
      contentKey={M.contentKey}
      showPageNumbers={L.sections.pageNumber}
      extraClass="bx-doc lhb-doc"
      style={{ ...M.docStyle, '--lhp-fs': M.docStyle['--inv-fs'], '--lhp-font': M.docStyle['--inv-font'] }}
    />
  );
}

export default InvoiceBoxedPageView;
