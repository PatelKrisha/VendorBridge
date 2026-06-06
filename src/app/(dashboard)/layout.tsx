import { headers } from 'next/headers';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const userRole = (headersList.get('x-user-role') || 'ADMIN') as 'ADMIN' | 'OFFICER' | 'APPROVER' | 'FINANCE' | 'VENDOR';
  const userEmail = headersList.get('x-user-email') || 'admin@acme.com';

  let userName = 'Aishwarya Nair'; // Default fallback

  if (userId) {
    try {
      const userList = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (userList[0]) {
        userName = userList[0].name;
      }
    } catch (error) {
      console.warn('Database query failed in layout, using fallback user details:', error);
      const mockNames: Record<string, string> = {
        'admin@acme.com': 'Aishwarya Nair',
        'officer@acme.com': 'Ritu Sharma',
        'approver@acme.com': 'Priya Mehta',
        'finance@acme.com': 'Vikram Joshi',
        'vendor@supernova.com': 'Mohammed Farhan',
      };
      userName = mockNames[userEmail] || 'Aishwarya Nair';
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar - fixed left */}
      <Sidebar role={userRole} userName={userName} />

      {/* Main Content Wrapper - shifted right */}
      <div className="flex flex-col md:pl-64 min-h-screen transition-all duration-300">
        {/* Header - sticky top */}
        <Header userName={userName} userEmail={userEmail} role={userRole} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
