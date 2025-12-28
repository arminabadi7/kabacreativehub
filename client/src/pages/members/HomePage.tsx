import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Folder, 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  ArrowRight,
  Users,
  Target,
  BarChart3,
  Briefcase,
  DollarSign,
  Calendar,
  Grid3x3,
  Settings,
  Building2,
  Scissors,
  LayoutGrid,
  Tag,
  Eye
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
};

type Issue = {
  id: string;
  title: string;
  status: string;
  projectId: string | null;
  createdAt: string;
};

export default function HomePage() {
  const [, setLocation] = useLocation();

  // Fetch all projects
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch assigned issues
  const { data: assignedIssues } = useQuery<Issue[]>({
    queryKey: ["/api/members/my-issues"],
    queryFn: async () => {
      const res = await fetch("/api/members/my-issues", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch assigned tasks
  const { data: assignedTasks } = useQuery<any[]>({
    queryKey: ["/api/members/my-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/members/my-tasks", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch member stats for points
  const { data: member } = useQuery<any>({
    queryKey: ["/api/members/session"],
    queryFn: async () => {
      const res = await fetch("/api/members/session", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: memberStats } = useQuery<any>({
    queryKey: ["/api/members", member?.id, "stats"],
    queryFn: async () => {
      if (!member?.id) return null;
      const res = await fetch(`/api/members/${member.id}/stats`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!member?.id,
  });

  const totalProjects = projects?.length || 0;
  const totalAssignedIssues = assignedIssues?.length || 0;
  const totalAssignedTasks = assignedTasks?.length || 0;
  const completedTasks = assignedTasks?.filter(t => t.isCompleted).length || 0;
  const pendingTasks = totalAssignedTasks - completedTasks;
  const totalPointsEarned = memberStats?.pointsEarned || 0;
  const currentBalance = memberStats?.currentBalance || 0;

  // In-house apps/tools - comprehensive list
  const inhouseApps = [
    {
      id: "clipping-area",
      name: "Clipping Area",
      description: "Review and approve video clips",
      icon: Scissors,
      path: "/member-dashboard?section=clipping-area",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: "projects",
      name: "Projects",
      description: "Manage all projects and issues",
      icon: Folder,
      path: "/member-dashboard?section=projects",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "board",
      name: "Board",
      description: "Kanban board for your work",
      icon: BarChart3,
      path: "/member-dashboard?section=board",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: "my-issues",
      name: "My Issues",
      description: "All issues and tasks assigned to you",
      icon: FileText,
      path: "/member-dashboard?section=my-issues",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      id: "workspace",
      name: "Workspace",
      description: "Workspace overview and resources",
      icon: Briefcase,
      path: "/member-dashboard?section=workspace",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      id: "teams",
      name: "Teams",
      description: "View teams and members",
      icon: Users,
      path: "/member-dashboard?section=teams",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Home</h1>
        <p className="text-muted-foreground">Overview of your work and quick access to all tools</p>
      </div>

      {/* Quick Stats - Overview from all tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned Issues</p>
                <p className="text-3xl font-bold">{totalAssignedIssues}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned Tasks</p>
                <p className="text-3xl font-bold">{totalAssignedTasks}</p>
                <p className="text-xs text-gray-500 mt-1">{completedTasks} completed, {pendingTasks} pending</p>
              </div>
              <Target className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Points Earned</p>
                <p className="text-3xl font-bold">{totalPointsEarned.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Balance: {currentBalance.toLocaleString()}</p>
              </div>
              <DollarSign className="w-10 h-10 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-3xl font-bold">{totalProjects}</p>
              </div>
              <Folder className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* In-House Apps & Tools Bar - Prominent section */}
      <Card className="mb-6 border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-gray-600" />
            <CardTitle className="text-xl">In-House Apps & Tools</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Quick access to all internal tools and applications</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inhouseApps.map((app) => {
              const Icon = app.icon;
              return (
                <Card
                  key={app.id}
                  className={`cursor-pointer hover:shadow-md transition-all border-2 ${app.bgColor} hover:scale-105`}
                  onClick={() => setLocation(app.path)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${app.bgColor} bg-opacity-50`}>
                        <Icon className={`w-6 h-6 ${app.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{app.name}</h3>
                        <p className="text-sm text-gray-600">{app.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Assigned Issues */}
        {assignedIssues && assignedIssues.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <CardTitle>Recent Assigned Issues</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/member-dashboard?section=my-issues")}
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignedIssues.slice(0, 5).map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => {
                      if (issue.projectId) {
                        setLocation(`/member-dashboard/projects/${issue.projectId}/issues/${issue.id}`);
                      }
                    }}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{issue.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Status: <span className="capitalize font-medium">{issue.status.replace(/_/g, " ")}</span>
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Assigned Tasks */}
        {assignedTasks && assignedTasks.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-gray-600" />
                  <CardTitle>Recent Assigned Tasks</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/member-dashboard?section=my-issues")}
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignedTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => {
                      if (task.issueId) {
                        // Try to find the issue to get projectId
                        const relatedIssue = assignedIssues?.find(i => i.id === task.issueId);
                        if (relatedIssue?.projectId) {
                          setLocation(`/member-dashboard/projects/${relatedIssue.projectId}/issues/${task.issueId}`);
                        }
                      }
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{task.name || task.title}</p>
                        {task.isCompleted && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                        {!task.isCompleted && (
                          <Clock className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                      {task.points > 0 && (
                        <p className="text-xs text-gray-500 mt-1">{task.points} points</p>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setLocation("/member-dashboard?section=my-issues")}
            >
              <FileText className="w-4 h-4 mr-2" />
              My Issues
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setLocation("/member-dashboard?section=board")}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Board
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setLocation("/member-dashboard?section=projects")}
            >
              <Folder className="w-4 h-4 mr-2" />
              Projects
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setLocation("/member-dashboard?section=workspace")}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Workspace
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




