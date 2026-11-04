// A line's price. Shown as plain text so it can't be changed by accident; "Edit
// price" opens one box, and a switch says whether the number typed includes GST
// or not. The saved value is always the price before GST.
import { useState } from 'react';
import { PriceWithGstInput } from './GstInputs';
import { round2 } from './lineAmounts';
import '../../styles/LinePriceInput.css';

function LinePriceInput({ price, rate, onChange, disabled = false, currency = 'INR' }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('incl'); // 'incl' | 'excl': what the number typed means

  const taxRate = Number(rate) || 0;
  const exGst = Number(price) || 0;
  const inclGst = round2(exGst * (1 + taxRate / 100));
  const money = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(v);

  // A line with no price yet goes straight to the editor
  const editing = !disabled && (open || exGst <= 0);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault(); // Enter here must not submit the whole document
      setOpen(false);
    }
  };

  if (!editing) {
    return (
      <div className="lp">
        <div className="lp-main">
          {money(taxRate > 0 ? inclGst : exGst)}
          {taxRate > 0 && <> <span className="lp-tag">incl. GST</span></>}
        </div>
        {taxRate > 0 && <div className="lp-sub">{money(exGst)} before GST</div>}
        {!disabled && <button type="button" className="lp-edit" onClick={() => setOpen(true)}>Edit price</button>}
      </div>
    );
  }

  return (
    <div className="lp lp-editing" onKeyDown={onKeyDown}>
      <div className="lp-seg" role="group" aria-label="What the price includes">
        <button type="button" aria-pressed={mode === 'incl'} onClick={() => setMode('incl')}>Incl. GST</button>
        <button type="button" aria-pressed={mode === 'excl'} onClick={() => setMode('excl')}>Excl. GST</button>
      </div>
      {mode === 'incl' ? (
        <PriceWithGstInput price={exGst} rate={taxRate} onChange={(value) => { setOpen(true); onChange(value); }} />
      ) : (
        <input
          type="number"
          min="0"
          step="0.01"
          aria-label="Price before GST"
          value={price}
          onChange={(e) => { setOpen(true); onChange(Number(e.target.value)); }}
        />
      )}
      <div className="lp-hint">
        {mode === 'incl' ? `${money(exGst)} before GST` : `${money(inclGst)} incl. GST`}
      </div>
      <button type="button" className="lp-done" onClick={() => setOpen(false)} disabled={exGst <= 0}>Done</button>
    </div>
  );
}

export default LinePriceInput;
