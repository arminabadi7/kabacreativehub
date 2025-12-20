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
import { ArrowLeft, Plus, X, User, MoreHorizontal, Flag, ChevronDown, Folder, Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";

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

export default function TemplateCreatePage({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    description: "",
    videoUrl: "",
    videoDuration: "0:01:00",
    teamId: null as string | null,
    defaultStatus: "backlog",
    defaultPriority: "no_priority",
    defaultAssigneeId: null as string | null,
    defaultProjectId: null as string | null,
  });

  const [tasks, setTasks] = useState<Omit<TemplateTask, "id" | "templateId">[]>([]);

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

  // Fetch teams
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

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/templates", {
        name: data.name,
        title: data.title,
        description: data.description || null,
        videoUrl: data.videoUrl || null,
        videoDuration: data.videoDuration || null,
        teamId: data.teamId,
        defaultStatus: data.defaultStatus,
        defaultPriority: data.defaultPriority,
        defaultAssigneeId: data.defaultAssigneeId,
        defaultProjectId: data.defaultProjectId,
      });
      return await response.json();
    },
    onSuccess: async (newTemplate) => {
      // Create tasks for the template
      if (tasks.length > 0) {
        await Promise.all(
          tasks
            .filter((task) => task.name && task.name.trim())
            .map(async (task, index) => {
              const response = await apiRequest("POST", `/api/templates/${newTemplate.id}/tasks`, {
                name: task.name.trim(),
                points: task.points || 0,
                priority: task.priority || "no_priority",
                assignedTo: task.assignedTo || null,
                order: index,
              });
              return await response.json();
            })
        );
      }
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Success!",
        description: "Template created successfully.",
      });
      onBack();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!formData.name.trim() || !formData.title.trim()) {
      toast({
        title: "Error",
        description: "Name and Title are required",
        variant: "destructive",
      });
      return;
    }
    createTemplateMutation.mutate(formData);
  };

  const handleAddTask = () => {
    setTasks([...tasks, { name: "", points: 0, priority: "no_priority", assignedTo: null, order: tasks.length }]);
  };

  const handleTaskUpdate = (index: number, field: string, value: any) => {
    setTasks((prevTasks) =>
      prevTasks.map((task, i) =>
        i === index ? { ...task, [field]: value } : task
      )
    );
  };

  const handleRemoveTask = (index: number) => {
    setTasks((prevTasks) => prevTasks.filter((_, i) => i !== index));
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
      <h1 className="text-3xl font-bold mb-6">Create issue template</h1>

      {/* Name Field */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="text-lg font-semibold border-gray-300"
          placeholder="Template name"
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
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Video URL</Label>
              <Input
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="Enter video URL"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Video Duration (HH:MM:SS)</Label>
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
                <Button variant="outline" size="sm" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 h-8 text-sm px-2.5">
                  <Globe className="w-3 h-3 text-gray-500" />
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
                <Button variant="outline" size="sm" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 h-8 text-sm px-2.5">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
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
                <Button variant="outline" size="sm" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 h-8 text-sm px-2.5">
                  <MoreHorizontal className="w-3 h-3 text-gray-600" />
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
                <Button variant="outline" size="sm" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 h-8 text-sm px-2.5">
                  {getSelectedAssignee() ? (
                    <>
                      <Avatar className="w-3 h-3 mr-0">
                        <AvatarFallback className="text-[10px]">
                          {getSelectedAssignee()?.fullName?.[0] || getSelectedAssignee()?.username[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      {getSelectedAssignee()?.fullName || getSelectedAssignee()?.username}
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 text-gray-600" />
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
                <Button variant="outline" size="sm" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 h-8 text-sm px-2.5">
                  <Flag className="w-3 h-3 text-gray-600" />
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
            {tasks.map((task, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <Input
                  value={task.name}
                  onChange={(e) => handleTaskUpdate(index, "name", e.target.value)}
                  className="flex-1 bg-white border-gray-300"
                  placeholder="Task name"
                />
                <Input
                  type="number"
                  value={task.points}
                  onChange={(e) => handleTaskUpdate(index, "points", parseInt(e.target.value) || 0)}
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
                          onClick={() => handleTaskUpdate(index, "priority", priority.value)}
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
                        onClick={() => handleTaskUpdate(index, "assignedTo", null)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                      >
                        Unassigned
                      </button>
                      {members && members.length > 0 ? (
                        members.map((member) => (
                          <button
                            key={member.id}
                            onClick={() => handleTaskUpdate(index, "assignedTo", member.id)}
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
                  onClick={() => handleRemoveTask(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 w-8 h-8 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button
              onClick={handleAddTask}
              variant="outline"
              className="flex items-center gap-2 bg-black text-white hover:bg-gray-900 border-0"
            >
              <Plus className="w-4 h-4" />
              Add task
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pb-6">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          disabled={createTemplateMutation.isPending}
          className="bg-gray-900 text-white hover:bg-gray-800"
        >
          {createTemplateMutation.isPending ? "Creating..." : "Create"}
        </Button>
      </div>
    </div>
  );
}





