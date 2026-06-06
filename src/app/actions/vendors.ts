'use server';

import { db } from '@/db';
import { vendors, users } from '@/db/schema';
import { eq, and, ne, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-context';
import { logActivity } from './activity-logs';
import { revalidatePath } from 'next/cache';

export async function getVendors() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Role-based visibility
    if (user.role === 'VENDOR') {
      // Vendors can only see their own profile
      // Let's find the vendor associated with the user's email
      const vendorList = await db
        .select()
        .from(vendors)
        .where(
          and(
            eq(vendors.contactEmail, user.email),
            eq(vendors.isDeleted, false)
          )
        );
      return { success: true, data: vendorList };
    }

    // Admin, Officer, Approver, Finance see all vendors in their org
    const vendorList = await db
      .select()
      .from(vendors)
      .where(
        and(
          eq(vendors.orgId, user.orgId),
          eq(vendors.isDeleted, false)
        )
      )
      .orderBy(desc(vendors.createdAt));

    return { success: true, data: vendorList };
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return { success: false, error: String(error), data: [] };
  }
}

export async function createVendor(data: {
  companyName: string;
  gstNumber: string;
  pan: string;
  category: string[];
  contactPerson: string;
  contactEmail: string;
  phone?: string;
  address?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');
    if (user.role !== 'ADMIN' && user.role !== 'OFFICER') {
      throw new Error('Forbidden: Only Admins or Officers can onboard vendors');
    }

    const [newVendor] = await db
      .insert(vendors)
      .values({
        orgId: user.orgId,
        companyName: data.companyName,
        gstNumber: data.gstNumber,
        pan: data.pan,
        category: data.category,
        contactPerson: data.contactPerson,
        contactEmail: data.contactEmail,
        status: 'PENDING',
        performanceScore: '100.00',
        bankDetails: {
          phone: data.phone || '',
          address: data.address || '',
        },
      })
      .returning();

    await logActivity({
      entityType: 'vendor',
      entityId: newVendor.id,
      action: `Onboarded vendor: ${data.companyName}`,
      metadata: { companyName: data.companyName },
    });

    revalidatePath('/vendors');
    revalidatePath('/');
    return { success: true, data: newVendor };
  } catch (error) {
    console.error('Error creating vendor:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateVendorStatus(vendorId: string, status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BLACKLISTED') {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');
    if (user.role !== 'ADMIN' && user.role !== 'OFFICER') {
      throw new Error('Forbidden');
    }

    const [updated] = await db
      .update(vendors)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(vendors.id, vendorId), eq(vendors.orgId, user.orgId)))
      .returning();

    if (!updated) {
      return { success: false, error: 'Vendor not found' };
    }

    await logActivity({
      entityType: 'vendor',
      entityId: vendorId,
      action: `Updated vendor status to ${status} for ${updated.companyName}`,
      metadata: { status },
    });

    revalidatePath('/vendors');
    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error) {
    console.error('Error updating vendor status:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteVendor(vendorId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');
    if (user.role !== 'ADMIN') {
      throw new Error('Forbidden: Only Admins can delete vendors');
    }

    const [deleted] = await db
      .update(vendors)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(and(eq(vendors.id, vendorId), eq(vendors.orgId, user.orgId)))
      .returning();

    if (!deleted) {
      return { success: false, error: 'Vendor not found' };
    }

    await logActivity({
      entityType: 'vendor',
      entityId: vendorId,
      action: `Soft-deleted vendor: ${deleted.companyName}`,
    });

    revalidatePath('/vendors');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return { success: false, error: String(error) };
  }
}
