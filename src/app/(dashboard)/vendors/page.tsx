import { getVendors } from '@/app/actions/vendors';
import VendorsClient from './vendors-client';

export const dynamic = 'force-dynamic';

export default async function VendorsPage() {
  const vendorsResponse = await getVendors();
  const initialVendors = vendorsResponse?.data || [];

  return <VendorsClient initialVendors={initialVendors} />;
}
