// Accounting Settings - Company, Accounting, and Numbering, Invoice Template & Payment Methods
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getAccountingSettings, updateAccountingSettings, getInvoiceTemplateSettings, updateInvoiceTemplateSettings, getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod, uploadCompanySignature, deleteCompanySignature, uploadCompanyLogo, deleteCompanyLogo } from '../../utils/accountingApi';
import { API_ORIGIN } from '../../utils/api';
import '../../styles/Accounting.css';
import { ICONS } from '../../components/accounting/AccountingIcons';
import useSnackbar from '../../utils/useSnackbar';
import InvoicePrintView from '../../components/accounting/InvoicePrintView';
import { INVOICE_TEMPLATES } from '../../components/accounting/invoiceTemplates';

// Sample used only for the template preview
const PREVIEW_INVOICE = {
  invoiceNumber: 'INV-00001', date: new Date().toISOString(), dueDate: new Date(Date.now() + 7 * 864e5).toISOString(),
  customer: 'Sample Customer Pvt Ltd', customerAddress: 'MG Road, Kochi', customerPhone: '98765 43210',
  items: [{ description: 'Consulting services', hsnCode: '998311', quantity: 1, unitPrice: 10000, taxRate: 5, taxAmount: 500, total: 10500 }],
  subtotal: 10000, tax: 500, total: 10500, amountPaid: 0,
};

const defaultCompany = {
  companyName: '', address: '',
  phone: '', mobile: '', email: '', website: '',
  state: '', stateCode: '',
  gstNumber: '', pan: '', cin: '', bankDetails: '', financialYearStart: '04',
  baseCurrency: 'INR', sealSignatureImage: '', companyLogo: '',
};
const defaultQuotationSettings = {
  validity: '30 Days', gstNote: '', deliveryTime: '', deliveryMode: '',
  warranty: '', paymentTerms: '', computerConfiguration: '', training: '',
};
const defaultAccounting = {
  fiscalYear: 'april-march', accountingMethod: 'accrual', decimalPrecision: '2',
  defaultReceivable: 'Accounts Receivable', defaultPayable: 'Accounts Payable',
  defaultSales: 'Sales Revenue', defaultPurchase: 'Cost of Goods Sold',
};
const defaultNumbering = {
  invoicePrefix: 'INV-', invoiceNext: 46, billPrefix: 'BILL-', billNext: 24,
  journalPrefix: 'JV-', journalNext: 16,
};
const defaultTemplate = {
  invoicePrefix: 'INV-', footerText: 'Thank you for your business!',
  termsAndConditions: 'Payment is due within 30 days of the invoice date.',
  defaultPaymentTerms: 'Net 30', invoiceLogo: '', invoiceTheme: 'default',
};
const demoPaymentMethods = [];

const SECTION_TABS = {
  business: 'company',
  accounting: 'accounting',
  numbering: 'numbering',
  'invoice-template': 'invoice',
  'quotation-template': 'quotation',
  'payment-methods': 'payment',
};

function AccountingSettings() {
  // Each settings section is its own URL inside the Settings frame
  const section = useLocation().pathname.split('/')[2]; // /settings/<section>
  const { showSnackbar } = useSnackbar();
  const activeTab = SECTION_TABS[section] || 'company';
  const [company, setCompany] = useState(defaultCompany);
  const [accounting, setAccounting] = useState(defaultAccounting);
  const [numbering, setNumbering] = useState(defaultNumbering);
  const [quotationSettings, setQuotationSettings] = useState(defaultQuotationSettings);
  const [template, setTemplate] = useState(defaultTemplate);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [signatureError, setSignatureError] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [editingMethod, setEditingMethod] = useState(null);
  const [showMethodForm, setShowMethodForm] = useState(false);
  const [methodForm, setMethodForm] = useState({ name: '', type: 'bank', accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '', upiId: '', qrCode: '', notes: '', enabled: true });

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const [settingsRes, tplRes, methodsRes] = await Promise.allSettled([
          getAccountingSettings(),
          getInvoiceTemplateSettings(),
          getPaymentMethods(),
        ]);
        if (cancelled) return;
        if (settingsRes.status === 'fulfilled') {
          const raw = settingsRes.value.data?.data || settingsRes.value.data;
          if (raw) {
            if (raw.company) setCompany({ ...defaultCompany, ...raw.company });
            if (raw.accounting) setAccounting({ ...defaultAccounting, ...raw.accounting });
            if (raw.numbering) setNumbering({ ...defaultNumbering, ...raw.numbering });
            if (raw.quotation) setQuotationSettings({ ...defaultQuotationSettings, ...raw.quotation });
          }
        }
        if (tplRes.status === 'fulfilled') {
          const tplRaw = tplRes.value.data?.data || tplRes.value.data;
          if (tplRaw) setTemplate({ ...defaultTemplate, ...tplRaw });
        }
        if (methodsRes.status === 'fulfilled') {
          const mRaw = methodsRes.value.data?.data || methodsRes.value.data;
          const mList = mRaw?.methods || (Array.isArray(mRaw) ? mRaw : demoPaymentMethods);
          setMethods(Array.isArray(mList) ? mList : demoPaymentMethods);
        }
        else setMethods(demoPaymentMethods);
      } catch { if (!cancelled) setMethods(demoPaymentMethods); }
      finally { if (!cancelled) setLoading(false); }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === 'invoice') {
        await updateInvoiceTemplateSettings(template);
      } else {
        await updateAccountingSettings({ company, accounting, numbering, quotation: quotationSettings });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Could not save settings. Please try again.', 'error');
    }
    setSaving(false);
  };

  const handleSignatureUpload = async (file) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setSignatureError('Please upload a PNG or JPG image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSignatureError('Image must be under 2MB.');
      return;
    }
    setSignatureError('');
    setUploadingSignature(true);
    try {
      const res = await uploadCompanySignature(file);
      const path = res.data?.path;
      if (path) setCompany((c) => ({ ...c, sealSignatureImage: path }));
    } catch {
      setSignatureError('Upload failed. Please try again.');
    }
    setUploadingSignature(false);
  };

  const handleSignatureRemove = async () => {
    setUploadingSignature(true);
    try {
      await deleteCompanySignature();
      setCompany((c) => ({ ...c, sealSignatureImage: '' }));
    } catch {
      setSignatureError('Could not remove signature. Please try again.');
    }
    setUploadingSignature(false);
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setLogoError('Please upload a PNG or JPG image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Image must be under 2MB.');
      return;
    }
    setLogoError('');
    setUploadingLogo(true);
    try {
      const res = await uploadCompanyLogo(file);
      const path = res.data?.path;
      if (path) setCompany((c) => ({ ...c, companyLogo: path }));
    } catch {
      setLogoError('Upload failed. Please try again.');
    }
    setUploadingLogo(false);
  };

  const handleLogoRemove = async () => {
    setUploadingLogo(true);
    try {
      await deleteCompanyLogo();
      setCompany((c) => ({ ...c, companyLogo: '' }));
    } catch {
      setLogoError('Could not remove logo. Please try again.');
    }
    setUploadingLogo(false);
  };

  const handleSaveMethod = async (e) => {
    e.preventDefault();
    try {
      if (editingMethod) {
        const res = await updatePaymentMethod(editingMethod.id, methodForm);
        const updated = res.data || { ...methodForm, id: editingMethod.id };
        setMethods(methods.map(m => m.id === editingMethod.id ? updated : m));
      } else {
        const res = await createPaymentMethod(methodForm);
        const created = res.data || { ...methodForm, id: Date.now() };
        setMethods([...methods, created]);
      }
    } catch {
      if (editingMethod) setMethods(methods.map(m => m.id === editingMethod.id ? { ...methodForm, id: editingMethod.id } : m));
      else setMethods([...methods, { ...methodForm, id: Date.now() }]);
    }
    setShowMethodForm(false); setEditingMethod(null);
    setMethodForm({ name: '', type: 'bank', accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '', upiId: '', qrCode: '', notes: '', enabled: true });
  };

  const handleDeleteMethod = async (id) => {
    if (window.confirm('Delete this payment method?')) {
      try { await deletePaymentMethod(id); } catch { /* fallback */ }
      setMethods(methods.filter(m => m.id !== id));
    }
  };

  const handleEditMethod = (method) => {
    setEditingMethod(method);
    setMethodForm({ ...method });
    setShowMethodForm(true);
  };

  const toggleMethod = async (id) => {
    const method = methods.find(m => m.id === id);
    const updated = { ...method, enabled: !method.enabled };
    try { await updatePaymentMethod(id, updated); } catch { /* fallback */ }
    setMethods(methods.map(m => m.id === id ? updated : m));
  };

  const tabs = [
    { key: 'company', label: 'Business & Tax Details', icon: ICONS.building },
    { key: 'accounting', label: 'Accounting Preferences', icon: ICONS.chartOfAccounts },
    { key: 'numbering', label: 'Document Numbering', icon: ICONS.fileText },
    { key: 'invoice', label: 'Invoice Template', icon: ICONS.invoice },
    { key: 'quotation', label: 'Quotation Template', icon: ICONS.quotation },
    { key: 'payment', label: 'Payment Methods', icon: ICONS.creditCard },
  ];

  return (
    <Layout>
      <div className="accounting-page">
        <div className="accounting-header">
          <div className="header-left"><div className="header-icon">{ICONS.settings}</div><div><h1 className="page-title">{tabs.find((t) => t.key === activeTab)?.label}</h1><p className="page-subtitle">Changes apply to new documents and entries</p></div></div>
          <div className="header-actions">
            {activeTab === 'payment' ? (
              <button className="acc-btn acc-btn-primary" onClick={() => { setEditingMethod(null); setMethodForm({ name: '', type: 'bank', accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '', upiId: '', qrCode: '', notes: '', enabled: true }); setShowMethodForm(true); }}>
                + Add Payment Method
              </button>
            ) : (
              <button className="acc-btn acc-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : saved ? '✓ Saved!' : `Save ${activeTab === 'invoice' ? 'Template' : 'Settings'}`}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="acc-loading"><span className="spinner"></span> Loading settings...</div>
        ) : (
        <>
        {/* Company Settings */}
        {activeTab === 'company' && (
          <div className="acc-table-container" style={{padding:'24px'}}>
            <h3 style={{margin:'0 0 4px',fontSize:'16px',fontWeight:600}}>Company Information</h3>
            <p style={{margin:'0 0 20px',fontSize:'13px',color:'var(--neutral-500)'}}>
              This letterhead information appears on every printed and downloaded Quotation, Proforma Invoice, and Invoice.
            </p>

            <h4 className="acc-settings-subheading">Company Logo</h4>
            <p style={{margin:'-8px 0 12px',fontSize:'12px',color:'var(--neutral-500)'}}>
              Printed on every Quotation, Proforma Invoice, and Invoice.
            </p>
            <div style={{display:'flex',alignItems:'flex-start',gap:'16px',flexWrap:'wrap',marginBottom:'20px'}}>
              <div style={{width:'180px',height:'100px',border:'1px dashed var(--neutral-300)',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',background:'var(--neutral-50)'}}>
                {company.companyLogo ? (
                  <img src={`${API_ORIGIN}/storage/${company.companyLogo}`} alt="Company Logo" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}} />
                ) : (
                  <span style={{fontSize:'12px',color:'var(--neutral-400)'}}>No logo uploaded</span>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  id="logo-upload-input"
                  style={{display:'none'}}
                  onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                />
                <div style={{display:'flex',gap:'8px'}}>
                  <label htmlFor="logo-upload-input" className="acc-btn acc-btn-secondary" style={{cursor:'pointer'}}>
                    {uploadingLogo ? 'Uploading...' : company.companyLogo ? 'Replace Image' : 'Upload Image'}
                  </label>
                  {company.companyLogo && (
                    <button type="button" className="acc-btn acc-btn-secondary" onClick={handleLogoRemove} disabled={uploadingLogo}>Remove</button>
                  )}
                </div>
                <p style={{margin:'8px 0 0',fontSize:'12px',color:'var(--neutral-500)'}}>PNG or JPG, up to 2MB. A square or wide transparent PNG works best.</p>
                {logoError && <p style={{margin:'8px 0 0',fontSize:'12px',color:'var(--danger-600, #dc2626)'}}>{logoError}</p>}
              </div>
            </div>

            <h4 className="acc-settings-subheading">Identity</h4>
            <div className="acc-form-group"><label>Company Name</label><input type="text" value={company.companyName || ''} onChange={(e) => setCompany({...company, companyName: e.target.value})} placeholder="e.g., Malabar Coast Enterprises Pvt Ltd" /></div>
            <div className="acc-form-group"><label>Address</label><textarea value={company.address || ''} onChange={(e) => setCompany({...company, address: e.target.value})} placeholder="Full registered address" /></div>
            <div className="acc-form-row">
              <div className="acc-form-group"><label>State</label><input type="text" value={company.state || ''} onChange={(e) => setCompany({...company, state: e.target.value})} placeholder="e.g., Kerala" /></div>
              <div className="acc-form-group"><label>State Code</label><input type="text" value={company.stateCode || ''} onChange={(e) => setCompany({...company, stateCode: e.target.value})} placeholder="e.g., 32" /></div>
            </div>

            <h4 className="acc-settings-subheading">Contact</h4>
            <div className="acc-form-row">
              <div className="acc-form-group"><label>Phone</label><input type="text" value={company.phone || ''} onChange={(e) => setCompany({...company, phone: e.target.value})} placeholder="+91 22 1234 5678" /></div>
              <div className="acc-form-group"><label>Mobile</label><input type="text" value={company.mobile || ''} onChange={(e) => setCompany({...company, mobile: e.target.value})} placeholder="e.g., 093806 21607" /></div>
            </div>
            <div className="acc-form-row">
              <div className="acc-form-group"><label>Email</label><input type="email" value={company.email || ''} onChange={(e) => setCompany({...company, email: e.target.value})} placeholder="accounts@mybusiness.com" /></div>
              <div className="acc-form-group"><label>Website</label><input type="text" value={company.website || ''} onChange={(e) => setCompany({...company, website: e.target.value})} placeholder="www.mybusiness.com" /></div>
            </div>

            <h4 className="acc-settings-subheading">Tax &amp; Legal</h4>
            <div className="acc-form-row">
              <div className="acc-form-group"><label>GST Number</label><input type="text" value={company.gstNumber || ''} onChange={(e) => setCompany({...company, gstNumber: e.target.value})} placeholder="e.g., 32AAECM1234F1Z5" /></div>
              <div className="acc-form-group"><label>PAN</label><input type="text" value={company.pan || ''} onChange={(e) => setCompany({...company, pan: e.target.value})} placeholder="e.g., AAECM1234F" /></div>
            </div>
            <div className="acc-form-group"><label>CIN (Corporate Identity Number)</label><input type="text" value={company.cin || ''} onChange={(e) => setCompany({...company, cin: e.target.value})} placeholder="e.g., U33110TN2013PTC089630" /></div>

            <h4 className="acc-settings-subheading">Banking &amp; Fiscal Year</h4>
            <div className="acc-form-group"><label>Bank Details (shown on invoice/quotation PDFs)</label><textarea value={company.bankDetails || ''} onChange={(e) => setCompany({...company, bankDetails: e.target.value})} rows={3} placeholder={'Account No: 50200000257173 of HDFC Bank Ltd, Kottivakkam Branch\nMICR No: 600240020, RTGS/NEFT/IFSC: HDFC0000500'} /></div>
            <div className="acc-form-row">
              <div className="acc-form-group"><label>Financial Year Start Month</label>
                <select value={company.financialYearStart || '04'} onChange={(e) => setCompany({...company, financialYearStart: e.target.value})}>
                  <option value="01">January</option><option value="04">April</option><option value="07">July</option><option value="10">October</option>
                </select>
              </div>
              <div className="acc-form-group"><label>Base Currency</label>
                <select value={company.baseCurrency || 'INR'} onChange={(e) => setCompany({...company, baseCurrency: e.target.value})}>
                  <option value="INR">INR - Indian Rupee</option><option value="USD">USD - US Dollar</option>
                </select>
              </div>
            </div>

            <h4 className="acc-settings-subheading">Seal &amp; Signature</h4>
            <p style={{margin:'-8px 0 12px',fontSize:'12px',color:'var(--neutral-500)'}}>
              Uploaded here, this image replaces the blank signature line on every printed Quotation, Proforma Invoice, and Invoice.
            </p>
            <div style={{display:'flex',alignItems:'flex-start',gap:'16px',flexWrap:'wrap'}}>
              <div style={{width:'180px',height:'100px',border:'1px dashed var(--neutral-300)',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',background:'var(--neutral-50)'}}>
                {company.sealSignatureImage ? (
                  <img src={`${API_ORIGIN}/storage/${company.sealSignatureImage}`} alt="Seal & Signature" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}} />
                ) : (
                  <span style={{fontSize:'12px',color:'var(--neutral-400)'}}>No image uploaded</span>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  id="signature-upload-input"
                  style={{display:'none'}}
                  onChange={(e) => handleSignatureUpload(e.target.files?.[0])}
                />
                <div style={{display:'flex',gap:'8px'}}>
                  <label htmlFor="signature-upload-input" className="acc-btn acc-btn-secondary" style={{cursor:'pointer'}}>
                    {uploadingSignature ? 'Uploading...' : company.sealSignatureImage ? 'Replace Image' : 'Upload Image'}
                  </label>
                  {company.sealSignatureImage && (
                    <button type="button" className="acc-btn acc-btn-secondary" onClick={handleSignatureRemove} disabled={uploadingSignature}>Remove</button>
                  )}
                </div>
                <p style={{margin:'8px 0 0',fontSize:'12px',color:'var(--neutral-500)'}}>PNG or JPG, up to 2MB. A transparent PNG of your seal/stamp with signature works best.</p>
                {signatureError && <p style={{margin:'8px 0 0',fontSize:'12px',color:'var(--danger-600, #dc2626)'}}>{signatureError}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Accounting Settings */}
        {activeTab === 'accounting' && (
          <div className="acc-table-container" style={{padding:'24px'}}>
            <h3 style={{margin:'0 0 20px',fontSize:'16px',fontWeight:600}}>Accounting Preferences</h3>
            <div className="acc-form-row">
              <div className="acc-form-group"><label>Fiscal Year</label>
                <select value={accounting.fiscalYear || 'april-march'} onChange={(e) => setAccounting({...accounting, fiscalYear: e.target.value})}>
                  <option value="april-march">April - March</option><option value="january-december">January - December</option>
                </select>
              </div>
              <div className="acc-form-group"><label>Accounting Method</label>
                <select value={accounting.accountingMethod || 'accrual'} onChange={(e) => setAccounting({...accounting, accountingMethod: e.target.value})}>
                  <option value="accrual">Accrual</option><option value="cash">Cash</option>
                </select>
              </div>
            </div>
            <div className="acc-form-group" style={{maxWidth:'300px'}}><label>Decimal Precision</label>
              <select value={accounting.decimalPrecision || '2'} onChange={(e) => setAccounting({...accounting, decimalPrecision: e.target.value})}>
                <option value="0">0</option><option value="2">2</option><option value="3">3</option>
              </select>
            </div>
            <h4 style={{margin:'24px 0 16px',fontSize:'14px',fontWeight:500,color:'var(--neutral-500)',textTransform:'uppercase'}}>Default Accounts</h4>
            <div className="acc-form-row">
              <div className="acc-form-group"><label>Default Receivable</label><input type="text" value={accounting.defaultReceivable || ''} onChange={(e) => setAccounting({...accounting, defaultReceivable: e.target.value})} /></div>
              <div className="acc-form-group"><label>Default Payable</label><input type="text" value={accounting.defaultPayable || ''} onChange={(e) => setAccounting({...accounting, defaultPayable: e.target.value})} /></div>
            </div>
            <div className="acc-form-row">
              <div className="acc-form-group"><label>Default Sales Account</label><input type="text" value={accounting.defaultSales || ''} onChange={(e) => setAccounting({...accounting, defaultSales: e.target.value})} /></div>
              <div className="acc-form-group"><label>Default Purchase Account</label><input type="text" value={accounting.defaultPurchase || ''} onChange={(e) => setAccounting({...accounting, defaultPurchase: e.target.value})} /></div>
            </div>
          </div>
        )}

        {/* Numbering Settings */}
        {activeTab === 'numbering' && (
          <div className="acc-table-container" style={{padding:'24px'}}>
            <h3 style={{margin:'0 0 20px',fontSize:'16px',fontWeight:600}}>Auto-Numbering Configuration</h3>
            <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
              {[
                { label: 'Invoice', prefix: 'invoicePrefix', next: 'invoiceNext' },
                { label: 'Bill', prefix: 'billPrefix', next: 'billNext' },
                { label: 'Journal Entry', prefix: 'journalPrefix', next: 'journalNext' },
              ].map(item => (
                <div key={item.label} style={{padding:'16px',background:'var(--neutral-50)',borderRadius:'10px'}}>
                  <h4 style={{margin:'0 0 12px',fontSize:'14px',fontWeight:500}}>{item.label} Numbering</h4>
                  <div className="acc-form-row">
                    <div className="acc-form-group" style={{marginBottom:0}}>
                      <label>Prefix</label>
                      <input type="text" value={numbering[item.prefix]} onChange={(e) => setNumbering({...numbering, [item.prefix]: e.target.value})} />
                    </div>
                    <div className="acc-form-group" style={{marginBottom:0}}>
                      <label>Next Number</label>
                      <input type="number" value={numbering[item.next]} onChange={(e) => setNumbering({...numbering, [item.next]: Number(e.target.value)})} />
                    </div>
                  </div>
                  <p style={{fontSize:'12px',color:'var(--neutral-400)',margin:'8px 0 0'}}>
                    Preview: <strong style={{fontVariantNumeric:'tabular-nums'}}>{numbering[item.prefix]}{String(numbering[item.next]).padStart(4, '0')}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoice Template Settings */}
        {activeTab === 'invoice' && (
          <div className="acc-table-container" style={{padding:'24px'}}>
            <h3 style={{margin:'0 0 6px',fontSize:'16px',fontWeight:600}}>Print Layout</h3>
            <p style={{margin:'0 0 14px',fontSize:'13px',color:'var(--neutral-500)'}}>
              Used for every printed and saved-as-PDF invoice. Click Save Template to apply.
            </p>
            <div className="acc-template-picker" role="radiogroup" aria-label="Invoice print layout">
              {INVOICE_TEMPLATES.map((t) => {
                const selected = (template.invoiceTheme || 'default') === t.id
                  || (t.id === 'default' && !INVOICE_TEMPLATES.some((x) => x.id === template.invoiceTheme));
                return (
                  <label key={t.id} className={`acc-template-option ${selected ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="invoiceTheme"
                      value={t.id}
                      checked={selected}
                      onChange={() => setTemplate({ ...template, invoiceTheme: t.id })}
                    />
                    <span>
                      <strong>{t.label}</strong>
                      <small>{t.description}</small>
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="acc-template-preview" aria-label="Preview">
              <div className="acc-template-preview-page">
                <InvoicePrintView
                  invoice={PREVIEW_INVOICE}
                  company={company}
                  paymentMethods={methods}
                  template={template.invoiceTheme}
                />
              </div>
            </div>

            <h3 style={{margin:'24px 0 18px',fontSize:'16px',fontWeight:600}}>Defaults</h3>
            <div className="acc-form-row">
              <div className="acc-form-group"><label>Invoice Prefix</label><input type="text" value={template.invoicePrefix || ''} onChange={(e) => setTemplate({...template, invoicePrefix: e.target.value})} /></div>
              <div className="acc-form-group"><label>Default Payment Terms</label>
                <select value={template.defaultPaymentTerms || 'Net 30'} onChange={(e) => setTemplate({...template, defaultPaymentTerms: e.target.value})}>
                  <option>Net 15</option><option>Net 30</option><option>Net 45</option><option>Net 60</option><option>Due on Receipt</option>
                </select>
              </div>
            </div>
            <div className="acc-form-group"><label>Footer Text</label><input type="text" value={template.footerText || ''} onChange={(e) => setTemplate({...template, footerText: e.target.value})} /></div>
            <div className="acc-form-group"><label>Terms & Conditions</label><textarea value={template.termsAndConditions || ''} onChange={(e) => setTemplate({...template, termsAndConditions: e.target.value})} /></div>
            <div className="acc-form-row">
              <div className="acc-form-group"><label>Invoice Logo URL</label><input type="text" value={template.invoiceLogo || ''} onChange={(e) => setTemplate({...template, invoiceLogo: e.target.value})} placeholder="https://..." /></div>
            </div>
          </div>
        )}

        {/* Quotation Template Settings */}
        {activeTab === 'quotation' && (
          <div className="acc-table-container" style={{padding:'24px'}}>
            <h3 style={{margin:'0 0 6px',fontSize:'16px',fontWeight:600}}>Quotation Terms & Conditions</h3>
            <p style={{margin:'0 0 20px',fontSize:'13px',color:'var(--neutral-500)'}}>
              These appear on every printed/PDF quotation's Terms &amp; Conditions block. Leave a field blank to omit its row.
            </p>
            <div className="acc-form-row">
              <div className="acc-form-group"><label>Validity</label><input type="text" value={quotationSettings.validity || ''} onChange={(e) => setQuotationSettings({...quotationSettings, validity: e.target.value})} placeholder="e.g., 30 Days" /></div>
              <div className="acc-form-group"><label>GST Note</label><input type="text" value={quotationSettings.gstNote || ''} onChange={(e) => setQuotationSettings({...quotationSettings, gstNote: e.target.value})} placeholder="e.g., IGST @ 5% Included" /></div>
            </div>
            <div className="acc-form-row">
              <div className="acc-form-group"><label>Delivery Time</label><input type="text" value={quotationSettings.deliveryTime || ''} onChange={(e) => setQuotationSettings({...quotationSettings, deliveryTime: e.target.value})} placeholder="e.g., 2 to 3 Weeks" /></div>
              <div className="acc-form-group"><label>Delivery Mode</label><input type="text" value={quotationSettings.deliveryMode || ''} onChange={(e) => setQuotationSettings({...quotationSettings, deliveryMode: e.target.value})} placeholder="e.g., By Courier" /></div>
            </div>
            <div className="acc-form-row">
              <div className="acc-form-group"><label>Warranty</label><input type="text" value={quotationSettings.warranty || ''} onChange={(e) => setQuotationSettings({...quotationSettings, warranty: e.target.value})} placeholder="e.g., 3 months from the date of supply" /></div>
              <div className="acc-form-group"><label>Payment</label><input type="text" value={quotationSettings.paymentTerms || ''} onChange={(e) => setQuotationSettings({...quotationSettings, paymentTerms: e.target.value})} placeholder="e.g., 50% advance and balance against delivery" /></div>
            </div>
            <div className="acc-form-row">
              <div className="acc-form-group"><label>Computer Configuration</label><input type="text" value={quotationSettings.computerConfiguration || ''} onChange={(e) => setQuotationSettings({...quotationSettings, computerConfiguration: e.target.value})} placeholder="e.g., Not Applicable" /></div>
              <div className="acc-form-group"><label>Training</label><input type="text" value={quotationSettings.training || ''} onChange={(e) => setQuotationSettings({...quotationSettings, training: e.target.value})} placeholder="e.g., Adequate training will be provided at the time of installation" /></div>
            </div>
            <p style={{margin:'8px 0 0',fontSize:'12px',color:'var(--neutral-400)'}}>
              Bank Details shown alongside these terms come from the Company tab.
            </p>
          </div>
        )}

        {/* Payment Methods */}
        {activeTab === 'payment' && (
          <>
            {showMethodForm && (
              <div className="acc-table-container" style={{padding:'24px',marginBottom:'20px',borderColor:'var(--primary-400)'}}>
                <h3 style={{margin:'0 0 16px',fontSize:'15px',fontWeight:600}}>{editingMethod ? 'Edit' : 'Add'} Payment Method</h3>
                <form onSubmit={handleSaveMethod}>
                  <div className="acc-form-row">
                    <div className="acc-form-group"><label>Method Name *</label><input type="text" value={methodForm.name} onChange={(e) => setMethodForm({...methodForm, name: e.target.value})} required placeholder="e.g., Bank Transfer" /></div>
                    <div className="acc-form-group"><label>Type *</label>
                      <select value={methodForm.type} onChange={(e) => setMethodForm({...methodForm, type: e.target.value})}>
                        <option value="bank">Bank Transfer</option><option value="upi">UPI</option><option value="cash">Cash</option><option value="card">Credit Card</option><option value="gateway">Payment Gateway</option>
                      </select>
                    </div>
                  </div>
                  {(methodForm.type === 'bank') && (
                    <>
                      <div className="acc-form-row">
                        <div className="acc-form-group"><label>Account Holder Name</label><input type="text" value={methodForm.accountHolderName} onChange={(e) => setMethodForm({...methodForm, accountHolderName: e.target.value})} /></div>
                        <div className="acc-form-group"><label>Bank Name</label><input type="text" value={methodForm.bankName} onChange={(e) => setMethodForm({...methodForm, bankName: e.target.value})} /></div>
                      </div>
                      <div className="acc-form-row">
                        <div className="acc-form-group"><label>Account Number</label><input type="text" value={methodForm.accountNumber} onChange={(e) => setMethodForm({...methodForm, accountNumber: e.target.value})} /></div>
                        <div className="acc-form-group"><label>IFSC Code</label><input type="text" value={methodForm.ifscCode} onChange={(e) => setMethodForm({...methodForm, ifscCode: e.target.value})} /></div>
                      </div>
                    </>
                  )}
                  {(methodForm.type === 'upi') && (
                    <div className="acc-form-row">
                      <div className="acc-form-group"><label>UPI ID</label><input type="text" value={methodForm.upiId} onChange={(e) => setMethodForm({...methodForm, upiId: e.target.value})} placeholder="abc@upi" /></div>
                      <div className="acc-form-group"><label>QR Code URL</label><input type="text" value={methodForm.qrCode} onChange={(e) => setMethodForm({...methodForm, qrCode: e.target.value})} placeholder="https://..." /></div>
                    </div>
                  )}
                  <div className="acc-form-group"><label>Notes / Instructions</label><input type="text" value={methodForm.notes} onChange={(e) => setMethodForm({...methodForm, notes: e.target.value})} /></div>
                  <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
                    <button type="button" className="acc-btn acc-btn-secondary" onClick={() => { setShowMethodForm(false); setEditingMethod(null); }}>Cancel</button>
                    <button type="submit" className="acc-btn acc-btn-primary">{editingMethod ? 'Update' : 'Add'} Method</button>
                  </div>
                </form>
              </div>
            )}

            <div className="acc-table-container">
              <table className="acc-table">
                <thead><tr><th>Method</th><th>Type</th><th>Details</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {methods.map(m => (
                    <tr key={m.id}>
                      <td style={{fontWeight:500}}>{m.name}</td>
                      <td><span className="acc-type-badge" style={{background:'var(--neutral-100)',color:'var(--neutral-700)'}}>{m.type.toUpperCase()}</span></td>
                      <td style={{fontSize:'12px',color:'var(--neutral-500)'}}>
                        {m.type === 'bank' && `${m.bankName} • ${m.accountNumber}`}
                        {m.type === 'upi' && m.upiId}
                        {m.type === 'cash' && 'Cash payment'}
                        {m.type === 'card' && 'Credit/Debit card'}
                        {m.type === 'gateway' && 'Online gateway'}
                      </td>
                      <td>
                        <button className={`acc-status-badge ${m.enabled ? 'active' : 'draft'}`} onClick={() => toggleMethod(m.id)} style={{cursor:'pointer',border:'none'}}>
                          {m.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>
                      <td>
                        <div style={{display:'flex',gap:'6px'}}>
                          <button className="acc-btn acc-btn-secondary" style={{padding:'4px 10px',fontSize:'12px'}} onClick={() => handleEditMethod(m)}>Edit</button>
                          <button className="acc-btn acc-btn-danger" style={{padding:'4px 10px',fontSize:'12px'}} onClick={() => handleDeleteMethod(m.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {methods.length === 0 && <tr><td colSpan="5" style={{textAlign:'center',padding:'40px',color:'var(--neutral-400)'}}>No payment methods configured</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
        </>
        )}

      </div>
    </Layout>
  );
}

export default AccountingSettings;

