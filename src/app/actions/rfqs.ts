'use server';

import { db } from '@/db';
import { rfqs, rfqItems, rfqVendorAssignments, vendors, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-context';
import { logActivity } from './activity-logs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getVendors } from './vendors';

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
    if (String(error).includes('Unauthorized') || String(error).includes('Forbidden')) {
      return { success: false, error: String(error), data: [] };
    }

    // Database connection fallback
    try {
      const cookieStore = await cookies();
      const localRfqsCookie = cookieStore.get('vendorbridge_local_rfqs')?.value || '[]';
      let localRfqs: any[] = [];
      try {
        localRfqs = JSON.parse(localRfqsCookie);
      } catch {}

      // Format dates
      localRfqs = localRfqs.map((r: any) => ({
        ...r,
        deadline: new Date(r.deadline),
        createdAt: new Date(r.createdAt),
      }));

      const defaultMockRfqs = [
        {
          id: 'mock-rfq-1',
          orgId: 'mock-org-1',
          rfqNumber: 'RFQ-2026-000001',
          title: 'Acme IT Infrastructure Upgrade',
          description: 'Procurement of enterprise server racks and storage arrays for our Mumbai data center expansion.',
          status: 'PUBLISHED' as const,
          totalBudget: '2500000.00',
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          createdById: 'mock-user-1',
          creatorName: 'Ritu Sharma',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          items: [
            {
              id: 'mock-rfq-item-1',
              itemName: 'Enterprise Server Rack 2U (Dual Xeon 32-Core, 256GB RAM, 8TB SSD)',
              quantity: 3,
              unit: 'Units',
              hsnCode: '84713010',
              specifications: 'Standard 19-inch mounting, dual redundant 750W power supplies, slide rails included.',
              targetPrice: '350000.00',
              benchmarkPrice: '380000.00',
            },
            {
              id: 'mock-rfq-item-2',
              itemName: '100GbE Managed Network Switch (48-Port SFP28, 6-Port QSFP28)',
              quantity: 2,
              unit: 'Units',
              hsnCode: '85176290',
              specifications: 'Layer 3 routing features, redundant hot-swappable fans and power supplies, ONIE support.',
              targetPrice: '450000.00',
              benchmarkPrice: '500000.00',
            }
          ],
          assignedVendors: [
            { vendorId: 'mock-vendor-1', companyName: 'Supernova Logistics & Trading' },
            { vendorId: 'mock-vendor-3', companyName: 'Zenith Tech Systems' }
          ]
        },
        {
          id: 'mock-rfq-2',
          orgId: 'mock-org-1',
          rfqNumber: 'RFQ-2026-000002',
          title: 'Office Stationary and Consumables Supply',
          description: 'Annual rate contract for corporate stationary, printing papers, and desk organizers.',
          status: 'CLOSED' as const,
          totalBudget: '350000.00',
          deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          createdById: 'mock-user-1',
          creatorName: 'Ritu Sharma',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          items: [
            {
              id: 'mock-rfq-item-3',
              itemName: 'Premium A4 Copier Paper (75 GSM, Bright White)',
              quantity: 500,
              unit: 'Boxes',
              hsnCode: '48025690',
              specifications: 'High-speed photocopying compatible, jam-free guarantee, 5 reams per box.',
              targetPrice: '300.00',
              benchmarkPrice: '320.00',
            }
          ],
          assignedVendors: [
            { vendorId: 'mock-vendor-1', companyName: 'Supernova Logistics & Trading' },
            { vendorId: 'mock-vendor-2', companyName: 'Apex Industrial Supplies' }
          ]
        }
      ];

      const allRfqs = [...localRfqs];
      for (const dm of defaultMockRfqs) {
        if (!allRfqs.some(r => r.id === dm.id)) {
          allRfqs.push(dm);
        }
      }

      const currentUser = await getCurrentUser();
      if (currentUser?.role === 'VENDOR') {
        // Find which vendor matches vendor email
        const vendorsRes = await getVendors();
        const vendorRecord = vendorsRes.success
          ? vendorsRes.data.find(v => v.contactEmail === currentUser.email)
          : null;

        if (!vendorRecord) {
          return { success: true, data: [] };
        }

        // Filter RFQs assigned to this vendor
        const filtered = allRfqs.filter(r => 
          r.assignedVendors?.some((av: any) => av.vendorId === vendorRecord.id)
        );
        return { success: true, data: filtered };
      }

      return { success: true, data: allRfqs };
    } catch (cookieErr) {
      console.error('Cookie fallback failed in getRfqs:', cookieErr);
      return { success: false, error: String(error), data: [] };
    }
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
  let user: any = null;
  try {
    user = await getCurrentUser();
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
    if (String(error).includes('Unauthorized') || String(error).includes('Forbidden')) {
      return { success: false, error: String(error) };
    }

    // Fallback: Store locally in cookies
    try {
      const cookieStore = await cookies();
      const localRfqsCookie = cookieStore.get('vendorbridge_local_rfqs')?.value || '[]';
      let localRfqs: any[] = [];
      try {
        localRfqs = JSON.parse(localRfqsCookie);
      } catch {}

      const dateStr = new Date().getFullYear();
      const nextSeq = String(localRfqs.length + 3).padStart(6, '0');
      const rfqNumber = `RFQ-${dateStr}-${nextSeq}`;

      // Load all vendors to resolve companyNames for assignment list
      const vendorsRes = await getVendors();
      const allVendors = vendorsRes.success ? vendorsRes.data : [];

      const assignedVendors = data.vendorIds.map(vid => {
        const match = allVendors.find(v => v.id === vid);
        return {
          vendorId: vid,
          companyName: match ? match.companyName : 'Assigned Vendor',
        };
      });

      const items = data.items.map((item, idx) => ({
        id: `mock-rfq-item-${localRfqs.length + idx + 10}`,
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        hsnCode: item.hsnCode || null,
        specifications: item.specifications || null,
        targetPrice: item.targetPrice || null,
        benchmarkPrice: item.benchmarkPrice,
      }));

      const newRfq = {
        id: 'mock-rfq-' + Math.random().toString(36).substring(2, 9),
        orgId: user?.orgId || 'mock-org-1',
        rfqNumber,
        title: data.title,
        description: data.description,
        deadline: new Date(data.deadline),
        status: 'PUBLISHED' as const,
        totalBudget: data.totalBudget,
        createdById: user?.userId || 'mock-user-1',
        creatorName: user?.role === 'OFFICER' ? 'Ritu Sharma' : 'Aishwarya Nair',
        createdAt: new Date(),
        items,
        assignedVendors,
      };

      localRfqs.push(newRfq);
      cookieStore.set('vendorbridge_local_rfqs', JSON.stringify(localRfqs), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      revalidatePath('/rfqs');
      revalidatePath('/');
      return { success: true, data: newRfq };
    } catch (cookieErr) {
      console.error('Cookie fallback failed in createRfq:', cookieErr);
      return { success: false, error: String(error) };
    }
  }
}
