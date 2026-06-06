import { getPaymentRecords } from '@/app/actions/payments';
import { getInvoices } from '@/app/actions/invoices';
import PaymentLedgerClient from './payment-ledger-client';

export const dynamic = 'force-dynamic';

export default async function PaymentLedgerPage() {
  const [recordsResponse, invoicesResponse] = await Promise.all([
    getPaymentRecords(),
    getInvoices(),
  ]);

  const records = recordsResponse?.data || [];
  
  // Filter invoices that are not paid yet
  const unpaidInvoices = (invoicesResponse?.data || []).filter(
    (inv) => inv.status !== 'PAID'
  );

  return (
    <PaymentLedgerClient
      records={records as any}
      unpaidInvoices={unpaidInvoices as any}
    />
  );
}
