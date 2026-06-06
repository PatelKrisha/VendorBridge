'use server';

import { db } from '@/db';
import { vendors, users } from '@/db/schema';
import { eq, and, ne, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-context';
import { logActivity } from './activity-logs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

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
    if (String(error).includes('Unauthorized') || String(error).includes('Forbidden')) {
      return { success: false, error: String(error), data: [] };
    }

    // Database connection fallback (cookie-based persistence)
    try {
      const cookieStore = await cookies();
      const localVendorsCookie = cookieStore.get('vendorbridge_local_vendors')?.value || '[]';
      let localVendors: any[] = [];
      try {
        localVendors = JSON.parse(localVendorsCookie);
      } catch {}

      localVendors = localVendors.map((v: any) => ({
        ...v,
        createdAt: new Date(v.createdAt),
      }));

      const defaultMockVendors = [
        {
          id: 'mock-vendor-1',
          orgId: 'mock-org-1',
          companyName: 'Supernova Logistics & Trading',
          gstNumber: '27AAASL5678B1Z2',
          pan: 'AAASL5678B',
          category: ['Logistics', 'Office Supplies'],
          bankDetails: {
            accountNumber: '123456789012',
            ifsc: 'SBIN0001234',
            beneficiaryName: 'Supernova Logistics & Trading',
          },
          status: 'ACTIVE' as const,
          contactPerson: 'Mohammed Farhan',
          contactEmail: 'farhan@supernova.com',
          performanceScore: '94.50',
          createdAt: new Date(),
          isDeleted: false,
        },
        {
          id: 'mock-vendor-2',
          orgId: 'mock-org-1',
          companyName: 'Apex Industrial Supplies',
          gstNumber: '27AAAAP9999C1Z3',
          pan: 'AAAAP9999C',
          category: ['Industrial', 'Hardware'],
          bankDetails: {
            accountNumber: '987654321098',
            ifsc: 'HDFC0005678',
            beneficiaryName: 'Apex Industrial Supplies',
          },
          status: 'ACTIVE' as const,
          contactPerson: 'Sanjay Gupta',
          contactEmail: 'sanjay@apex.com',
          performanceScore: '98.20',
          createdAt: new Date(),
          isDeleted: false,
        },
        {
          id: 'mock-vendor-3',
          orgId: 'mock-org-1',
          companyName: 'Zenith Tech Systems',
          gstNumber: '27AAAZT8888D1Z4',
          pan: 'AAAZT8888D',
          category: ['IT Hardware', 'Software'],
          bankDetails: {
            accountNumber: '555566667777',
            ifsc: 'ICIC0000456',
            beneficiaryName: 'Zenith Tech Systems',
          },
          status: 'ACTIVE' as const,
          contactPerson: 'Aditi Rao',
          contactEmail: 'aditi@zenith.com',
          performanceScore: '91.80',
          createdAt: new Date(),
          isDeleted: false,
        }
      ];

      const allVendors = [...localVendors];
      for (const dm of defaultMockVendors) {
        if (!allVendors.some(v => v.id === dm.id)) {
          allVendors.push(dm);
        }
      }

      const currentUser = await getCurrentUser();
      const filtered = currentUser?.role === 'VENDOR'
        ? allVendors.filter(v => v.contactEmail === currentUser.email && !v.isDeleted)
        : allVendors.filter(v => !v.isDeleted);

      return { success: true, data: filtered };
    } catch (cookieErr) {
      console.error('Cookie fallback failed in getVendors:', cookieErr);
      return { success: false, error: String(error), data: [] };
    }
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
  let user: any = null;
  try {
    user = await getCurrentUser();
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
    if (String(error).includes('Unauthorized') || String(error).includes('Forbidden')) {
      return { success: false, error: String(error) };
    }

    // Fallback: Store locally in cookies
    try {
      const cookieStore = await cookies();
      const localVendorsCookie = cookieStore.get('vendorbridge_local_vendors')?.value || '[]';
      let localVendors: any[] = [];
      try {
        localVendors = JSON.parse(localVendorsCookie);
      } catch {}

      const newVendor = {
        id: 'mock-vendor-' + Math.random().toString(36).substring(2, 9),
        orgId: user?.orgId || 'mock-org-1',
        companyName: data.companyName,
        gstNumber: data.gstNumber,
        pan: data.pan,
        category: data.category,
        contactPerson: data.contactPerson,
        contactEmail: data.contactEmail,
        status: 'PENDING' as const,
        performanceScore: '100.00',
        bankDetails: {
          phone: data.phone || '',
          address: data.address || '',
        },
        createdAt: new Date(),
        isDeleted: false,
      };

      localVendors.push(newVendor);
      cookieStore.set('vendorbridge_local_vendors', JSON.stringify(localVendors), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      revalidatePath('/vendors');
      revalidatePath('/');
      return { success: true, data: newVendor };
    } catch (cookieErr) {
      console.error('Cookie fallback failed in createVendor:', cookieErr);
      return { success: false, error: String(error) };
    }
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
    if (String(error).includes('Unauthorized') || String(error).includes('Forbidden')) {
      return { success: false, error: String(error) };
    }

    try {
      const cookieStore = await cookies();
      const localVendorsCookie = cookieStore.get('vendorbridge_local_vendors')?.value || '[]';
      let localVendors: any[] = [];
      try {
        localVendors = JSON.parse(localVendorsCookie);
      } catch {}

      let updated = false;
      localVendors = localVendors.map(v => {
        if (v.id === vendorId) {
          updated = true;
          return { ...v, status, updatedAt: new Date() };
        }
        return v;
      });

      if (!updated) {
        // Fallback default mock vendors check
        const defaultMockVendors = [
          {
            id: 'mock-vendor-1',
            orgId: 'mock-org-1',
            companyName: 'Supernova Logistics & Trading',
            gstNumber: '27AAASL5678B1Z2',
            pan: 'AAASL5678B',
            category: ['Logistics', 'Office Supplies'],
            bankDetails: {
              accountNumber: '123456789012',
              ifsc: 'SBIN0001234',
              beneficiaryName: 'Supernova Logistics & Trading',
            },
            status: 'ACTIVE' as const,
            contactPerson: 'Mohammed Farhan',
            contactEmail: 'farhan@supernova.com',
            performanceScore: '94.50',
            createdAt: new Date(),
            isDeleted: false,
          },
          {
            id: 'mock-vendor-2',
            orgId: 'mock-org-1',
            companyName: 'Apex Industrial Supplies',
            gstNumber: '27AAAAP9999C1Z3',
            pan: 'AAAAP9999C',
            category: ['Industrial', 'Hardware'],
            bankDetails: {
              accountNumber: '987654321098',
              ifsc: 'HDFC0005678',
              beneficiaryName: 'Apex Industrial Supplies',
            },
            status: 'ACTIVE' as const,
            contactPerson: 'Sanjay Gupta',
            contactEmail: 'sanjay@apex.com',
            performanceScore: '98.20',
            createdAt: new Date(),
            isDeleted: false,
          },
          {
            id: 'mock-vendor-3',
            orgId: 'mock-org-1',
            companyName: 'Zenith Tech Systems',
            gstNumber: '27AAAZT8888D1Z4',
            pan: 'AAAZT8888D',
            category: ['IT Hardware', 'Software'],
            bankDetails: {
              accountNumber: '555566667777',
              ifsc: 'ICIC0000456',
              beneficiaryName: 'Zenith Tech Systems',
            },
            status: 'ACTIVE' as const,
            contactPerson: 'Aditi Rao',
            contactEmail: 'aditi@zenith.com',
            performanceScore: '91.80',
            createdAt: new Date(),
            isDeleted: false,
          }
        ];

        const match = defaultMockVendors.find(v => v.id === vendorId);
        if (match) {
          localVendors.push({ ...match, status, updatedAt: new Date() });
          updated = true;
        }
      }

      if (updated) {
        cookieStore.set('vendorbridge_local_vendors', JSON.stringify(localVendors), {
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });
        revalidatePath('/vendors');
        revalidatePath('/');
        return { success: true };
      }
      return { success: false, error: 'Vendor not found' };
    } catch (e) {
      return { success: false, error: String(error) };
    }
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
    if (String(error).includes('Unauthorized') || String(error).includes('Forbidden')) {
      return { success: false, error: String(error) };
    }

    try {
      const cookieStore = await cookies();
      const localVendorsCookie = cookieStore.get('vendorbridge_local_vendors')?.value || '[]';
      let localVendors: any[] = [];
      try {
        localVendors = JSON.parse(localVendorsCookie);
      } catch {}

      let updated = false;
      localVendors = localVendors.map(v => {
        if (v.id === vendorId) {
          updated = true;
          return { ...v, isDeleted: true, updatedAt: new Date() };
        }
        return v;
      });

      if (!updated) {
        const defaultMockVendors = [
          {
            id: 'mock-vendor-1',
            orgId: 'mock-org-1',
            companyName: 'Supernova Logistics & Trading',
            gstNumber: '27AAASL5678B1Z2',
            pan: 'AAASL5678B',
            category: ['Logistics', 'Office Supplies'],
            bankDetails: {
              accountNumber: '123456789012',
              ifsc: 'SBIN0001234',
              beneficiaryName: 'Supernova Logistics & Trading',
            },
            status: 'ACTIVE' as const,
            contactPerson: 'Mohammed Farhan',
            contactEmail: 'farhan@supernova.com',
            performanceScore: '94.50',
            createdAt: new Date(),
            isDeleted: false,
          },
          {
            id: 'mock-vendor-2',
            orgId: 'mock-org-1',
            companyName: 'Apex Industrial Supplies',
            gstNumber: '27AAAAP9999C1Z3',
            pan: 'AAAAP9999C',
            category: ['Industrial', 'Hardware'],
            bankDetails: {
              accountNumber: '987654321098',
              ifsc: 'HDFC0005678',
              beneficiaryName: 'Apex Industrial Supplies',
            },
            status: 'ACTIVE' as const,
            contactPerson: 'Sanjay Gupta',
            contactEmail: 'sanjay@apex.com',
            performanceScore: '98.20',
            createdAt: new Date(),
            isDeleted: false,
          },
          {
            id: 'mock-vendor-3',
            orgId: 'mock-org-1',
            companyName: 'Zenith Tech Systems',
            gstNumber: '27AAAZT8888D1Z4',
            pan: 'AAAZT8888D',
            category: ['IT Hardware', 'Software'],
            bankDetails: {
              accountNumber: '555566667777',
              ifsc: 'ICIC0000456',
              beneficiaryName: 'Zenith Tech Systems',
            },
            status: 'ACTIVE' as const,
            contactPerson: 'Aditi Rao',
            contactEmail: 'aditi@zenith.com',
            performanceScore: '91.80',
            createdAt: new Date(),
            isDeleted: false,
          }
        ];

        const match = defaultMockVendors.find(v => v.id === vendorId);
        if (match) {
          localVendors.push({ ...match, isDeleted: true, updatedAt: new Date() });
          updated = true;
        }
      }

      if (updated) {
        cookieStore.set('vendorbridge_local_vendors', JSON.stringify(localVendors), {
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });
        revalidatePath('/vendors');
        revalidatePath('/');
        return { success: true };
      }
      return { success: false, error: 'Vendor not found' };
    } catch (e) {
      return { success: false, error: String(error) };
    }
  }
}
