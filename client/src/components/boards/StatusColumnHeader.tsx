import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Check, X, Trash2, GripVertical } from "lucide-react";
import { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ProjectStatus } from "./types";

interface StatusColumnHeaderProps {
  status: ProjectStatus;
  issueCount: number;
  projectId: string;
  onAddIssue: () => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

const PALETTE = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E", "#10B981",
  "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#6B7280",
];

export function StatusColumnHeader({ status, issueCount, projectId, onAddIssue, dragHandleProps }: StatusColumnHeaderProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [labelVal, setLabelVal] = useState(status.label);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const updateMutation = useMutation({
    mutationFn: async (data: { label?: string; color?: string }) => {
      const res = await apiRequest("PATCH", `/api/projects/${projectId}/statuses/${status.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "statuses"] });
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/projects/${projectId}/statuses/${status.id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "statuses"] });
      toast({ title: "Status deleted" });
    },
    onError: (err: any) => {
      const msg = err?.message || "Cannot delete status";
      toast({ title: msg, variant: "destructive" });
    },
  });

  const handleSaveLabel = () => {
    const trimmed = labelVal.trim();
    if (trimmed && trimmed !== status.label) {
      updateMutation.mutate({ label: trimmed });
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveLabel();
    if (e.key === "Escape") { setLabelVal(status.label); setEditing(false); }
  };

  return (
    <div className="flex items-center gap-2 mb-3 group/header">
      {/* Drag handle — shown on hover, used to reorder columns */}
      <div
        {...(dragHandleProps ?? {})}
        className="cursor-grab active:cursor-grabbing opacity-0 group-hover/header:opacity-100 transition-opacity shrink-0 -ml-1 text-gray-300 hover:text-gray-500"
        title="Drag to reorder column"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Colored dot — click to open color picker */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-3 h-3 rounded-full shrink-0 ring-2 ring-transparent hover:ring-gray-300 transition-all"
          style={{ backgroundColor: status.color }}
          title="Change color"
        />
        {showColorPicker && (
          <div className="absolute top-5 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-2 grid grid-cols-5 gap-1 w-[120px]">
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => { updateMutation.mutate({ color: c }); setShowColorPicker(false); }}
                className="w-5 h-5 rounded-full border-2 hover:scale-110 transition-transform"
                style={{ backgroundColor: c, borderColor: c === status.color ? "#1F2937" : "transparent" }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Label */}
      {editing ? (
        <div className="flex items-center gap-1 flex-1">
          <input
            ref={inputRef}
            value={labelVal}
            onChange={(e) => setLabelVal(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-sm font-semibold text-gray-900 bg-transparent border-b border-blue-400 outline-none min-w-0"
          />
          <button onClick={handleSaveLabel} className="text-green-600 hover:text-green-700"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setLabelVal(status.label); setEditing(false); }} className="text-red-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors text-left"
          title="Click to rename"
        >
          {status.label}
        </button>
      )}

      {/* Count */}
      <span className="text-xs text-gray-400 tabular-nums ml-0.5">{issueCount}</span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions: edit, delete, add-issue */}
      <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Rename"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={() => { if (confirm(`Delete "${status.label}" column?`)) deleteMutation.mutate(); }}
          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete column"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <button
        onClick={onAddIssue}
        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
        title="Add issue"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
