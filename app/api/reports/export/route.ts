import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import ExcelJS from "exceljs";

// ── Helpers ──────────────────────────────────────────────

function headerStyle(cell: ExcelJS.Cell, bg = "1E40AF") {
  cell.font      = { bold: true, color: { argb: "FFFFFF" }, size: 11 };
  cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  cell.border    = {
    top:    { style: "thin", color: { argb: "CCCCCC" } },
    bottom: { style: "thin", color: { argb: "CCCCCC" } },
    left:   { style: "thin", color: { argb: "CCCCCC" } },
    right:  { style: "thin", color: { argb: "CCCCCC" } },
  };
}

function rowBorder(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.border = {
      top:    { style: "thin", color: { argb: "EEEEEE" } },
      bottom: { style: "thin", color: { argb: "EEEEEE" } },
      left:   { style: "thin", color: { argb: "EEEEEE" } },
      right:  { style: "thin", color: { argb: "EEEEEE" } },
    };
    cell.alignment = { vertical: "middle" };
  });
}

// ── Handler ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to   = searchParams.get("to");
    const type = searchParams.get("type") ?? "sales";

    const dateFilter = from && to ? {
      orderDate: {
        gte: new Date(from),
        lte: new Date(new Date(to).setHours(23, 59, 59, 999)),
      },
    } : {};

    const wb = new ExcelJS.Workbook();
    wb.creator  = "CRM Admin";
    wb.created  = new Date();

    // ════════════════════════════════════════
    // SALES EXPORT
    // ════════════════════════════════════════
    if (type === "sales") {
      const orders = await prisma.orderMaster.findMany({
        where: { ...dateFilter, orderStatus: { notIn: ["CANCELLED", "PAYMENT_PENDING"] } },
        orderBy: { orderDate: "desc" },
        include: { orderDetails: { select: { productName: true, quantity: true, total: true } } },
      });

      const ws = wb.addWorksheet("Sales Report");
      ws.properties.defaultRowHeight = 20;

      // Title
      ws.mergeCells("A1:K1");
      const title = ws.getCell("A1");
      title.value     = `Sales Report${from ? ` — ${from} to ${to}` : ""}`;
      title.font      = { bold: true, size: 14, color: { argb: "1E40AF" } };
      title.alignment = { horizontal: "center", vertical: "middle" };
      ws.getRow(1).height = 28;
      ws.addRow([]);

      // Headers
      const headers = [
        "Order #", "Date", "Customer Name", "Email", "Phone",
        "Items", "Item Total (₹)", "Delivery (₹)", "GST (₹)",
        "Grand Total (₹)", "Status", "Payment Mode",
      ];
      const headerRow = ws.addRow(headers);
      headerRow.eachCell((cell) => headerStyle(cell));
      headerRow.height = 22;

      // Column widths
      [18, 14, 22, 28, 14, 30, 16, 14, 12, 16, 14, 14].forEach((w, i) => {
        ws.getColumn(i + 1).width = w;
      });

      // Data rows
      orders.forEach((o, idx) => {
        const items = o.orderDetails.map((d) => `${d.productName} ×${d.quantity}`).join(", ");
        const row = ws.addRow([
          o.orderNumber,
          new Date(o.orderDate).toLocaleDateString("en-IN"),
          o.custName,
          o.custEmail,
          o.custNumber,
          items,
          Number(o.itemTotal),
          Number(o.deliveryFee ?? 0),
          Number(o.gstCharges),
          Number(o.grandtotal),
          o.orderStatus,
          o.paymentMode ?? "",
        ]);
        row.getCell(7).numFmt  = "#,##0.00";
        row.getCell(8).numFmt  = "#,##0.00";
        row.getCell(9).numFmt  = "#,##0.00";
        row.getCell(10).numFmt = "#,##0.00";
        if (idx % 2 === 1) {
          row.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F8FAFF" } };
          });
        }
        rowBorder(row);
      });

      // Summary
      ws.addRow([]);
      const totalRow = ws.addRow([
        "TOTAL", "", "", "", "", "",
        orders.reduce((s, o) => s + Number(o.itemTotal), 0),
        orders.reduce((s, o) => s + Number(o.deliveryFee ?? 0), 0),
        orders.reduce((s, o) => s + Number(o.gstCharges), 0),
        orders.reduce((s, o) => s + Number(o.grandtotal), 0),
        `${orders.length} orders`, "",
      ]);
      totalRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "EFF6FF" } };
      });
      [7, 8, 9, 10].forEach((c) => { totalRow.getCell(c).numFmt = "#,##0.00"; });

    // ════════════════════════════════════════
    // PRODUCTS EXPORT
    // ════════════════════════════════════════
    } else if (type === "products") {
      const details = await prisma.orderDetail.findMany({
        where: { orderMaster: { ...dateFilter, orderStatus: { notIn: ["CANCELLED", "PAYMENT_PENDING"] } } },
        select: { productName: true, sku: true, quantity: true, unitPrice: true, total: true },
      });

      const map: Record<string, any> = {};
      for (const d of details) {
        if (!map[d.sku]) map[d.sku] = { productName: d.productName, sku: d.sku, qty: 0, revenue: 0, orders: 0 };
        map[d.sku].qty     += d.quantity;
        map[d.sku].revenue += Number(d.total);
        map[d.sku].orders  += 1;
      }
      const products = Object.values(map).sort((a, b) => b.revenue - a.revenue);

      const ws = wb.addWorksheet("Product Performance");
      ws.properties.defaultRowHeight = 20;

      ws.mergeCells("A1:F1");
      const title = ws.getCell("A1");
      title.value     = "Product Performance Report";
      title.font      = { bold: true, size: 14, color: { argb: "065F46" } };
      title.alignment = { horizontal: "center", vertical: "middle" };
      ws.getRow(1).height = 28;
      ws.addRow([]);

      const headerRow = ws.addRow(["Rank", "Product Name", "SKU", "Total Orders", "Total Qty Sold", "Total Revenue (₹)"]);
      headerRow.eachCell((cell) => headerStyle(cell, "065F46"));
      headerRow.height = 22;
      [8, 38, 18, 14, 16, 18].forEach((w, i) => { ws.getColumn(i + 1).width = w; });

      products.forEach((p, i) => {
        const row = ws.addRow([i + 1, p.productName, p.sku, p.orders, p.qty, p.revenue]);
        row.getCell(6).numFmt = "#,##0.00";
        if (i % 2 === 1) {
          row.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F0FDF4" } };
          });
        }
        rowBorder(row);
      });

    // ════════════════════════════════════════
    // CUSTOMERS EXPORT
    // ════════════════════════════════════════
    } else if (type === "customers") {
      const customers = await prisma.customer.findMany({
        select: {
          id: true, name: true, email: true, mobileNumber: true,
          createdAt: true, gender: true, status: true,
          orders: {
            where: { orderStatus: { notIn: ["CANCELLED", "PAYMENT_PENDING"] } },
            select: { grandtotal: true, orderDate: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const ws = wb.addWorksheet("Customers");
      ws.properties.defaultRowHeight = 20;

      ws.mergeCells("A1:H1");
      const title = ws.getCell("A1");
      title.value     = "Customer Report";
      title.font      = { bold: true, size: 14, color: { argb: "6B21A8" } };
      title.alignment = { horizontal: "center", vertical: "middle" };
      ws.getRow(1).height = 28;
      ws.addRow([]);

      const headerRow = ws.addRow([
        "ID", "Name", "Email", "Phone", "Gender",
        "Total Orders", "Total Spent (₹)", "Last Order", "Status", "Joined",
      ]);
      headerRow.eachCell((cell) => headerStyle(cell, "6B21A8"));
      headerRow.height = 22;
      [8, 24, 30, 14, 10, 14, 16, 14, 10, 14].forEach((w, i) => { ws.getColumn(i + 1).width = w; });

      customers.forEach((c, i) => {
        const totalSpent    = c.orders.reduce((s, o) => s + Number(o.grandtotal), 0);
        const lastOrder     = c.orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())[0];
        const row = ws.addRow([
          c.id, c.name, c.email, c.mobileNumber ?? "",
          c.gender ?? "", c.orders.length, totalSpent,
          lastOrder ? new Date(lastOrder.orderDate).toLocaleDateString("en-IN") : "—",
          c.status ? "Active" : "Inactive",
          new Date(c.createdAt).toLocaleDateString("en-IN"),
        ]);
        row.getCell(7).numFmt = "#,##0.00";
        if (i % 2 === 1) {
          row.eachCell((cell) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FAF5FF" } };
          });
        }
        rowBorder(row);
      });
    }

    // ── Stream the file ───────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const fileName = `${type}-report-${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length":      buffer.byteLength.toString(),
      },
    });
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to export", { status: 500 });
  }
}
