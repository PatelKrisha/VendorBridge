import { client, db } from './index';
import * as schema from './schema';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');

  // Reset database (order matters for foreign key constraints)
  console.log('Cleaning up existing records...');
  await db.delete(schema.activityLogs);
  await db.delete(schema.paymentRecords);
  await db.delete(schema.invoices);
  await db.delete(schema.grnItems);
  await db.delete(schema.poItems);
  await db.delete(schema.purchaseOrders);
  await db.delete(schema.approvalActions);
  await db.delete(schema.approvalRequests);
  await db.delete(schema.quotationItems);
  await db.delete(schema.quotations);
  await db.delete(schema.rfqVendorAssignments);
  await db.delete(schema.rfqItems);
  await db.delete(schema.rfqs);
  await db.delete(schema.vendorDocuments);
  await db.delete(schema.vendorBankHistory);
  await db.delete(schema.vendors);
  await db.delete(schema.users);
  await db.delete(schema.organizations);

  // 1. Create Organization
  console.log('Creating organization...');
  const [org] = await db.insert(schema.organizations).values({
    name: 'Acme Global Corporation',
    gstNumber: '27AAACA1234A1Z1',
    pan: 'AAACA1234A',
    address: '101, Business Tower, Bandra Kurla Complex, Mumbai, Maharashtra, 400051',
    primaryEmail: 'procurement@acme.com',
    minRfqVendors: 3,
    vendorSelfRegisterEnabled: true,
  }).returning();

  // Hash passwords
  const passwordHash = await bcrypt.hash('Password@1234', 12);

  // 2. Create Users (one for each role)
  console.log('Creating users...');
  const [adminUser] = await db.insert(schema.users).values({
    orgId: org.id,
    name: 'Aishwarya Nair',
    email: 'admin@acme.com',
    passwordHash,
    role: 'ADMIN',
  }).returning();

  const [officerUser] = await db.insert(schema.users).values({
    orgId: org.id,
    name: 'Ritu Sharma',
    email: 'officer@acme.com',
    passwordHash,
    role: 'OFFICER',
  }).returning();

  const [approverUser] = await db.insert(schema.users).values({
    orgId: org.id,
    name: 'Priya Mehta',
    email: 'approver@acme.com',
    passwordHash,
    role: 'APPROVER',
  }).returning();

  const [financeUser] = await db.insert(schema.users).values({
    orgId: org.id,
    name: 'Vikram Joshi',
    email: 'finance@acme.com',
    passwordHash,
    role: 'FINANCE',
  }).returning();

  // 3. Create Vendors
  console.log('Creating vendors...');
  const [vendor1] = await db.insert(schema.vendors).values({
    orgId: org.id,
    companyName: 'Supernova Logistics & Trading',
    gstNumber: '27AAASL5678B1Z2',
    pan: 'AAASL5678B',
    category: ['Logistics', 'Office Supplies'],
    bankDetails: {
      accountNumber: '123456789012',
      ifsc: 'SBIN0001234',
      beneficiaryName: 'Supernova Logistics & Trading',
    },
    status: 'ACTIVE',
    contactPerson: 'Mohammed Farhan',
    contactEmail: 'farhan@supernova.com',
    performanceScore: '94.50',
  }).returning();

  const [vendor2] = await db.insert(schema.vendors).values({
    orgId: org.id,
    companyName: 'Apex Industrial Supplies',
    gstNumber: '27AAAAP9999C1Z3',
    pan: 'AAAAP9999C',
    category: ['Industrial', 'Hardware'],
    bankDetails: {
      accountNumber: '987654321098',
      ifsc: 'HDFC0005678',
      beneficiaryName: 'Apex Industrial Supplies',
    },
    status: 'ACTIVE',
    contactPerson: 'Sanjay Gupta',
    contactEmail: 'sanjay@apex.com',
    performanceScore: '98.20',
  }).returning();

  const [vendor3] = await db.insert(schema.vendors).values({
    orgId: org.id,
    companyName: 'Zenith Tech Systems',
    gstNumber: '27AAAZT8888D1Z4',
    pan: 'AAAZT8888D',
    category: ['IT Hardware', 'Software'],
    bankDetails: {
      accountNumber: '555566667777',
      ifsc: 'ICIC0000456',
      beneficiaryName: 'Zenith Tech Systems',
    },
    status: 'ACTIVE',
    contactPerson: 'Aditi Rao',
    contactEmail: 'aditi@zenith.com',
    performanceScore: '91.80',
  }).returning();

  const [vendor4] = await db.insert(schema.vendors).values({
    orgId: org.id,
    companyName: 'Vanguard Electronics',
    gstNumber: '27AAAVE1111E1Z5',
    pan: 'AAAVE1111E',
    category: ['IT Hardware', 'Electronics'],
    bankDetails: {
      accountNumber: '222233334444',
      ifsc: 'BARB0BOMKEY',
      beneficiaryName: 'Vanguard Electronics',
    },
    status: 'PENDING',
    contactPerson: 'Rohan Deshmukh',
    contactEmail: 'rohan@vanguard.com',
    performanceScore: '100.00',
  }).returning();

  // Create Vendor login user linked to vendor1
  const [vendorUser] = await db.insert(schema.users).values({
    orgId: org.id,
    name: 'Mohammed Farhan',
    email: 'vendor@supernova.com',
    passwordHash,
    role: 'VENDOR',
  }).returning();

  // 4. Create RFQ
  console.log('Creating RFQs...');
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 14); // 14 days from now

  const [rfq1] = await db.insert(schema.rfqs).values({
    orgId: org.id,
    rfqNumber: 'RFQ-2026-000001',
    title: 'Acme IT Infrastructure Upgrade',
    description: 'Procurement of high-performance servers, switches, and UPS hardware for primary data center upgrade.',
    deadline,
    status: 'PUBLISHED',
    totalBudget: '1500000.00',
    createdById: officerUser.id,
  }).returning();

  // RFQ Items
  console.log('Creating RFQ items...');
  const [rfq1Item1] = await db.insert(schema.rfqItems).values({
    rfqId: rfq1.id,
    itemName: 'Enterprise Server Rack 2U (Dual Xeon 32-Core, 256GB RAM, 8TB SSD)',
    quantity: 3,
    unit: 'PCS',
    hsnCode: '84713010',
    specifications: 'Must support dual power supply, hardware RAID controller, and 10GbE network cards.',
    targetPrice: '350000.00',
    benchmarkPrice: '370000.00',
  }).returning();

  const [rfq1Item2] = await db.insert(schema.rfqItems).values({
    rfqId: rfq1.id,
    itemName: 'Managed L3 Network Switch 48-Port PoE+ (10G SFP+ Uplinks)',
    quantity: 2,
    unit: 'PCS',
    hsnCode: '85176290',
    specifications: 'Minimum 370W PoE budget, CLI managed, stacking support.',
    targetPrice: '750000.00', // Total budget includes switches
    benchmarkPrice: '120000.00',
  }).returning();

  // Assign Vendors to RFQ
  console.log('Assigning vendors to RFQ...');
  await db.insert(schema.rfqVendorAssignments).values([
    { rfqId: rfq1.id, vendorId: vendor1.id },
    { rfqId: rfq1.id, vendorId: vendor2.id },
    { rfqId: rfq1.id, vendorId: vendor3.id },
  ]);

  // 5. Create Quotation for Vendor 1
  console.log('Creating quotations...');
  const [quote1] = await db.insert(schema.quotations).values({
    rfqId: rfq1.id,
    vendorId: vendor1.id,
    status: 'SUBMITTED',
    validityDays: 45,
    notes: 'We can deliver these items within the requested timelines. Prices include delivery and installation support.',
    submittedAt: new Date(),
    totalAmount: '1270000.00',
  }).returning();

  // Quotation Items for Quote 1
  await db.insert(schema.quotationItems).values([
    {
      quotationId: quote1.id,
      rfqItemId: rfq1Item1.id,
      unitPrice: '360000.00',
      discount: '2.50',
      deliveryDays: 10,
      taxRate: '18.00',
      subtotal: '1053000.00',
    },
    {
      quotationId: quote1.id,
      rfqItemId: rfq1Item2.id,
      unitPrice: '115000.00',
      discount: '4.00',
      deliveryDays: 7,
      taxRate: '18.00',
      subtotal: '2208000.00',
    },
  ]);

  console.log('Database seeded successfully!');
  client.end();
}

main().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
