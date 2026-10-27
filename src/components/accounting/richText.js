// Rich-text helpers for the quotation terms page: allow-list sanitising (also
// done on the server), the bank-details placeholder, and conversion from the
// older structured terms list.
import DOMPurify from 'dompurify';
import { splitKeyValues } from './invoiceFormat';

export const BANK_MARKER_ATTR = 'data-bank-details';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ol', 'ul', 'li', 'h2', 'h3', 'h4',
  'blockquote', 'hr', 'div', 'table', 'colgroup', 'col', 'thead', 'tbody', 'tr', 'th', 'td',
];
const ALLOWED_STYLE = /^(text-align:\s*(left|center|right|justify)|(min-)?width:\s*\d{1,4}px)$/i;

let hooked = false;
function addStyleFilter() {
  if (hooked) return;
  hooked = true;
  // Keep only alignment and column widths from inline styles
  DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName !== 'style') return;
    const kept = data.attrValue.split(';').map((d) => d.trim()).filter((d) => ALLOWED_STYLE.test(d));
    if (kept.length) data.attrValue = kept.join('; ');
    else data.keepAttr = false;
  });
}

export function sanitizeRichText(html) {
  addStyleFilter();
  return DOMPurify.sanitize(String(html || ''), {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['style', 'colspan', 'rowspan', BANK_MARKER_ATTR],
  });
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function bankTableHtml(bankDetails) {
  const rows = splitKeyValues(bankDetails);
  if (!rows.length) return '';
  const body = rows.map(([k, v]) => (k == null
    ? `<tr><td colspan="2">${esc(v)}</td></tr>`
    : `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)).join('');
  return `<table class="qlh-bank"><tbody>${body}</tbody></table>`;
}

// Sanitised terms with each bank-details block swapped for the real table
export function renderTermsHtml(html, bankDetails) {
  const clean = sanitizeRichText(html);
  const table = bankTableHtml(bankDetails);
  return clean.replace(new RegExp(`<div[^>]*${BANK_MARKER_ATTR}[^>]*>[\\s\\S]*?</div>`, 'g'), table);
}

// Older settings stored terms as [{ title, text, showBank }]
export function termsToHtml(terms) {
  const items = (terms || []).map((t) => {
    const text = esc(t.text).replace(/\n/g, '<br>');
    const head = t.title ? `<strong>${esc(t.title)}:</strong> ` : '';
    return `<li><p>${head}${text}</p>${t.showBank ? `<div ${BANK_MARKER_ATTR}="true"></div>` : ''}</li>`;
  }).join('');
  return items ? `<ol>${items}</ol>` : '<p></p>';
}
