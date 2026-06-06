'use server';

import { db } from '@/db';
import { invoices, purchaseOrders, vendors } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-context';
import { logActivity } from './activity-logs';
import { revalidatePath } from 'next/cache';

export async function getInvoices() {
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
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
        subtotal: invoices.subtotal,
        cgst: invoices.cgst,
        sgst: invoices.sgst,
        igst: invoices.igst,
        total: invoices.total,
        dueDate: invoices.dueDate,
        createdAt: invoices.createdAt,
        poNumber: purchaseOrders.poNumber,
        poId: purchaseOrders.id,
        vendorName: vendors.companyName,
        vendorGst: vendors.gstNumber,
      })
      .from(invoices)
      .innerJoin(purchaseOrders, eq(invoices.poId, purchaseOrders.id))
      .innerJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
      .orderBy(desc(invoices.createdAt));

    const results = vendorIdFilter
      ? await query.where(eq(purchaseOrders.vendorId, vendorIdFilter))
      : await query.where(eq(vendors.orgId, user.orgId));

    return { success: true, data: results };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return { success: false, error: String(error), data: [] };
  }
}

export async function createInvoice(data: {
  poId: string;
  invoiceNumber?: string;
  subtotal: string;
  cgst: string;
  sgst: string;
  igst: string;
  total: string;
  dueDate: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    // Generate invoice number if not provided
    let invoiceNumber = data.invoiceNumber;
    if (!invoiceNumber) {
      const dateStr = new Date().getFullYear();
      const countResult = await db.select().from(invoices);
      const nextSeq = String(countResult.length + 1).padStart(6, '0');
      invoiceNumber = `INV-${dateStr}-${nextSeq}`;
    }

    // Insert invoice
    const [newInvoice] = await db
      .insert(invoices)
      .values({
        invoiceNumber,
        poId: data.poId,
        status: 'ISSUED',
        subtotal: data.subtotal,
        cgst: data.cgst,
        sgst: data.sgst,
        igst: data.igst,
        total: data.total,
        dueDate: new Date(data.dueDate),
        sentAt: new Date(),
      })
      .returning();

    await logActivity({
      entityType: 'invoice',
      entityId: newInvoice.id,
      action: `Created Invoice: ${invoiceNumber}`,
      metadata: { invoiceNumber },
    });

    revalidatePath('/invoices');
    revalidatePath('/vendor-portal');
    revalidatePath('/');
    return { success: true, data: newInvoice };
  } catch (error) {
    console.error('Error creating invoice:', error);
    return { success: false, error: String(error) };
  }
}
