import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MemberAvatar } from "./MemberAvatar";
import { BoardTask, BoardMember } from "./types";

interface TaskRowProps {
  task: BoardTask;
  issueId: string;
  projectId: string;
  members?: BoardMember[];
  compact?: boolean;
}

export function TaskRow({ task, issueId, projectId, members = [], compact = false }: TaskRowProps) {
  const isCompleted = task.isCompleted ?? task.status === "completed";
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [bouncing, setBouncing] = useState(false);

  const displayCompleted = optimistic !== null ? optimistic : isCompleted;

  const assignedMember = members.find((m) => m.id === task.assignedTo) ?? null;
  // Fallback to joined fields
  const avatarMember: BoardMember | null = assignedMember ?? (
    task.memberUsername
      ? { id: task.assignedTo ?? "", username: task.memberUsername ?? "", fullName: task.memberFullName ?? null, profilePicture: task.memberAvatar ?? null }
      : null
  );

  const toggleMutation = useMutation({
    mutationFn: async (completed: boolean) => {
      const res = await apiRequest("PATCH", `/api/issues/${issueId}/tasks/${task.id}`, {
        isCompleted: completed,
        status: completed ? "completed" : "pending",
      });
      return res.json();
    },
    onMutate: (completed) => {
      setOptimistic(completed);
      setBouncing(true);
      setTimeout(() => setBouncing(false), 300);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/board/projects", projectId, "issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "issues"] });
      setOptimistic(null);
    },
    onError: () => {
      setOptimistic(null);
    },
  });

  const taskName = task.name ?? task.title ?? "Untitled task";
  const pts = task.points ?? 0;

  return (
    <div
      className={`flex items-center gap-2 group ${compact ? "py-0.5" : "py-1"} px-1 rounded hover:bg-gray-50 transition-colors`}
    >
      {/* Checkbox */}
      <div className={`transition-transform ${bouncing ? "scale-125" : "scale-100"}`}>
        <Checkbox
          checked={displayCompleted}
          onCheckedChange={(val) => toggleMutation.mutate(Boolean(val))}
          className="shrink-0 border-gray-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
        />
      </div>

      {/* Task name */}
      <span
        className={`flex-1 text-xs leading-snug truncate ${
          displayCompleted ? "line-through text-gray-400" : "text-gray-700"
        }`}
      >
        {taskName}
      </span>

      {/* Points badge */}
      {pts > 0 && (
        <span className="text-xs font-medium text-gray-500 shrink-0 tabular-nums">
          {pts} pts
        </span>
      )}

      {/* Assignee avatar */}
      <MemberAvatar member={avatarMember} size="xs" />
    </div>
  );
}
