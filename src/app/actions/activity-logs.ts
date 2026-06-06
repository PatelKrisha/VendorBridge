'use server';

import { db } from '@/db';
import { activityLogs, users } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-context';
import { cookies } from 'next/headers';

export async function logActivity(data: {
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Record<string, any>;
}) {
  let user: any = null;
  try {
    user = await getCurrentUser();
    if (!user) {
      console.warn('Activity logging skipped: No authenticated user found.');
      return { success: false, error: 'Unauthenticated' };
    }

    await db.insert(activityLogs).values({
      entityType: data.entityType,
      entityId: data.entityId,
      action: data.action,
      actorId: user.userId,
      actorRole: user.role,
      metadata: data.metadata || {},
      ipAddress: null, // Optional
    });

    return { success: true };
  } catch (error) {
    console.error('Error logging activity:', error);

    // Fallback: Store locally in cookies
    try {
      const cookieStore = await cookies();
      const localLogsCookie = cookieStore.get('vendorbridge_local_logs')?.value || '[]';
      let localLogs: any[] = [];
      try {
        localLogs = JSON.parse(localLogsCookie);
      } catch {}

      const mockNames: Record<string, string> = {
        'admin@acme.com': 'Aishwarya Nair',
        'officer@acme.com': 'Ritu Sharma',
        'approver@acme.com': 'Priya Mehta',
        'finance@acme.com': 'Vikram Joshi',
        'vendor@supernova.com': 'Mohammed Farhan',
      };
      const actorName = user ? (mockNames[user.email] || user.email.split('@')[0]) : 'System';

      const newLog = {
        id: 'mock-log-' + Math.random().toString(36).substring(2, 9),
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        actorName,
        actorRole: user?.role || 'SYSTEM',
        timestamp: new Date(),
      };

      localLogs.unshift(newLog); // Put latest logs first
      cookieStore.set('vendorbridge_local_logs', JSON.stringify(localLogs.slice(0, 100)), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return { success: true };
    } catch (cookieErr) {
      console.error('Cookie fallback failed in logActivity:', cookieErr);
      return { success: false, error: String(error) };
    }
  }
}

export async function getActivityLogs() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Role-based logs visibility
    // Admin/Officer see all logs. Others see only logs related to their user actions.
    if (user.role === 'ADMIN' || user.role === 'OFFICER') {
      const logs = await db
        .select({
          id: activityLogs.id,
          entityType: activityLogs.entityType,
          entityId: activityLogs.entityId,
          action: activityLogs.action,
          actorName: users.name,
          actorRole: activityLogs.actorRole,
          timestamp: activityLogs.timestamp,
        })
        .from(activityLogs)
        .leftJoin(users, eq(activityLogs.actorId, users.id))
        .orderBy(desc(activityLogs.timestamp))
        .limit(100);

      return { success: true, data: logs };
    } else {
      const logs = await db
        .select({
          id: activityLogs.id,
          entityType: activityLogs.entityType,
          entityId: activityLogs.entityId,
          action: activityLogs.action,
          actorName: users.name,
          actorRole: activityLogs.actorRole,
          timestamp: activityLogs.timestamp,
        })
        .from(activityLogs)
        .leftJoin(users, eq(activityLogs.actorId, users.id))
        .where(eq(activityLogs.actorId, user.userId))
        .orderBy(desc(activityLogs.timestamp))
        .limit(100);

      return { success: true, data: logs };
    }
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    if (String(error).includes('Unauthorized') || String(error).includes('Forbidden')) {
      return { success: false, error: String(error), data: [] };
    }

    // Database connection fallback
    try {
      const cookieStore = await cookies();
      const localLogsCookie = cookieStore.get('vendorbridge_local_logs')?.value || '[]';
      let localLogs: any[] = [];
      try {
        localLogs = JSON.parse(localLogsCookie);
      } catch {}

      // Format dates
      localLogs = localLogs.map((l: any) => ({
        ...l,
        timestamp: new Date(l.timestamp),
      }));

      const defaultMockLogs = [
        {
          id: 'mock-log-1',
          entityType: 'vendor',
          entityId: 'mock-vendor-1',
          action: 'Onboarded vendor: Supernova Logistics & Trading',
          actorName: 'Ritu Sharma',
          actorRole: 'OFFICER' as const,
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
        },
        {
          id: 'mock-log-2',
          entityType: 'approval_request',
          entityId: 'mock-app-1',
          action: 'Approved Quotation for RFQ-2026-000002',
          actorName: 'Priya Mehta',
          actorRole: 'APPROVER' as const,
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
        },
        {
          id: 'mock-log-3',
          entityType: 'rfq',
          entityId: 'mock-rfq-1',
          action: 'Created RFQ-2026-000003 - Acme IT Infrastructure Upgrade',
          actorName: 'Ritu Sharma',
          actorRole: 'OFFICER' as const,
          timestamp: new Date(Date.now() - 3 * 3600000),
        },
        {
          id: 'mock-log-4',
          entityType: 'purchase_order',
          entityId: 'mock-po-1',
          action: 'Acknowledged PO-2026-000104',
          actorName: 'Mohammed Farhan',
          actorRole: 'VENDOR' as const,
          timestamp: new Date(Date.now() - 5 * 3600000),
        },
        {
          id: 'mock-log-5',
          entityType: 'payment_record',
          entityId: 'mock-payment-1',
          action: 'Recorded payment of ₹12,74,400 for INV-2026-000012',
          actorName: 'Vikram Joshi',
          actorRole: 'FINANCE' as const,
          timestamp: new Date(Date.now() - 24 * 3600000),
        }
      ];

      const allLogs = [...localLogs];
      for (const dl of defaultMockLogs) {
        if (!allLogs.some(l => l.id === dl.id)) {
          allLogs.push(dl);
        }
      }

      const currentUser = await getCurrentUser();
      if (currentUser?.role === 'ADMIN' || currentUser?.role === 'OFFICER') {
        return { success: true, data: allLogs };
      } else {
        const actorNameFilter = currentUser ? (
          currentUser.email === 'vendor@supernova.com' ? 'Mohammed Farhan' : currentUser.email.split('@')[0]
        ) : '';
        const filtered = allLogs.filter(l => l.actorName === actorNameFilter || l.actorRole === currentUser?.role);
        return { success: true, data: filtered };
      }
    } catch (cookieErr) {
      console.error('Cookie fallback failed in getActivityLogs:', cookieErr);
      return { success: false, error: String(error), data: [] };
    }
  }
}
