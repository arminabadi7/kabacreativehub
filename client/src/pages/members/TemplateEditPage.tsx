import { useState, useEffect } from "react";
import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Plus, X, User, MoreHorizontal, Flag, ChevronDown, Folder } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";

type Template = {
  id: string;
  name: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  videoDuration: string | null;
  teamId?: string | null;
  defaultStatus?: string | null;
  defaultPriority?: string | null;
  defaultAssigneeId?: string | null;
  defaultProjectId?: string | null;
  createdAt: string;
  updatedAt: string;
};

type TemplateTask = {
  id: string;
  templateId: string;
  name: string;
  points: number;
  priority: string;
  assignedTo: string | null;
  order: number;
};

type Member = {
  id: string;
  username: string;
  fullName: string | null;
  email: string;
  role: string;
};

type Project = {
  id: string;
  name: string;
  clientId: string;
};

type Team = {
  id: string;
  name: string;
  description: string | null;
};

export default function TemplateEditPage({ template, onBack }: { template: Template; onBack: () => void }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: template.name,
    title: template.title,
    description: template.description || "",
    videoUrl: template.videoUrl || "",
    videoDuration: template.videoDuration || "0:01:00",
    teamId: template.teamId || null,
    defaultStatus: template.defaultStatus || "todo",
    defaultPriority: template.defaultPriority || "no_priority",
    defaultAssigneeId: template.defaultAssigneeId || null,
    defaultProjectId: template.defaultProjectId || null,
  });

  const [tasks, setTasks] = useState<TemplateTask[]>([]);
  const [newTaskName, setNewTaskName] = useState("");

  // Fetch template tasks
  const { data: templateTasks } = useQuery<TemplateTask[]>({
    queryKey: ["/api/templates", template.id, "tasks"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/templates/${template.id}/tasks`);
      return await response.json();
    },
  });

  // Fetch members (for assignee selection) - filtered by team
  const { data: members } = useQuery<Member[]>({
    queryKey: ["/api/members/assignees", formData.teamId],
    queryFn: async () => {
      const url = formData.teamId 
        ? `/api/members/assignees?teamId=${formData.teamId}`
        : "/api/members/assignees";
      const response = await apiRequest("GET", url);
      return await response.json();
    },
  });

  // Fetch projects
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/projects");
      return await response.json();
    },
  });

  // Fetch teams (or create default teams based on member roles)
  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/teams");
        return await response.json();
      } catch {
        // If teams endpoint doesn't exist, create default teams from member roles
        const roleTeams: Team[] = [
          { id: "persian", name: "Persian", description: "Persian language team" },
          { id: "english", name: "English", description: "English language team" },
          { id: "all", name: "All Teams", description: "All teams" },
        ];
        return roleTeams;
      }
    },
  });

  // Update local tasks when templateTasks changes
  useEffect(() => {
    if (templateTasks) {
      setTasks(templateTasks.sort((a, b) => a.order - b.order));
    }
  }, [templateTasks]);

  const updateTemplateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("PATCH", `/api/templates/${template.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates", template.id] });
      toast({
        title: "Success!",
        description: "Template updated successfully.",
      });
      onBack();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (taskName: string) => {
      const response = await apiRequest("POST", `/api/templates/${template.id}/tasks`, {
        name: taskName,
        points: 0,
        priority: "no_priority",
        order: tasks.length,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates", template.id, "tasks"] });
      setNewTaskName("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add task",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: { taskId: string; name?: string; points?: number; priority?: string; assignedTo?: string | null }) => {
      const response = await apiRequest("PATCH", `/api/templates/${template.id}/tasks/${data.taskId}`, {
        name: data.name,
        points: data.points,
        priority: data.priority,
        assignedTo: data.assignedTo,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates", template.id, "tasks"] });
      setEditingTaskId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest("DELETE", `/api/templates/${template.id}/tasks/${taskId}`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates", template.id, "tasks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  const handleUpdate = () => {
    updateTemplateMutation.mutate(formData);
  };

  const handleAddTask = () => {
    if (newTaskName.trim()) {
      addTaskMutation.mutate(newTaskName.trim());
    }
  };

  const handleTaskUpdate = (taskId: string, field: string, value: any) => {
    // Update local state immediately for better UX
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, [field]: value } : task
      )
    );
    // Then sync with server
    updateTaskMutation.mutate({
      taskId,
      [field]: value,
    });
  };

  const getAssignedMember = (memberId: string | null) => {
    if (!memberId) return null;
    return members?.find((m) => m.id === memberId);
  };

  const getSelectedTeam = () => {
    return teams?.find(t => t.id === formData.teamId) || null;
  };

  const getSelectedProject = () => {
    return projects?.find(p => p.id === formData.defaultProjectId) || null;
  }

  const getSelectedAssignee = () => {
    return members?.find(m => m.id === formData.defaultAssigneeId) || null;
  }

  const statusOptions = [
    { value: "todo", label: "Todo" },
    { value: "backlog", label: "Backlog" },
    { value: "in_progress", label: "In Progress" },
    { value: "review", label: "Review" },
    { value: "done", label: "Done" },
  ];

  const priorityOptions = [
    { value: "no_priority", label: "No Priority" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Edit issue template</h1>

      {/* Name Field */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="text-lg font-semibold border-gray-300"
        />
      </div>

      {/* Main Template Card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-xl font-semibold border-none p-0 h-auto focus-visible:ring-0"
              placeholder="Template title"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add description..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Drive Location / Video URL</Label>
              <Input
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="Enter video URL or drive location"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Video Duration (seconds)</Label>
              <Input
                value={formData.videoDuration}
                onChange={(e) => setFormData({ ...formData, videoDuration: e.target.value })}
                placeholder="0:01:00"
              />
            </div>
          </div>

          {/* Tags Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Team Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 flex items-center gap-1">
                  <Folder className="w-4 h-4" />
                  {getSelectedTeam()?.name || "Team"} <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0">
                <div className="p-1">
                  {teams?.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => setFormData({ ...formData, teamId: team.id })}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                    >
                      <Folder className="w-4 h-4" />
                      {team.name}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Status Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  {statusOptions.find(s => s.value === formData.defaultStatus)?.label || "Status"} <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0">
                <div className="p-1">
                  {statusOptions.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => setFormData({ ...formData, defaultStatus: status.value })}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Priority Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="hover:bg-gray-100">
                  <MoreHorizontal className="w-4 h-4 mr-1" />
                  {priorityOptions.find(p => p.value === formData.defaultPriority)?.label || "No Priority"} <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-0">
                <div className="p-1">
                  {priorityOptions.map((priority) => (
                    <button
                      key={priority.value}
                      onClick={() => setFormData({ ...formData, defaultPriority: priority.value })}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Assignee Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="hover:bg-gray-100 flex items-center gap-1">
                  {getSelectedAssignee() ? (
                    <>
                      <Avatar className="w-4 h-4 mr-0">
                        <AvatarFallback className="text-[10px]">
                          {getSelectedAssignee()?.fullName?.[0] || getSelectedAssignee()?.username[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      {getSelectedAssignee()?.fullName || getSelectedAssignee()?.username}
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-1" />
                      Assignee
                    </>
                  )}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0">
                <div className="p-1">
                  <button
                    onClick={() => setFormData({ ...formData, defaultAssigneeId: null })}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                  >
                    Unassigned
                  </button>
                  {members?.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setFormData({ ...formData, defaultAssigneeId: member.id })}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                    >
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-xs">
                          {member.fullName?.[0] || member.username[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      {member.fullName || member.username}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Project Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100">
                  <Flag className="w-4 h-4 mr-1" />
                  {getSelectedProject()?.name || "Project"} <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0">
                <div className="p-1">
                  <button
                    onClick={() => setFormData({ ...formData, defaultProjectId: null })}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                  >
                    No Project
                  </button>
                  {projects?.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setFormData({ ...formData, defaultProjectId: project.id })}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Create Task Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Create task</h3>
            <Button variant="outline" size="sm" className="text-gray-600 rounded-lg">
              Template
            </Button>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <Input
                  value={task.name}
                  onChange={(e) => handleTaskUpdate(task.id, "name", e.target.value)}
                  className="flex-1 bg-white border-gray-300"
                  placeholder="Task name"
                />
                <Input
                  type="number"
                  value={task.points}
                  onChange={(e) => handleTaskUpdate(task.id, "points", parseInt(e.target.value) || 0)}
                  className="w-20 bg-white border-gray-300"
                  placeholder="0"
                  min="0"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-32 justify-start bg-white border-gray-300">
                      {priorityOptions.find(p => p.value === task.priority)?.label || "No Priority"}
                      <ChevronDown className="w-3 h-3 ml-auto" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-0">
                    <div className="p-1">
                      {priorityOptions.map((priority) => (
                        <button
                          key={priority.value}
                          onClick={() => handleTaskUpdate(task.id, "priority", priority.value)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                        >
                          {priority.label}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="w-8 h-8 flex-shrink-0">
                      {task.assignedTo ? (
                        <Avatar className="w-8 h-8 cursor-pointer border-2 border-gray-300">
                          <AvatarImage src={getAssignedMember(task.assignedTo)?.email ? undefined : undefined} />
                          <AvatarFallback className="text-xs bg-gray-200">
                            {getAssignedMember(task.assignedTo)?.fullName?.[0] || getAssignedMember(task.assignedTo)?.username[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 bg-white">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0">
                    <div className="p-1">
                      <button
                        onClick={() => handleTaskUpdate(task.id, "assignedTo", null)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      >
                        Unassigned
                      </button>
                      {members && members.length > 0 ? (
                        members.map((member) => (
                          <button
                            key={member.id}
                            onClick={() => handleTaskUpdate(task.id, "assignedTo", member.id)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                          >
                            <Avatar className="w-5 h-5">
                              <AvatarFallback className="text-xs bg-gray-200">
                                {member.fullName?.[0] || member.username[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            {member.fullName || member.username}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          {formData.teamId ? "No members in this team" : "Select a team first"}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTaskMutation.mutate(task.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 w-8 h-8 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <div className="flex items-center gap-2 pt-2">
              <Input
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="Task name"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddTask();
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={handleAddTask}
                variant="outline"
                disabled={!newTaskName.trim() || addTaskMutation.isPending}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add task
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pb-6">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button
          onClick={handleUpdate}
          disabled={updateTemplateMutation.isPending}
          className="bg-gray-900 text-white hover:bg-gray-800"
        >
          {updateTemplateMutation.isPending ? "Updating..." : "Update"}
        </Button>
      </div>
    </div>
  );
}
