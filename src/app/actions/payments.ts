'use server';

import { db } from '@/db';
import { paymentRecords, invoices, purchaseOrders, vendors, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-context';
import { logActivity } from './activity-logs';
import { revalidatePath } from 'next/cache';

export async function getPaymentRecords() {
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
        id: paymentRecords.id,
        paymentDate: paymentRecords.paymentDate,
        amount: paymentRecords.amount,
        method: paymentRecords.method,
        referenceNumber: paymentRecords.referenceNumber,
        notes: paymentRecords.notes,
        invoiceNumber: invoices.invoiceNumber,
        poNumber: purchaseOrders.poNumber,
        vendorName: vendors.companyName,
        recorderName: users.name,
      })
      .from(paymentRecords)
      .innerJoin(invoices, eq(paymentRecords.invoiceId, invoices.id))
      .innerJoin(purchaseOrders, eq(invoices.poId, purchaseOrders.id))
      .innerJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
      .leftJoin(users, eq(paymentRecords.recordedBy, users.id))
      .orderBy(desc(paymentRecords.paymentDate));

    const results = vendorIdFilter
      ? await query.where(eq(purchaseOrders.vendorId, vendorIdFilter))
      : await query.where(eq(vendors.orgId, user.orgId));

    return { success: true, data: results };
  } catch (error) {
    console.error('Error fetching payment records:', error);
    return { success: false, error: String(error), data: [] };
  }
}

export async function recordPayment(data: {
  invoiceId: string;
  amount: string;
  method: 'NEFT' | 'RTGS' | 'CHEQUE' | 'CARD' | 'UPI';
  referenceNumber: string;
  notes?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');
    if (user.role !== 'FINANCE' && user.role !== 'ADMIN') {
      throw new Error('Forbidden: Only Finance or Admins can record payments');
    }

    const result = await db.transaction(async (tx) => {
      // 1. Insert payment record
      const [payment] = await tx
        .insert(paymentRecords)
        .values({
          invoiceId: data.invoiceId,
          amount: data.amount,
          method: data.method,
          referenceNumber: data.referenceNumber,
          recordedBy: user.userId,
          notes: data.notes || null,
        })
        .returning();

      // 2. Update invoice status to PAID
      await tx
        .update(invoices)
        .set({ status: 'PAID', updatedAt: new Date() })
        .where(eq(invoices.id, data.invoiceId));

      return payment;
    });

    // Fetch invoice details for logging
    const [inv] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, data.invoiceId))
      .limit(1);

    await logActivity({
      entityType: 'payment_record',
      entityId: result.id,
      action: `Recorded payment of ₹${Number(data.amount).toLocaleString('en-IN')} for Invoice ${inv?.invoiceNumber || ''}`,
      metadata: { invoiceId: data.invoiceId, amount: data.amount },
    });

    revalidatePath('/invoices');
    revalidatePath('/payment-ledger');
    revalidatePath('/vendor-portal');
    revalidatePath('/');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error recording payment:', error);
    return { success: false, error: String(error) };
  }
}
