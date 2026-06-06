import { getRfqs } from '@/app/actions/rfqs';
import { getVendors } from '@/app/actions/vendors';
import { getCurrentUser } from '@/lib/auth-context';
import RfqsClient from './rfqs-client';

export const dynamic = 'force-dynamic';

export default async function RfqsPage() {
  const user = await getCurrentUser();
  const userRole = user?.role || 'OFFICER';

  const [rfqsResponse, vendorsResponse] = await Promise.all([
    getRfqs(),
    getVendors(),
  ]);

  const initialRfqs = rfqsResponse?.data || [];
  const vendors = vendorsResponse?.data || [];

  return (
    <RfqsClient
      initialRfqs={initialRfqs as any}
      vendors={vendors as any}
      userRole={userRole}
    />
  );
}
