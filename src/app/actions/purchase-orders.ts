'use server';

import { db } from '@/db';
import { purchaseOrders, poItems, vendors, quotations } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-context';
import { logActivity } from './activity-logs';
import { revalidatePath } from 'next/cache';

export async function getPurchaseOrders() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let vendorIdFilter: string | null = null;

    if (user.role === 'VENDOR') {
      const [vendorRecord] = await db
        .select()
        .from(vendors)
        .where(eq(vendors.contactEmail, user.email))
        .limit(1);

      if (!vendorRecord) {
        return { success: true, data: [] };
      }
      vendorIdFilter = vendorRecord.id;
    }

    const query = db
      .select({
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        status: purchaseOrders.status,
        deliveryAddress: purchaseOrders.deliveryAddress,
        paymentTerms: purchaseOrders.paymentTerms,
        issuedAt: purchaseOrders.issuedAt,
        vendorName: vendors.companyName,
        vendorGst: vendors.gstNumber,
        vendorId: vendors.id,
        bankDetails: vendors.bankDetails,
      })
      .from(purchaseOrders)
      .innerJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
      .orderBy(desc(purchaseOrders.createdAt));

    const pos = vendorIdFilter 
      ? await query.where(eq(purchaseOrders.vendorId, vendorIdFilter))
      : await query.where(eq(vendors.orgId, user.orgId));

    const data = await Promise.all(
      pos.map(async (po) => {
        const items = await db.select().from(poItems).where(eq(poItems.poId, po.id));
        
        // Sum total amount
        const total = items.reduce((acc, item) => acc + Number(item.totalAmount), 0);

        return {
          ...po,
          items,
          total: total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        };
      })
    );

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return { success: false, error: String(error), data: [] };
  }
}

export async function acknowledgePO(poId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    const [vendorRecord] = await db
      .select()
      .from(vendors)
      .where(eq(vendors.contactEmail, user.email))
      .limit(1);

    if (user.role === 'VENDOR' && !vendorRecord) {
      throw new Error('Forbidden: Not a registered vendor');
    }

    const condition = user.role === 'VENDOR' 
      ? and(eq(purchaseOrders.id, poId), eq(purchaseOrders.vendorId, vendorRecord.id))
      : eq(purchaseOrders.id, poId);

    const [updated] = await db
      .update(purchaseOrders)
      .set({ status: 'ACKNOWLEDGED', updatedAt: new Date() })
      .where(condition)
      .returning();

    if (!updated) {
      return { success: false, error: 'Purchase order not found or not assigned to you' };
    }

    await logActivity({
      entityType: 'purchase_order',
      entityId: poId,
      action: `Acknowledged PO: ${updated.poNumber}`,
    });

    revalidatePath('/purchase-orders');
    revalidatePath('/vendor-portal');
    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error) {
    console.error('Error acknowledging PO:', error);
    return { success: false, error: String(error) };
  }
}

export async function cancelPO(poId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');
    if (user.role !== 'ADMIN' && user.role !== 'OFFICER') {
      throw new Error('Forbidden: Only Admins or Officers can cancel POs');
    }

    const [updated] = await db
      .update(purchaseOrders)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(eq(purchaseOrders.id, poId))
      .returning();

    if (!updated) {
      return { success: false, error: 'Purchase order not found' };
    }

    await logActivity({
      entityType: 'purchase_order',
      entityId: poId,
      action: `Cancelled PO: ${updated.poNumber}`,
    });

    revalidatePath('/purchase-orders');
    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error) {
    console.error('Error cancelling PO:', error);
    return { success: false, error: String(error) };
  }
}
