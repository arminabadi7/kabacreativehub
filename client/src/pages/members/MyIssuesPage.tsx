import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, AlertCircle, Clock, CheckCircle2, Circle, FileText, Building2, FolderOpen, Folder } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Issue = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  videoUrl: string | null;
  videoDuration: string | null;
  projectId: string;
  createdAt: string;
  project: {
    id: string;
    name: string;
    clientId: string;
  };
  client: {
    id: string;
    username: string;
    fullName: string | null;
  } | null;
};

type Task = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  points: number;
  priority: string;
  assignedTo: string | null;
  memberId: string | null;
  issueId: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  issue: {
    id: string;
    title: string;
    projectId: string;
  } | null;
  project: {
    id: string;
    name: string;
  } | null;
};

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  unstarted: "Unstarted",
  todo: "To Do",
  "in_progress": "In Progress",
  translating: "Translating",
  ready_for_dub: "Ready for Dub",
  ready_for_editing: "Ready for Editing",
  editing: "Editing",
  ready_for_caption: "Ready for Caption",
  review: "Review",
  ready_for_upload: "Ready for Upload",
  completed: "Completed",
  done: "Done",
};

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-orange-500",
  unstarted: "bg-gray-500",
  todo: "bg-gray-400",
  "in_progress": "bg-blue-500",
  translating: "bg-orange-500",
  ready_for_dub: "bg-orange-500",
  ready_for_editing: "bg-orange-500",
  editing: "bg-orange-500",
  ready_for_caption: "bg-orange-500",
  review: "bg-yellow-500",
  ready_for_upload: "bg-purple-500",
  completed: "bg-green-500",
  done: "bg-green-600",
};

export default function MyIssuesPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: issues, isLoading: issuesLoading } = useQuery<Issue[]>({
    queryKey: ["/api/members/my-issues"],
    queryFn: async () => {
      const res = await fetch("/api/members/my-issues", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch issues");
      return res.json();
    },
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/members/my-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/members/my-tasks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const isLoading = issuesLoading || tasksLoading;

  // Filter issues and tasks based on search term
  const filteredIssues = (issues || []).filter((issue) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      issue.title?.toLowerCase().includes(searchLower) ||
      issue.description?.toLowerCase().includes(searchLower) ||
      issue.project?.name?.toLowerCase().includes(searchLower) ||
      issue.client?.username?.toLowerCase().includes(searchLower) ||
      issue.client?.fullName?.toLowerCase().includes(searchLower) ||
      STATUS_LABELS[issue.status]?.toLowerCase().includes(searchLower)
    );
  });

  const filteredTasks = (tasks || []).filter((task) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      task.name?.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.issue?.title?.toLowerCase().includes(searchLower) ||
      task.project?.name?.toLowerCase().includes(searchLower) ||
      task.status?.toLowerCase().includes(searchLower)
    );
  });

  // Group issues by status
  const issuesByStatus = filteredIssues.reduce((acc, issue) => {
    const status = issue.status || "unstarted";
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(issue);
    return acc;
  }, {} as Record<string, Issue[]>);

  const handleIssueClick = (issue: Issue) => {
    setLocation(`/dashboard/projects/${issue.projectId}/issues/${issue.id}`);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading your issues...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Issues</h1>
        <p className="text-muted-foreground">All issues and tasks assigned to you</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by title, description, project, client, status, or task name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Issues</p>
                <div className="text-2xl font-bold">{filteredIssues.length}</div>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tasks</p>
                <div className="text-2xl font-bold">{filteredTasks.length}</div>
              </div>
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In Progress</p>
                <div className="text-2xl font-bold">
                  {issuesByStatus["in_progress"]?.length || 0}
                </div>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <div className="text-2xl font-bold">
                  {(issuesByStatus["completed"]?.length || 0) + (issuesByStatus["done"]?.length || 0)}
                </div>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Backlog</p>
                <div className="text-2xl font-bold">
                  {issuesByStatus["backlog"]?.length || 0}
                </div>
              </div>
              <Circle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Issues ({filteredIssues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredIssues.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues.map((issue) => (
                    <TableRow 
                      key={issue.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleIssueClick(issue)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{issue.title}</div>
                          {issue.description && (
                            <div className="text-sm text-gray-500 truncate max-w-md">
                              {issue.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${
                            STATUS_COLORS[issue.status] || "bg-gray-500"
                          }`}
                        >
                          {STATUS_LABELS[issue.status] || issue.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{issue.project?.name || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {issue.client ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {issue.client.fullName || issue.client.username}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">No client</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIssueClick(issue);
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">
                {searchTerm ? "No issues found matching your search." : "No issues assigned to you yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Tasks ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow 
                      key={task.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        if (task.issue?.projectId && task.issueId) {
                          setLocation(`/dashboard/projects/${task.issue.projectId}/issues/${task.issueId}`);
                        }
                      }}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.name}</div>
                          {task.description && (
                            <div className="text-sm text-gray-500 truncate max-w-md">
                              {task.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.isCompleted
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {task.isCompleted ? "Completed" : "Pending"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{task.points || 0}pt</span>
                      </TableCell>
                      <TableCell>
                        {task.issue ? (
                          <span className="font-medium">{task.issue.title}</span>
                        ) : (
                          <span className="text-gray-400">No issue</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.project ? (
                          <div className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{task.project.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">No project</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.issue?.projectId && task.issueId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/dashboard/projects/${task.issue!.projectId}/issues/${task.issueId}`);
                            }}
                          >
                            View Issue
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">
                {searchTerm ? "No tasks found matching your search." : "No tasks assigned to you yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}




