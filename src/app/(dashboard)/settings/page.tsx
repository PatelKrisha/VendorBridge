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
  let userData = {
    id: authUser.userId,
    name: 'User',
    email: authUser.email,
    role: authUser.role,
    orgId: authUser.orgId,
  };

  try {
    // Check if authUser.userId is a valid UUID before querying to avoid DB cast errors
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authUser.userId);
    if (isUuid) {
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

      if (dbUser) {
        userData = dbUser;
      }
    }
  } catch (error) {
    console.warn('Database query failed in settings page, falling back to session payload:', error);
  }

  // Ensure name is populated with mock data if fallback occurs
  if (userData.name === 'User') {
    const mockNames: Record<string, string> = {
      'admin@acme.com': 'Aishwarya Nair',
      'officer@acme.com': 'Ritu Sharma',
      'approver@acme.com': 'Priya Mehta',
      'finance@acme.com': 'Vikram Joshi',
      'vendor@supernova.com': 'Mohammed Farhan',
    };
    userData.name = mockNames[userData.email] || userData.email.split('@')[0];
  }

  return <SettingsClient currentUser={userData as any} />;
}
