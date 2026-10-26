// Shared pagination footer for accounting list pages — prev/next + page size,
// matching the .acc-btn / .acc-table visual language in Accounting.css.
function Pagination({ meta, page, onPageChange, perPage, onPerPageChange }) {
  if (!meta || meta.total === 0) return null;

  // api.js auto-transforms response keys snake_case → camelCase, so the
  // backend's `current_page`/`last_page` arrive here as `currentPage`/`lastPage`.
  const { currentPage, lastPage, total } = meta;
  const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);

  const pageNumbers = [];
  const windowStart = Math.max(1, currentPage - 2);
  const windowEnd = Math.min(lastPage, windowStart + 4);
  for (let p = windowStart; p <= windowEnd; p++) pageNumbers.push(p);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: '12px', padding: '14px 20px',
      borderTop: '1px solid var(--neutral-100)', fontSize: '13px', color: 'var(--neutral-600)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>Showing {from}–{to} of {total}</span>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--neutral-200)', fontSize: '12px' }}
        >
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          type="button"
          className="acc-btn acc-btn-secondary"
          style={{ padding: '5px 12px', fontSize: '12px' }}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ← Prev
        </button>
        {windowStart > 1 && <span style={{ padding: '0 4px' }}>…</span>}
        {pageNumbers.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            style={{
              minWidth: '28px', padding: '5px 8px', fontSize: '12px', borderRadius: '6px',
              border: '1px solid var(--neutral-200)', cursor: 'pointer', fontFamily: 'inherit',
              background: p === currentPage ? 'var(--primary-600)' : '#fff',
              color: p === currentPage ? '#fff' : 'var(--neutral-700)',
              fontWeight: p === currentPage ? 700 : 500,
            }}
          >
            {p}
          </button>
        ))}
        {windowEnd < lastPage && <span style={{ padding: '0 4px' }}>…</span>}
        <button
          type="button"
          className="acc-btn acc-btn-secondary"
          style={{ padding: '5px 12px', fontSize: '12px' }}
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default Pagination;
