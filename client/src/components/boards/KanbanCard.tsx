import { Draggable } from "@hello-pangea/dnd";
import { Clock, MoreHorizontal, User } from "lucide-react";
import { TaskRow } from "./TaskRow";
import { MemberAvatar } from "./MemberAvatar";
import { BoardIssue, BoardMember, BoardTask } from "./types";

interface KanbanCardProps {
  issue: BoardIssue;
  index: number;
  projectId: string;
  members?: BoardMember[];
  onEdit: (issue: BoardIssue) => void;
}

function formatDuration(secs: number | string | null | undefined): string | null {
  if (!secs) return null;
  const total = typeof secs === "string" ? parseInt(secs) : secs;
  if (isNaN(total) || total === 0) return null;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Safely coerce the tasks field — DB may return a JSON string, array, or null */
function normalizeTasks(raw: unknown): BoardTask[] {
  if (Array.isArray(raw)) return raw as BoardTask[];
  if (typeof raw === "string" && raw.trim().startsWith("[")) {
    try { return JSON.parse(raw) as BoardTask[]; } catch { /* fall through */ }
  }
  return [];
}

export function KanbanCard({ issue, index, projectId, members = [], onEdit }: KanbanCardProps) {
  const tasks = normalizeTasks(issue.tasks);
  const completedCount = tasks.filter((t) => t.isCompleted || t.status === "completed").length;
  const duration = formatDuration(issue.videoDuration);

  const assigneeMember = members.find((m) => m.id === issue.assigneeId) ??
    (issue.assigneeUsername ? { id: issue.assigneeId ?? "", username: issue.assigneeUsername, fullName: issue.assigneeName ?? null, profilePicture: issue.assigneeAvatar ?? null } : null);

  const creatorMember = issue.creatorAvatar || issue.creatorName
    ? { id: issue.creatorId ?? "", username: "", fullName: issue.creatorName ?? null, profilePicture: issue.creatorAvatar ?? null }
    : null;

  const handleOpenDetail = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-nav]')) return;
    onEdit(issue);
  };

  return (
    <Draggable draggableId={issue.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={handleOpenDetail}
          className={`
            bg-white border border-gray-200 rounded-lg p-3 cursor-pointer
            transition-all duration-150 select-none
            ${snapshot.isDragging
              ? "shadow-2xl border-blue-300 rotate-1 scale-[1.02] ring-2 ring-blue-200"
              : "hover:shadow-md hover:border-gray-300"}
          `}
        >
          {/* Top row: title + assignee + action button */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-sm font-semibold text-gray-900 leading-snug flex-1">
              {issue.title}
            </span>
            <div className="flex items-center gap-1 shrink-0" data-no-nav>
              {assigneeMember ? (
                <MemberAvatar member={assigneeMember} size="sm" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
                  <User className="w-3 h-3 text-gray-400" />
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); }}
                className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Task rows */}
          {tasks.length > 0 && (
            <div className="space-y-0.5 mb-2" data-no-nav onClick={(e) => e.stopPropagation()}>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  issueId={issue.id}
                  projectId={projectId}
                  members={members}
                  compact
                />
              ))}
            </div>
          )}

          {/* Footer: date + duration + progress */}
          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-50">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Created: {formatDate(issue.createdAt)}</span>
              {duration && (
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {duration}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {tasks.length > 0 && (
                <span className="text-xs text-gray-400 tabular-nums">
                  {completedCount}/{tasks.length}
                </span>
              )}
              {creatorMember && <MemberAvatar member={creatorMember} size="xs" />}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
