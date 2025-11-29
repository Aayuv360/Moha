import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import {
  exportSalesReport,
  exportInventoryReport,
  exportReturnsReport,
} from "@/lib/exportReports";
import type { Order, Product, Return } from "@shared/schema";

interface ExportReportsCardProps {
  orders: Order[];
  products: Product[];
  returns: Return[];
}

export function ExportReportsCard({
  orders,
  products,
  returns,
}: ExportReportsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Export Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Download your business data as CSV for analysis and record-keeping.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => exportSalesReport(orders, returns)}
            data-testid="button-export-sales"
          >
            <Download className="h-4 w-4" />
            Sales Report
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => exportInventoryReport(products)}
            data-testid="button-export-inventory"
          >
            <Download className="h-4 w-4" />
            Inventory Report
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => exportReturnsReport(returns, orders)}
            data-testid="button-export-returns"
          >
            <Download className="h-4 w-4" />
            Returns Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
