import { pgTable, uuid, varchar, text, timestamp, boolean, integer, numeric, jsonb, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'OFFICER', 'APPROVER', 'FINANCE', 'VENDOR']);
export const vendorStatusEnum = pgEnum('vendor_status', ['PENDING', 'ACTIVE', 'SUSPENDED', 'BLACKLISTED']);
export const rfqStatusEnum = pgEnum('rfq_status', ['DRAFT', 'PUBLISHED', 'CLOSED', 'AWARDED', 'CANCELLED']);
export const quotationStatusEnum = pgEnum('quotation_status', ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'AWARDED', 'REJECTED', 'EXPIRED', 'WITHDRAWN']);
export const approvalStatusEnum = pgEnum('approval_status', ['PENDING', 'APPROVED', 'REJECTED', 'ESCALATED', 'DELEGATED', 'CONFLICT_SKIPPED']);
export const approvalActionEnum = pgEnum('approval_action', ['APPROVED', 'REJECTED', 'DELEGATED', 'CONFLICT_SKIPPED']);
export const poStatusEnum = pgEnum('po_status', ['DRAFT', 'ISSUED', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CLOSED', 'CANCELLED']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['DRAFT', 'ISSUED', 'SENT', 'ACKNOWLEDGED', 'PAID', 'OVERDUE']);
export const paymentMethodEnum = pgEnum('payment_method', ['NEFT', 'RTGS', 'CHEQUE', 'CARD', 'UPI']);
export const bankHistoryStatusEnum = pgEnum('bank_history_status', ['PENDING', 'ACTIVE']);

// 1. Organizations Table
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  gstNumber: varchar('gst_number', { length: 15 }).unique(),
  pan: varchar('pan', { length: 10 }).unique(),
  address: text('address'),
  logoUrl: text('logo_url'),
  primaryEmail: varchar('primary_email', { length: 255 }),
  smtpConfig: jsonb('smtp_config'), // Encrypted config
  minRfqVendors: integer('min_rfq_vendors').default(3).notNull(),
  vendorSelfRegisterEnabled: boolean('vendor_self_register_enabled').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('OFFICER').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  mfaSecret: text('mfa_secret'),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Vendors Table
export const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  gstNumber: varchar('gst_number', { length: 15 }).notNull(),
  pan: varchar('pan', { length: 10 }).notNull(),
  category: jsonb('category').$type<string[]>().default([]).notNull(), // Array of categories
  bankDetails: jsonb('bank_details'), // Encrypted JSON
  status: vendorStatusEnum('status').default('PENDING').notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  performanceScore: numeric('performance_score', { precision: 5, scale: 2 }).default('100.00'),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('vendors_org_id_status_idx').on(table.orgId, table.status),
]);

// 4. Vendor Bank History (new in v2.0 - Gap G-04)
export const vendorBankHistory = pgTable('vendor_bank_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  oldValues: jsonb('old_values'), // Encrypted JSON
  newValues: jsonb('new_values'), // Encrypted JSON
  changedBy: uuid('changed_by').references(() => users.id).notNull(),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
  verifiedAt: timestamp('verified_at'),
  status: bankHistoryStatusEnum('status').default('PENDING').notNull(),
});

// 5. Vendor Documents
export const vendorDocuments = pgTable('vendor_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  documentName: varchar('document_name', { length: 255 }).notNull(),
  documentUrl: text('document_url').notNull(),
  documentType: varchar('document_type', { length: 50 }).notNull(), // GST, PAN, INCORPORATION, etc.
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// 6. RFQs Table
export const rfqs = pgTable('rfqs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id).notNull(),
  rfqNumber: varchar('rfq_number', { length: 50 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  deadline: timestamp('deadline').notNull(),
  status: rfqStatusEnum('status').default('DRAFT').notNull(),
  totalBudget: numeric('total_budget', { precision: 15, scale: 2 }),
  createdById: uuid('created_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 7. RFQ Items
export const rfqItems = pgTable('rfq_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  rfqId: uuid('rfq_id').references(() => rfqs.id).notNull(),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  unit: varchar('unit', { length: 50 }).notNull(), // KGS, PCS, LTRS, etc.
  hsnCode: varchar('hsn_code', { length: 8 }),
  specifications: text('specifications'),
  targetPrice: numeric('target_price', { precision: 12, scale: 2 }),
  benchmarkPrice: numeric('benchmark_price', { precision: 12, scale: 2 }).notNull(), // Gap G-15
}, (table) => [
  index('rfq_items_rfq_id_idx').on(table.rfqId),
]);

// 8. RFQ Vendor Assignments
export const rfqVendorAssignments = pgTable('rfq_vendor_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  rfqId: uuid('rfq_id').references(() => rfqs.id).notNull(),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
});

// 9. Quotations
export const quotations = pgTable('quotations', {
  id: uuid('id').defaultRandom().primaryKey(),
  rfqId: uuid('rfq_id').references(() => rfqs.id).notNull(),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  status: quotationStatusEnum('status').default('DRAFT').notNull(),
  validityDays: integer('validity_days').default(30).notNull(),
  notes: text('notes'),
  version: integer('version').default(1).notNull(),
  submittedAt: timestamp('submitted_at'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('quotations_rfq_id_status_idx').on(table.rfqId, table.status),
]);

// 10. Quotation Items
export const quotationItems = pgTable('quotation_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  quotationId: uuid('quotation_id').references(() => quotations.id).notNull(),
  rfqItemId: uuid('rfq_item_id').references(() => rfqItems.id).notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 5, scale: 2 }).default('0.00').notNull(),
  deliveryDays: integer('delivery_days').notNull(),
  taxRate: numeric('tax_rate', { precision: 4, scale: 2 }).default('18.00').notNull(), // GST standard
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
  zeroPriceJustification: text('zero_price_justification'), // Gap G-07
}, (table) => [
  index('quotation_items_quotation_id_idx').on(table.quotationId),
]);

// 11. Approval Requests
export const approvalRequests = pgTable('approval_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  quotationId: uuid('quotation_id').references(() => quotations.id).notNull(),
  currentLevel: integer('current_level').default(1).notNull(),
  maxLevels: integer('max_levels').default(1).notNull(),
  status: approvalStatusEnum('status').default('PENDING').notNull(),
  initiatedBy: uuid('initiated_by').references(() => users.id).notNull(),
  initiatedAt: timestamp('initiated_at').defaultNow().notNull(),
  version: integer('version').default(1).notNull(), // Optimistic locking
});

// 12. Approval Actions
export const approvalActions = pgTable('approval_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id').references(() => approvalRequests.id).notNull(),
  approverId: uuid('approver_id').references(() => users.id).notNull(),
  level: integer('level').notNull(),
  action: approvalActionEnum('action').notNull(),
  remarks: text('remarks').notNull(),
  actedAt: timestamp('acted_at').defaultNow().notNull(),
});

// 13. Purchase Orders
export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  poNumber: varchar('po_number', { length: 50 }).notNull().unique(),
  quotationId: uuid('quotation_id').references(() => quotations.id).notNull(),
  rfqAwardId: uuid('rfq_award_id').notNull(), // links related awards in split-PO cases (Gap G-09)
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  status: poStatusEnum('status').default('DRAFT').notNull(),
  deliveryAddress: text('delivery_address').notNull(),
  paymentTerms: text('payment_terms').notNull(),
  issuedAt: timestamp('issued_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 14. PO Items
export const poItems = pgTable('po_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  poId: uuid('po_id').references(() => purchaseOrders.id).notNull(),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  taxRate: numeric('tax_rate', { precision: 4, scale: 2 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
});

// 15. GRN Items (new in v2.0 - Gap G-12)
export const grnItems = pgTable('grn_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  poId: uuid('po_id').references(() => purchaseOrders.id).notNull(),
  poItemId: uuid('po_item_id').references(() => poItems.id).notNull(),
  receivedQty: integer('received_qty').notNull(),
  grnDate: timestamp('grn_date').defaultNow().notNull(),
  receivedBy: uuid('received_by').references(() => users.id).notNull(),
  discrepancyFlag: boolean('discrepancy_flag').default(false).notNull(),
  discrepancyNotes: text('discrepancy_notes'),
  resolvedAt: timestamp('resolved_at'),
});

// 16. Invoices
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  poId: uuid('po_id').references(() => purchaseOrders.id).notNull(),
  status: invoiceStatusEnum('status').default('DRAFT').notNull(),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
  cgst: numeric('cgst', { precision: 15, scale: 2 }).default('0.00').notNull(),
  sgst: numeric('sgst', { precision: 15, scale: 2 }).default('0.00').notNull(),
  igst: numeric('igst', { precision: 15, scale: 2 }).default('0.00').notNull(),
  total: numeric('total', { precision: 15, scale: 2 }).notNull(),
  dueDate: timestamp('due_date').notNull(),
  sentAt: timestamp('sent_at'),
  emailDeliveryStatus: varchar('email_delivery_status', { length: 50 }),
  irn: varchar('irn', { length: 64 }), // e-invoicing reference number (Gap G-14)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('invoices_status_due_date_idx').on(table.status, table.dueDate),
]);

// 17. Payment Records (new in v2.0 - Gap G-13)
export const paymentRecords = pgTable('payment_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').references(() => invoices.id).notNull(),
  paymentDate: timestamp('payment_date').defaultNow().notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  method: paymentMethodEnum('method').notNull(),
  referenceNumber: varchar('reference_number', { length: 100 }).notNull(),
  recordedBy: uuid('recorded_by').references(() => users.id).notNull(),
  notes: text('notes'),
});

// 18. Activity Logs (NFR-DB-01 / Gap G-18 / G-24)
export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  actorId: uuid('actor_id').references(() => users.id).notNull(),
  actorRole: varchar('actor_role', { length: 50 }).notNull(),
  metadata: jsonb('metadata'),
  ipAddress: varchar('ip_address', { length: 45 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => [
  index('activity_logs_entity_id_timestamp_idx').on(table.entityId, table.timestamp),
  index('activity_logs_actor_id_timestamp_idx').on(table.actorId, table.timestamp),
]);

// Relationships
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  vendors: many(vendors),
  rfqs: many(rfqs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.orgId],
    references: [organizations.id],
  }),
  approvalActions: many(approvalActions),
  activityLogs: many(activityLogs),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [vendors.orgId],
    references: [organizations.id],
  }),
  bankHistory: many(vendorBankHistory),
  documents: many(vendorDocuments),
  quotations: many(quotations),
  purchaseOrders: many(purchaseOrders),
}));

export const vendorBankHistoryRelations = relations(vendorBankHistory, ({ one }) => ({
  vendor: one(vendors, {
    fields: [vendorBankHistory.vendorId],
    references: [vendors.id],
  }),
  user: one(users, {
    fields: [vendorBankHistory.changedBy],
    references: [users.id],
  }),
}));

export const vendorDocumentsRelations = relations(vendorDocuments, ({ one }) => ({
  vendor: one(vendors, {
    fields: [vendorDocuments.vendorId],
    references: [vendors.id],
  }),
}));

export const rfqsRelations = relations(rfqs, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [rfqs.orgId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [rfqs.createdById],
    references: [users.id],
  }),
  items: many(rfqItems),
  assignments: many(rfqVendorAssignments),
  quotations: many(quotations),
}));

export const rfqItemsRelations = relations(rfqItems, ({ one, many }) => ({
  rfq: one(rfqs, {
    fields: [rfqItems.rfqId],
    references: [rfqs.id],
  }),
  quotationItems: many(quotationItems),
}));

export const rfqVendorAssignmentsRelations = relations(rfqVendorAssignments, ({ one }) => ({
  rfq: one(rfqs, {
    fields: [rfqVendorAssignments.rfqId],
    references: [rfqs.id],
  }),
  vendor: one(vendors, {
    fields: [rfqVendorAssignments.vendorId],
    references: [vendors.id],
  }),
}));

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  rfq: one(rfqs, {
    fields: [quotations.rfqId],
    references: [rfqs.id],
  }),
  vendor: one(vendors, {
    fields: [quotations.vendorId],
    references: [vendors.id],
  }),
  items: many(quotationItems),
  approvalRequest: one(approvalRequests, {
    fields: [quotations.id],
    references: [approvalRequests.quotationId],
  }),
  purchaseOrders: many(purchaseOrders),
}));

export const quotationItemsRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationItems.quotationId],
    references: [quotations.id],
  }),
  rfqItem: one(rfqItems, {
    fields: [quotationItems.rfqItemId],
    references: [rfqItems.id],
  }),
}));

export const approvalRequestsRelations = relations(approvalRequests, ({ one, many }) => ({
  quotation: one(quotations, {
    fields: [approvalRequests.quotationId],
    references: [quotations.id],
  }),
  initiator: one(users, {
    fields: [approvalRequests.initiatedBy],
    references: [users.id],
  }),
  actions: many(approvalActions),
}));

export const approvalActionsRelations = relations(approvalActions, ({ one }) => ({
  request: one(approvalRequests, {
    fields: [approvalActions.requestId],
    references: [approvalRequests.id],
  }),
  approver: one(users, {
    fields: [approvalActions.approverId],
    references: [users.id],
  }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  quotation: one(quotations, {
    fields: [purchaseOrders.quotationId],
    references: [quotations.id],
  }),
  vendor: one(vendors, {
    fields: [purchaseOrders.vendorId],
    references: [vendors.id],
  }),
  items: many(poItems),
  grnItems: many(grnItems),
  invoice: one(invoices, {
    fields: [purchaseOrders.id],
    references: [invoices.poId],
  }),
}));

export const poItemsRelations = relations(poItems, ({ one, many }) => ({
  po: one(purchaseOrders, {
    fields: [poItems.poId],
    references: [purchaseOrders.id],
  }),
  grnItems: many(grnItems),
}));

export const grnItemsRelations = relations(grnItems, ({ one }) => ({
  po: one(purchaseOrders, {
    fields: [grnItems.poId],
    references: [purchaseOrders.id],
  }),
  poItem: one(poItems, {
    fields: [grnItems.poItemId],
    references: [poItems.id],
  }),
  receiver: one(users, {
    fields: [grnItems.receivedBy],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  po: one(purchaseOrders, {
    fields: [invoices.poId],
    references: [purchaseOrders.id],
  }),
  paymentRecords: many(paymentRecords),
}));

export const paymentRecordsRelations = relations(paymentRecords, ({ one }) => ({
  invoice: one(invoices, {
    fields: [paymentRecords.invoiceId],
    references: [invoices.id],
  }),
  recorder: one(users, {
    fields: [paymentRecords.recordedBy],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  actor: one(users, {
    fields: [activityLogs.actorId],
    references: [users.id],
  }),
}));

