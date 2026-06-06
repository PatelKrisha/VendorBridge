'use server';

import { db } from '@/db';
import { rfqs, rfqItems, rfqVendorAssignments, vendors, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-context';
import { logActivity } from './activity-logs';
import { revalidatePath } from 'next/cache';

export async function getRfqs() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    // Role-based visibility
    if (user.role === 'VENDOR') {
      // Find vendor associated with user's email
      const [vendorRecord] = await db
        .select()
        .from(vendors)
        .where(eq(vendors.contactEmail, user.email))
        .limit(1);

      if (!vendorRecord) {
        return { success: true, data: [] };
      }

      // Fetch RFQs assigned to this vendor
      const assigned = await db
        .select({
          rfq: rfqs,
        })
        .from(rfqVendorAssignments)
        .innerJoin(rfqs, eq(rfqVendorAssignments.rfqId, rfqs.id))
        .where(eq(rfqVendorAssignments.vendorId, vendorRecord.id))
        .orderBy(desc(rfqs.createdAt));

      // Map to return just the RFQs with their items and status
      const data = await Promise.all(
        assigned.map(async (a) => {
          const items = await db.select().from(rfqItems).where(eq(rfqItems.rfqId, a.rfq.id));
          return {
            ...a.rfq,
            items,
          };
        })
      );

      return { success: true, data };
    }

    // Admin, Officer, Approver, Finance see all RFQs in org
    const rfqList = await db
      .select({
        rfq: rfqs,
        creatorName: users.name,
      })
      .from(rfqs)
      .leftJoin(users, eq(rfqs.createdById, users.id))
      .where(eq(rfqs.orgId, user.orgId))
      .orderBy(desc(rfqs.createdAt));

    const data = await Promise.all(
      rfqList.map(async (r) => {
        const items = await db.select().from(rfqItems).where(eq(rfqItems.rfqId, r.rfq.id));
        const assignments = await db
          .select({
            vendorId: rfqVendorAssignments.vendorId,
            companyName: vendors.companyName,
          })
          .from(rfqVendorAssignments)
          .innerJoin(vendors, eq(rfqVendorAssignments.vendorId, vendors.id))
          .where(eq(rfqVendorAssignments.rfqId, r.rfq.id));

        return {
          ...r.rfq,
          creatorName: r.creatorName,
          items,
          assignedVendors: assignments,
        };
      })
    );

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching RFQs:', error);
    return { success: false, error: String(error), data: [] };
  }
}

export async function createRfq(data: {
  title: string;
  description: string;
  deadline: string;
  totalBudget: string;
  items: {
    itemName: string;
    quantity: number;
    unit: string;
    hsnCode?: string;
    specifications?: string;
    targetPrice?: string;
    benchmarkPrice: string;
  }[];
  vendorIds: string[];
}) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');
    if (user.role !== 'ADMIN' && user.role !== 'OFFICER') {
      throw new Error('Forbidden');
    }

    // Generate RFQ number
    const dateStr = new Date().getFullYear();
    const countResult = await db.select().from(rfqs);
    const nextSeq = String(countResult.length + 1).padStart(6, '0');
    const rfqNumber = `RFQ-${dateStr}-${nextSeq}`;

    const newRfq = await db.transaction(async (tx) => {
      // 1. Insert RFQ
      const [insertedRfq] = await tx
        .insert(rfqs)
        .values({
          orgId: user.orgId,
          rfqNumber,
          title: data.title,
          description: data.description,
          deadline: new Date(data.deadline),
          status: 'PUBLISHED',
          totalBudget: data.totalBudget,
          createdById: user.userId,
        })
        .returning();

      // 2. Insert items
      if (data.items.length > 0) {
        await tx.insert(rfqItems).values(
          data.items.map((item) => ({
            rfqId: insertedRfq.id,
            itemName: item.itemName,
            quantity: item.quantity,
            unit: item.unit,
            hsnCode: item.hsnCode || null,
            specifications: item.specifications || null,
            targetPrice: item.targetPrice || null,
            benchmarkPrice: item.benchmarkPrice,
          }))
        );
      }

      // 3. Assign vendors
      if (data.vendorIds.length > 0) {
        await tx.insert(rfqVendorAssignments).values(
          data.vendorIds.map((vendorId) => ({
            rfqId: insertedRfq.id,
            vendorId,
          }))
        );
      }

      return insertedRfq;
    });

    await logActivity({
      entityType: 'rfq',
      entityId: newRfq.id,
      action: `Published RFQ: ${rfqNumber} - ${data.title}`,
      metadata: { rfqNumber, title: data.title },
    });

    revalidatePath('/rfqs');
    revalidatePath('/');
    return { success: true, data: newRfq };
  } catch (error) {
    console.error('Error creating RFQ:', error);
    return { success: false, error: String(error) };
  }
}
