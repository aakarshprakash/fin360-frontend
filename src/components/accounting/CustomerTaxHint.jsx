// Under the customer box on a quotation / proforma / invoice: says whether GST will
// print as IGST or CGST + SGST, which depends on the customer's state or GSTIN.
import { stateFromGstin } from './invoiceFormat';
import '../../styles/DocumentTotals.css';

function CustomerTaxHint({ customer }) {
  if (!customer) return null;
  const state = customer.state || stateFromGstin(customer.gstNumber);

  if (state) {
    return <span className="cth is-ok">State: {state}. GST prints as IGST or CGST + SGST by comparing with your state.</span>;
  }
  return (
    <span className="cth is-warn" role="status">
      This customer has no state or GSTIN, so GST will print as plain &ldquo;GST&rdquo;. Add either on the customer to print IGST or CGST + SGST.
    </span>
  );
}

export default CustomerTaxHint;
