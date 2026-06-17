import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Plus, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanColumn } from "./KanbanColumn";
import { CreateIssueModal } from "./CreateIssueModal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BoardIssue, BoardMember, BoardProject, ProjectStatus } from "./types";
import { usePermissions } from "@/hooks/usePermissions";

interface KanbanBoardProps {
  project: BoardProject;
}

export function KanbanBoard({ project }: KanbanBoardProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { can, PERMISSIONS } = usePermissions();
  const canCreateIssues = can(PERMISSIONS.CREATE_ISSUES);
  const canManageWorkspace = can(PERMISSIONS.MANAGE_WORKSPACE);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createInitialStatus, setCreateInitialStatus] = useState<string | undefined>(undefined);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { data: statuses = [], isLoading: statusesLoading } = useQuery<ProjectStatus[]>({
    queryKey: ["/api/projects", project.id, "statuses"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${project.id}/statuses`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch statuses");
      return res.json();
    },
  });

  const { data: issues = [], isLoading: issuesLoading } = useQuery<BoardIssue[]>({
    queryKey: ["/api/board/projects", project.id, "issues"],
    queryFn: async () => {
      const res = await fetch(`/api/board/projects/${project.id}/issues`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch issues");
      return res.json();
    },
  });

  const { data: members = [] } = useQuery<BoardMember[]>({
    queryKey: ["/api/members/list-public"],
    queryFn: async () => {
      const res = await fetch("/api/members/list-public", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // ── Add column ─────────────────────────────────────────────────────────────
  const addStatusMutation = useMutation({
    mutationFn: async () => {
      const key = `custom_${Date.now()}`;
      const res = await apiRequest("POST", `/api/projects/${project.id}/statuses`, {
        key,
        label: "New Column",
        color: "#6B7280",
        order: statuses.length,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/projects", project.id, "statuses"] });
    },
    onError: () => toast({ title: "Failed to add column", variant: "destructive" }),
  });

  // ── Move issue (card drag) ─────────────────────────────────────────────────
  const moveIssueMutation = useMutation({
    mutationFn: async (data: { issueId: string; newStatus: string; newOrder: number }) => {
      const res = await apiRequest("PATCH", `/api/issues/${data.issueId}`, {
        status: data.newStatus,
        order: data.newOrder,
      });
      return res.json();
    },
    onMutate: async ({ issueId, newStatus, newOrder }) => {
      await qc.cancelQueries({ queryKey: ["/api/board/projects", project.id, "issues"] });
      const prev = qc.getQueryData<BoardIssue[]>(["/api/board/projects", project.id, "issues"]);
      if (prev) {
        qc.setQueryData<BoardIssue[]>(
          ["/api/board/projects", project.id, "issues"],
          prev.map((i) => (i.id === issueId ? { ...i, status: newStatus, order: newOrder } : i))
        );
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        qc.setQueryData(["/api/board/projects", project.id, "issues"], context.prev);
      }
      toast({ title: "Failed to move issue", variant: "destructive" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["/api/board/projects", project.id, "issues"] });
    },
  });

  // ── Reorder columns ────────────────────────────────────────────────────────
  const reorderColumnsMutation = useMutation({
    mutationFn: async (reordered: ProjectStatus[]) => {
      const res = await apiRequest("PUT", `/api/projects/${project.id}/statuses/reorder`, {
        statuses: reordered.map((s, i) => ({ id: s.id, order: i })),
      });
      return res.json();
    },
    onError: () => {
      // Roll back to server state on failure
      qc.invalidateQueries({ queryKey: ["/api/projects", project.id, "statuses"] });
      toast({ title: "Failed to reorder columns", variant: "destructive" });
    },
    // No optimistic rollback needed — we already wrote to cache in onDragEnd
  });

  // ── Unified drag end handler ───────────────────────────────────────────────
  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { type, source, destination, draggableId } = result;
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;

      // ── Column reorder ────────────────────────────────────────────────────
      if (type === "COLUMN") {
        const reordered = Array.from(statuses);
        const [moved] = reordered.splice(source.index, 1);
        reordered.splice(destination.index, 0, moved);

        // Optimistic cache update — columns reorder instantly
        qc.setQueryData<ProjectStatus[]>(
          ["/api/projects", project.id, "statuses"],
          reordered.map((s, i) => ({ ...s, order: i }))
        );

        reorderColumnsMutation.mutate(reordered);
        return;
      }

      // ── Card move ─────────────────────────────────────────────────────────
      const targetStatus = destination.droppableId;
      const issuesInTarget = issues
        .filter((i) => i.status === targetStatus && i.id !== draggableId)
        .sort((a, b) => a.order - b.order);

      issuesInTarget.splice(destination.index, 0, { id: draggableId } as BoardIssue);
      const newOrder = issuesInTarget.findIndex((i) => i.id === draggableId);

      moveIssueMutation.mutate({ issueId: draggableId, newStatus: targetStatus, newOrder });
    },
    [statuses, issues, moveIssueMutation, reorderColumnsMutation, qc, project.id]
  );

  // ── Derived: group issues by status ───────────────────────────────────────
  const issuesByStatus: Record<string, BoardIssue[]> = {};
  for (const s of statuses) {
    issuesByStatus[s.key] = issues
      .filter((i) => i.status === s.key)
      .sort((a, b) => a.order - b.order);
  }
  // Orphan issues (status key not in our list) → dump in first column
  for (const issue of issues) {
    if (!issuesByStatus[issue.status]) {
      const firstKey = statuses[0]?.key;
      if (firstKey) issuesByStatus[firstKey] = [...(issuesByStatus[firstKey] ?? []), issue];
    }
  }

  const handleAddIssue = (statusKey: string) => {
    setCreateInitialStatus(statusKey);
    setCreateModalOpen(true);
  };

  if (statusesLoading || issuesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-72 h-48 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Board toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 flex-shrink-0">
        <LayoutGrid className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-800">
          {project.teamName && (
            <span className="text-gray-400 font-normal">{project.teamName} › </span>
          )}
          {project.name}
        </span>
        {(project.clientFullName || project.clientUsername) && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {project.clientFullName || project.clientUsername}
          </span>
        )}
        <div className="flex-1" />
        {canManageWorkspace && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => addStatusMutation.mutate()}
            disabled={addStatusMutation.isPending}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Column
          </Button>
        )}
        {canCreateIssues && (
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5 bg-gray-900 hover:bg-gray-700 text-white"
            onClick={() => handleAddIssue(statuses[0]?.key ?? "backlog")}
          >
            <Plus className="w-3.5 h-3.5" />
            New Issue
          </Button>
        )}
      </div>

      {/* Board — single DragDropContext handles both column and card DnD */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          {/* Outer droppable: column reordering (horizontal) */}
          <Droppable droppableId="board" type="COLUMN" direction="horizontal">
            {(boardProvided) => (
              <div
                ref={boardProvided.innerRef}
                {...boardProvided.droppableProps}
                className="flex gap-4 p-6 min-h-full w-max"
              >
                {statuses.map((status, index) => (
                  /* Each column is a Draggable for reordering */
                  <Draggable
                    key={status.id}
                    draggableId={`col-${status.id}`}
                    index={index}
                  >
                    {(colProvided, colSnapshot) => (
                      <div
                        ref={colProvided.innerRef}
                        {...colProvided.draggableProps}
                        /* Do NOT spread dragHandleProps here — we give them to the header grip */
                      >
                        <KanbanColumn
                          status={status}
                          issues={issuesByStatus[status.key] ?? []}
                          projectId={project.id}
                          members={members}
                          statuses={statuses}
                          project={project}
                          onAddIssue={handleAddIssue}
                          dragHandleProps={colProvided.dragHandleProps}
                          isDraggingColumn={colSnapshot.isDragging}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {boardProvided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Create Issue Modal */}
      <CreateIssueModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        projectId={project.id}
        initialStatus={createInitialStatus}
        statuses={statuses}
        members={members}
        project={project}
      />
    </div>
  );
}
