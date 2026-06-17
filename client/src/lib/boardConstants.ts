// ─── Shared board constants ────────────────────────────────────────────────
// Single source of truth — import from here, never inline these in components.

export const DEFAULT_STATUS_KEYS = [
  "backlog",
  "ready_for_editing",
  "editing",
  "ready_for_caption",
  "ready_for_upload",
] as const;

export type StatusKey = (typeof DEFAULT_STATUS_KEYS)[number] | string;

export const DEFAULT_STATUS_LABELS: Record<string, string> = {
  backlog:            "Backlog",
  ready_for_editing:  "Ready for Editing",
  editing:            "Editing",
  ready_for_caption:  "Ready for Caption",
  ready_for_upload:   "Ready for Upload",
  // Legacy / other systems
  unstarted:          "Unstarted",
  translating:        "Translating",
  ready_for_dub:      "Ready for Dub",
  dubbing:            "Dubbing",
  todo:               "To Do",
  in_progress:        "In Progress",
  review:             "Review",
  done:               "Done",
  completed:          "Completed",
};

export const DEFAULT_STATUS_COLORS: Record<string, string> = {
  backlog:            "#F97316", // orange
  ready_for_editing:  "#EAB308", // yellow
  editing:            "#3B82F6", // blue
  ready_for_caption:  "#8B5CF6", // purple
  ready_for_upload:   "#10B981", // green
  unstarted:          "#6B7280", // gray
  translating:        "#F97316",
  ready_for_dub:      "#F97316",
  dubbing:            "#3B82F6",
  todo:               "#6B7280",
  in_progress:        "#3B82F6",
  review:             "#8B5CF6",
  done:               "#10B981",
  completed:          "#10B981",
};

export const PRIORITY_LABELS: Record<string, string> = {
  no_priority: "No Priority",
  low:         "Low",
  medium:      "Medium",
  high:        "High",
  urgent:      "Urgent",
};

export const PRIORITY_COLORS: Record<string, string> = {
  no_priority: "#9CA3AF",
  low:         "#60A5FA",
  medium:      "#FBBF24",
  high:        "#F97316",
  urgent:      "#EF4444",
};

export function getStatusLabel(key: string, customLabels?: Record<string, string>): string {
  return customLabels?.[key] ?? DEFAULT_STATUS_LABELS[key] ?? key;
}

export function getStatusColor(key: string, customColors?: Record<string, string>): string {
  return customColors?.[key] ?? DEFAULT_STATUS_COLORS[key] ?? "#6B7280";
}

/** ProjectStatus as returned by GET /api/projects/:id/statuses */
export interface ProjectStatus {
  id: string;
  projectId: string;
  key: string;
  label: string;
  color: string;
  order: number;
}
