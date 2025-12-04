import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, BarChart3, User, Filter, ChevronDown } from "lucide-react";

type Issue = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  projectId: string | null;
  videoDuration: string | null;
  createdAt: string;
};

type Task = {
  id: string;
  name: string;
  points: number;
  assignedTo: string | null;
  isCompleted: boolean;
};

type Project = {
  id: string;
  name: string;
};

const STATUSES = [
  "backlog",
  "unstarted",
  "translating",
  "ready_for_dub",
  "ready_for_editing",
  "editing",
  "ready_for_caption",
  "ready_for_upload",
];

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  unstarted: "Unstarted",
  translating: "Translating",
  ready_for_dub: "Ready for dub",
  ready_for_editing: "Ready for editing",
  editing: "Editing",
  ready_for_caption: "Ready for caption",
  ready_for_upload: "Ready for upload",
};

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-orange-500",
  unstarted: "bg-gray-500",
  translating: "bg-orange-500",
  ready_for_dub: "bg-orange-500",
  ready_for_editing: "bg-orange-500",
  editing: "bg-orange-500",
  ready_for_caption: "bg-orange-500",
  ready_for_upload: "bg-orange-500",
};

export default function ProjectsBoard() {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: issues } = useQuery<Issue[]>({
    queryKey: ["/api/issues", selectedProject],
    queryFn: async () => {
      const url = selectedProject
        ? `/api/issues?projectId=${selectedProject}`
        : "/api/issues";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch issues");
      return res.json();
    },
    enabled: !!selectedProject,
  });

  const selectedProjectData = projects?.find((p) => p.id === selectedProject);

  const moveIssueMutation = useMutation({
    mutationFn: async (data: { issueId: string; newStatus: string; newOrder: number }) => {
      const response = await apiRequest("PATCH", `/api/issues/${data.issueId}`, {
        status: data.newStatus,
        order: data.newOrder,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues", selectedProject] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to move issue",
        variant: "destructive",
      });
    },
  });

  const handleDragStart = (e: React.DragEvent, issue: Issue) => {
    e.dataTransfer.setData("issueId", issue.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const issueId = e.dataTransfer.getData("issueId");
    const issuesInStatus = issues?.filter((i) => i.status === targetStatus) || [];
    const newOrder = issuesInStatus.length;

    moveIssueMutation.mutate({
      issueId,
      newStatus: targetStatus,
      newOrder,
    });
  };

  const issuesByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = issues?.filter((issue) => issue.status === status) || [];
    return acc;
  }, {} as Record<string, Issue[]>);

  // Format date like "Sep 15"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  if (!selectedProject && projects && projects.length > 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Projects</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedProject(project.id)}
            >
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold">{project.name}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Top Header Bar */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded"></div>
              <span className="font-semibold text-gray-900">Content Operation</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-sm text-gray-600">
              Projects <span className="text-gray-400">/</span> {selectedProjectData?.name || "Project"}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 border-b-2 border-gray-900 pb-1">
              <span className="text-sm font-medium text-gray-900">Overview</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-gray-600">Issues</span>
            </div>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Edit className="w-4 h-4 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Plus className="w-4 h-4 text-gray-600" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Filter Bar */}
        <div className="mb-4">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 200px)" }}>
          {STATUSES.map((status) => {
            const statusIssues = issuesByStatus[status] || [];
            return (
              <div
                key={status}
                className="flex-shrink-0 w-80"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status] || "bg-gray-500"}`}></div>
                        <h3 className="font-semibold text-gray-900 text-sm">{STATUS_LABELS[status]}</h3>
                      </div>
                      <Button size="sm" variant="ghost" className="w-6 h-6 p-0">
                        <Plus className="w-4 h-4 text-gray-600" />
                      </Button>
                    </div>
                    <div className="space-y-3 min-h-[200px]">
                      {statusIssues.map((issue) => (
                        <IssueCard key={issue.id} issue={issue} onDragStart={handleDragStart} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function IssueCard({ issue, onDragStart }: { issue: Issue; onDragStart: (e: React.DragEvent, issue: Issue) => void }) {
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["/api/issues", issue.id, "tasks"],
    queryFn: async () => {
      const res = await fetch(`/api/issues/${issue.id}/tasks`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const { data: members } = useQuery<Array<{ id: string; fullName: string | null; username: string; profilePicture: string | null }>>({
    queryKey: ["/api/members/list"],
    queryFn: async () => {
      const res = await fetch("/api/members/list", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  const getMember = (memberId: string | null) => {
    if (!memberId || !members) return null;
    return members.find((m) => m.id === memberId);
  };

  const issueTasks = tasks || [];

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, issue)}
      className="cursor-move hover:shadow-md transition-shadow bg-white border-gray-200"
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-900 text-sm">{issue.title}</h4>
          <div className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4 text-gray-500" />
            <User className="w-4 h-4 text-gray-500" />
          </div>
        </div>

        {issueTasks.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-700 mb-2">Tasks ({issueTasks.length})</div>
            <div className="space-y-1.5">
              {issueTasks.map((task) => {
                const member = getMember(task.assignedTo);
                return (
                  <div key={task.id} className="flex items-center gap-2 text-xs">
                    <Checkbox checked={task.isCompleted} className="w-3 h-3" />
                    <span className="flex-1 text-gray-900">{task.name}</span>
                    <span className="text-gray-600 font-medium">{task.points} pts</span>
                    {member ? (
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={member.profilePicture || undefined} />
                        <AvatarFallback className="text-[8px]">
                          {member.fullName?.[0] || member.username[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-gray-300 bg-gray-100"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span>Created: {formatDate(issue.createdAt)}</span>
          <span>{issue.videoDuration || "0:01:00"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
