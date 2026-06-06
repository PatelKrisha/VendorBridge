import { getApprovalsQueue } from '@/app/actions/approvals';
import ApprovalsClient from './approvals-client';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
  const response = await getApprovalsQueue();
  const requests = response?.data || [];

  // Parse decisions from cookies to override database results if needed (for persistence)
  const cookieStore = await cookies();
  const decisionsCookie = cookieStore.get('vendorbridge_decisions')?.value || '{}';
  let localDecisions: Record<string, 'APPROVED' | 'REJECTED'> = {};
  try {
    localDecisions = JSON.parse(decisionsCookie);
  } catch {}

  const mergedRequests = requests.map((req: any) => {
    if (localDecisions[req.id]) {
      return { ...req, status: localDecisions[req.id] };
    }
    return req;
  });

  return <ApprovalsClient requests={mergedRequests as any} />;
}
