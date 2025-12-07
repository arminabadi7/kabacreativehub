import { useState } from "react";
import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, BarChart3, User, Filter, ChevronDown, ChevronUp, ArrowLeft, Pencil, Check, X, Folder, Video, Calendar, Flag, UserCircle, Globe, MoreHorizontal, Circle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  name?: string;
  title?: string;
  points: number;
  assignedTo?: string | null;
  memberId?: string | null;
  isCompleted?: boolean;
  status?: string;
};

type Project = {
  id: string;
  name: string;
  description?: string | null;
  clientId?: string | null;
  fileLink?: string | null;
  statusLabels?: string | null; // JSON string of custom status labels
};

type Client = {
  id: string;
  username: string;
  fullName: string | null;
  email: string;
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

export default function ProjectsBoard() {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectClientId, setNewProjectClientId] = useState<string>("");
  const [newProjectFileLink, setNewProjectFileLink] = useState("");
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [statusLabelEdit, setStatusLabelEdit] = useState<string>("");
  const [isCreateIssueDialogOpen, setIsCreateIssueDialogOpen] = useState(false);
  const [createIssueStatus, setCreateIssueStatus] = useState<string | null>(null);
  const [issueForm, setIssueForm] = useState({
    title: "",
    description: "",
    teamId: "",
    templateId: "",
    status: "",
    priority: "no_priority",
    assigneeId: "",
    videoUrl: "",
    videoDuration: "0:01:00",
    createMore: false,
  });
  const [dueDate, setDueDate] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [tasks, setTasks] = useState<Array<{ id: string; name: string; points: number; priority: string; assignedTo: string | null }>>([]);
  const [taskListExpanded, setTaskListExpanded] = useState(true);
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients/list"],
    queryFn: async () => {
      const res = await fetch("/api/clients/list", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  const { data: issues } = useQuery<Issue[]>({
    queryKey: ["/api/projects", selectedProject, "issues"],
    queryFn: async () => {
      if (!selectedProject) return [];
      const res = await fetch(`/api/projects/${selectedProject}/issues`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch issues");
      return res.json();
    },
    enabled: !!selectedProject,
  });

  const { data: templates } = useQuery<any[]>({
    queryKey: ["/api/templates"],
    queryFn: async () => {
      const res = await fetch("/api/templates", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  const { data: teams } = useQuery<any[]>({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const res = await fetch("/api/teams", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json();
    },
  });

  const { data: assignees } = useQuery<any[]>({
    queryKey: ["/api/members/assignees", issueForm.teamId],
    queryFn: async () => {
      const url = issueForm.teamId 
        ? `/api/members/assignees?teamId=${issueForm.teamId}`
        : "/api/members/assignees";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch assignees");
      return res.json();
    },
  });

  const { data: templateTasks } = useQuery<any[]>({
    queryKey: ["/api/templates", issueForm.templateId, "tasks"],
    queryFn: async () => {
      if (!issueForm.templateId) return [];
      const res = await fetch(`/api/templates/${issueForm.templateId}/tasks`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch template tasks");
      return res.json();
    },
    enabled: !!issueForm.templateId,
  });

  const selectedProjectData = projects?.find((p) => p.id === selectedProject);

  // Get status labels for the selected project (with default fallback)
  const getStatusLabels = (): Record<string, string> => {
    if (!selectedProjectData?.statusLabels) {
      return DEFAULT_STATUS_LABELS;
    }
    try {
      const customLabels = JSON.parse(selectedProjectData.statusLabels);
      // Merge with defaults to ensure all statuses have labels
      return { ...DEFAULT_STATUS_LABELS, ...customLabels };
    } catch {
      return DEFAULT_STATUS_LABELS;
    }
  };

  const statusLabels = getStatusLabels();
  const STATUSES = DEFAULT_STATUSES; // Use default statuses in order

  const updateStatusLabelMutation = useMutation({
    mutationFn: async (data: { projectId: string; status: string; label: string }) => {
      const currentLabels = statusLabels;
      const updatedLabels = { ...currentLabels, [data.status]: data.label };
      const response = await apiRequest("PATCH", `/api/projects/${data.projectId}`, {
        statusLabels: JSON.stringify(updatedLabels),
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setEditingStatus(null);
      setStatusLabelEdit("");
      toast({
        title: "Success!",
        description: "Status label updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status label",
        variant: "destructive",
      });
    },
  });

  const handleStartEditStatus = (status: string) => {
    setEditingStatus(status);
    setStatusLabelEdit(statusLabels[status] || DEFAULT_STATUS_LABELS[status] || status);
  };

  const handleSaveStatusLabel = (status: string) => {
    if (!selectedProject || !statusLabelEdit.trim()) return;
    updateStatusLabelMutation.mutate({
      projectId: selectedProject,
      status,
      label: statusLabelEdit.trim(),
    });
  };

  const handleCancelEditStatus = () => {
    setEditingStatus(null);
    setStatusLabelEdit("");
  };

  const handleOpenCreateIssue = (status: string) => {
    setCreateIssueStatus(status);
    setIssueForm({
      title: "",
      description: "",
      teamId: "",
      templateId: "",
      status: status,
      priority: "no_priority",
      assigneeId: "",
      videoUrl: "",
      videoDuration: "0:01:00",
      createMore: false,
    });
    setDueDate("");
    setPublishDate("");
    setTasks([]);
    setTaskListExpanded(true);
    setIsCreateIssueDialogOpen(true);
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setIssueForm(prev => ({
        ...prev,
        templateId,
        title: template.title || template.issueTitle || "",
        description: template.description || "",
        teamId: template.teamId || "",
        status: template.defaultStatus || prev.status,
        priority: template.defaultPriority || "no_priority",
        assigneeId: template.defaultAssigneeId || "",
        videoUrl: template.videoUrl || "",
        videoDuration: template.videoDuration || "0:01:00",
      }));
    } else {
      setIssueForm(prev => ({ ...prev, templateId }));
    }
  };

  // Load template tasks when template is selected
  React.useEffect(() => {
    console.log(`[TemplateTasks] Template changed: ${issueForm.templateId}`, {
      templateId: issueForm.templateId,
      templateTasks: templateTasks,
      templateTasksLength: templateTasks?.length || 0,
    });
    
    if (issueForm.templateId && templateTasks && templateTasks.length > 0) {
      const mappedTasks = templateTasks.map((t, idx) => ({
        id: `temp-${idx}`,
        name: t.name,
        points: t.points || 0,
        priority: t.priority || "no_priority",
        assignedTo: t.assignedTo || null,
      }));
      console.log(`[TemplateTasks] Setting tasks from template:`, mappedTasks);
      setTasks(mappedTasks);
    } else if (!issueForm.templateId) {
      console.log(`[TemplateTasks] No template selected, clearing tasks`);
      setTasks([]);
    } else if (issueForm.templateId && (!templateTasks || templateTasks.length === 0)) {
      console.log(`[TemplateTasks] Template selected but no tasks found`);
      setTasks([]);
    }
  }, [issueForm.templateId, templateTasks]);

  const createIssueMutation = useMutation({
    mutationFn: async (data: any) => {
      // Convert video duration from HH:MM:SS to seconds
      let videoDurationSeconds = null;
      if (data.videoDuration && data.videoDuration !== "0:00:00") {
        const parts = data.videoDuration.split(":").map(Number);
        if (parts.length === 3) {
          videoDurationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      }
      
      const issueData = {
        projectId: selectedProject,
        title: data.title,
        description: data.description || null,
        status: data.status,
        videoUrl: data.videoUrl || null,
        videoDuration: videoDurationSeconds,
        order: 0,
        teamId: data.teamId || null,
        priority: data.priority || "no_priority",
        assignedTo: data.assignedTo || null,
      };
      
      const response = await apiRequest("POST", "/api/issues", issueData);
      return await response.json();
    },
    onSuccess: async (issue) => {
      console.log(`[CreateIssue] Issue created: ${issue.id}`, issue);
      console.log(`[CreateIssue] Tasks to create: ${tasks.length}`, tasks);
      
      // Create tasks for the issue
      if (tasks.length > 0) {
        const tasksToCreate = tasks.filter((task) => task.name && task.name.trim());
        console.log(`[CreateIssue] Filtered tasks to create: ${tasksToCreate.length}`, tasksToCreate);
        
        try {
          const createdTasks = await Promise.all(
            tasksToCreate.map(async (task, idx) => {
              console.log(`[CreateIssue] Creating task ${idx + 1}/${tasksToCreate.length}:`, task);
              try {
                const response = await apiRequest("POST", `/api/issues/${issue.id}/tasks`, {
                  name: task.name.trim(),
                  points: task.points || 0,
                  priority: task.priority || "no_priority",
                  assignedTo: task.assignedTo || null,
                  order: idx,
                });
                const createdTask = await response.json();
                console.log(`[CreateIssue] Task created successfully:`, createdTask);
                return createdTask;
              } catch (taskError: any) {
                console.error(`[CreateIssue] Error creating task "${task.name}":`, taskError);
                throw taskError;
              }
            })
          );
          console.log(`[CreateIssue] All ${createdTasks.length} tasks created successfully`);
          
          // Small delay to ensure tasks are saved before invalidating
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: any) {
          console.error("[CreateIssue] Error creating tasks:", error);
          toast({
            title: "Warning",
            description: `Issue created but some tasks failed to create: ${error.message}`,
            variant: "destructive",
          });
        }
      } else {
        console.log(`[CreateIssue] No tasks to create (tasks array is empty)`);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject, "issues"] });
      // Invalidate tasks for the created issue - wait a bit to ensure tasks are saved
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/issues", issue.id, "tasks"] });
        console.log(`[CreateIssue] Invalidated tasks query for issue ${issue.id}`);
      }, 200);
      if (!issueForm.createMore) {
        setIsCreateIssueDialogOpen(false);
        setIssueForm({
          title: "",
          description: "",
          teamId: "",
          templateId: "",
          status: createIssueStatus || "",
          priority: "no_priority",
          assigneeId: "",
          videoUrl: "",
          videoDuration: "0:01:00",
          createMore: false,
        });
        setDueDate("");
        setPublishDate("");
        setTasks([]);
      } else {
        // Reset form but keep status and createMore
        setIssueForm(prev => ({
          ...prev,
          title: "",
          description: "",
          templateId: "",
          videoUrl: "",
          videoDuration: "0:01:00",
        }));
        setTasks([]);
      }
      toast({
        title: "Success!",
        description: "Issue created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create issue",
        variant: "destructive",
      });
    },
  });

  const handleCreateIssue = () => {
    // Get issue title from template if selected, otherwise use form title or description
    const selectedTemplateData = issueForm.templateId && templates 
      ? templates.find(t => t.id === issueForm.templateId)
      : null;
    const issueTitle = selectedTemplateData?.issueTitle || issueForm.title || issueForm.description.trim();
    
    if (!issueTitle && !issueForm.description.trim()) {
      toast({
        title: "Error",
        description: "Issue title or description is required",
        variant: "destructive",
      });
      return;
    }

    createIssueMutation.mutate({
      ...issueForm,
      title: issueTitle || issueForm.description.trim(),
      status: issueForm.status || createIssueStatus || "backlog",
    });
  };

  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; clientId: string; fileLink?: string }) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsCreateDialogOpen(false);
      setNewProjectName("");
      setNewProjectDescription("");
      setNewProjectClientId("");
      setNewProjectFileLink("");
      toast({
        title: "Success!",
        description: "Project created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = () => {
    if (!newProjectName.trim() || !newProjectClientId) {
      toast({
        title: "Error",
        description: "Project name and client are required",
        variant: "destructive",
      });
      return;
    }
    createProjectMutation.mutate({
      name: newProjectName.trim(),
      description: newProjectDescription.trim() || undefined,
      clientId: newProjectClientId,
      fileLink: newProjectFileLink.trim() || undefined,
    });
  };

  const moveIssueMutation = useMutation({
    mutationFn: async (data: { issueId: string; newStatus: string; newOrder: number }) => {
      const response = await apiRequest("PATCH", `/api/issues/${data.issueId}`, {
        status: data.newStatus,
        order: data.newOrder,
      });
      return await response.json();
    },
    onMutate: async (data) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/projects", selectedProject, "issues"] });

      // Snapshot the previous value
      const previousIssues = queryClient.getQueryData<Issue[]>(["/api/projects", selectedProject, "issues"]);

      // Optimistically update to the new value
      if (previousIssues) {
        const updatedIssues = previousIssues.map((issue) =>
          issue.id === data.issueId
            ? { ...issue, status: data.newStatus, order: data.newOrder }
            : issue
        );
        queryClient.setQueryData<Issue[]>(["/api/projects", selectedProject, "issues"], updatedIssues);
      }

      // Return context with the snapshotted value
      return { previousIssues };
    },
    onError: (error: any, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousIssues) {
        queryClient.setQueryData(["/api/projects", selectedProject, "issues"], context.previousIssues);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to move issue",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject, "issues"] });
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
    // Only clear drag over if we're actually leaving the drop zone
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
    
    // Clear drag states immediately for instant UI feedback
    setDragOverStatus(null);
    setDraggedIssueId(null);

    // Find the issue being moved
    const movedIssue = issues?.find((i) => i.id === issueId);
    if (!movedIssue) return;

    // Calculate new order (place at end of target status)
    const issuesInStatus = issues?.filter((i) => i.status === targetStatus && i.id !== issueId) || [];
    const newOrder = issuesInStatus.length;

    // Optimistically update immediately - mutation will handle the server sync
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

  // Show project list if no project is selected
  if (!selectedProject) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Projects</h1>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-black text-white hover:bg-gray-900"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedProject(project.id)}
              >
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                  )}
                  {project.fileLink && (
                    <p className="text-xs text-gray-500 truncate">{project.fileLink}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No projects found</p>
            <p className="text-gray-400 text-sm mt-2">Click "New Project" to create your first project</p>
          </div>
        )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Create a new project to organize your work and issues.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <Label htmlFor="project-client">Client *</Label>
                <Select value={newProjectClientId} onValueChange={setNewProjectClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.fullName || client.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Enter project description (optional)"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="project-file-link">File Link / Location</Label>
                <Input
                  id="project-file-link"
                  value={newProjectFileLink}
                  onChange={(e) => setNewProjectFileLink(e.target.value)}
                  placeholder="/Projects/ClientName/Episode_01 (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={createProjectMutation.isPending}
                className="bg-black text-white hover:bg-gray-900"
              >
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Top Header Bar */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProject(null)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Button>
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
                className={`flex-shrink-0 w-80 group transition-all duration-200 ${
                  dragOverStatus === status ? "bg-blue-50 rounded-lg" : ""
                }`}
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status)}
              >
                <Card className={`bg-white border-gray-200 transition-all duration-200 ${
                  dragOverStatus === status ? "border-blue-400 border-2 shadow-lg" : ""
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status] || "bg-gray-500"}`}></div>
                        {editingStatus === status ? (
                          <div className="flex items-center gap-1 flex-1">
                            <Input
                              value={statusLabelEdit}
                              onChange={(e) => setStatusLabelEdit(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveStatusLabel(status);
                                } else if (e.key === "Escape") {
                                  handleCancelEditStatus();
                                }
                              }}
                              className="h-6 text-sm px-2 py-1"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleSaveStatusLabel(status)}
                            >
                              <Check className="w-3 h-3 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={handleCancelEditStatus}
                            >
                              <X className="w-3 h-3 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-semibold text-gray-900 text-sm">{statusLabels[status] || DEFAULT_STATUS_LABELS[status] || status}</h3>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleStartEditStatus(status)}
                            >
                              <Pencil className="w-3 h-3 text-gray-500" />
                            </Button>
                          </>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-6 h-6 p-0"
                        onClick={() => handleOpenCreateIssue(status)}
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </Button>
                    </div>
                    <div className="space-y-3 min-h-[200px]">
                      {statusIssues.map((issue) => (
                        <IssueCard 
                          key={issue.id} 
                          issue={issue} 
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          isDragging={draggedIssueId === issue.id}
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

      {/* Create Issue Dialog */}
      <Dialog open={isCreateIssueDialogOpen} onOpenChange={setIsCreateIssueDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-white">
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-200">
            <div className="flex items-center justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-500 hover:text-gray-700"
                onClick={() => setIsCreateIssueDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="px-6 py-4 space-y-3">
            {/* Header Section - Team and Template Dropdowns */}
            <div className="flex items-center gap-3">
              <Select value={issueForm.teamId} onValueChange={(value) => setIssueForm(prev => ({ ...prev, teamId: value }))}>
                <SelectTrigger className="w-[140px] h-9 border-gray-300">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <SelectValue placeholder="Select team" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {teams?.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={issueForm.templateId} onValueChange={handleTemplateChange}>
                <SelectTrigger className="flex-1 h-9 border-gray-300">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-gray-500" />
                    <SelectValue placeholder="Select template" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Issue Title Display (read-only, from template) */}
            {issueForm.templateId && templates && (
              <div className="text-base font-medium text-gray-900">
                {templates.find(t => t.id === issueForm.templateId)?.issueTitle || ""}
              </div>
            )}

            {/* Issue Description Textarea */}
            <div>
              <Textarea
                value={issueForm.description}
                onChange={(e) => setIssueForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter issue description..."
                className="min-h-[50px] resize-none border-gray-300 text-sm"
              />
            </div>

            {/* Issue Attributes Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={issueForm.status || createIssueStatus || "backlog"} onValueChange={(value) => setIssueForm(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="h-8 text-sm border-gray-300 bg-white hover:bg-gray-50 px-2.5">
                  <div className="flex items-center gap-1.5">
                    <Circle className={`w-3 h-3 fill-current ${(issueForm.status || createIssueStatus) === "backlog" ? "text-orange-500" : "text-gray-700"}`} />
                    <span className="text-sm text-gray-700">
                      {statusLabels[issueForm.status || createIssueStatus || ""] || DEFAULT_STATUS_LABELS[issueForm.status || createIssueStatus || ""] || "Backlog"}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status] || DEFAULT_STATUS_LABELS[status] || status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={issueForm.priority} onValueChange={(value) => setIssueForm(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger className="h-8 text-sm border-gray-300 bg-white hover:bg-gray-50 px-2.5">
                  <div className="flex items-center gap-1.5">
                    <MoreHorizontal className="w-3 h-3 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      {issueForm.priority === "no_priority" ? "No Priority" :
                       issueForm.priority === "low" ? "Low" :
                       issueForm.priority === "medium" ? "Medium" :
                       issueForm.priority === "high" ? "High" : "No Priority"}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_priority">No Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={issueForm.assigneeId || "unassigned"} 
                onValueChange={(value) => setIssueForm(prev => ({ ...prev, assigneeId: value === "unassigned" ? "" : value }))}
              >
                <SelectTrigger className="h-8 text-sm border-gray-300 bg-white hover:bg-gray-50 px-2.5">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-gray-600" />
                    <SelectValue placeholder="Assignee" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {assignees?.map((assignee) => (
                    <SelectItem key={assignee.id} value={assignee.id}>
                      {assignee.fullName || assignee.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Project Name (read-only) */}
              {selectedProjectData && (
                <div className="flex items-center gap-1.5 h-8 text-sm text-gray-700 px-2.5 border border-gray-300 rounded-md bg-white">
                  <Video className="w-3 h-3 text-gray-600" />
                  <span>{selectedProjectData.name}</span>
                </div>
              )}

              <div className="relative flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 rounded-md px-2.5 py-1.5 h-8 bg-white hover:bg-gray-50">
                <Calendar className="w-3 h-3" />
                {dueDate ? (
                  <span className="text-xs">{dueDate}</span>
                ) : (
                  <span className="text-xs text-gray-400">Due Date</span>
                )}
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <div className="relative flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 rounded-md px-2.5 py-1.5 h-8 bg-white hover:bg-gray-50">
                <Calendar className="w-3 h-3" />
                {publishDate ? (
                  <span className="text-xs">{publishDate}</span>
                ) : (
                  <span className="text-xs text-gray-400">Publish Date</span>
                )}
                <Input
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Video Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">Video URL</Label>
                <Input
                  value={issueForm.videoUrl}
                  onChange={(e) => setIssueForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="Enter video URL"
                  className="mt-1 border-gray-300 text-sm"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Video Duration (HH:MM:SS)</Label>
                <Input
                  value={issueForm.videoDuration}
                  onChange={(e) => setIssueForm(prev => ({ ...prev, videoDuration: e.target.value }))}
                  placeholder="0:01:00"
                  className="mt-1 border-gray-300 text-sm"
                />
              </div>
            </div>

            {/* Task List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setTaskListExpanded(!taskListExpanded)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-700"
                >
                  {taskListExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  )}
                  <span>Task List {tasks.length}</span>
                </button>
              </div>
              {taskListExpanded && (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2">
                      <Input
                        value={task.name}
                        onChange={(e) => setTasks(tasks.map(t => t.id === task.id ? { ...t, name: e.target.value } : t))}
                        placeholder="Task name"
                        className="flex-1 h-8 text-sm border-gray-300"
                      />
                      <Input
                        type="number"
                        value={task.points}
                        onChange={(e) => setTasks(tasks.map(t => t.id === task.id ? { ...t, points: parseInt(e.target.value) || 0 } : t))}
                        className="w-16 h-8 text-sm border-gray-300 text-center"
                        min="0"
                      />
                      <Select
                        value={task.priority}
                        onValueChange={(value) => setTasks(tasks.map(t => t.id === task.id ? { ...t, priority: value } : t))}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-sm border-gray-300">
                          <div className="flex items-center gap-1.5">
                            <MoreHorizontal className="w-3 h-3 text-gray-600" />
                            <SelectValue>
                              {task.priority === "no_priority" ? "No Priority" :
                               task.priority === "low" ? "Low" :
                               task.priority === "medium" ? "Medium" :
                               task.priority === "high" ? "High" : "No Priority"}
                            </SelectValue>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no_priority">No Priority</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={task.assignedTo || "unassigned"}
                        onValueChange={(value) => setTasks(tasks.map(t => t.id === task.id ? { ...t, assignedTo: value === "unassigned" ? null : value } : t))}
                      >
                        <SelectTrigger className="w-8 h-8 p-0 border-0">
                          {task.assignedTo && assignees ? (
                            <Avatar className="w-6 h-6 cursor-pointer">
                              <AvatarImage src={assignees.find((m) => m.id === task.assignedTo)?.profilePicture || undefined} />
                              <AvatarFallback className="text-[10px] bg-gray-200">
                                {assignees.find((m) => m.id === task.assignedTo)?.fullName?.[0] || 
                                 assignees.find((m) => m.id === task.assignedTo)?.username[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-6 h-6 rounded-full border border-gray-300 bg-gray-100 cursor-pointer" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {assignees?.map((assignee) => (
                            <SelectItem key={assignee.id} value={assignee.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5">
                                  <AvatarImage src={assignee.profilePicture || undefined} />
                                  <AvatarFallback className="text-[10px]">
                                    {assignee.fullName?.[0] || assignee.username[0] || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                {assignee.fullName || assignee.username}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-gray-600"
                        onClick={() => setTasks(tasks.filter(t => t.id !== task.id))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {taskListExpanded && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTasks([...tasks, { id: `task-${Date.now()}`, name: "", points: 0, priority: "no_priority", assignedTo: null }])}
                  className="mt-2 bg-black text-white hover:bg-gray-900 border-0"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add task
                </Button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              <Switch
                checked={issueForm.createMore}
                onCheckedChange={(checked) => setIssueForm(prev => ({ ...prev, createMore: checked as boolean }))}
                id="create-more"
              />
              <Label htmlFor="create-more" className="text-sm text-gray-700 cursor-pointer">
                Create More
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsCreateIssueDialogOpen(false)}
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateIssue}
                disabled={createIssueMutation.isPending || (!issueForm.title.trim() && !issueForm.description.trim() && !issueForm.templateId)}
                className="bg-black text-white hover:bg-gray-900"
              >
                {createIssueMutation.isPending ? "Creating..." : "Create Issue"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IssueCard({ 
  issue, 
  onDragStart, 
  onDragEnd,
  isDragging 
}: { 
  issue: Issue; 
  onDragStart: (e: React.DragEvent, issue: Issue) => void;
  onDragEnd: () => void;
  isDragging?: boolean;
}) {
  const { toast } = useToast();
  
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useQuery<Task[]>({
    queryKey: ["/api/issues", issue.id, "tasks"],
    queryFn: async () => {
      console.log(`[IssueCard] Fetching tasks for issue: ${issue.id}`);
      const res = await fetch(`/api/issues/${issue.id}/tasks`, { credentials: "include" });
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[IssueCard] Failed to fetch tasks: ${res.status} ${res.statusText}`, errorText);
        throw new Error("Failed to fetch tasks");
      }
      const data = await res.json();
      console.log(`[IssueCard] Received ${data.length} tasks for issue ${issue.id}:`, data);
      return data;
    },
    enabled: !!issue.id, // Always enabled if issue has an id
    retry: 2,
  });

  const { data: members } = useQuery<Array<{ id: string; fullName: string | null; username: string; profilePicture: string | null }>>({
    queryKey: ["/api/members/assignees"],
    queryFn: async () => {
      const res = await fetch("/api/members/assignees", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: { taskId: string; isCompleted: boolean }) => {
      // Update task status via direct database update
      const response = await apiRequest("PATCH", `/api/tasks/${data.taskId}`, {
        status: data.isCompleted ? "completed" : "pending",
        isCompleted: data.isCompleted,
        completedAt: data.isCompleted ? new Date().toISOString() : null,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues", issue.id, "tasks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
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
  
  // Debug logging
  React.useEffect(() => {
    console.log(`[IssueCard] Issue: ${issue.title} (${issue.id}):`, {
      issueId: issue.id,
      tasksCount: issueTasks.length,
      tasks: issueTasks,
      tasksLoading,
      tasksError,
      rawTasks: tasks,
    });
  }, [issue.id, issue.title, issueTasks.length, tasksLoading, tasksError, tasks]);

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, issue)}
      onDragEnd={onDragEnd}
      className={`cursor-move transition-all duration-200 bg-white border-gray-200 ${
        isDragging 
          ? "opacity-50 scale-95 rotate-1 shadow-lg" 
          : "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
      }`}
      style={{
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <CardContent className="p-3">
        {/* Issue Title */}
        <h4 className="font-semibold text-gray-900 text-sm mb-3">{issue.title}</h4>

        {/* Tasks List - Always show if tasks exist */}
        {tasksLoading ? (
          <div className="mb-3 text-xs text-gray-500">Loading tasks...</div>
        ) : tasksError ? (
          <div className="mb-3 text-xs text-red-500">Error loading tasks: {tasksError.message}</div>
        ) : issueTasks && issueTasks.length > 0 ? (
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-700 mb-2">Tasks ({issueTasks.length})</div>
            <div className="space-y-1.5">
              {issueTasks.map((task) => {
                const memberId = task.assignedTo || task.memberId;
                const member = getMember(memberId);
                const taskName = task.name || task.title || "Untitled Task";
                const isCompleted = task.isCompleted || task.status === "completed";
                return (
                  <div key={task.id} className="flex items-center gap-2 text-xs">
                    <Checkbox 
                      checked={isCompleted} 
                      onCheckedChange={(checked) => {
                        updateTaskMutation.mutate({
                          taskId: task.id,
                          isCompleted: checked as boolean,
                        });
                      }}
                      className="w-3.5 h-3.5 rounded border-gray-300 data-[state=checked]:bg-black data-[state=checked]:border-black"
                    />
                    <span className={`flex-1 text-gray-900 ${isCompleted ? "line-through text-gray-500" : ""}`}>
                      {taskName}
                    </span>
                    <span className="text-gray-600 font-medium">{task.points || 0} pts</span>
                    {member ? (
                      <Avatar className="w-5 h-5 flex-shrink-0">
                        <AvatarImage src={member.profilePicture || undefined} />
                        <AvatarFallback className="text-[8px] bg-gray-200">
                          {member.fullName?.[0] || member.username[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-gray-300 bg-gray-100 flex-shrink-0"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-3 text-xs text-gray-400">No tasks</div>
        )}

        {/* Creation Date - Bottom Left */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span>Created: {formatDate(issue.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
