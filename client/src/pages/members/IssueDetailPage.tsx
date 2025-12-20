import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Edit, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Video, 
  Calendar, 
  MoreHorizontal, 
  Circle, 
  User, 
  BarChart3,
  Copy,
  Tag,
  Milestone,
  Plus
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Issue = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  projectId: string | null;
  videoUrl: string | null;
  videoDuration: string | null;
  createdAt: string;
  priority?: string;
  assignedTo?: string | null;
  dueDate?: string | null;
  publishDate?: string | null;
  teamId?: string | null;
};

type Task = {
  id: string;
  name: string;
  points: number;
  assignedTo: string | null;
  isCompleted: boolean;
  priority: string;
  order: number;
};

type Project = {
  id: string;
  name: string;
};

type Member = {
  id: string;
  fullName: string | null;
  username: string;
  profilePicture: string | null;
};

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

type IssueDetailPageProps = {
  fromFounderDashboard?: boolean;
  onBackToFounder?: () => void;
};

export default function IssueDetailPage(props: IssueDetailPageProps = {}) {
  const { fromFounderDashboard = false, onBackToFounder } = props;
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Parse route params manually
  const match = location.match(/^\/member-dashboard\/projects\/([^\/]+)\/issues\/([^\/]+)$/);
  const params = match ? {
    projectId: match[1],
    issueId: match[2]
  } : null;
  
  console.log("[IssueDetailPage] Current location:", location);
  console.log("[IssueDetailPage] Route match:", match);
  console.log("[IssueDetailPage] Route params:", params);
  
  const issueId = params?.issueId;
  const projectId = params?.projectId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoDetailsExpanded, setVideoDetailsExpanded] = useState(true);
  const [taskListExpanded, setTaskListExpanded] = useState(true);
  const [status, setStatus] = useState("backlog");
  const [priority, setPriority] = useState("no_priority");
  const [assignee, setAssignee] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState("0:01:00");
  const [tasks, setTasks] = useState<Task[]>([]);

  const { data: issue, isLoading: issueLoading } = useQuery<Issue>({
    queryKey: ["/api/issues", issueId],
    queryFn: async () => {
      const res = await fetch(`/api/issues/${issueId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch issue");
      return res.json();
    },
    enabled: !!issueId,
  });

  const { data: project } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
    enabled: !!projectId,
  });

  const { data: issueTasks } = useQuery<Task[]>({
    queryKey: ["/api/issues", issueId, "tasks"],
    queryFn: async () => {
      const res = await fetch(`/api/issues/${issueId}/tasks`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    enabled: !!issueId,
  });

  const { data: members } = useQuery<Member[]>({
    queryKey: ["/api/members/list"],
    queryFn: async () => {
      const res = await fetch("/api/members/list", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
  });

  // Initialize form when issue loads
  useEffect(() => {
    if (issue) {
      setTitle(issue.title || "");
      setDescription(issue.description || "");
      setStatus(issue.status || "backlog");
      setPriority(issue.priority || "no_priority");
      setAssignee(issue.assignedTo || "");
      setDueDate(issue.dueDate || "");
      setPublishDate(issue.publishDate || "");
      setVideoUrl(issue.videoUrl || "");
      setVideoDuration(issue.videoDuration || "0:01:00");
    }
  }, [issue]);

  // Initialize tasks when they load
  useEffect(() => {
    if (issueTasks) {
      setTasks(issueTasks);
    }
  }, [issueTasks]);

  const updateIssueMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/issues/${issueId}`, {
        title,
        description: description || null,
        status,
        priority,
        assignedTo: assignee || null,
        dueDate: dueDate || null,
        publishDate: publishDate || null,
        videoUrl: videoUrl || null,
        videoDuration: videoDuration || "0:01:00",
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues", issueId] });
      queryClient.invalidateQueries({ queryKey: ["/api/issues", projectId] });
      toast({
        title: "Success!",
        description: "Issue updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update issue",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/issues/${issueId}/tasks/${taskId}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues", issueId, "tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest("DELETE", `/api/issues/${issueId}/tasks/${taskId}`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues", issueId, "tasks"] });
      toast({
        title: "Success!",
        description: "Task deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: { name: string; points: number; priority: string; assignedTo: string | null }) => {
      const response = await apiRequest("POST", `/api/issues/${issueId}/tasks`, {
        name: taskData.name,
        points: taskData.points || 0,
        priority: taskData.priority || "no_priority",
        assignedTo: taskData.assignedTo || null,
        order: tasks.length,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/issues", issueId, "tasks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const handleUpdateTask = (taskId: string, field: keyof Task, value: any) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updates = { [field]: value };
    updateTaskMutation.mutate({ taskId, updates });
    
    // Optimistically update local state
    setTasks(tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t));
  };

  const handleTaskNameBlur = (taskId: string, name: string) => {
    if (name.trim()) {
      handleUpdateTask(taskId, "name", name.trim());
    }
  };

  const handleAddTask = () => {
    createTaskMutation.mutate({
      name: "",
      points: 0,
      priority: "no_priority",
      assignedTo: null,
    });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const getMember = (memberId: string | null) => {
    if (!memberId || !members) return null;
    return members.find((m) => m.id === memberId);
  };

  if (issueLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!issue) {
    return <div className="p-6">Issue not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          {/* Back to Founder Dashboard (if accessed from founder) */}
          {fromFounderDashboard && onBackToFounder && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (onBackToFounder) {
                    onBackToFounder();
                  }
                }}
                className="p-0 h-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Founder Dashboard
              </Button>
              <span>/</span>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/member-dashboard/projects/${projectId}`)}
            className="p-0 h-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Projects
          </Button>
          <span>/</span>
          <span>{project?.name || "Project"}</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">{issue.title}</span>
        </div>

        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1">
            <Card className="bg-white">
              <CardContent className="p-6">
                {/* Issue Title */}
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-semibold border-0 p-0 mb-4 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Issue title"
                />

                {/* Issue Description */}
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter issue description..."
                  className="min-h-[100px] mb-6 border-gray-300"
                />

                {/* Video Details Section */}
                <div className="mb-6">
                  <button
                    onClick={() => setVideoDetailsExpanded(!videoDetailsExpanded)}
                    className="flex items-center justify-between w-full text-left mb-4"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">Video Details</h3>
                    {videoDetailsExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {videoDetailsExpanded && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Video URL</Label>
                        <Input
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          placeholder="Enter video URL"
                          className="border-gray-300"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Video Duration (HH:MM:SS)</Label>
                        <Input
                          value={videoDuration}
                          onChange={(e) => setVideoDuration(e.target.value)}
                          placeholder="0:01:00"
                          className="border-gray-300"
                        />
                      </div>

                      {/* Task List */}
                      <Card className="border-gray-200">
                        <CardContent className="p-4">
                          <button
                            onClick={() => setTaskListExpanded(!taskListExpanded)}
                            className="flex items-center justify-between w-full text-left mb-4"
                          >
                            <h4 className="text-sm font-semibold text-gray-900">Task List {tasks.length}</h4>
                            {taskListExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </button>

                          {taskListExpanded && (
                            <div className="space-y-3">
                              {tasks.map((task) => {
                                const member = getMember(task.assignedTo);
                                return (
                                  <div key={task.id} className="flex items-center gap-3">
                                    <Input
                                      value={task.name}
                                      onChange={(e) => {
                                        // Update local state immediately for responsive UI
                                        setTasks(tasks.map(t => t.id === task.id ? { ...t, name: e.target.value } : t));
                                      }}
                                      onBlur={(e) => handleTaskNameBlur(task.id, e.target.value)}
                                      placeholder="Task name"
                                      className="flex-1 h-8 text-sm border-gray-300"
                                    />
                                    <Input
                                      type="number"
                                      value={task.points}
                                      onChange={(e) => handleUpdateTask(task.id, "points", parseInt(e.target.value) || 0)}
                                      className="w-20 h-8 text-sm border-gray-300 text-center"
                                      min="0"
                                    />
                                    <Select
                                      value={task.priority}
                                      onValueChange={(value) => handleUpdateTask(task.id, "priority", value)}
                                    >
                                      <SelectTrigger className="w-[140px] h-8 text-sm border-gray-300">
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
                                      value={task.assignedTo || ""}
                                      onValueChange={(value) => handleUpdateTask(task.id, "assignedTo", value || null)}
                                    >
                                      <SelectTrigger className="w-10 h-8 p-0 border-0">
                                        {task.assignedTo && members ? (
                                          <Avatar className="w-6 h-6 cursor-pointer">
                                            <AvatarImage src={members.find((m) => m.id === task.assignedTo)?.profilePicture || undefined} />
                                            <AvatarFallback className="text-[10px] bg-gray-200">
                                              {members.find((m) => m.id === task.assignedTo)?.fullName?.[0] || 
                                               members.find((m) => m.id === task.assignedTo)?.username[0] || "?"}
                                            </AvatarFallback>
                                          </Avatar>
                                        ) : (
                                          <div className="w-6 h-6 rounded-full border border-gray-300 bg-gray-100 cursor-pointer" />
                                        )}
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="">Unassigned</SelectItem>
                                        {members?.map((member) => (
                                          <SelectItem key={member.id} value={member.id}>
                                            <div className="flex items-center gap-2">
                                              <Avatar className="w-5 h-5">
                                                <AvatarImage src={member.profilePicture || undefined} />
                                                <AvatarFallback className="text-[10px]">
                                                  {member.fullName?.[0] || member.username[0] || "?"}
                                                </AvatarFallback>
                                              </Avatar>
                                              {member.fullName || member.username}
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-gray-400 hover:text-gray-600"
                                      onClick={() => handleDeleteTask(task.id)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {taskListExpanded && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleAddTask}
                              className="mt-4 bg-black text-white hover:bg-gray-900 border-0"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add task
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                {/* Update Issue Button */}
                <Button
                  onClick={() => updateIssueMutation.mutate()}
                  disabled={updateIssueMutation.isPending}
                  className="bg-black text-white hover:bg-gray-900"
                >
                  {updateIssueMutation.isPending ? "Updating..." : "Update Issue"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Properties Sidebar */}
          <div className="w-80 flex-shrink-0">
            <Card className="bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Properties</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Copy className="w-4 h-4 text-gray-500" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Status */}
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-8 text-sm border-gray-300">
                        <div className="flex items-center gap-1.5">
                          <Circle className={`w-3 h-3 fill-current ${STATUS_COLORS[status] || "text-gray-500"}`} />
                          <SelectValue>{STATUS_LABELS[status] || status}</SelectValue>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="h-8 text-sm border-gray-300">
                        <div className="flex items-center gap-1.5">
                          <BarChart3 className="w-3 h-3 text-gray-600" />
                          <SelectValue>
                            {priority === "no_priority" ? "No Priority" :
                             priority === "low" ? "Low" :
                             priority === "medium" ? "Medium" :
                             priority === "high" ? "High" : "No Priority"}
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
                  </div>

                  {/* Assignee */}
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Assignee</Label>
                    <Select value={assignee} onValueChange={setAssignee}>
                      <SelectTrigger className="h-8 text-sm border-gray-300">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-gray-600" />
                          <SelectValue placeholder="Assignee">
                            {assignee && members ? members.find(m => m.id === assignee)?.fullName || members.find(m => m.id === assignee)?.username : "Assignee"}
                          </SelectValue>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {members?.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.fullName || member.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Labels */}
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Labels</Label>
                    <div className="flex items-center gap-1.5 h-8 text-sm text-gray-400 border border-gray-300 rounded-md px-2">
                      <Tag className="w-3 h-3" />
                      <span>No labels</span>
                    </div>
                  </div>

                  {/* Project */}
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Project</Label>
                    <div className="flex items-center gap-1.5 h-8 text-sm text-gray-700 border border-gray-300 rounded-md px-2 bg-white">
                      <Video className="w-3 h-3 text-gray-600" />
                      <span>{project?.name || "No project"}</span>
                    </div>
                  </div>

                  {/* Milestone */}
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Milestone</Label>
                    <div className="flex items-center gap-1.5 h-8 text-sm text-gray-400 border border-gray-300 rounded-md px-2">
                      <Milestone className="w-3 h-3" />
                      <span>No milestone</span>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Due Date</Label>
                    <div className="relative">
                      <div className="flex items-center gap-1.5 h-8 text-sm text-gray-600 border border-gray-300 rounded-md px-2 bg-white">
                        <Calendar className="w-3 h-3" />
                        {dueDate ? (
                          <span className="text-xs">{dueDate}</span>
                        ) : (
                          <span className="text-xs text-gray-400">Select date</span>
                        )}
                      </div>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Publish Date */}
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Publish Date</Label>
                    <div className="relative">
                      <div className="flex items-center gap-1.5 h-8 text-sm text-gray-600 border border-gray-300 rounded-md px-2 bg-white">
                        <Calendar className="w-3 h-3" />
                        {publishDate ? (
                          <span className="text-xs">{publishDate}</span>
                        ) : (
                          <span className="text-xs text-gray-400">Select date</span>
                        )}
                      </div>
                      <Input
                        type="date"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}



