// A document printed on a full-page letterhead. Every page is a real A4 sheet
// with the letterhead behind it, and content is split into pages here, by
// measuring it, so the screen preview and the printout break in the same places:
// table rows and terms never cut across the letterhead's header or footer, and
// table headings repeat on each page.
//
// blocks: [{ key, node, group?, keepWithNext?, breakBefore? }]
//   node         a <div>-level element, or a <tr> when the block has a group
//   group        id in `groups`: consecutive blocks share a table
//   keepWithNext stay on the same page as the following block
//   breakBefore  start a new page
//   fill         a table row (node is a function of its height in px) that takes
//                up the space left on its page, so column rules reach the blocks below
// groups: { id: { className, cols: ['11mm', null, …], head: <tr/> } }
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { API_ORIGIN } from '../../utils/api';
import '../../styles/LetterheadDocument.css';

const SAFETY_PX = 6; // rounding between measuring and rendering

// Consecutive blocks of one group become a table
function renderBlocks(indexes, blocks, groups, measuring, fills = {}) {
  const out = [];
  let i = 0;
  while (i < indexes.length) {
    const block = blocks[indexes[i]];
    if (!block) { i += 1; continue; }
    if (!block.group) {
      out.push(<div key={block.key} className="lhd-block" data-lhd={measuring ? indexes[i] : undefined}>{block.node}</div>);
      i += 1;
      continue;
    }
    const group = groups[block.group];
    const rows = [];
    let j = i;
    while (j < indexes.length && blocks[indexes[j]]?.group === block.group) {
      const b = blocks[indexes[j]];
      const node = b.fill ? b.node(fills[indexes[j]] || 0) : b.node;
      rows.push(measuring ? <RowProbe key={b.key} index={indexes[j]}>{node}</RowProbe> : <RowNode key={b.key}>{node}</RowNode>);
      j += 1;
    }
    out.push(
      <table key={`${block.key}-table`} className={`lhd-table ${group.className || ''}`}>
        <colgroup>{group.cols.map((w, c) => <col key={c} style={w ? { width: w } : undefined} />)}</colgroup>
        <thead data-lhd-head={measuring ? block.group : undefined}>{group.head}</thead>
        {rows}
      </table>,
    );
    i = j;
  }
  return out;
}

// Each row gets its own <tbody> so it can be measured on its own
const RowNode = ({ children }) => <tbody>{children}</tbody>;
const RowProbe = ({ index, children }) => <tbody data-lhd={index}>{children}</tbody>;

// Height of a block, plus its table heading when it would start a table
const blockCost = (blocks, heights, headHeights, i, prevGroup) => heights[i]
  + (blocks[i].group && blocks[i].group !== prevGroup ? headHeights[blocks[i].group] || 0 : 0);

function paginate(blocks, heights, headHeights, usable) {
  const pages = [[]];
  let used = 0;
  const costAt = (i, prevGroup) => blockCost(blocks, heights, headHeights, i, prevGroup);

  blocks.forEach((block, i) => {
    const page = pages[pages.length - 1];
    const prev = page.length ? blocks[page[page.length - 1]] : null;
    const prevGroup = prev?.group;

    // The block plus everything it must stay with
    let needed = costAt(i, prevGroup);
    let group = block.group;
    for (let k = i; blocks[k]?.keepWithNext && blocks[k + 1]; k += 1) {
      needed += costAt(k + 1, group);
      group = blocks[k + 1].group;
    }

    if (page.length && (block.breakBefore || used + needed > usable)) {
      pages.push([i]);
      used = costAt(i, undefined);
    } else {
      page.push(i);
      used += costAt(i, prevGroup);
    }
  });
  return pages;
}

// Height for each fill row: whatever its page has left over
function fillHeights(pages, blocks, heights, headHeights, usable) {
  const fills = {};
  pages.forEach((page) => {
    let used = 0;
    let prevGroup;
    page.forEach((i) => {
      used += blockCost(blocks, heights, headHeights, i, prevGroup);
      prevGroup = blocks[i].group;
    });
    page.forEach((i) => { if (blocks[i].fill) fills[i] = Math.max(0, usable - used); });
  });
  return fills;
}

function LetterheadDocument({ company, blocks, groups = {}, contentKey, showPageNumbers, extraClass = '', style }) {
  const co = company || {};
  const top = Number(co.letterheadTop ?? 52);
  const bottom = Number(co.letterheadBottom ?? 35);
  const side = Number(co.letterheadSide ?? 15);
  const measureRef = useRef(null);
  const [layout, setLayout] = useState(null); // { pages, fills }

  const measure = useCallback(() => {
    const root = measureRef.current;
    if (!root) return;
    const usable = root.querySelector('.lhd-probe-height').offsetHeight - SAFETY_PX;
    const heights = blocks.map((_, i) => root.querySelector(`[data-lhd="${i}"]`)?.offsetHeight || 0);
    const headHeights = {};
    root.querySelectorAll('[data-lhd-head]').forEach((h) => { headHeights[h.getAttribute('data-lhd-head')] = h.offsetHeight; });
    const pages = paginate(blocks, heights, headHeights, usable);
    const next = { pages, fills: fillHeights(pages, blocks, heights, headHeights, usable) };
    setLayout((cur) => (JSON.stringify(cur) === JSON.stringify(next) ? cur : next));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- blocks are rebuilt each render; contentKey says when they changed
  }, [contentKey, top, bottom, side]);

  useLayoutEffect(() => {
    measure();
    const root = measureRef.current;
    if (!root) return undefined;
    // Heights change when stylesheets, pictures and web fonts arrive. The print
    // window renders before its stylesheet has loaded, so this is what gets its
    // pages right. Its own window's observer: one from another window won't fire.
    const doc = root.ownerDocument;
    const observer = new doc.defaultView.ResizeObserver(measure);
    observer.observe(root.querySelector('.lhd-measure-body'));
    const sheets = [...doc.querySelectorAll('link[rel="stylesheet"]')];
    sheets.forEach((link) => link.addEventListener('load', measure));
    return () => {
      observer.disconnect();
      sheets.forEach((link) => link.removeEventListener('load', measure));
    };
  }, [measure]);

  const allIndexes = blocks.map((_, i) => i);
  const pageList = layout && layout.pages.every((p) => p.every((i) => blocks[i])) ? layout.pages : [allIndexes];
  const contentStyle = { top: `${top}mm`, left: `${side}mm`, right: `${side}mm`, bottom: `${bottom}mm` };

  return (
    <div className={`inv-print lhd-doc ${extraClass}`} style={style}>
      {/* Edge-to-edge letterhead: no browser margins (and so no browser header/footer) */}
      <style>{'@page { size: A4; margin: 0; }'}</style>

      {pageList.map((indexes, p) => (
        <section className="lhd-page" key={p}>
          {/* An <img>, not a CSS background, so it prints without "Background graphics" */}
          {co.letterheadImage && <img className="lhd-bg" src={`${API_ORIGIN}/storage/${co.letterheadImage}`} alt="" />}
          <div className="lhd-content" style={contentStyle}>{renderBlocks(indexes, blocks, groups, false, layout?.fills)}</div>
          {(showPageNumbers || pageList.length > 1) && (
            <div className="lhd-pageno" style={{ bottom: `${Math.max(bottom - 5, 2)}mm`, right: `${side}mm` }}>Page {p + 1} of {pageList.length}</div>
          )}
        </section>
      ))}

      {/* Hidden copy used only for measuring */}
      <div className="lhd-measure" ref={measureRef} aria-hidden="true" style={{ width: `${210 - side * 2}mm` }}>
        <div className="lhd-probe-height" style={{ height: `${297 - top - bottom}mm` }} />
        <div className="lhd-measure-body">{renderBlocks(allIndexes, blocks, groups, true)}</div>
      </div>
    </div>
  );
}

export default LetterheadDocument;
