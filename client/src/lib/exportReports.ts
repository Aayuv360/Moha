import type { Order, Product, Return } from "@shared/schema";

export function downloadCSV(filename: string, data: string) {
  const link = document.createElement("a");
  link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(data)}`;
  link.download = filename;
  link.click();
}

export function exportSalesReport(orders: Order[], returns: Return[]) {
  const approvedReturns = returns.filter((r) => r.status === "approved");
  const totalRevenue = orders.reduce(
    (sum, order) => sum + parseFloat(order.totalAmount.toString()),
    0,
  );
  const refundedAmount = approvedReturns.reduce(
    (sum, ret) => sum + parseFloat(ret.refundAmount.toString()),
    0,
  );
  const netRevenue = totalRevenue - refundedAmount;

  let csv = "Sales Report\n";
  csv += `Generated: ${new Date().toLocaleString("en-IN")}\n\n`;
  csv += "SUMMARY\n";
  csv += `Total Orders,${orders.length}\n`;
  csv += `Total Sales,₹${totalRevenue.toLocaleString("en-IN")}\n`;
  csv += `Approved Returns,${approvedReturns.length}\n`;
  csv += `Refunded Amount,₹${refundedAmount.toLocaleString("en-IN")}\n`;
  csv += `Net Revenue,₹${netRevenue.toLocaleString("en-IN")}\n\n`;

  csv += "ORDER DETAILS\n";
  csv += "Order ID,Customer,Email,Phone,Total Amount,Status,Date\n";
  orders.forEach((order) => {
    csv += `"${order.id}","${order.customerName}","${order.email}","${order.phone}",₹${parseFloat(order.totalAmount.toString()).toLocaleString("en-IN")},"${order.status}","${new Date(order.createdAt).toLocaleDateString("en-IN")}"\n`;
  });

  downloadCSV(
    `Sales_Report_${new Date().toISOString().split("T")[0]}.csv`,
    csv
  );
}

export function exportInventoryReport(products: Product[]) {
  const totalInventoryValue = products.reduce(
    (sum, prod) => sum + parseFloat(prod.price.toString()) * prod.inStock,
    0,
  );
  const lowStockProducts = products.filter((p) => p.inStock <= 5).length;

  let csv = "Inventory Report\n";
  csv += `Generated: ${new Date().toLocaleString("en-IN")}\n\n`;
  csv += "SUMMARY\n";
  csv += `Total Products,${products.length}\n`;
  csv += `Total Inventory Value,₹${totalInventoryValue.toLocaleString("en-IN")}\n`;
  csv += `Low Stock Products,${lowStockProducts}\n\n`;

  csv += "PRODUCT DETAILS\n";
  csv += "Product ID,Name,Category,Fabric,Color,Price,Stock,Total Value\n";
  products.forEach((product) => {
    const totalValue = parseFloat(product.price.toString()) * product.inStock;
    csv += `"${product.id}","${product.name}","${product.category || "N/A"}","${product.fabric || "N/A"}","${product.color || "N/A"}",₹${parseFloat(product.price.toString()).toLocaleString("en-IN")},${product.inStock},₹${totalValue.toLocaleString("en-IN")}\n`;
  });

  downloadCSV(
    `Inventory_Report_${new Date().toISOString().split("T")[0]}.csv`,
    csv
  );
}

export function exportReturnsReport(returns: Return[], orders: Order[]) {
  const approvedReturns = returns.filter((r) => r.status === "approved");
  const requestedReturns = returns.filter((r) => r.status === "requested");
  const rejectedReturns = returns.filter((r) => r.status === "rejected");
  const totalRefunded = approvedReturns.reduce(
    (sum, ret) => sum + parseFloat(ret.refundAmount.toString()),
    0,
  );
  const returnRate =
    orders.length > 0 ? ((returns.length / orders.length) * 100).toFixed(2) : "0";

  let csv = "Returns & Refunds Report\n";
  csv += `Generated: ${new Date().toLocaleString("en-IN")}\n\n`;
  csv += "SUMMARY\n";
  csv += `Total Returns,${returns.length}\n`;
  csv += `Requested,${requestedReturns.length}\n`;
  csv += `Approved,${approvedReturns.length}\n`;
  csv += `Rejected,${rejectedReturns.length}\n`;
  csv += `Total Refunded,₹${totalRefunded.toLocaleString("en-IN")}\n`;
  csv += `Return Rate,${returnRate}%\n\n`;

  csv += "RETURN DETAILS\n";
  csv += "Return ID,Order ID,Product ID,Quantity,Reason,Status,Refund Amount,Date\n";
  returns.forEach((returnRecord) => {
    csv += `"${returnRecord.id}","${returnRecord.orderId}","${returnRecord.productId}",${returnRecord.quantity},"${returnRecord.reason}","${returnRecord.status}",₹${parseFloat(returnRecord.refundAmount.toString()).toLocaleString("en-IN")},"${new Date(returnRecord.createdAt).toLocaleDateString("en-IN")}"\n`;
  });

  downloadCSV(
    `Returns_Report_${new Date().toISOString().split("T")[0]}.csv`,
    csv
  );
}
