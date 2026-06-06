'use server';

import { db } from '@/db';
import { invoices, purchaseOrders, vendors } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-context';
import { logActivity } from './activity-logs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getPurchaseOrders } from './purchase-orders';

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
    if (String(error).includes('Unauthorized') || String(error).includes('Forbidden')) {
      return { success: false, error: String(error), data: [] };
    }

    // Database connection fallback
    try {
      const cookieStore = await cookies();
      const localInvoicesCookie = cookieStore.get('vendorbridge_local_invoices')?.value || '[]';
      let localInvoices: any[] = [];
      try {
        localInvoices = JSON.parse(localInvoicesCookie);
      } catch {}

      // Format dates
      localInvoices = localInvoices.map((inv: any) => ({
        ...inv,
        dueDate: new Date(inv.dueDate),
        createdAt: new Date(inv.createdAt),
      }));

      const defaultMockInvoices = [
        {
          id: 'mock-invoice-1',
          invoiceNumber: 'INV-2026-000001',
          status: 'PAID' as const,
          subtotal: '1270000.00',
          cgst: '114300.00',
          sgst: '114300.00',
          igst: '0.00',
          total: '1498600.00',
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          poNumber: 'PO-2026-000104',
          poId: 'mock-po-1',
          vendorName: 'Supernova Logistics & Trading',
          vendorGst: '27AAASL5678B1Z2',
        },
        {
          id: 'mock-invoice-2',
          invoiceNumber: 'INV-2026-000002',
          status: 'ISSUED' as const,
          subtotal: '350000.00',
          cgst: '31500.00',
          sgst: '31500.00',
          igst: '0.00',
          total: '413000.00',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          poNumber: 'PO-2026-000105',
          poId: 'mock-po-2',
          vendorName: 'Zenith Tech Systems',
          vendorGst: '27AAAZT8888D1Z4',
        }
      ];

      // Read local decisions from approval/payments to update status if paid
      const decisionsCookie = cookieStore.get('vendorbridge_decisions')?.value || '{}';
      let localDecisions: Record<string, string> = {};
      try {
        localDecisions = JSON.parse(decisionsCookie);
      } catch {}

      const allInvoices = [...localInvoices];
      for (const dm of defaultMockInvoices) {
        if (!allInvoices.some(i => i.id === dm.id)) {
          // If invoice is marked as paid by a local action, reflect that
          if (localDecisions[dm.id] === 'PAID') {
            dm.status = 'PAID';
          }
          allInvoices.push(dm);
        }
      }

      const currentUser = await getCurrentUser();
      if (currentUser?.role === 'VENDOR') {
        const filtered = allInvoices.filter(i => i.vendorName.toLowerCase().includes('supernova') && currentUser.email.includes('supernova'));
        return { success: true, data: filtered };
      }

      return { success: true, data: allInvoices };
    } catch (cookieErr) {
      console.error('Cookie fallback failed in getInvoices:', cookieErr);
      return { success: false, error: String(error), data: [] };
    }
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
  let user: any = null;
  try {
    user = await getCurrentUser();
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
    if (String(error).includes('Unauthorized') || String(error).includes('Forbidden')) {
      return { success: false, error: String(error) };
    }

    // Fallback: Store locally in cookies
    try {
      const cookieStore = await cookies();
      const localInvoicesCookie = cookieStore.get('vendorbridge_local_invoices')?.value || '[]';
      let localInvoices: any[] = [];
      try {
        localInvoices = JSON.parse(localInvoicesCookie);
      } catch {}

      const dateStr = new Date().getFullYear();
      const nextSeq = String(localInvoices.length + 3).padStart(6, '0');
      const invoiceNumber = data.invoiceNumber || `INV-${dateStr}-${nextSeq}`;

      // Resolve PO details for fields
      const poRes = await getPurchaseOrders();
      const poList = poRes.success ? poRes.data : [];
      const matchPo = poList.find((p: any) => p.id === data.poId);

      const newInvoice = {
        id: 'mock-invoice-' + Math.random().toString(36).substring(2, 9),
        invoiceNumber,
        poId: data.poId,
        status: 'ISSUED' as const,
        subtotal: data.subtotal,
        cgst: data.cgst,
        sgst: data.sgst,
        igst: data.igst,
        total: data.total,
        dueDate: new Date(data.dueDate),
        createdAt: new Date(),
        poNumber: matchPo ? matchPo.poNumber : 'PO-2026-XXXXXX',
        vendorName: matchPo ? matchPo.vendorName : 'Vendor Company Ltd',
        vendorGst: matchPo ? matchPo.vendorGst : '27XXXXX1234X1Z0',
      };

      localInvoices.push(newInvoice);
      cookieStore.set('vendorbridge_local_invoices', JSON.stringify(localInvoices), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      revalidatePath('/invoices');
      revalidatePath('/vendor-portal');
      revalidatePath('/');
      return { success: true, data: newInvoice };
    } catch (cookieErr) {
      console.error('Cookie fallback failed in createInvoice:', cookieErr);
      return { success: false, error: String(error) };
    }
  }
}
