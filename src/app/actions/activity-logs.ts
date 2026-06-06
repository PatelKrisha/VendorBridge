'use server';

import { db } from '@/db';
import { activityLogs, users } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-context';

export async function logActivity(data: {
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Record<string, any>;
}) {
  try {
    const user = await getCurrentUser();
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
    return { success: false, error: String(error) };
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
    return { success: false, error: String(error), data: [] };
  }
}
