// Record a full or part payment against an invoice.
import { useEffect, useState } from 'react';
import { Wallet, X } from 'lucide-react';
import { getBankAccounts, recordInvoicePayment } from '../../utils/accountingApi';
import '../../styles/Products.css';
import '../../styles/InvoiceSettlement.css';

const METHODS = ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Card'];
const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const round2 = (v) => Math.round(Number(v || 0) * 100) / 100;

function InvoicePaymentModal({ invoice, outstanding, onDone, onClose }) {
  const [form, setForm] = useState({
    amount: round2(outstanding),
    date: new Date().toISOString().slice(0, 10),
    method: 'Bank Transfer',
    bankAccountId: '',
    reference: '',
    notes: '',
  });
  const [banks, setBanks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getBankAccounts()
      .then((res) => {
        const list = res.data?.data || res.data || [];
        if (cancelled || !Array.isArray(list)) return;
        setBanks(list);
        if (list.length) setForm((f) => ({ ...f, bankAccountId: f.bankAccountId || String(list[0].id) }));
      })
      .catch(() => { /* the server falls back to the first account */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const amount = Number(form.amount) || 0;
  const after = round2(outstanding - amount);
  const tooMuch = amount > outstanding + 0.005;

  const submit = async (e) => {
    e.preventDefault();
    if (amount <= 0 || tooMuch) return;
    setSaving(true);
    setError('');
    try {
      const res = await recordInvoicePayment(invoice.id, {
        amount: round2(amount),
        date: form.date,
        method: form.method,
        bankAccountId: form.bankAccountId ? Number(form.bankAccountId) : null,
        reference: form.reference || null,
        notes: form.notes || null,
      });
      onDone(res.data?.invoice, after <= 0.005 ? 'Payment recorded — invoice fully paid.' : `Part payment recorded. ${money(after)} still due.`);
    } catch (err) {
      const body = err.response?.data;
      setError((body?.errors && Object.values(body.errors)[0]?.[0]) || body?.message || 'Could not record the payment.');
      setSaving(false);
    }
  };

  return (
    <div className="acc-modal-overlay" onClick={onClose}>
      <div className="pm st-dialog" role="dialog" aria-modal="true" aria-labelledby="pay-title" onClick={(e) => e.stopPropagation()}>
        <header className="pm-head">
          <span className="pm-head-icon st-icon-pay"><Wallet size={20} aria-hidden="true" /></span>
          <div>
            <h2 id="pay-title">Record payment</h2>
            <p>{invoice.invoiceNumber} · {invoice.customer}</p>
          </div>
          <button type="button" className="pm-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>

        <form onSubmit={submit} className="pm-form">
          <div className="st-body">
            <div className="st-balance">
              <div><span>Invoice total</span><strong>{money(invoice.total)}</strong></div>
              <div><span>Outstanding</span><strong className="is-due">{money(outstanding)}</strong></div>
              <div><span>After this payment</span><strong className={after <= 0.005 ? 'is-clear' : ''}>{tooMuch ? '—' : money(Math.max(0, after))}</strong></div>
            </div>

            <div className="pm-card-body st-grid">
              <div className="pm-field pm-span-3">
                <label htmlFor="pay-amount">Amount received<span className="pm-req"> *</span></label>
                <div className="pm-adorn"><span>₹</span><input id="pay-amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} required autoFocus /></div>
                <div className="pm-quick" role="group" aria-label="Quick amounts">
                  <button type="button" className={Math.abs(amount - outstanding) < 0.005 ? 'is-on' : ''} onClick={() => setForm({ ...form, amount: round2(outstanding) })}>Full balance</button>
                  <button type="button" className={Math.abs(amount - outstanding / 2) < 0.005 ? 'is-on' : ''} onClick={() => setForm({ ...form, amount: round2(outstanding / 2) })}>Half</button>
                </div>
                {tooMuch && <span className="st-warn">More than the {money(outstanding)} outstanding.</span>}
              </div>
              <div className="pm-field">
                <label htmlFor="pay-date">Date<span className="pm-req"> *</span></label>
                <input id="pay-date" type="date" value={form.date} onChange={set('date')} required />
              </div>
              <div className="pm-field">
                <label htmlFor="pay-method">Method</label>
                <select id="pay-method" className="st-select" value={form.method} onChange={set('method')}>
                  {METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="pm-field">
                <label htmlFor="pay-bank">Deposit to</label>
                <select id="pay-bank" className="st-select" value={form.bankAccountId} onChange={set('bankAccountId')} disabled={!banks.length}>
                  {!banks.length && <option value="">Cash & Bank</option>}
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>{b.bankName}{b.accountNumber ? ` ····${String(b.accountNumber).slice(-4)}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="pm-field">
                <label htmlFor="pay-ref">Reference</label>
                <input id="pay-ref" type="text" maxLength={100} value={form.reference} onChange={set('reference')} placeholder="UTR / cheque no." />
              </div>
              <div className="pm-field pm-span-3">
                <label htmlFor="pay-notes">Note</label>
                <input id="pay-notes" type="text" maxLength={500} value={form.notes} onChange={set('notes')} placeholder="Optional" />
              </div>
            </div>
          </div>

          <footer className="pm-foot">
            {error ? <p className="pm-error" role="alert">{error}</p> : <p className="pm-foot-hint">Posts to the bank account and Accounts Receivable.</p>}
            <div className="pm-foot-actions">
              <button type="button" className="acc-btn acc-btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="acc-btn acc-btn-primary" disabled={saving || amount <= 0 || tooMuch}>
                {saving ? 'Saving…' : after <= 0.005 && !tooMuch ? 'Record full payment' : 'Record part payment'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default InvoicePaymentModal;
