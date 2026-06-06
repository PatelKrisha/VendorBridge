import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Monkey-patch fs.readFileSync to redirect .afm font lookups to the correct node_modules path
const originalReadFileSync = fs.readFileSync;
(fs as any).readFileSync = function (filePath: any, options: any) {
  if (typeof filePath === 'string' && filePath.endsWith('.afm')) {
    const fontName = path.basename(filePath);
    const actualPath = path.join(
      'c:\\Users\\np133\\Downloads\\VendorBridge ERP\\node_modules\\pdfkit\\js\\data',
      fontName
    );
    return originalReadFileSync(actualPath, options);
  }
  return originalReadFileSync(filePath, options);
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || '1';

    // Mock Invoices database
    const invoices = [
      { 
        id: '1', 
        invoiceNumber: 'INV-2026-000010', 
        poNumber: 'PO-2026-000101', 
        vendor: 'Supernova Logistics & Trading', 
        vendorGst: '27AAASL5678B1Z2',
        dueDate: '2026-06-30', 
        status: 'ISSUED', 
        subtotal: 1053000, 
        cgst: 94770, 
        sgst: 94770, 
        igst: 0, 
        total: 1242540,
        items: [
          { name: 'Enterprise Server Rack 2U (Dual Xeon 32-Core, 256GB RAM, 8TB SSD)', qty: 3, price: 350000, tax: 18 }
        ]
      },
      { 
        id: '2', 
        invoiceNumber: 'INV-2026-000011', 
        poNumber: 'PO-2026-000102', 
        vendor: 'Apex Industrial Supplies', 
        vendorGst: '27AAAAP9999C1Z3',
        dueDate: '2026-06-25', 
        status: 'PAID', 
        subtotal: 220800, 
        cgst: 19872, 
        sgst: 19872, 
        igst: 0, 
        total: 260544,
        items: [
          { name: 'Managed L3 Network Switch 48-Port PoE+ (10G SFP+ Uplinks)', qty: 2, price: 110400, tax: 18 }
        ]
      },
      { 
        id: '3', 
        invoiceNumber: 'INV-2026-000012', 
        poNumber: 'PO-2026-000103', 
        vendor: 'Zenith Tech Systems', 
        vendorGst: '27AAAZT8888D1Z4',
        dueDate: '2026-06-05', 
        status: 'OVERDUE', 
        subtotal: 540000, 
        cgst: 48600, 
        sgst: 48600, 
        igst: 0, 
        total: 637200,
        items: [
          { name: 'Standard Office Workstation Desks', qty: 10, price: 54000, tax: 18 }
        ]
      },
    ];

    let inv: any;
    const existingInv = invoices.find((i) => i.id === id);
    if (!existingInv) {
      const dataParam = searchParams.get('data');
      if (dataParam) {
        try {
          inv = JSON.parse(decodeURIComponent(dataParam));
        } catch (e) {
          inv = invoices[0];
        }
      } else {
        inv = invoices[0];
      }
    } else {
      inv = existingInv;
    }

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Uint8Array[] = [];

    const bufferPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));
    });

    // 1. Header (Primary Navy Color)
    doc.fillColor('#1A3C5E')
       .fontSize(22)
       .text('TAX INVOICE', 50, 50, { align: 'right' });

    doc.fillColor('#64748b')
       .fontSize(8)
       .text('VendorBridge ERP Platform Generated', 50, 75, { align: 'right' });

    // 2. Billing / Company Info
    doc.fillColor('#0f172a')
       .fontSize(10)
       .text('Acme Global Corporation', 50, 100, { underline: true })
       .fontSize(9)
       .fillColor('#334155')
       .text('101, Business Tower, Bandra Kurla Complex')
       .text('Mumbai, Maharashtra, 400051')
       .text('GSTIN: 27AAACA1234A1Z1')
       .text('Email: procurement@acme.com');

    // 3. Invoice Meta Block
    doc.fillColor('#0f172a')
       .fontSize(10)
       .text('Invoice Details', 350, 100, { underline: true })
       .fontSize(9)
       .fillColor('#334155')
       .text(`Invoice Number: ${inv.invoiceNumber}`)
       .text(`Date of Issue: 2026-06-06`)
       .text(`Due Date: ${inv.dueDate}`)
       .text(`PO Reference: ${inv.poNumber}`);

    // Horizontal Divider line
    doc.moveTo(50, 170).lineTo(550, 170).strokeColor('#cbd5e1').lineWidth(1).stroke();

    // 4. Vendor Details
    doc.fillColor('#0f172a')
       .fontSize(10)
       .text('Billing From (Vendor):', 50, 185, { underline: true })
       .fontSize(9)
       .fillColor('#334155')
       .text(inv.vendor)
       .text(`GSTIN: ${inv.vendorGst}`)
       .text('Status: Verified Supplier');

    // Horizontal Divider line
    doc.moveTo(50, 240).lineTo(550, 240).strokeColor('#cbd5e1').stroke();

    // 5. Items Table Header
    let y = 260;
    doc.fillColor('#1A3C5E')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text('Item Description', 50, y, { width: 240 })
       .text('Qty', 300, y, { width: 40, align: 'center' })
       .text('Unit Price', 350, y, { width: 70, align: 'right' })
       .text('Tax Rate', 430, y, { width: 50, align: 'right' })
       .text('Amount (INR)', 490, y, { width: 60, align: 'right' })
       .font('Helvetica');

    // Underline header
    doc.moveTo(50, y + 15).lineTo(550, y + 15).strokeColor('#e2e8f0').stroke();

    // Table items
    y += 25;
    doc.fillColor('#334155').fontSize(8.5);
    inv.items.forEach((item: any) => {
      // Determine height of item description to prevent overlap if it wraps
      const itemHeight = Math.max(
        doc.heightOfString(item.name, { width: 240 }),
        14
      );

      // Draw item details with explicit bounding boxes
      doc.text(item.name, 50, y, { width: 240 });
      doc.text(item.qty.toString(), 300, y, { width: 40, align: 'center' });
      doc.text(`INR ${item.price.toLocaleString()}`, 350, y, { width: 70, align: 'right' });
      doc.text(`${item.tax}%`, 430, y, { width: 50, align: 'right' });
      doc.text(`INR ${(item.qty * item.price).toLocaleString()}`, 490, y, { width: 60, align: 'right' });

      y += itemHeight + 8; // Move down based on the height of the row + padding
    });

    // Divider before totals
    doc.moveTo(50, y).lineTo(550, y).strokeColor('#cbd5e1').stroke();
    y += 15;

    // 6. Tax and Summary calculations
    doc.fillColor('#64748b')
       .fontSize(9)
       .text('Subtotal:', 300, y, { width: 180, align: 'right' })
       .text(`INR ${inv.subtotal.toLocaleString()}`, 490, y, { width: 60, align: 'right' });
    y += 15;

    doc.text('CGST (9%):', 300, y, { width: 180, align: 'right' })
       .text(`INR ${inv.cgst.toLocaleString()}`, 490, y, { width: 60, align: 'right' });
    y += 15;

    doc.text('SGST (9%):', 300, y, { width: 180, align: 'right' })
       .text(`INR ${inv.sgst.toLocaleString()}`, 490, y, { width: 60, align: 'right' });
    y += 15;

    doc.fillColor('#1A3C5E')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('Total Amount (Inclusive of GST):', 300, y, { width: 180, align: 'right' })
       .text(`INR ${inv.total.toLocaleString()}`, 490, y, { width: 60, align: 'right' })
       .font('Helvetica');

    // 7. Footer
    doc.fillColor('#94a3b8')
       .fontSize(7)
       .text('Thank you for your business. This is a computer-generated invoice and requires no physical signature.', 50, 700, { align: 'center' });

    doc.end();

    const buffer = await bufferPromise;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${inv.invoiceNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || String(error), stack: error.stack },
      { status: 500 }
    );
  }
}
