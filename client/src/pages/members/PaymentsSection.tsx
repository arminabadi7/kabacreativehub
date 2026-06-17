import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Circle } from "lucide-react";

// Points to USD conversion rate (1 point = $0.05208333)
const POINTS_TO_USD_RATE = 0.05208333;

type Transaction = {
  id: string;
  memberId: string;
  type: "earned" | "paid" | "bonus" | "penalty";
  description: string;
  points: number;
  createdAt: string;
};

export default function PaymentsSection() {
  // Get current member session
  const { data: member } = useQuery({
    queryKey: ["/api/members/session"],
    queryFn: async () => {
      const res = await fetch("/api/members/session", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch member session");
      return res.json();
    },
  });

  // Fetch transactions for the current member (fetch all by using large page size)
  const { data: transactionsData, isLoading } = useQuery<{ transactions: Transaction[]; total: number }>({
    queryKey: ["/api/members", member?.id, "transactions"],
    queryFn: async () => {
      if (!member?.id) throw new Error("Member ID not available");
      // Request a large number of rows to get all transactions
      const res = await fetch(`/api/members/${member.id}/transactions?page=1&rowsPerPage=1000`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    enabled: !!member?.id,
  });

  const transactions = transactionsData?.transactions || [];

  // Calculate totals
  const totalEarned = transactions
    .filter(t => t.type === "earned" || t.type === "bonus")
    .reduce((sum, t) => sum + t.points, 0);

  const totalPaid = transactions
    .filter(t => t.type === "paid")
    .reduce((sum, t) => sum + Math.abs(t.points), 0);

  const totalPenalties = transactions
    .filter(t => t.type === "penalty")
    .reduce((sum, t) => sum + Math.abs(t.points), 0);

  const totalDeducted = transactions
    .filter(t => t.type === "deducted")
    .reduce((sum, t) => sum + Math.abs(t.points), 0);

  const currentBalance = totalEarned - totalPaid - totalPenalties - totalDeducted;

  const getTypeColor = (type: string) => {
    switch (type) {
      case "earned":
        return "bg-green-100 text-green-800";
      case "bonus":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-purple-100 text-purple-800";
      case "penalty":
        return "bg-red-100 text-red-800";
      case "deducted":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "earned":
      case "bonus":
        return <TrendingUp className="w-4 h-4" />;
      case "paid":
      case "penalty":
      case "deducted":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const formatCurrency = (points: number) => {
    const usd = points * POINTS_TO_USD_RATE;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(usd);
  };

  const formatPoints = (points: number) => {
    return new Intl.NumberFormat("en-US").format(Math.abs(points));
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Payments & Transactions</h1>
        <p className="text-muted-foreground">View all your transactions, earnings, and payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold">{formatPoints(totalEarned)} pts</p>
                <p className="text-sm text-gray-500">{formatCurrency(totalEarned)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">{formatPoints(totalPaid)} pts</p>
                <p className="text-sm text-gray-500">{formatCurrency(totalPaid)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold">{formatPoints(currentBalance)} pts</p>
                <p className="text-sm text-gray-500">{formatCurrency(currentBalance)}</p>
              </div>
              <Circle className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
                <p className="text-sm text-gray-500">{transactionsData?.total || 0} total</p>
              </div>
              <DollarSign className="w-8 h-8 text-gray-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No transactions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">USD Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => {
                    const isPositive = transaction.type === "earned" || transaction.type === "bonus";
                    const isPaid = transaction.type === "paid";
                    const prefix = isPaid ? "" : isPositive ? "+" : "-";
                    const colorClass = isPaid ? "text-blue-600" : isPositive ? "text-green-600" : "text-red-600";

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(transaction.type)}>
                            <div className="flex items-center gap-1">
                              {getTypeIcon(transaction.type)}
                              <span className="capitalize">{transaction.type}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="truncate">{transaction.description}</p>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${colorClass}`}>
                          {prefix}{formatPoints(Math.abs(transaction.points))} pts
                        </TableCell>
                        <TableCell className={`text-right font-medium ${colorClass}`}>
                          {prefix}{formatCurrency(Math.abs(transaction.points))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}




