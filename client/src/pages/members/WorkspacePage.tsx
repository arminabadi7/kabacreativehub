import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Folder, 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Users,
  Calendar
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  description: string | null;
  clientId: string | null;
  createdAt: string;
};

type Issue = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  projectId: string | null;
  createdAt: string;
  assigneeId: string | null;
};

type WorkspaceStats = {
  totalProjects: number;
  totalIssues: number;
  issuesByStatus: Record<string, number>;
  recentProjects: Project[];
  recentIssues: Issue[];
  inProgressIssues: Issue[];
  completedIssues: Issue[];
};

export default function WorkspacePage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch all projects
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  // Fetch all issues (for statistics)
  const { data: statusStatistics } = useQuery<Record<string, number>>({
    queryKey: ["/api/issues/status-statistics"],
    queryFn: async () => {
      const res = await fetch("/api/issues/status-statistics", { credentials: "include" });
      if (!res.ok) return {};
      return res.json();
    },
  });

  // Fetch all issues for recent/in-progress display
  const { data: allIssues, isLoading: issuesLoading } = useQuery<Issue[]>({
    queryKey: ["/api/issues/all"],
    queryFn: async () => {
      const res = await fetch("/api/issues/all", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Calculate statistics
  const totalProjects = projects?.length || 0;
  const totalIssues = allIssues?.length || 0;
  const issuesByStatus = statusStatistics || {};
  
  // Get recent projects (last 5)
  const recentProjects = projects
    ? [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
    : [];
  
  // Get recent issues (last 10)
  const recentIssues = allIssues
    ? [...allIssues].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)
    : [];
  
  // Get in-progress issues (not in backlog or completed-like statuses)
  const inProgressStatuses = ["ready_for_editing", "editing", "ready_for_caption", "ready_for_upload"];
  const inProgressIssues = allIssues?.filter(issue => 
    inProgressStatuses.includes(issue.status)
  ).slice(0, 5) || [];

  const isLoading = projectsLoading || issuesLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading workspace...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Workspace</h1>
          <p className="text-muted-foreground">Overview of your projects and work progress</p>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-3xl font-bold">{totalProjects}</p>
              </div>
              <Folder className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Issues</p>
                <p className="text-3xl font-bold">{totalIssues}</p>
              </div>
              <FileText className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold">{inProgressIssues.length}</p>
              </div>
              <Clock className="w-10 h-10 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold">
                  {Object.keys(issuesByStatus).reduce((sum, status) => {
                    // Assuming statuses like "ready_for_upload" or similar are "completed"
                    // You may want to adjust this logic based on your status definitions
                    return sum + (status === "ready_for_upload" ? issuesByStatus[status] : 0);
                  }, 0)}
                </p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Projects</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/member-dashboard?section=projects")}
              >
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No projects yet</p>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => setLocation("/member-dashboard?section=projects")}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{project.name}</p>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{project.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Created {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Issues by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Issues by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(issuesByStatus).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No issues yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(issuesByStatus)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="font-medium text-gray-900 capitalize">
                          {status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-gray-700">{count}</span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* In Progress Issues */}
      {inProgressIssues.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>In Progress Issues</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/member-dashboard?section=projects")}
              >
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inProgressIssues.map((issue) => (
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
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <p className="font-medium text-gray-900">{issue.title}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded capitalize">
                        {issue.status.replace(/_/g, " ")}
                      </span>
                      {issue.description && (
                        <p className="text-sm text-gray-600 line-clamp-1">{issue.description}</p>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Issues */}
      {recentIssues.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Issues</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/member-dashboard?section=projects")}
              >
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentIssues.slice(0, 10).map((issue) => (
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
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded capitalize">
                        {issue.status.replace(/_/g, " ")}
                      </span>
                      <p className="text-xs text-gray-400">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}




