import { getPurchaseOrders } from '@/app/actions/purchase-orders';
import { getCurrentUser } from '@/lib/auth-context';
import PurchaseOrdersClient from './purchase-orders-client';

export const dynamic = 'force-dynamic';

export default async function PurchaseOrdersPage() {
  const user = await getCurrentUser();
  const userRole = user?.role || 'OFFICER';

  const response = await getPurchaseOrders();
  const orders = response?.data || [];

  return (
    <PurchaseOrdersClient
      orders={orders as any}
      userRole={userRole}
    />
  );
}
