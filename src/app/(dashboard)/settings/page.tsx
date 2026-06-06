import { getCurrentUser } from '@/lib/auth-context';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import SettingsClient from './settings-client';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return (
      <div className="p-8 text-center text-rose-500 font-semibold">
        Unauthorized. Please log in.
      </div>
    );
  }

  // Fetch real details from DB
  const [dbUser] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      orgId: users.orgId,
    })
    .from(users)
    .where(eq(users.id, authUser.userId))
    .limit(1);

  const userData = dbUser || {
    id: authUser.userId,
    name: 'User',
    email: authUser.email,
    role: authUser.role,
    orgId: authUser.orgId,
  };

  return <SettingsClient currentUser={userData as any} />;
}
