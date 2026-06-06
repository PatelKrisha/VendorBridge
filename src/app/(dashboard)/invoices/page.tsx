import { getInvoices } from '@/app/actions/invoices';
import { getPurchaseOrders } from '@/app/actions/purchase-orders';
import { getCurrentUser } from '@/lib/auth-context';
import InvoicesClient from './invoices-client';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const user = await getCurrentUser();
  const userRole = user?.role || 'OFFICER';

  const [invoicesResponse, posResponse] = await Promise.all([
    getInvoices(),
    getPurchaseOrders(),
  ]);

  const initialInvoices = invoicesResponse?.data || [];
  
  // Filter POs that can be invoiced (ISSUED or ACKNOWLEDGED)
  const purchaseOrdersList = (posResponse?.data || []).filter(
    (po) => po.status === 'ISSUED' || po.status === 'ACKNOWLEDGED'
  );

  return (
    <InvoicesClient
      initialInvoices={initialInvoices as any}
      purchaseOrders={purchaseOrdersList as any}
      userRole={userRole}
    />
  );
}
