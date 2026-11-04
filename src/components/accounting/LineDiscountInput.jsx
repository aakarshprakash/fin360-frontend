// One of a line's two linked discount boxes (% and ₹): typing in either one
// updates the other. field: 'percent' | 'amount'.
import { discountAsPercent, discountWithGst, lineDiscount, lineGross, round2 } from './lineAmounts';

function LineDiscountInput({ field, item, onChange, disabled, style }) {
  const gross = lineGross(item);
  const isPercent = field === 'percent';
  const active = item.discountMode === field;
  const value = active
    ? (isPercent ? item.discountPercent : item.discountAmount)
    : (isPercent ? discountAsPercent(lineDiscount(item), gross) : discountWithGst(item));
  const max = isPercent ? 100 : round2(gross * (1 + (Number(item.taxRate) || 0) / 100)); // the amount is off the price with GST

  return (
    <input
      type="number"
      min="0"
      max={max}
      step="any"
      style={style}
      disabled={disabled}
      value={value}
      aria-label={isPercent ? 'Discount percent' : 'Discount amount including GST'}
      placeholder={isPercent ? '%' : '₹'}
      onChange={(e) => {
        const raw = e.target.value;
        const capped = Number(raw) > max ? String(max) : raw;
        onChange(isPercent
          ? { discountMode: 'percent', discountPercent: capped }
          : { discountMode: 'amount', discountAmount: capped });
      }}
    />
  );
}

export default LineDiscountInput;
