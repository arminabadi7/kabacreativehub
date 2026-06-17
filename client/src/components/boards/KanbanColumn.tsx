import { useState, forwardRef } from "react";
import { Droppable, DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { KanbanCard } from "./KanbanCard";
import { StatusColumnHeader } from "./StatusColumnHeader";
import { EditIssueModal } from "./EditIssueModal";
import { BoardIssue, BoardMember, ProjectStatus, BoardProject } from "./types";

interface KanbanColumnProps {
  status: ProjectStatus;
  issues: BoardIssue[];
  projectId: string;
  members?: BoardMember[];
  statuses?: ProjectStatus[];
  project?: BoardProject | null;
  onAddIssue: (statusKey: string) => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isDraggingColumn?: boolean;
}

export const KanbanColumn = forwardRef<HTMLDivElement, KanbanColumnProps>(
  ({ status, issues, projectId, members = [], statuses = [], project, onAddIssue, dragHandleProps, isDraggingColumn }, ref) => {
    const [editingIssue, setEditingIssue] = useState<BoardIssue | null>(null);

    return (
      <div
        ref={ref}
        className={`flex-shrink-0 w-72 flex flex-col transition-opacity ${
          isDraggingColumn ? "opacity-90 shadow-2xl rotate-1" : ""
        }`}
      >
        <StatusColumnHeader
          status={status}
          issueCount={issues.length}
          projectId={projectId}
          onAddIssue={() => onAddIssue(status.key)}
          dragHandleProps={dragHandleProps}
        />

        <Droppable droppableId={status.key} type="CARD">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`
                flex-1 min-h-[120px] rounded-lg p-2 space-y-2 transition-colors duration-150
                ${snapshot.isDraggingOver
                  ? "bg-blue-50 border-2 border-dashed border-blue-300"
                  : "bg-gray-50/60 border border-transparent"}
              `}
            >
              {issues.map((issue, index) => (
                <KanbanCard
                  key={issue.id}
                  issue={issue}
                  index={index}
                  projectId={projectId}
                  members={members}
                  onEdit={setEditingIssue}
                />
              ))}
              {provided.placeholder}

              {issues.length === 0 && !snapshot.isDraggingOver && (
                <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-200 mb-2" />
                  <span className="text-xs">No issues</span>
                </div>
              )}
            </div>
          )}
        </Droppable>

        {editingIssue && (
          <EditIssueModal
            open={!!editingIssue}
            onClose={() => setEditingIssue(null)}
            issue={editingIssue}
            projectId={projectId}
            statuses={statuses}
            members={members}
            project={project}
          />
        )}
      </div>
    );
  }
);

KanbanColumn.displayName = "KanbanColumn";
