import { useState } from "react";
import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Folder, Circle } from "lucide-react";
import IssueCard from "./IssueCard";

// Re-export IssueCard for ProjectsBoard compatibility (it uses local function, so this is fine)
export { IssueCard };

type Issue = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  projectId: string | null;
  videoDuration: string | null;
  priority?: string;
  assignedTo?: string | null;
  createdAt: string;
  project?: {
    id: string;
    name: string;
  };
};

// Default statuses in exact order (left to right)
const DEFAULT_STATUSES = [
  "backlog",
  "ready_for_editing",
  "editing",
  "ready_for_caption",
  "ready_for_upload",
];

// Default status labels
const DEFAULT_STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
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

export default function BoardPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  // Fetch default statuses from API
  const { data: defaultStatuses = DEFAULT_STATUSES } = useQuery<string[]>({
    queryKey: ["/api/settings/default-statuses"],
    queryFn: async () => {
      const res = await fetch("/api/settings/default-statuses", { credentials: "include" });
      if (!res.ok) {
        return DEFAULT_STATUSES;
      }
      return res.json();
    },
  });

  const STATUSES = defaultStatuses;

  // Fetch all issues assigned to the current member
  const { data: issues, isLoading: issuesLoading } = useQuery<Issue[]>({
    queryKey: ["/api/members/my-board"],
    queryFn: async () => {
      const res = await fetch("/api/members/my-board", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch issues");
      return res.json();
    },
  });

  const moveIssueMutation = useMutation({
    mutationFn: async (data: { issueId: string; newStatus: string; newOrder: number }) => {
      const response = await apiRequest("PATCH", `/api/issues/${data.issueId}`, {
        status: data.newStatus,
        order: data.newOrder,
      });
      return await response.json();
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["/api/members/my-board"] });
      const previousIssues = queryClient.getQueryData<Issue[]>(["/api/members/my-board"]);

      if (previousIssues) {
        const updatedIssues = previousIssues.map((issue) =>
          issue.id === data.issueId
            ? { ...issue, status: data.newStatus, order: data.newOrder }
            : issue
        );
        queryClient.setQueryData<Issue[]>(["/api/members/my-board"], updatedIssues);
      }

      return { previousIssues };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousIssues) {
        queryClient.setQueryData(["/api/members/my-board"], context.previousIssues);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to move issue",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/my-board"] });
    },
  });

  const handleDragStart = (e: React.DragEvent, issue: Issue) => {
    e.dataTransfer.setData("issueId", issue.id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedIssueId(issue.id);
  };

  const handleDragEnd = () => {
    setDraggedIssueId(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverStatus(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    e.stopPropagation();
    const issueId = e.dataTransfer.getData("issueId");

    setDragOverStatus(null);
    setDraggedIssueId(null);

    const movedIssue = issues?.find((i) => i.id === issueId);
    if (!movedIssue) return;

    const issuesInStatus = issues?.filter((i) => i.status === targetStatus && i.id !== issueId) || [];
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

  if (issuesLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading board...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Board</h1>
        <p className="text-muted-foreground">All your assigned issues and tasks</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => {
          const statusIssues = issuesByStatus[status] || [];
          
          return (
            <div
              key={status}
              className="flex-shrink-0 w-80"
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              <Card className={`bg-white border-gray-200 transition-all duration-200 ${
                dragOverStatus === status ? "border-blue-400 border-2 shadow-lg" : ""
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status] || "bg-gray-500"}`}></div>
                    <h3 className="font-semibold text-gray-900">
                      {DEFAULT_STATUS_LABELS[status] || status}
                    </h3>
                    <span className="text-sm text-gray-500 ml-auto">
                      {statusIssues.length}
                    </span>
                  </div>

                  <div className="space-y-3 min-h-[100px]">
                    {statusIssues.map((issue) => (
                      <IssueCard 
                        key={issue.id} 
                        issue={issue} 
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        isDragging={draggedIssueId === issue.id}
                        setLocation={setLocation}
                        projectId={issue.projectId}
                      />
                    ))}
                    {dragOverStatus === status && draggedIssueId && !statusIssues.find(i => i.id === draggedIssueId) && (
                      <div className="border-2 border-dashed border-blue-400 rounded-lg p-3 bg-blue-50 opacity-50 min-h-[80px] flex items-center justify-center">
                        <span className="text-sm text-blue-600 font-medium">Drop here</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}



