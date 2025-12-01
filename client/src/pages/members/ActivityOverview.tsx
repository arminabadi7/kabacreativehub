import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Gift, DollarSign, Zap, User, Star } from "lucide-react";

type ActivityStats = {
  tasksCompleted: number;
  bonusesReceived: number;
  paymentsProcessed: number;
  tasksIncomplete: number;
  penaltiesApplied: number;
};

export default function ActivityOverview({ memberId }: { memberId: string }) {
  const { data: stats } = useQuery<ActivityStats>({
    queryKey: ["/api/members", memberId, "activity"],
  });

  const activities = [
    {
      label: "Tasks Completed",
      value: stats?.tasksCompleted || 0,
      icon: User,
      secondaryIcon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Bonuses Received",
      value: stats?.bonusesReceived || 0,
      icon: User,
      secondaryIcon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Payments Processed",
      value: stats?.paymentsProcessed || 0,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Tasks Incomplete",
      value: stats?.tasksIncomplete || 0,
      icon: Zap,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      label: "Penalties Applied",
      value: stats?.penaltiesApplied || 0,
      icon: Zap,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <CardTitle className="text-lg font-semibold mb-4">Activity Overview</CardTitle>
        <div className="flex items-center justify-around">
          {activities.map((activity) => {
            const Icon = activity.icon;
            const SecondaryIcon = (activity as any).secondaryIcon;
            return (
              <div key={activity.label} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center relative ${activity.bgColor}`}>
                  <Icon className={`w-5 h-5 ${activity.color}`} />
                  {SecondaryIcon && (
                    <SecondaryIcon className={`w-3 h-3 ${activity.color} absolute -bottom-0.5 -right-0.5`} />
                  )}
                </div>
                <div className={`text-2xl font-bold mt-2 ${activity.color}`}>{activity.value}</div>
                <div className="text-xs text-gray-600 mt-1 text-center max-w-[100px]">
                  {activity.label}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


