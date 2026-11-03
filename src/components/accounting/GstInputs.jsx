// GST inputs for line items and products.
// GstSelect: the standard slabs plus Settings › Tax Rates, always including the
// line's own rate, so a product's or saved document's GST is never altered.
// PriceWithGstInput: enter a price including GST; the price before GST follows.
import { useEffect, useState } from 'react';
import { getTaxes } from '../../utils/accountingApi';
import { STANDARD_GST_RATES, round2 } from './lineAmounts';

// Fetched once per page load, not once per line
let masterRates = null;
let pending = null;
function loadMasterRates() {
  if (!pending) {
    pending = getTaxes()
      .then((res) => {
        const list = res.data?.data || res.data || [];
        // CGST/SGST rows are halves of a rate (9% + 9%), not a rate to charge on a line
        masterRates = (Array.isArray(list) ? list : [])
          .filter((t) => t.active !== false && !['CGST', 'SGST'].includes(t.type))
          .map((t) => Number(t.rate))
          .filter((r) => r >= 0);
        return masterRates;
      })
      .catch(() => { masterRates = []; return masterRates; }); // viewers can't read the master
  }
  return pending;
}

export function GstSelect({ value, onChange, disabled, style }) {
  const [master, setMaster] = useState(masterRates || []);
  useEffect(() => {
    let cancelled = false;
    loadMasterRates().then((rates) => { if (!cancelled) setMaster(rates); });
    return () => { cancelled = true; };
  }, []);

  const current = Number(value) || 0;
  const rates = [...new Set([...STANDARD_GST_RATES, ...master, current])].sort((a, b) => b - a);
  return (
    <select style={style} disabled={disabled} aria-label="GST rate" value={current} onChange={(e) => onChange(Number(e.target.value))}>
      {rates.map((r) => <option key={r} value={r}>{r === 0 ? 'No Tax' : `GST ${r}%`}</option>)}
    </select>
  );
}

export function PriceWithGstInput({ price, rate, onChange, disabled, id, style }) {
  // What's being typed is kept as typed: converting back and forth can differ by a paisa
  const [draft, setDraft] = useState(null);
  const factor = 1 + (Number(rate) || 0) / 100;
  const shown = draft ?? (Number(price) > 0 ? round2(Number(price) * factor) : '');
  return (
    <input
      id={id}
      type="number"
      min="0"
      step="0.01"
      style={style}
      disabled={disabled}
      aria-label="Price including GST"
      value={shown}
      onChange={(e) => {
        setDraft(e.target.value);
        onChange(round2((Number(e.target.value) || 0) / factor));
      }}
      onBlur={() => setDraft(null)}
    />
  );
}
