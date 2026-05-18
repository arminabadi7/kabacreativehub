import { useState } from "react";
import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, BarChart3, User, Filter, ChevronDown, ChevronUp, ArrowLeft, Pencil, Check, X, Folder, Video, Calendar, Flag, UserCircle, Globe, MoreHorizontal, Circle, AlertCircle } from "lucide-react";
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
  videoDurationSeconds?: number | null;
  priority?: string;
  assigneeId?: string | null;
  createdAt: string;
  tasks?: Task[]; // Tasks should always be included with issues from the API
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

type ProjectsBoardProps = {
  allowCreateProject?: boolean;
};

export default function ProjectsBoard({ allowCreateProject = false }: ProjectsBoardProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectClientId, setNewProjectClientId] = useState<string>("");
  const [newProjectTeamId, setNewProjectTeamId] = useState<string>("");
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

  const { data: issues, isLoading: issuesLoading, error: issuesError } = useQuery<Issue[]>({
    queryKey: ["/api/projects", selectedProject, "issues"],
    queryFn: async () => {
      if (!selectedProject) return [];
      console.log(`[ProjectsBoard] Fetching issues for project: ${selectedProject}`);
      const res = await fetch(`/api/projects/${selectedProject}/issues`, { credentials: "include" });
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[ProjectsBoard] Failed to fetch issues: ${res.status}`, errorText);
        throw new Error(`Failed to fetch issues: ${res.status} ${errorText}`);
      }
      const data = await res.json();
      console.log(`[ProjectsBoard] Fetched ${data.length} issues from API`);
      
      // Log tasks for each issue to verify they're included
      data.forEach((issue: Issue, index: number) => {
        const taskCount = issue.tasks?.length || 0;
        console.log(`[ProjectsBoard] Issue ${index + 1}: "${issue.title}" (${issue.id})`, {
          hasTasks: !!issue.tasks,
          taskCount,
          tasks: issue.tasks,
          issueKeys: Object.keys(issue),
        });
        if (taskCount > 0) {
          console.log(`[ProjectsBoard] ✓ Issue "${issue.title}" has ${taskCount} tasks:`, issue.tasks?.map(t => ({ 
            id: t.id, 
            name: t.name || t.title, 
            points: t.points,
            assignedTo: t.assignedTo 
          })));
        } else {
          console.warn(`[ProjectsBoard] ✗ Issue "${issue.title}" has NO tasks!`);
        }
      });
      
      // Verify data structure
      if (data.length > 0) {
        console.log(`[ProjectsBoard] Sample issue structure:`, {
          id: data[0].id,
          title: data[0].title,
          hasTasks: !!data[0].tasks,
          taskCount: data[0].tasks?.length || 0,
          allKeys: Object.keys(data[0]),
        });
      }
      
      return data;
    },
    enabled: !!selectedProject,
  });

  // Invalidate task queries when issues list changes (e.g., new issue created from template)
  React.useEffect(() => {
    if (issues && issues.length > 0) {
      // Small delay to ensure server has finished creating tasks
      const timer = setTimeout(() => {
        issues.forEach((issue) => {
          queryClient.invalidateQueries({ queryKey: ["/api/issues", issue.id] });
          queryClient.invalidateQueries({ queryKey: ["/api/projects", issue.projectId, "issues"] });
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [issues?.length]); // Only run when number of issues changes

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

  // OPTIONAL: Fetch template tasks for display in form (backend will handle automatically when creating issue)
  const { data: templateTasks } = useQuery<any[]>({
    queryKey: ["/api/templates", issueForm.templateId, "tasks"],
    queryFn: async () => {
      if (!issueForm.templateId) return [];
      const res = await fetch(`/api/templates/${issueForm.templateId}/tasks`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch template tasks");
      return res.json();
    },
    enabled: !!issueForm.templateId,
    // This is optional - backend will automatically fetch and include tasks when templateId is provided
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const selectedProjectData = projects?.find((p) => p.id === selectedProject);

  // Fetch default statuses from API
  const { data: defaultStatuses = DEFAULT_STATUSES } = useQuery<string[]>({
    queryKey: ["/api/settings/default-statuses"],
    queryFn: async () => {
      const res = await fetch("/api/settings/default-statuses", { credentials: "include" });
      if (!res.ok) {
        // Fall back to hardcoded defaults if API fails
        return DEFAULT_STATUSES;
      }
      return res.json();
    },
  });

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
  const STATUSES = defaultStatuses; // Use configurable default statuses

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
      console.log("[TemplateChange] Loading template:", template);
      
      // Convert videoDuration from seconds to HH:MM:SS format if it's a number
      let videoDuration = "0:01:00";
      if (template.videoDuration) {
        if (typeof template.videoDuration === 'number') {
          const hours = Math.floor(template.videoDuration / 3600);
          const minutes = Math.floor((template.videoDuration % 3600) / 60);
          const seconds = template.videoDuration % 60;
          videoDuration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
          videoDuration = template.videoDuration;
        }
      }

      const templateStatus = template.defaultStatus || createIssueStatus || "backlog";
      const templatePriority = template.defaultPriority || "no_priority";
      const templateAssignee = template.defaultAssigneeId || "";

      console.log("[TemplateChange] Template data being applied:", {
        title: template.title || template.issueTitle,
        description: template.description,
        teamId: template.teamId,
        status: templateStatus,
        priority: templatePriority,
        assigneeId: templateAssignee,
        videoUrl: template.videoUrl,
        videoDuration: videoDuration,
      });

      setIssueForm(prev => ({
        ...prev,
        templateId,
        title: template.title || template.issueTitle || "",
        description: template.description || "",
        teamId: template.teamId || "",
        status: templateStatus,
        priority: templatePriority,
        assigneeId: templateAssignee,
        videoUrl: template.videoUrl || "",
        videoDuration: videoDuration,
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
      console.log("[CreateIssueMutation] Received data:", data);
      console.log("[CreateIssueMutation] Template ID:", data.templateId || issueForm.templateId);
      console.log("[CreateIssueMutation] Current tasks state:", tasks);
      
      // Convert video duration from HH:MM:SS to seconds
      let videoDurationSeconds = null;
      if (data.videoDuration && data.videoDuration !== "0:00:00") {
        const parts = data.videoDuration.split(":").map(Number);
        if (parts.length === 3) {
          videoDurationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      }
      
      // NEW WORKFLOW: Backend automatically fetches template tasks when templateId is provided
      // We can optionally send tasks if user manually edited them, otherwise backend handles it
      const templateId = data.templateId || issueForm.templateId || null;
      
      // If user manually edited tasks in the form, include them
      // Otherwise, backend will automatically fetch from template
      let tasksToSend: any[] | undefined = undefined;
      if (tasks && tasks.length > 0) {
        // User has manually set tasks - send them
        tasksToSend = tasks
          .filter((task) => task.name && task.name.trim())
          .map((task, index) => ({
            name: task.name.trim(),
            points: task.points || 0,
            priority: task.priority || "no_priority",
            assignedTo: task.assignedTo || null,
            order: task.order !== undefined ? task.order : index,
          }));
        console.log("[CreateIssueMutation] Sending manually edited tasks:", tasksToSend.length);
      } else if (templateId) {
        // No manual tasks, but templateId provided - backend will fetch automatically
        console.log("[CreateIssueMutation] No manual tasks - backend will automatically fetch from template");
        tasksToSend = undefined; // Don't send tasks - let backend handle it
      }
      
      const issueData: any = {
        projectId: selectedProject,
        title: data.title,
        description: data.description || null,
        status: data.status,
        videoUrl: data.videoUrl || null,
        videoDuration: videoDurationSeconds,
        order: 0,
        teamId: data.teamId || null,
        priority: data.priority || "no_priority",
        assigneeId: data.assigneeId || data.assignedTo || null,
        dueDate: data.dueDate || null,
        publishDate: data.publishDate || null,
        templateId: templateId, // CRITICAL: Include templateId - backend will automatically fetch template and tasks
      };
      
      // Only include tasks if user manually edited them
      // Otherwise, backend will automatically fetch from template
      if (tasksToSend && tasksToSend.length > 0) {
        issueData.tasks = tasksToSend;
        console.log("[CreateIssueMutation] Including manually edited tasks in request");
      } else {
        console.log("[CreateIssueMutation] Not sending tasks - backend will fetch from template automatically");
      }
      
      console.log("[CreateIssueMutation] Sending issue data:", {
        ...issueData,
        tasks: issueData.tasks ? `${issueData.tasks.length} tasks` : "will be fetched by backend"
      });
      
      const response = await apiRequest("POST", "/api/issues", issueData);
      const issue = await response.json();
      
      console.log("[CreateIssueMutation] Issue created with tasks:", issue.tasks?.length || 0);
      return issue;
    },
    onSuccess: async (issue) => {
      console.log(`[CreateIssue] Issue created: ${issue.id}`);
      console.log(`[CreateIssue] Issue tasks count: ${issue.tasks?.length || 0}`);
      console.log(`[CreateIssue] Issue tasks:`, issue.tasks);
      
      // CRITICAL: Verify tasks are in the response
      if (!issue.tasks || issue.tasks.length === 0) {
        console.error(`[CreateIssue] WARNING: Issue ${issue.id} was created but has NO tasks!`);
        console.error(`[CreateIssue] This might indicate a problem with task creation in the backend.`);
        // Try to refetch the issue to get tasks
        setTimeout(async () => {
          try {
            const res = await fetch(`/api/issues/${issue.id}`, { credentials: "include" });
            if (res.ok) {
              const refetchedIssue = await res.json();
              console.log(`[CreateIssue] Refetched issue has ${refetchedIssue.tasks?.length || 0} tasks`);
              if (refetchedIssue.tasks && refetchedIssue.tasks.length > 0) {
                issue.tasks = refetchedIssue.tasks;
                // Update cache with refetched issue
                queryClient.setQueryData(["/api/issues", issue.id], issue);
              }
            }
          } catch (error) {
            console.error(`[CreateIssue] Error refetching issue:`, error);
          }
        }, 1000);
      }
      
      // Issue is now created with tasks already attached
      // CRITICAL: Set the cache for the individual issue query FIRST
      // This ensures when we navigate to the issue detail page, it has the tasks
      console.log(`[CreateIssue] Setting cache for issue ${issue.id} with ${issue.tasks?.length || 0} tasks`);
      queryClient.setQueryData(
        ["/api/issues", issue.id],
        issue
      );
      
      // Update the cache for the project issues list
      queryClient.setQueryData(
        ["/api/projects", selectedProject, "issues"],
        (oldData: Issue[] | undefined) => {
          if (!oldData) return [issue];
          // Check if issue already exists (shouldn't, but just in case)
          const existingIndex = oldData.findIndex((i) => i.id === issue.id);
          if (existingIndex >= 0) {
            // Update existing issue with tasks
            const updated = [...oldData];
            updated[existingIndex] = { ...updated[existingIndex], tasks: issue.tasks || [] };
            return updated;
          }
          // Add new issue at the beginning
          return [issue, ...oldData];
        }
      );
      
      // Don't invalidate immediately - let the cache be used first
      // Only refetch after a delay to ensure tasks are committed
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/issues", issue.id] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject, "issues"] });
        queryClient.refetchQueries({ queryKey: ["/api/issues", issue.id] });
        queryClient.refetchQueries({ queryKey: ["/api/projects", selectedProject, "issues"] });
      }, 1000);
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

    // Convert videoDuration from template (seconds) to HH:MM:SS format if needed
    let videoDuration = issueForm.videoDuration;
    if (selectedTemplateData?.videoDuration && typeof selectedTemplateData.videoDuration === 'number') {
      // Template has videoDuration in seconds, convert to HH:MM:SS
      const hours = Math.floor(selectedTemplateData.videoDuration / 3600);
      const minutes = Math.floor((selectedTemplateData.videoDuration % 3600) / 60);
      const seconds = selectedTemplateData.videoDuration % 60;
      videoDuration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    const issueData = {
      ...issueForm,
      title: issueTitle || issueForm.description.trim(),
      status: issueForm.status || createIssueStatus || "backlog",
      assignedTo: issueForm.assigneeId || null, // Map assigneeId to assignedTo
      videoDuration: videoDuration || "0:01:00",
      dueDate: dueDate || null,
      publishDate: publishDate || null,
    };

    console.log("[CreateIssue] Creating issue with data from template:", {
      templateId: issueForm.templateId,
      templateData: selectedTemplateData,
      issueData: issueData,
      tasks: tasks,
    });

    createIssueMutation.mutate(issueData);
  };

  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; clientId: string; teamId?: string; fileLink?: string }) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsCreateDialogOpen(false);
      setNewProjectName("");
      setNewProjectDescription("");
      setNewProjectClientId("");
      setNewProjectTeamId("");
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
      teamId: newProjectTeamId || undefined,
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

  // Debug logging
  React.useEffect(() => {
    console.log(`[ProjectsBoard] Issues state:`, {
      selectedProject,
      issuesCount: issues?.length || 0,
      issues,
      issuesLoading,
      issuesError,
      issuesByStatus,
    });
  }, [selectedProject, issues, issuesLoading, issuesError]);

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
          {allowCreateProject && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-black text-white hover:bg-gray-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          )}
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
            {allowCreateProject && (
              <p className="text-gray-400 text-sm mt-2">Click "New Project" to create your first project</p>
            )}
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
                <Label htmlFor="project-team">Team</Label>
                <Select value={newProjectTeamId} onValueChange={setNewProjectTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-team">No Team</SelectItem>
                    {teams?.map((team: { id: string; name: string }) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
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

        {/* Loading State */}
        {issuesLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading issues...</p>
          </div>
        )}

        {/* Error State */}
        {issuesError && (
          <div className="text-center py-12">
            <p className="text-red-500">Error loading issues: {issuesError instanceof Error ? issuesError.message : "Unknown error"}</p>
          </div>
        )}

        {/* Empty State */}
        {!issuesLoading && !issuesError && (!issues || issues.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No issues found</p>
            <p className="text-gray-400 text-sm mt-2">Click the + button on any column to create an issue</p>
          </div>
        )}

        {/* Kanban Board */}
        {!issuesLoading && !issuesError && issues && issues.length > 0 && (
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
                          setLocation={setLocation}
                          projectId={selectedProject}
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
        )}
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
              <Select value={issueForm.teamId || "no-team"} onValueChange={(value) => setIssueForm(prev => ({ ...prev, teamId: value === "no-team" ? "" : value }))}>
                <SelectTrigger className="w-[140px] h-9 border-gray-300">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <SelectValue placeholder="Select team" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {teams?.map((team: { id: string; name: string }) => (
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
  isDragging,
  setLocation,
  projectId
}: { 
  issue: Issue; 
  onDragStart: (e: React.DragEvent, issue: Issue) => void;
  onDragEnd: () => void;
  isDragging?: boolean;
  setLocation: (path: string) => void;
  projectId: string | null;
}) {
  const { toast } = useToast();
  
  // Tasks are always part of the issue object - no separate fetching needed
  const issueTasks = issue.tasks || [];
  
  // Debug logging to verify tasks are present
  React.useEffect(() => {
    if (issue.id) {
      console.log(`[IssueCard] Issue "${issue.title}" (${issue.id}):`, {
        hasTasks: !!issue.tasks,
        taskCount: issue.tasks?.length || 0,
        tasks: issue.tasks,
        issueKeys: Object.keys(issue),
      });
    }
  }, [issue.id, issue.tasks]);

  const { data: members } = useQuery<Array<{ id: string; fullName: string | null; username: string; profilePicture: string | null }>>({
    queryKey: ["/api/members/assignees"],
    queryFn: async () => {
      const res = await fetch("/api/members/assignees", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
  });

  const getMember = (memberId: string | null) => {
    if (!memberId || !members) return null;
    return members.find((m) => m.id === memberId);
  };

  const updateTaskMutation = useMutation({
    mutationFn: async (data: { taskId: string; isCompleted: boolean; issueId: string }) => {
      // Use the correct endpoint for updating tasks in the JSON column
      const response = await apiRequest("PATCH", `/api/issues/${data.issueId}/tasks/${data.taskId}`, {
        isCompleted: data.isCompleted,
      });
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate issues query to refetch with updated tasks
      // Tasks are part of the issue, so invalidating the project issues query will refetch with tasks
      if (issue.projectId) {
        queryClient.invalidateQueries({ queryKey: ["/api/projects", issue.projectId, "issues"] });
        queryClient.invalidateQueries({ queryKey: ["/api/issues", issue.id] });
      }
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "issues"] });
      }
      // CRITICAL: Invalidate member stats if task has an assigned member
      // Find the task to get its assignedTo
      const task = issue.tasks?.find((t: any) => t.id === variables.taskId);
      if (task?.assignedTo) {
        console.log(`[ProjectsBoard] Invalidating queries for member ${task.assignedTo} after task completion`);
        // Invalidate specific member stats queries
        queryClient.invalidateQueries({ queryKey: ["/api/members", task.assignedTo, "stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/members", task.assignedTo, "transactions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/members", task.assignedTo, "statistics"] });
        // Also invalidate all member stats for founder dashboard
        queryClient.invalidateQueries({ queryKey: ["/api/members/all-stats"] });
        // Force refetch to ensure UI updates immediately
        queryClient.refetchQueries({ queryKey: ["/api/members", task.assignedTo, "stats"] });
        queryClient.refetchQueries({ queryKey: ["/api/members/all-stats"] });
      }
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


  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea') || target.closest('[role="checkbox"]')) {
      return;
    }
    if (issue.projectId) {
      setLocation(`/member-dashboard/projects/${issue.projectId}/issues/${issue.id}`);
    }
  };

  // Format video duration from seconds to HH:MM:SS
  const formatVideoDuration = (duration: string | number | null | undefined): string => {
    if (!duration) return "0:01:00";
    
    let seconds = 0;
    if (typeof duration === 'string') {
      // Check if it's already in HH:MM:SS format
      const parts = duration.split(':');
      if (parts.length === 3) {
        return duration; // Already formatted
      }
      seconds = parseInt(duration) || 0;
    } else {
      seconds = duration;
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status color for the orange dot
  const getStatusColor = (status: string): string => {
    return STATUS_COLORS[status] || "bg-orange-500";
  };

  const getPriorityColor = (priority: string | undefined | null): string => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getPriorityLabel = (priority: string | undefined | null): string => {
    switch (priority) {
      case "high":
        return "High";
      case "medium":
        return "Medium";
      case "low":
        return "Low";
      default:
        return "No Priority";
    }
  };

  // Get issue assignee (check both assigneeId and assignee_id for compatibility)
  const issueAssigneeId = issue.assigneeId || (issue as any).assignee_id || null;
  const issueAssignee = issueAssigneeId ? getMember(issueAssigneeId) : null;

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, issue)}
      onDragEnd={onDragEnd}
      onClick={handleCardClick}
      className={`cursor-pointer transition-all duration-200 bg-white border-gray-200 ${
        isDragging 
          ? "opacity-50 scale-95 rotate-1 shadow-lg" 
          : "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
      }`}
      style={{
        cursor: isDragging ? "grabbing" : "pointer",
      }}
    >
      <CardContent className="p-3">
        {/* Issue Title Row */}
        <div className="flex items-center gap-2 mb-2">
          {/* Orange Status Dot */}
          <div className={`w-2 h-2 rounded-full ${getStatusColor(issue.status)} flex-shrink-0`}></div>
          
          {/* Issue Title */}
          <h4 className="font-semibold text-gray-900 text-sm flex-1">{issue.title}</h4>
          
          {/* Icons Row */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Priority/Urgency Badge */}
            {issue.priority && issue.priority !== "no_priority" && (
              <Badge 
                variant="outline" 
                className={`text-[10px] px-1.5 py-0.5 h-5 ${getPriorityColor(issue.priority)}`}
              >
                {getPriorityLabel(issue.priority)}
              </Badge>
            )}
            
            {/* Three Horizontal Lines Icon (Menu) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Open issue menu/detail view
              }}
              className="p-0.5 hover:bg-gray-100 rounded"
            >
              <MoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
            </button>
            
            {/* User Icon (Assignee) */}
            {issueAssignee ? (
              <Avatar className="w-5 h-5 flex-shrink-0">
                <AvatarImage src={issueAssignee.profilePicture || undefined} />
                <AvatarFallback className="text-[8px] bg-gray-200">
                  {issueAssignee.fullName?.[0] || issueAssignee.username[0] || "?"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-5 h-5 rounded-full border border-gray-300 bg-gray-100 flex items-center justify-center flex-shrink-0">
                <UserCircle className="w-3 h-3 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Tasks List - Always show if tasks exist */}
        {issueTasks && issueTasks.length > 0 ? (
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-700 mb-1.5">Tasks ({issueTasks.length})</div>
            <div className="space-y-1.5">
              {issueTasks.map((task, idx) => {
                const memberId = task.assignedTo || task.memberId || task.assigned_to || null;
                const member = getMember(memberId);
                const taskName = task.name || task.title || "Untitled Task";
                const isCompleted = task.isCompleted || task.is_completed || task.status === "completed";
                const taskPoints = task.points || 0;
                const taskId = task.id || `task-${idx}`;
                
                console.log(`[IssueCard] Rendering task ${idx + 1}:`, { taskId, taskName, taskPoints, memberId, isCompleted });
                
                return (
                  <div key={taskId} className="flex items-center gap-2 text-xs">
                    <Checkbox 
                      checked={isCompleted} 
                      onCheckedChange={(checked) => {
                        if (task.id) {
                          updateTaskMutation.mutate({
                            taskId: task.id,
                            isCompleted: checked as boolean,
                            issueId: issue.id,
                          });
                        }
                      }}
                      className="w-3.5 h-3.5 rounded border-gray-300 data-[state=checked]:bg-black data-[state=checked]:border-black flex-shrink-0"
                    />
                    <span className={`flex-1 text-gray-900 ${isCompleted ? "line-through text-gray-500" : ""}`}>
                      {taskName}
                    </span>
                    {taskPoints > 0 && (
                      <span className="text-gray-600 font-medium flex-shrink-0">{taskPoints} pts</span>
                    )}
                    {member ? (
                      <Avatar className="w-4 h-4 flex-shrink-0">
                        <AvatarImage src={member.profilePicture || undefined} />
                        <AvatarFallback className="text-[8px] bg-gray-200">
                          {member.fullName?.[0] || member.username[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-4 h-4 flex-shrink-0" /> // Spacer when no assignee
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Debug: Show message when no tasks
          issueTasks.length === 0 && (
            <div className="mb-2 text-xs text-gray-400 italic">
              No tasks (issue.tasks = {JSON.stringify(issue.tasks)})
            </div>
          )
        )}

        {/* Footer: Tasks, Points, Member, and Video Duration */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {/* Tasks Count */}
            {issueTasks.length > 0 && (
              <span className="text-gray-600 font-medium">
                {issueTasks.length} {issueTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            )}
            
            {/* Points Progress */}
            {(() => {
              const totalPoints = issueTasks.reduce((sum: number, task: any) => sum + (task.points || 0), 0);
              const completedPoints = issueTasks
                .filter((task: any) => task.isCompleted || task.is_completed || task.status === "completed")
                .reduce((sum: number, task: any) => sum + (task.points || 0), 0);
              return totalPoints > 0 ? (
                <span className="text-gray-600 font-medium">
                  {completedPoints}/{totalPoints}pt
                </span>
              ) : null;
            })()}
            
            {/* Video Duration */}
            {(issue.videoDuration || issue.videoDurationSeconds) && (
              <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 font-mono">
                {formatVideoDuration(issue.videoDurationSeconds || issue.videoDuration)}
              </span>
            )}
          </div>
          
          {/* Member Assignee */}
          <div className="flex items-center gap-2">
            {issueAssignee && (
              <>
                <span className="text-gray-600 text-[10px] hidden sm:inline">
                  {issueAssignee.fullName || issueAssignee.username}
                </span>
                <Avatar className="w-5 h-5 flex-shrink-0">
                  <AvatarImage src={issueAssignee.profilePicture || undefined} />
                  <AvatarFallback className="text-[8px] bg-gray-200">
                    {issueAssignee.fullName?.[0] || issueAssignee.username[0] || "?"}
                  </AvatarFallback>
                </Avatar>
              </>
            )}
            {!issueAssignee && (
              <span className="text-gray-400 text-[10px] italic">Unassigned</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
