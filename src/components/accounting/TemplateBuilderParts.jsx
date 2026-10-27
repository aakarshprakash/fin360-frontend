// Controls and the scaled A4 preview shared by the invoice and quotation
// template builders (styles: InvoiceTemplateBuilder.css, itb-*).
import { useLayoutEffect, useRef, useState } from 'react';
import '../../styles/InvoiceTemplateBuilder.css';

const A4_PX = { width: 794, height: 1123 }; // 210 × 297 mm at 96 dpi

export function Toggle({ label, checked, onChange, hint }) {
  return (
    <label className="itb-toggle">
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <input type="checkbox" role="switch" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

export function Segmented({ label, value, options, onChange }) {
  return (
    <div className="itb-field">
      <span className="itb-label">{label}</span>
      <div className="itb-segmented" role="radiogroup" aria-label={label}>
        {options.map(([v, text]) => (
          <button
            type="button"
            key={v}
            role="radio"
            aria-checked={value === v}
            className={value === v ? 'is-on' : ''}
            onClick={() => onChange(v)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TextField({ label, value, onChange, maxLength, placeholder, multiline, rows = 3 }) {
  const Input = multiline ? 'textarea' : 'input';
  return (
    <label className="itb-field">
      <span className="itb-label">{label}</span>
      <Input
        type={multiline ? undefined : 'text'}
        value={value || ''}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={multiline ? rows : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function Panel({ title, children, open }) {
  return (
    <details className="itb-panel" open={open}>
      <summary>{title}</summary>
      <div className="itb-panel-body">{children}</div>
    </details>
  );
}

// A4 sheet scaled to the available width. autoHeight: frame follows the
// content (several pages) instead of clipping to one sheet.
export function ScaledPreview({ children, autoHeight = false }) {
  const ref = useRef(null);
  const pageRef = useRef(null);
  const [scale, setScale] = useState(0.7);
  const [contentHeight, setContentHeight] = useState(A4_PX.height);
  useLayoutEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(() => {
      setScale(Math.min(1, (ref.current.clientWidth - 34) / A4_PX.width));
      if (autoHeight && pageRef.current) setContentHeight(Math.max(A4_PX.height, pageRef.current.offsetHeight));
    });
    ro.observe(ref.current);
    if (pageRef.current) ro.observe(pageRef.current);
    return () => ro.disconnect();
  }, [autoHeight]);
  const height = autoHeight ? contentHeight : A4_PX.height;
  return (
    <div className="itb-preview" ref={ref}>
      <div className="itb-preview-frame" style={{ width: A4_PX.width * scale, height: height * scale }}>
        <div className="itb-preview-page" ref={pageRef} style={{ transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
