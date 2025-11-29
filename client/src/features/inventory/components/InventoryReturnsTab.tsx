import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Return } from "@shared/schema";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface InventoryReturnsTabProps {
  returns: Return[];
}

export function InventoryReturnsTab({ returns }: InventoryReturnsTabProps) {
  const { toast } = useToast();

  const updateReturnStatusMutation = useMutation({
    mutationFn: async ({
      returnId,
      status,
    }: {
      returnId: string;
      status: string;
    }) => {
      return await apiRequest(
        "PATCH",
        `/api/inventory/returns/${returnId}/status`,
        { status },
      );
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/inventory/returns"] });
      toast({ title: "Return status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update return status", variant: "destructive" });
    },
  });

  const statusColors: Record<string, string> = {
    requested: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  };

  const statusIcons: Record<string, any> = {
    requested: Clock,
    approved: CheckCircle,
    rejected: XCircle,
  };

  if (returns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No return requests yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {returns.map((returnRecord) => {
        const StatusIcon = statusIcons[returnRecord.status] || Clock;
        return (
          <Card key={returnRecord.id} data-testid={`return-card-${returnRecord.id}`}>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-medium">
                    Return #{returnRecord.id.substring(0, 8)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Order: {returnRecord.orderId.substring(0, 8)}
                  </p>
                </div>
                <Badge className={statusColors[returnRecord.status] || statusColors.requested}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {returnRecord.status.charAt(0).toUpperCase() +
                    returnRecord.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Quantity</p>
                    <p className="font-medium">{returnRecord.quantity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Refund Amount</p>
                    <p className="font-medium">
                      ₹{parseFloat(returnRecord.refundAmount.toString()).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground">Reason</p>
                  <p className="font-medium">{returnRecord.reason}</p>
                </div>

                {returnRecord.status === "requested" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        updateReturnStatusMutation.mutate({
                          returnId: returnRecord.id,
                          status: "approved",
                        })
                      }
                      disabled={updateReturnStatusMutation.isPending}
                      data-testid={`button-approve-return-${returnRecord.id}`}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateReturnStatusMutation.mutate({
                          returnId: returnRecord.id,
                          status: "rejected",
                        })
                      }
                      disabled={updateReturnStatusMutation.isPending}
                      data-testid={`button-reject-return-${returnRecord.id}`}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
