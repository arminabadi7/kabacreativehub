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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Plus, X, User, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Template = {
  id: string;
  name: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  videoDuration: string | null;
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
  profilePicture: string | null;
};

export default function TemplateEditPage({ template, onBack }: { template: Template; onBack: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: template.name,
    title: template.title,
    description: template.description || "",
    videoUrl: template.videoUrl || "",
    videoDuration: template.videoDuration || "0:01:00",
  });

  const [tasks, setTasks] = useState<TemplateTask[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState("");

  const { data: templateTasks } = useQuery<TemplateTask[]>({
    queryKey: ["/api/templates", template.id, "tasks"],
  });

  // Update local tasks when templateTasks changes
  useEffect(() => {
    if (templateTasks) {
      setTasks(templateTasks);
    }
  }, [templateTasks]);

  const { data: members } = useQuery<Member[]>({
    queryKey: ["/api/members/list"],
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("PUT", `/api/templates/${template.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Success!",
        description: "Template updated successfully.",
      });
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

  return (
    <div className="p-6 space-y-6">
      <Button
        onClick={onBack}
        variant="ghost"
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Templates
      </Button>

      <h1 className="text-3xl font-bold mb-6">Edit issue template</h1>

      {/* Name Field */}
      <Card>
        <CardContent className="p-6">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="text-lg font-semibold"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Template Card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-xl font-semibold border-none p-0 h-auto focus-visible:ring-0"
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
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Video Duration (seconds)</Label>
              <Input
                value={formData.videoDuration}
                onChange={(e) => setFormData({ ...formData, videoDuration: e.target.value })}
              />
            </div>
          </div>

          {/* Tags Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="bg-blue-50 border-blue-200 text-blue-700">
              Persian <span className="ml-1">▼</span>
            </Button>
            <Button variant="outline" size="sm" className="bg-orange-50 border-orange-200 text-orange-700">
              Backlog
            </Button>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="w-4 h-4 mr-1" />
              No Priority
            </Button>
            <Button variant="outline" size="sm">
              <User className="w-4 h-4 mr-1" />
              Max Casanova
            </Button>
            <Button variant="outline" size="sm" className="bg-red-50 border-red-200 text-red-700">
              🚩 Gary Farsi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Task Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Create task</h3>
            <Button variant="outline" size="sm" className="text-gray-600">
              Template
            </Button>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <Input
                  value={task.name}
                  onChange={(e) => handleTaskUpdate(task.id, "name", e.target.value)}
                  className="flex-1"
                  onBlur={() => setEditingTaskId(null)}
                />
                <Input
                  type="number"
                  value={task.points}
                  onChange={(e) => handleTaskUpdate(task.id, "points", parseInt(e.target.value) || 0)}
                  className="w-20"
                />
                <Select
                  value={task.priority}
                  onValueChange={(value) => handleTaskUpdate(task.id, "priority", value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="No Priority">
                      {task.priority === "no_priority" ? "No Priority" : 
                       task.priority === "low" ? "Low" :
                       task.priority === "medium" ? "Medium" :
                       task.priority === "high" ? "High" : "No Priority"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_priority">No Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <div className="w-8 h-8">
                  {task.assignedTo ? (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={getAssignedMember(task.assignedTo)?.profilePicture || undefined} />
                      <AvatarFallback>
                        {getAssignedMember(task.assignedTo)?.fullName?.[0] || getAssignedMember(task.assignedTo)?.username[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTaskMutation.mutate(task.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <div className="flex items-center gap-2">
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
              >
                <Plus className="w-4 h-4 mr-2" />
                Add task
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
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

