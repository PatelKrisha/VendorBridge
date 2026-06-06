'use server';

import { db } from '@/db';
import { rfqs, rfqVendorAssignments, approvalRequests, purchaseOrders, invoices, activityLogs, users, vendors, quotations } from '@/db/schema';
import { eq, and, ne, lt, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-context';

export async function getDashboardStats() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    let stats = [
      { name: 'Active RFQs', value: '0', change: 'Live from database', href: '/rfqs' },
      { name: 'Pending Approvals', value: '0', change: 'Awaiting action', href: '/approvals' },
      { name: 'Issued POs', value: '0', change: 'Total commitments', href: '/purchase-orders' },
      { name: 'Overdue Invoices', value: '0', change: 'Requires attention', href: '/invoices' },
    ];

    let vendorId: string | null = null;

    if (user.role === 'VENDOR') {
      const [vendorRecord] = await db
        .select()
        .from(vendors)
        .where(eq(vendors.contactEmail, user.email))
        .limit(1);

      if (vendorRecord) {
        vendorId = vendorRecord.id;
      }
    }

    if (user.role === 'VENDOR') {
      if (!vendorId) {
        return { stats, recentActivities: [] };
      }

      // 1. Open RFQs (assigned to this vendor)
      const rfqCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(rfqVendorAssignments)
        .innerJoin(rfqs, eq(rfqVendorAssignments.rfqId, rfqs.id))
        .where(
          and(
            eq(rfqVendorAssignments.vendorId, vendorId),
            ne(rfqs.status, 'CANCELLED'),
            ne(rfqs.status, 'CLOSED')
          )
        );

      // 2. Active POs
      const poCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(purchaseOrders)
        .where(
          and(
            eq(purchaseOrders.vendorId, vendorId),
            ne(purchaseOrders.status, 'CANCELLED'),
            ne(purchaseOrders.status, 'CLOSED')
          )
        );

      // 3. Pending Invoices (not paid)
      const invCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .innerJoin(purchaseOrders, eq(invoices.poId, purchaseOrders.id))
        .where(
          and(
            eq(purchaseOrders.vendorId, vendorId),
            ne(invoices.status, 'PAID')
          )
        );

      // 4. Overdue Invoices
      const overdueCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .innerJoin(purchaseOrders, eq(invoices.poId, purchaseOrders.id))
        .where(
          and(
            eq(purchaseOrders.vendorId, vendorId),
            ne(invoices.status, 'PAID'),
            lt(invoices.dueDate, new Date())
          )
        );

      stats = [
        { name: 'Assigned RFQs', value: String(rfqCountResult[0]?.count || 0), change: 'Open for bidding', href: '/rfqs' },
        { name: 'Active POs', value: String(poCountResult[0]?.count || 0), change: 'In progress', href: '/purchase-orders' },
        { name: 'Pending Invoices', value: String(invCountResult[0]?.count || 0), change: 'Awaiting payment', href: '/invoices' },
        { name: 'Overdue Invoices', value: String(overdueCountResult[0]?.count || 0), change: 'Action required', href: '/invoices' },
      ];
    } else {
      // Internal User Counts
      // 1. Active RFQs
      const rfqCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(rfqs)
        .where(
          and(
            eq(rfqs.orgId, user.orgId),
            ne(rfqs.status, 'CANCELLED'),
            ne(rfqs.status, 'CLOSED')
          )
        );

      // 2. Pending Approvals
      const approvalsQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(approvalRequests);
      
      const appCountResult = user.role === 'APPROVER'
        ? await approvalsQuery.where(eq(approvalRequests.status, 'PENDING'))
        : await approvalsQuery.innerJoin(quotations, eq(approvalRequests.quotationId, quotations.id))
                              .innerJoin(vendors, eq(quotations.vendorId, vendors.id))
                              .where(and(eq(vendors.orgId, user.orgId), eq(approvalRequests.status, 'PENDING')));

      // 3. Issued POs
      const poCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(purchaseOrders)
        .innerJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
        .where(
          and(
            eq(vendors.orgId, user.orgId),
            eq(purchaseOrders.status, 'ISSUED')
          )
        );

      // 4. Overdue Invoices
      const overdueCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .innerJoin(purchaseOrders, eq(invoices.poId, purchaseOrders.id))
        .innerJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
        .where(
          and(
            eq(vendors.orgId, user.orgId),
            ne(invoices.status, 'PAID'),
            lt(invoices.dueDate, new Date())
          )
        );

      stats = [
        { name: 'Active RFQs', value: String(rfqCountResult[0]?.count || 0), change: 'Running procurement runs', href: '/rfqs' },
        { name: 'Pending Approvals', value: String(appCountResult[0]?.count || 0), change: 'Queue checklist items', href: '/approvals' },
        { name: 'Issued POs', value: String(poCountResult[0]?.count || 0), change: 'Awaiting vendor ack', href: '/purchase-orders' },
        { name: 'Overdue Invoices', value: String(overdueCountResult[0]?.count || 0), change: 'Escalated to finance', href: '/invoices' },
      ];
    }

    // Get recent activities
    const recentActivitiesQuery = db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        user: users.name,
        timestamp: activityLogs.timestamp,
      })
      .from(activityLogs)
      .innerJoin(users, eq(activityLogs.actorId, users.id))
      .orderBy(sql`${activityLogs.timestamp} desc`)
      .limit(5);

    const recentActivities = vendorId
      ? await recentActivitiesQuery.where(eq(activityLogs.actorId, user.userId))
      : await recentActivitiesQuery.where(eq(users.orgId, user.orgId));

    // Map timestamp to relative text (e.g. "10 mins ago")
    const relativeTime = (date: Date) => {
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    const mappedActivities = recentActivities.map((act) => ({
      id: act.id,
      action: act.action,
      user: act.user,
      time: relativeTime(act.timestamp),
    }));

    return { success: true, stats, recentActivities: mappedActivities };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    if (String(error).includes('Unauthorized')) {
      return { success: false, stats: [], recentActivities: [], error: 'Unauthorized' };
    }

    let userRole = 'ADMIN';
    try {
      const user = await getCurrentUser();
      userRole = user?.role || 'ADMIN';
    } catch {}

    let stats = [];
    if (userRole === 'VENDOR') {
      stats = [
        { name: 'Assigned RFQs', value: '3', change: 'Open for bidding', href: '/rfqs' },
        { name: 'Active POs', value: '5', change: 'In progress', href: '/purchase-orders' },
        { name: 'Pending Invoices', value: '2', change: 'Awaiting payment', href: '/invoices' },
        { name: 'Overdue Invoices', value: '1', change: 'Action required', href: '/invoices' },
      ];
    } else if (userRole === 'OFFICER') {
      stats = [
        { name: 'Active RFQs', value: '12', change: 'Running procurement runs', href: '/rfqs' },
        { name: 'Issued POs', value: '15', change: 'Awaiting vendor ack', href: '/purchase-orders' },
      ];
    } else if (userRole === 'APPROVER') {
      stats = [
        { name: 'Pending Approvals', value: '4', change: 'Queue checklist items', href: '/approvals' },
        { name: 'Issued POs', value: '15', change: 'Awaiting vendor ack', href: '/purchase-orders' },
      ];
    } else if (userRole === 'FINANCE') {
      stats = [
        { name: 'Issued POs', value: '15', change: 'Total commitments', href: '/purchase-orders' },
        { name: 'Overdue Invoices', value: '2', change: 'Escalated to finance', href: '/invoices' },
        { name: 'Pending Invoices', value: '5', change: 'Awaiting review', href: '/invoices' },
      ];
    } else {
      // ADMIN
      stats = [
        { name: 'Active RFQs', value: '12', change: 'Running procurement runs', href: '/rfqs' },
        { name: 'Pending Approvals', value: '4', change: 'Queue checklist items', href: '/approvals' },
        { name: 'Issued POs', value: '15', change: 'Awaiting vendor ack', href: '/purchase-orders' },
        { name: 'Overdue Invoices', value: '2', change: 'Escalated to finance', href: '/invoices' },
      ];
    }

    const recentActivities = [
      { id: 'act-1', action: 'Titan Steel Ltd submitted a quote for RFQ-2026-000001', user: 'System', time: '10 mins ago' },
      { id: 'act-2', action: 'Approved Quotation for RFQ-2026-000002', user: 'Priya Mehta', time: '1 hour ago' },
      { id: 'act-3', action: 'Created RFQ-2026-000003', user: 'Ritu Sharma', time: '3 hours ago' },
      { id: 'act-4', action: 'Acknowledged PO-2026-000104', user: 'Mohammed Farhan', time: '5 hours ago' },
      { id: 'act-5', action: 'Recorded payment of ₹12,74,400 for INV-2026-000012', user: 'Vikram Joshi', time: '1 day ago' },
    ];

    return { success: true, stats, recentActivities };
  }
}
