import { getApprovalsQueue } from '@/app/actions/approvals';
import ApprovalsClient from './approvals-client';

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
  const response = await getApprovalsQueue();
  const requests = response?.data || [];

  return <ApprovalsClient requests={requests as any} />;
}
