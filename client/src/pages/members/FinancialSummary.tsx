import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, Waves } from "lucide-react";

const EXCHANGE_RATE = 0.052083333333333;

type MemberStats = {
  currentBalance: number;
  totalEarned: number;
  totalPaid: number;
  thisMonth: number;
};

export default function FinancialSummary({ memberId }: { memberId: string }) {
  const { data: stats } = useQuery<MemberStats>({
    queryKey: ["/api/members", memberId, "stats"],
  });

  const formatUSD = (points: number) => {
    return (points * EXCHANGE_RATE).toFixed(2);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats?.currentBalance || 0} pts
          </div>
          <p className="text-base text-muted-foreground mt-1">
            {formatUSD(stats?.currentBalance || 0)} USD
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Available points not paid yet
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats?.totalEarned || 0} pts
          </div>
          <p className="text-base text-muted-foreground mt-1">
            {formatUSD(stats?.totalEarned || 0)} USD
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Lifetime points from completed tasks
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          <Waves className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats?.totalPaid || 0} pts
          </div>
          <p className="text-base text-muted-foreground mt-1">
            {formatUSD(stats?.totalPaid || 0)} USD
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Lifetime points paid out
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <Calendar className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {stats?.thisMonth || 0} pts
          </div>
          <p className="text-base text-muted-foreground mt-1">
            {formatUSD(stats?.thisMonth || 0)} USD
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Points earned this month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


