'use server';

import { db } from '@/db';
import { approvalRequests, approvalActions, quotations, rfqs, vendors, users, purchaseOrders, poItems, quotationItems, rfqItems } from '@/db/schema';
import { eq, and, desc, ne } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-context';
import { logActivity } from './activity-logs';
import { revalidatePath } from 'next/cache';

export async function getApprovalsQueue() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    // Approvers and Admins can see the approvals queue
    if (user.role !== 'APPROVER' && user.role !== 'ADMIN') {
      return { success: true, data: [] };
    }

    // Fetch pending and decided approvals
    const requests = await db
      .select({
        id: approvalRequests.id,
        currentLevel: approvalRequests.currentLevel,
        status: approvalRequests.status,
        initiatedAt: approvalRequests.initiatedAt,
        quotationId: quotations.id,
        totalAmount: quotations.totalAmount,
        vendorName: vendors.companyName,
        vendorId: vendors.id,
        rfqNumber: rfqs.rfqNumber,
        rfqTitle: rfqs.title,
        rfqId: rfqs.id,
        initiatorName: users.name,
      })
      .from(approvalRequests)
      .innerJoin(quotations, eq(approvalRequests.quotationId, quotations.id))
      .innerJoin(vendors, eq(quotations.vendorId, vendors.id))
      .innerJoin(rfqs, eq(quotations.rfqId, rfqs.id))
      .innerJoin(users, eq(approvalRequests.initiatedBy, users.id))
      .orderBy(desc(approvalRequests.initiatedAt));

    // Decided and pending filters
    const decisions = await db.select().from(approvalActions);
    
    return { success: true, data: requests };
  } catch (error) {
    console.error('Error fetching approvals queue:', error);
    return { success: false, error: String(error), data: [] };
  }
}

export async function submitApprovalDecision(data: {
  requestId: string;
  action: 'APPROVED' | 'REJECTED';
  remarks: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');
    if (user.role !== 'APPROVER' && user.role !== 'ADMIN') {
      throw new Error('Forbidden: Only Approvers or Admins can action approvals');
    }

    // Fetch the request
    const [request] = await db
      .select()
      .from(approvalRequests)
      .where(eq(approvalRequests.id, data.requestId))
      .limit(1);

    if (!request) {
      return { success: false, error: 'Approval request not found' };
    }

    const result = await db.transaction(async (tx) => {
      // 1. Insert approval action
      await tx.insert(approvalActions).values({
        requestId: request.id,
        approverId: user.userId,
        level: request.currentLevel,
        action: data.action,
        remarks: data.remarks,
      });

      // 2. Update approval request status
      const requestStatus = data.action === 'APPROVED' ? 'APPROVED' : 'REJECTED';
      await tx
        .update(approvalRequests)
        .set({ status: requestStatus })
        .where(eq(approvalRequests.id, request.id));

      // 3. Update quotation status
      const quotationStatus = data.action === 'APPROVED' ? 'AWARDED' : 'REJECTED';
      const [updatedQuotation] = await tx
        .update(quotations)
        .set({ status: quotationStatus, updatedAt: new Date() })
        .where(eq(quotations.id, request.quotationId))
        .returning();

      // 4. Update RFQ status
      if (data.action === 'APPROVED') {
        await tx
          .update(rfqs)
          .set({ status: 'AWARDED', updatedAt: new Date() })
          .where(eq(rfqs.id, updatedQuotation.rfqId));

        // 5. Generate Purchase Order automatically
        const dateStr = new Date().getFullYear();
        const poCount = await tx.select().from(purchaseOrders);
        const nextSeq = String(poCount.length + 1).padStart(6, '0');
        const poNumber = `PO-${dateStr}-${nextSeq}`;

        // Get vendor details for address fallback
        const [vendorRecord] = await tx
          .select()
          .from(vendors)
          .where(eq(vendors.id, updatedQuotation.vendorId))
          .limit(1);

        const vendorAddress = (vendorRecord?.bankDetails as any)?.address || 'Vendor registered office';

        const [insertedPo] = await tx
          .insert(purchaseOrders)
          .values({
            poNumber,
            quotationId: updatedQuotation.id,
            rfqAwardId: updatedQuotation.rfqId, // Links award
            vendorId: updatedQuotation.vendorId,
            status: 'ISSUED',
            deliveryAddress: 'Acme Global Corp Main Warehouses, BKC, Mumbai, MH, 400051',
            paymentTerms: 'Net 30 Days from delivery',
            issuedAt: new Date(),
          })
          .returning();

        // 6. Copy quotation items to PO items
        const quoteItemsList = await tx
          .select()
          .from(quotationItems)
          .where(eq(quotationItems.quotationId, updatedQuotation.id));

        for (const item of quoteItemsList) {
          // Get item name from RFQ item
          const [rfqItemRecord] = await tx
            .select()
            .from(rfqItems)
            .where(eq(rfqItems.id, item.rfqItemId))
            .limit(1);

          const itemName = rfqItemRecord?.itemName || 'Procurement Line Item';
          const qty = rfqItemRecord?.quantity || 1;

          const subtotalNum = Number(item.subtotal);
          const taxRateNum = Number(item.taxRate);
          const totalAmount = subtotalNum * (1 + taxRateNum / 100);

          await tx.insert(poItems).values({
            poId: insertedPo.id,
            itemName,
            quantity: qty,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            totalAmount: String(totalAmount.toFixed(2)),
          });
        }
      }

      return updatedQuotation;
    });

    await logActivity({
      entityType: 'approval_request',
      entityId: data.requestId,
      action: `${data.action} quotation award for RFQ. Remarks: ${data.remarks}`,
      metadata: { action: data.action },
    });

    revalidatePath('/approvals');
    revalidatePath('/purchase-orders');
    revalidatePath('/rfqs');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error submitting approval decision:', error);
    return { success: false, error: String(error) };
  }
}
