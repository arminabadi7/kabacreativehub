import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Video, UserCircle, MoreHorizontal, Folder, AlertCircle } from "lucide-react";

type Task = {
  id: string;
  name?: string;
  title?: string;
  points?: number;
  assignedTo?: string | null;
  isCompleted?: boolean;
  status?: string;
  order?: number;
};

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
  tasks?: Task[];
  project?: {
    id: string;
    name: string;
  };
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

export default function IssueCard({ 
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
  
  // Local state for optimistic UI updates
  const [optimisticTasks, setOptimisticTasks] = React.useState<Record<string, { isCompleted: boolean; isUpdating: boolean }>>({});
  
  // Track which checkbox was just clicked for bounce animation
  const [clickedTaskId, setClickedTaskId] = React.useState<string | null>(null);
  
  // Update optimistic state when issue tasks change
  React.useEffect(() => {
    const newOptimistic: Record<string, { isCompleted: boolean; isUpdating: boolean }> = {};
    issueTasks.forEach((task: Task) => {
      newOptimistic[task.id] = {
        isCompleted: task.isCompleted || task.status === "completed",
        isUpdating: false,
      };
    });
    setOptimisticTasks(newOptimistic);
  }, [issueTasks]);

  const { data: members } = useQuery<Array<{ id: string; fullName: string | null; username: string; profilePicture: string | null }>>({
    queryKey: ["/api/members/list-public"],
    queryFn: async () => {
      const res = await fetch("/api/members/list-public", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
  });

  const getMember = (memberId: string | null) => {
    if (!memberId || !members) return null;
    return members.find((m) => m.id === memberId);
  };

  const updateTaskMutation = useMutation({
    mutationFn: async (data: { taskId: string; isCompleted: boolean; task: Task }) => {
      // Optimistically update UI immediately
      setOptimisticTasks(prev => ({
        ...prev,
        [data.taskId]: {
          isCompleted: data.isCompleted,
          isUpdating: true,
        },
      }));
      
      // Use the correct endpoint for updating tasks in the JSON column
      const response = await apiRequest("PATCH", `/api/issues/${issue.id}/tasks/${data.taskId}`, {
        isCompleted: data.isCompleted,
      });
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Mark as no longer updating
      setOptimisticTasks(prev => ({
        ...prev,
        [variables.taskId]: {
          isCompleted: variables.isCompleted,
          isUpdating: false,
        },
      }));
      // Show success message if task was completed and has points
      if (variables.isCompleted && variables.task.points && variables.task.points > 0 && variables.task.assignedTo) {
        toast({
          title: "Task Completed!",
          description: `${variables.task.points} points awarded to member`,
        });
      } else if (!variables.isCompleted) {
        toast({
          title: "Task Reopened",
          description: "Task marked as incomplete",
        });
      }
      
      // Tasks are part of the issue, so invalidating the project issues query will refetch with tasks
      if (issue.projectId) {
        queryClient.invalidateQueries({ queryKey: ["/api/projects", issue.projectId, "issues"] });
      }
      // Also invalidate board query if this is from the board view
      queryClient.invalidateQueries({ queryKey: ["/api/members/my-board"] });
      // Invalidate issue query to refetch with updated tasks
      queryClient.invalidateQueries({ queryKey: ["/api/issues", issue.id] });
      // CRITICAL: Invalidate member stats and transactions to show updated points
      if (variables.task.assignedTo) {
        console.log(`[IssueCard] Invalidating queries for member ${variables.task.assignedTo} after task completion`);
        // Invalidate specific member stats queries
        queryClient.invalidateQueries({ queryKey: ["/api/members", variables.task.assignedTo, "stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/members", variables.task.assignedTo, "transactions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/members", variables.task.assignedTo, "statistics"] });
        // Also invalidate all member stats for founder dashboard (this will refetch all member stats)
        queryClient.invalidateQueries({ queryKey: ["/api/members/all-stats"] });
        // Force refetch to ensure UI updates immediately
        queryClient.refetchQueries({ queryKey: ["/api/members", variables.task.assignedTo, "stats"] });
        queryClient.refetchQueries({ queryKey: ["/api/members/all-stats"] });
      }
    },
    onError: (error: any, variables) => {
      // Revert optimistic update on error
      setOptimisticTasks(prev => ({
        ...prev,
        [variables.taskId]: {
          isCompleted: !variables.isCompleted, // Revert to previous state
          isUpdating: false,
        },
      }));
      
      console.error("[IssueCard] Error updating task:", error);
      console.error("[IssueCard] Error details:", error?.responseText, error?.status);
      const errorMessage = error?.responseText 
        ? (typeof error.responseText === 'string' ? error.responseText : JSON.stringify(error.responseText))
        : error?.message || "Failed to update task";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Prevent navigation when clicking on interactive elements
    if (
      target.closest('button') || 
      target.closest('input') || 
      target.closest('select') || 
      target.closest('textarea') || 
      target.closest('[role="checkbox"]') ||
      target.closest('[data-checkbox-container]') || // Also prevent when clicking near checkbox
      target.closest('[data-checkbox-wrapper]') // Prevent when clicking checkbox wrapper
    ) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (issue.projectId) {
      setLocation(`/member-dashboard/projects/${issue.projectId}/issues/${issue.id}`);
    }
  };

  const formatVideoDuration = (duration: string | number | null | undefined): string => {
    if (!duration) return "0:01:00";
    
    let seconds = 0;
    if (typeof duration === 'string') {
      const parts = duration.split(':');
      if (parts.length === 3) {
        return duration;
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

  const issueAssigneeId = issue.assignedTo || (issue as any).assignee_id || null;
  const issueAssignee = issueAssigneeId ? getMember(issueAssigneeId) : null;

  // Calculate total points and completed points
  const totalPoints = issueTasks.reduce((sum, task) => sum + (task.points || 0), 0);
  const completedPoints = issueTasks
    .filter(task => task.isCompleted || task.status === "completed")
    .reduce((sum, task) => sum + (task.points || 0), 0);

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, issue)}
      onDragEnd={onDragEnd}
      onClick={handleCardClick}
      className={`cursor-pointer transition-all duration-200 bg-white border-gray-200 ${
        isDragging 
          ? "opacity-50 scale-95 rotate-1 shadow-lg" 
          : "hover:shadow-md hover:scale-[1.02]"
      }`}
      onMouseDown={(e) => {
        // Prevent card animation when clicking on checkbox or its container
        const target = e.target as HTMLElement;
        if (
          target.closest('[role="checkbox"]') ||
          target.closest('[data-checkbox-container]') ||
          target.closest('[data-checkbox-wrapper]')
        ) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      style={{
        cursor: isDragging ? "grabbing" : "pointer",
      }}
    >
      <CardContent className="p-3">
        {/* Issue Title Row */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(issue.status)} flex-shrink-0`}></div>
          <h4 className="font-semibold text-gray-900 text-sm flex-1">{issue.title}</h4>
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
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Project Name */}
        {issue.project && (
          <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-500">
            <Folder className="w-3 h-3" />
            <span>{issue.project.name}</span>
          </div>
        )}

        {/* Tasks List */}
        {issueTasks.length > 0 && (
          <div className="mb-2">
            {/* Tasks Header */}
            <div className="text-xs font-semibold text-gray-700 mb-1.5">
              Tasks ({issueTasks.length})
            </div>
            <div className="space-y-1.5">
              {issueTasks.map((task: any) => {
                const taskMember = task.assignedTo ? getMember(task.assignedTo) : null;
                // Use optimistic state if available, otherwise fall back to task state
                const optimisticState = optimisticTasks[task.id];
                const isTaskCompleted = optimisticState 
                  ? optimisticState.isCompleted 
                  : (task.isCompleted || task.status === "completed");
                const isUpdating = optimisticState?.isUpdating || false;
                
                const isJustClicked = clickedTaskId === task.id;
                
                return (
                  <div
                    key={task.id}
                    data-checkbox-container
                    className={`flex items-center gap-2 text-xs transition-all duration-200 ${
                      isUpdating ? "opacity-60" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <div 
                      data-checkbox-wrapper
                      className="relative"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <Checkbox
                        checked={isTaskCompleted}
                        onCheckedChange={(checked) => {
                          const newIsCompleted = checked === true;
                          
                          // Trigger pop animation
                          setClickedTaskId(task.id);
                          setTimeout(() => setClickedTaskId(null), 300); // Clear after animation (matches animation duration)
                          
                          // Only award points when completing (not when uncompleting)
                          // The backend will handle awarding points only on completion
                          updateTaskMutation.mutate({
                            taskId: task.id,
                            isCompleted: newIsCompleted,
                            task: task, // Pass full task object for toast message
                          });
                        }}
                        className={`h-3.5 w-3.5 flex-shrink-0 cursor-pointer transition-all duration-200 ${
                          isUpdating ? "animate-pulse ring-2 ring-blue-300" : ""
                        } ${
                          isJustClicked ? "animate-pop-checkbox" : ""
                        } ${
                          isTaskCompleted ? "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 data-[state=checked]:text-white" : "hover:border-green-400 hover:scale-110"
                        }`}
                        disabled={isUpdating}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      />
                    </div>
                    <span className={`flex-1 transition-all duration-200 ${
                      isTaskCompleted 
                        ? "line-through text-gray-400" 
                        : "text-gray-700"
                    } ${
                      isUpdating ? "opacity-60" : ""
                    }`}>
                      {task.name || task.title}
                    </span>
                    {task.points > 0 && (
                      <span className="text-gray-500 font-medium flex-shrink-0">{task.points} pts</span>
                    )}
                    {taskMember ? (
                      <Avatar className="w-4 h-4 flex-shrink-0">
                        <AvatarImage src={taskMember.profilePicture || undefined} />
                        <AvatarFallback className="text-[8px] bg-gray-200">
                          {taskMember.fullName?.[0] || taskMember.username[0] || "?"}
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
        )}

        {/* Footer Row */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {/* Video Duration */}
            {issue.videoDuration && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Video className="w-3 h-3" />
                <span>{formatVideoDuration(issue.videoDuration)}</span>
              </div>
            )}
            
            {/* Created Date */}
            {issue.createdAt && (
              <div className="text-xs text-gray-500">
                Created: {new Date(issue.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>

          {/* Issue Assignee */}
          <div className="flex items-center gap-2">
            {issueAssignee && (
              <>
                <div className="text-xs text-gray-500 hidden sm:block">
                  {issueAssignee.fullName || issueAssignee.username}
                </div>
                <Avatar className="w-5 h-5">
                  <AvatarImage src={issueAssignee.profilePicture || undefined} />
                  <AvatarFallback className="text-[10px] bg-gray-200">
                    {issueAssignee.fullName?.[0] || issueAssignee.username[0] || "?"}
                  </AvatarFallback>
                </Avatar>
              </>
            )}
            {!issueAssignee && (
              <div className="text-xs text-gray-400 italic">Unassigned</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


