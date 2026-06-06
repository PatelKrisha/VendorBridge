import { getActivityLogs } from '@/app/actions/activity-logs';
import ActivityLogsClient from './activity-logs-client';

export const dynamic = 'force-dynamic';

export default async function ActivityLogsPage() {
  const response = await getActivityLogs();
  const logs = response?.data || [];

  return <ActivityLogsClient logs={logs as any} />;
}
