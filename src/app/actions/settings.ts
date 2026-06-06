'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-context';
import { logActivity } from './activity-logs';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function updateProfile(data: { name: string; email: string }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const [updated] = await db
      .update(users)
      .set({
        name: data.name,
        email: data.email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.userId))
      .returning();

    if (!updated) {
      return { success: false, error: 'User not found' };
    }

    await logActivity({
      entityType: 'user',
      entityId: user.userId,
      action: `Updated profile details: Name to "${data.name}", Email to "${data.email}"`,
    });

    revalidatePath('/settings');
    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: String(error) };
  }
}

export async function changePassword(data: { current: string; new: string }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    // Fetch user password hash
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.userId))
      .limit(1);

    if (!userRecord) {
      return { success: false, error: 'User not found' };
    }

    // Verify current password
    const isMatch = await bcrypt.compare(data.current, userRecord.passwordHash);
    if (!isMatch) {
      return { success: false, error: 'Current password does not match' };
    }

    // Hash new password
    const newHash = await bcrypt.hash(data.new, 12);

    await db
      .update(users)
      .set({
        passwordHash: newHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.userId));

    await logActivity({
      entityType: 'user',
      entityId: user.userId,
      action: `Changed account password`,
    });

    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, error: String(error) };
  }
}
