// Accounting API utility - All accounting-related API endpoints
// Every function here is ready to call the backend when it's available.
// Pages fall back to demo data if the API returns an error.
import api from './api';

// ============ Products (catalog for invoice/bill/quotation line-item picker) ============
export const getProducts = (params) => api.get('/accounting/products', { params });
export const getProduct = (id) => api.get(`/accounting/products/${id}`);
export const getProductCategories = () => api.get('/accounting/products/categories');
export const createProduct = (data) => api.post('/accounting/products', data);
export const updateProduct = (id, data) => api.put(`/accounting/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/accounting/products/${id}`);

// ============ Chart of Accounts ============
export const getAccounts = (params) => api.get('/accounting/accounts', { params });
export const getAccount = (id) => api.get(`/accounting/accounts/${id}`);
export const createAccount = (data) => api.post('/accounting/accounts', data);
export const updateAccount = (id, data) => api.put(`/accounting/accounts/${id}`, data);
export const deleteAccount = (id) => api.delete(`/accounting/accounts/${id}`);
export const getAccountLedger = (id, params) => api.get(`/accounting/accounts/${id}/ledger`, { params });

// ============ Accounting Customers ============
export const getAccountingCustomers = (params) => api.get('/accounting/customers', { params });
export const getAccountingCustomer = (id) => api.get(`/accounting/customers/${id}`);
export const createAccountingCustomer = (data) => api.post('/accounting/customers', data);
export const updateAccountingCustomer = (id, data) => api.put(`/accounting/customers/${id}`, data);
export const deleteAccountingCustomer = (id) => api.delete(`/accounting/customers/${id}`);
export const getCustomerLedger = (id, params) => api.get(`/accounting/customers/${id}/ledger`, { params });
export const getCustomerInvoices = (id, params) => api.get(`/accounting/customers/${id}/invoices`, { params });
export const getCustomerStatement = (id, params) => api.get(`/accounting/customers/${id}/statement`, { params });

// ============ Vendors ============
export const getVendors = (params) => api.get('/accounting/vendors', { params });
export const getVendor = (id) => api.get(`/accounting/vendors/${id}`);
export const createVendor = (data) => api.post('/accounting/vendors', data);
export const updateVendor = (id, data) => api.put(`/accounting/vendors/${id}`, data);
export const deleteVendor = (id) => api.delete(`/accounting/vendors/${id}`);
export const getVendorLedger = (id, params) => api.get(`/accounting/vendors/${id}/ledger`, { params });
export const getVendorBills = (id, params) => api.get(`/accounting/vendors/${id}/bills`, { params });
export const getVendorStatement = (id, params) => api.get(`/accounting/vendors/${id}/statement`, { params });

// ============ Invoices (Sales) ============
export const getInvoices = (params) => api.get('/accounting/invoices', { params });
export const getInvoice = (id) => api.get(`/accounting/invoices/${id}`);
export const createInvoice = (data) => api.post('/accounting/invoices', data);
export const updateInvoice = (id, data) => api.put(`/accounting/invoices/${id}`, data);
export const deleteInvoice = (id) => api.delete(`/accounting/invoices/${id}`);
export const updateInvoiceStatus = (id, status) => api.patch(`/accounting/invoices/${id}/status`, { status });
export const recordInvoicePayment = (id, data) => api.post(`/accounting/invoices/${id}/payments`, data);
export const getInvoicePayments = (id) => api.get(`/accounting/invoices/${id}/payments`);
// Void a payment entered by mistake (reverses its ledger entry)
export const voidInvoicePayment = (id, paymentId) => api.delete(`/accounting/invoices/${id}/payments/${paymentId}`);
export const createInvoiceCreditNote = (id, data) => api.post(`/accounting/invoices/${id}/credit-notes`, data);
export const voidCreditNote = (id, creditNoteId) => api.delete(`/accounting/invoices/${id}/credit-notes/${creditNoteId}`);
export const sendInvoiceEmail = (id) => api.post(`/accounting/invoices/${id}/send`);
export const downloadInvoicePdf = (id) => api.get(`/accounting/invoices/${id}/pdf`, { responseType: 'blob' });
export const createCreditNote = (data) => api.post('/accounting/credit-notes', data);
export const getCreditNotes = (params) => api.get('/accounting/credit-notes', { params });

// ============ Bills (Purchases) ============
export const getBills = (params) => api.get('/accounting/bills', { params });
export const getBill = (id) => api.get(`/accounting/bills/${id}`);
export const createBill = (data) => api.post('/accounting/bills', data);
export const updateBill = (id, data) => api.put(`/accounting/bills/${id}`, data);
export const deleteBill = (id) => api.delete(`/accounting/bills/${id}`);
export const updateBillStatus = (id, status) => api.patch(`/accounting/bills/${id}/status`, { status });
export const recordBillPayment = (id, data) => api.post(`/accounting/bills/${id}/payments`, data);
export const getBillPayments = (id) => api.get(`/accounting/bills/${id}/payments`);
export const createDebitNote = (data) => api.post('/accounting/debit-notes', data);
export const getDebitNotes = (params) => api.get('/accounting/debit-notes', { params });

// ============ Income ============
export const getIncomes = (params) => api.get('/accounting/income', { params });
export const getIncome = (id) => api.get(`/accounting/income/${id}`);
export const createIncome = (data) => api.post('/accounting/income', data);
export const updateIncome = (id, data) => api.put(`/accounting/income/${id}`, data);
export const deleteIncome = (id) => api.delete(`/accounting/income/${id}`);
export const getIncomeCategories = () => api.get('/accounting/income/categories');

// ============ Expenses ============
export const getExpenses = (params) => api.get('/accounting/expenses', { params });
export const getExpense = (id) => api.get(`/accounting/expenses/${id}`);
export const createExpense = (data) => api.post('/accounting/expenses', data);
export const updateExpense = (id, data) => api.put(`/accounting/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/accounting/expenses/${id}`);
export const getExpenseCategories = () => api.get('/accounting/expenses/categories');

// ============ Income & Expense Dashboard ============
export const getIncomeExpenseSummary = (params) => api.get('/accounting/income-expenses/summary', { params });

// ============ Banking ============
export const getBankAccounts = (params) => api.get('/accounting/bank-accounts', { params });
export const getBankAccount = (id) => api.get(`/accounting/bank-accounts/${id}`);
export const createBankAccount = (data) => api.post('/accounting/bank-accounts', data);
export const updateBankAccount = (id, data) => api.put(`/accounting/bank-accounts/${id}`, data);
export const deleteBankAccount = (id) => api.delete(`/accounting/bank-accounts/${id}`);
export const getBankTransactions = (id, params) => api.get(`/accounting/bank-accounts/${id}/transactions`, { params });
export const createBankTransaction = (id, data) => api.post(`/accounting/bank-accounts/${id}/transactions`, data);
export const updateBankTransaction = (bankId, txnId, data) => api.put(`/accounting/bank-accounts/${bankId}/transactions/${txnId}`, data);
export const deleteBankTransaction = (bankId, txnId) => api.delete(`/accounting/bank-accounts/${bankId}/transactions/${txnId}`);
export const reconcileBank = (id, data) => api.post(`/accounting/bank-accounts/${id}/reconcile`, data);
export const getBankReconciliation = (id, params) => api.get(`/accounting/bank-accounts/${id}/reconciliation`, { params });

// ============ Journal Entries ============
export const getJournalEntries = (params) => api.get('/accounting/journal-entries', { params });
export const getJournalEntry = (id) => api.get(`/accounting/journal-entries/${id}`);
export const createJournalEntry = (data) => api.post('/accounting/journal-entries', data);
export const updateJournalEntry = (id, data) => api.put(`/accounting/journal-entries/${id}`, data);
export const deleteJournalEntry = (id) => api.delete(`/accounting/journal-entries/${id}`);
export const postJournalEntry = (id) => api.patch(`/accounting/journal-entries/${id}/post`);
export const reverseJournalEntry = (id) => api.post(`/accounting/journal-entries/${id}/reverse`);

// ============ Taxes ============
export const getTaxes = (params) => api.get('/accounting/taxes', { params });
export const getTax = (id) => api.get(`/accounting/taxes/${id}`);
export const createTax = (data) => api.post('/accounting/taxes', data);
export const updateTax = (id, data) => api.put(`/accounting/taxes/${id}`, data);
export const deleteTax = (id) => api.delete(`/accounting/taxes/${id}`);

// ============ Currencies ============
export const getCurrencies = (params) => api.get('/accounting/currencies', { params });
export const getCurrency = (id) => api.get(`/accounting/currencies/${id}`);
export const createCurrency = (data) => api.post('/accounting/currencies', data);
export const updateCurrency = (id, data) => api.put(`/accounting/currencies/${id}`, data);
export const deleteCurrency = (id) => api.delete(`/accounting/currencies/${id}`);
export const refreshExchangeRates = () => api.post('/accounting/currencies/refresh-rates');

// ============ Dashboard ============
export const getAccountingDashboard = (params) => api.get('/accounting/dashboard', { params });
export const getDashboardOverview = (params) => api.get('/accounting/dashboard/overview', { params });
export const getDashboardCharts = (params) => api.get('/accounting/dashboard/charts', { params });
export const getRecentTransactions = (params) => api.get('/accounting/dashboard/recent-transactions', { params });

// ============ Reports ============
export const getReport = (type, params) => api.get(`/accounting/reports/${type}`, { params });
export const exportReport = (type, format, params) => api.get(`/accounting/reports/${type}/export`, { params: { ...params, format }, responseType: 'blob' });

// ============ Settings ============
export const getAccountingSettings = () => api.get('/accounting/settings');
export const updateAccountingSettings = (data) => api.put('/accounting/settings', data);
export const uploadCompanySignature = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  // Let the browser set the multipart Content-Type (with boundary) itself.
  return api.post('/accounting/settings/signature', formData, {
    headers: { 'Content-Type': undefined },
  });
};
export const deleteCompanySignature = () => api.delete('/accounting/settings/signature');
export const uploadCompanyLogo = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  // Let the browser set the multipart Content-Type (with boundary) itself.
  return api.post('/accounting/settings/logo', formData, {
    headers: { 'Content-Type': undefined },
  });
};
export const deleteCompanyLogo = () => api.delete('/accounting/settings/logo');

// ============ Recurring Transactions ============
export const getRecurringTransactions = (params) => api.get('/accounting/recurring', { params });
export const getRecurringTransaction = (id) => api.get(`/accounting/recurring/${id}`);
export const createRecurringTransaction = (data) => api.post('/accounting/recurring', data);
export const updateRecurringTransaction = (id, data) => api.put(`/accounting/recurring/${id}`, data);
export const deleteRecurringTransaction = (id) => api.delete(`/accounting/recurring/${id}`);
export const pauseRecurringTransaction = (id) => api.patch(`/accounting/recurring/${id}/pause`);
export const resumeRecurringTransaction = (id) => api.patch(`/accounting/recurring/${id}/resume`);

// ============ Financial Year (SRS 25) ============
export const getFinancialYears = () => api.get('/accounting/financial-years');
export const getFinancialYear = (id) => api.get(`/accounting/financial-years/${id}`);
export const openFinancialYear = (data) => api.post('/accounting/financial-years', data);
export const updateFinancialYear = (id, data) => api.put(`/accounting/financial-years/${id}`, data);
export const closeFinancialYear = (id) => api.post(`/accounting/financial-years/${id}/close`);
export const setDefaultFinancialYear = (id) => api.patch(`/accounting/financial-years/${id}/set-default`);
export const getFinancialYearBalances = (id) => api.get(`/accounting/financial-years/${id}/balances`);

// ============ Audit Trail ============
export const getAuditLogs = (params) => api.get('/accounting/audit-logs', { params });

// ============ Bulk Operations ============
export const bulkDeleteAccounts = (ids) => api.post('/accounting/accounts/bulk-delete', { ids });
export const bulkUpdateInvoiceStatus = (ids, status) => api.post('/accounting/invoices/bulk-status', { ids, status });
export const importAccounts = (data) => api.post('/accounting/accounts/import', data);
export const exportAccounts = (format) => api.get('/accounting/accounts/export', { params: { format }, responseType: 'blob' });

// ============ Invoice Template Settings (SRS 23.6) ============
export const getInvoiceTemplateSettings = () => api.get('/accounting/invoice-settings');
export const updateInvoiceTemplateSettings = (data) => api.put('/accounting/invoice-settings', data);

// ============ Payment Methods (SRS 23.6) ============
export const getPaymentMethods = () => api.get('/accounting/payment-methods');
export const getPaymentMethod = (id) => api.get(`/accounting/payment-methods/${id}`);
export const createPaymentMethod = (data) => api.post('/accounting/payment-methods', data);
export const updatePaymentMethod = (id, data) => api.put(`/accounting/payment-methods/${id}`, data);
export const deletePaymentMethod = (id) => api.delete(`/accounting/payment-methods/${id}`);

// ============ Quotations (SRS 26) ============
export const getQuotations = (params) => api.get('/accounting/quotations', { params });
export const getQuotation = (id) => api.get(`/accounting/quotations/${id}`);
export const createQuotation = (data) => api.post('/accounting/quotations', data);
export const updateQuotation = (id, data) => api.put(`/accounting/quotations/${id}`, data);
export const deleteQuotation = (id) => api.delete(`/accounting/quotations/${id}`);
export const updateQuotationStatus = (id, status) => api.patch(`/accounting/quotations/${id}/status`, { status });
export const duplicateQuotation = (id) => api.post(`/accounting/quotations/${id}/duplicate`);
export const convertQuotationToInvoice = (id) => api.post(`/accounting/quotations/${id}/convert-to-invoice`);
export const convertQuotationToProforma = (id) => api.post(`/accounting/quotations/${id}/convert-to-proforma`);
export const sendQuotationEmail = (id) => api.post(`/accounting/quotations/${id}/send`);
export const downloadQuotationPdf = (id) => api.get(`/accounting/quotations/${id}/pdf`, { responseType: 'blob' });

// ============ Proforma Invoices ============
export const getProformaInvoices = (params) => api.get('/accounting/proforma-invoices', { params });
export const getProformaInvoice = (id) => api.get(`/accounting/proforma-invoices/${id}`);
export const createProformaInvoice = (data) => api.post('/accounting/proforma-invoices', data);
export const updateProformaInvoice = (id, data) => api.put(`/accounting/proforma-invoices/${id}`, data);
export const deleteProformaInvoice = (id) => api.delete(`/accounting/proforma-invoices/${id}`);
export const updateProformaInvoiceStatus = (id, status) => api.patch(`/accounting/proforma-invoices/${id}/status`, { status });
export const duplicateProformaInvoice = (id) => api.post(`/accounting/proforma-invoices/${id}/duplicate`);
export const convertProformaToInvoice = (id) => api.post(`/accounting/proforma-invoices/${id}/convert-to-invoice`);
export const sendProformaInvoiceEmail = (id) => api.post(`/accounting/proforma-invoices/${id}/send`);
export const downloadProformaInvoicePdf = (id) => api.get(`/accounting/proforma-invoices/${id}/pdf`, { responseType: 'blob' });

// ============ Branches / Multi-Location (SRS 23.13) ============
export const getBranches = (params) => api.get('/accounting/branches', { params });
export const getBranch = (id) => api.get(`/accounting/branches/${id}`);
export const createBranch = (data) => api.post('/accounting/branches', data);
export const updateBranch = (id, data) => api.put(`/accounting/branches/${id}`, data);
export const deleteBranch = (id) => api.delete(`/accounting/branches/${id}`);
export const getBranchReport = (id, type, params) => api.get(`/accounting/branches/${id}/reports/${type}`, { params });

// ============ Product images & stock ============
const multipart = { headers: { 'Content-Type': undefined } };
export const uploadProductImage = (id, file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post(`/accounting/products/${id}/image`, formData, multipart);
};
export const deleteProductImage = (id) => api.delete(`/accounting/products/${id}/image`);
export const getStockMovements = (id) => api.get(`/accounting/products/${id}/stock-movements`);
// type: 'in' | 'out' | 'set'
export const adjustStock = (id, data) => api.post(`/accounting/products/${id}/stock`, data);

// ============ Quotation letterhead artwork (slot: 'header' | 'footer') ============
export const uploadQuotationImage = (slot, file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post(`/accounting/settings/quotation-image/${slot}`, formData, multipart);
};
export const deleteQuotationImage = (slot) => api.delete(`/accounting/settings/quotation-image/${slot}`);
