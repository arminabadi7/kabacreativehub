import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronDown, ChevronUp, Plus, X, Video, Calendar, Flag, UserCircle, MoreHorizontal, BookmarkPlus, Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AssigneePicker } from "./AssigneePicker";
import { MemberAvatar } from "./MemberAvatar";
import { BoardMember, BoardIssue, ProjectStatus, BoardProject } from "./types";
import { PRIORITY_LABELS } from "@/lib/boardConstants";

interface CreateIssueModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  initialStatus?: string;
  statuses: ProjectStatus[];
  members: BoardMember[];
  project?: BoardProject | null;
}

type TaskDraft = {
  id: string;           // local temp id
  name: string;
  points: number;
  priority: string;
  assignedTo: string | null;
};

function hhmmsToSeconds(val: string): number | null {
  const parts = val.split(":").map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1 && !isNaN(parts[0])) return parts[0];
  return null;
}

let _uid = 0;
const uid = () => `draft-${++_uid}`;

export function CreateIssueModal({
  open, onClose, projectId, initialStatus, statuses, members, project,
}: CreateIssueModalProps) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(initialStatus ?? statuses[0]?.key ?? "backlog");
  const [priority, setPriority] = useState("no_priority");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState("0:01:00");
  const [templateId, setTemplateId] = useState("");
  const [tasks, setTasks] = useState<TaskDraft[]>([]);
  const [taskListOpen, setTaskListOpen] = useState(true);
  const [createMore, setCreateMore] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const saveAsTemplateMutation = useMutation({
    mutationFn: async (name: string) => {
      // 1. Create the template
      const tplRes = await apiRequest("POST", "/api/templates", {
        name,
        issueTitle: title.trim(),
        description: description.trim() || null,
        videoUrl: videoUrl.trim() || null,
        videoDuration: videoDuration || null,
        defaultPriority: priority,
        defaultAssigneeId: assigneeId || null,
      });
      const tpl = await tplRes.json();
      if (tpl.error) throw new Error(tpl.error);
      // 2. Create template tasks
      await Promise.all(
        tasks.map((t, i) =>
          apiRequest("POST", `/api/templates/${tpl.id}/tasks`, {
            name: t.name,
            points: t.points,
            priority: t.priority,
            assignedTo: t.assignedTo || null,
            order: i,
          })
        )
      );
      return tpl;
    },
    onSuccess: (tpl) => {
      qc.invalidateQueries({ queryKey: ["/api/templates"] });
      setShowSaveTemplate(false);
      setTemplateName("");
      toast({ title: "Template saved!", description: `"${tpl.name}" is now available in the template list.` });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to save template", variant: "destructive" });
    },
  });

  // Sync status when initialStatus changes (opening from different column)
  useEffect(() => {
    if (open) setStatus(initialStatus ?? statuses[0]?.key ?? "backlog");
  }, [open, initialStatus]);

  // Fetch templates
  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ["/api/templates"],
    queryFn: async () => {
      const res = await fetch("/api/templates", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch template tasks when template changes
  const { data: templateTasks } = useQuery<any[]>({
    queryKey: ["/api/templates", templateId, "tasks"],
    queryFn: async () => {
      if (!templateId) return [];
      const res = await fetch(`/api/templates/${templateId}/tasks`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!templateId,
  });

  // When template selected → populate form
  useEffect(() => {
    if (!templateId) return;
    const tpl = templates.find((t: any) => t.id === templateId);
    if (tpl) {
      if (tpl.issueTitle || tpl.title) setTitle(tpl.issueTitle ?? tpl.title ?? "");
      if (tpl.description) setDescription(tpl.description);
      if (tpl.videoUrl) setVideoUrl(tpl.videoUrl);
      if (tpl.videoDuration) {
        const s = typeof tpl.videoDuration === "number" ? tpl.videoDuration : parseInt(tpl.videoDuration);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        setVideoDuration(`${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`);
      }
      if (tpl.defaultPriority) setPriority(tpl.defaultPriority);
      if (tpl.defaultAssigneeId) setAssigneeId(tpl.defaultAssigneeId);
    }
  }, [templateId, templates]);

  useEffect(() => {
    if (templateTasks && templateTasks.length > 0) {
      setTasks(templateTasks.map((t: any) => ({
        id: uid(),
        name: t.name,
        points: t.points ?? 0,
        priority: t.priority ?? "no_priority",
        assignedTo: t.assignedTo ?? null,
      })));
    }
  }, [templateTasks]);

  const reset = () => {
    setTitle(""); setDescription(""); setStatus(initialStatus ?? statuses[0]?.key ?? "backlog");
    setPriority("no_priority"); setAssigneeId(null); setDueDate(""); setPublishDate("");
    setVideoUrl(""); setVideoDuration("0:01:00"); setTemplateId(""); setTasks([]);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const durSecs = hhmmsToSeconds(videoDuration);
      const taskPayload = tasks
        .filter((t) => t.name.trim())
        .map((t, i) => ({ name: t.name.trim(), points: t.points, priority: t.priority, assignedTo: t.assignedTo, order: i }));

      const body: Record<string, any> = {
        projectId,
        title: title.trim(),
        description: description || null,
        status,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        publishDate: publishDate || null,
        videoUrl: videoUrl || null,
        videoDuration: durSecs,
        order: 0,
        templateId: templateId || null,
      };
      if (taskPayload.length > 0) body.tasks = taskPayload;

      const res = await apiRequest("POST", "/api/issues", body);
      return res.json();
    },
    onSuccess: (issue) => {
      // ── 1. Write directly into the board cache so the card appears instantly ──
      // Normalize the new issue to match what the board endpoint returns.
      const boardIssue: BoardIssue = {
        ...issue,
        // Snake-case → camelCase for fields the board JOIN normally resolves
        projectId: issue.projectId ?? issue.project_id ?? projectId,
        assigneeId: issue.assigneeId ?? issue.assignee_id ?? null,
        createdAt: issue.createdAt ?? issue.created_at ?? new Date().toISOString(),
        tasks: Array.isArray(issue.tasks) ? issue.tasks : [],
      };

      qc.setQueryData<BoardIssue[]>(
        ["/api/board/projects", projectId, "issues"],
        (prev = []) => [...prev, boardIssue]
      );

      // ── 2. Background refetch to pull in any server-side resolved fields ──
      qc.invalidateQueries({ queryKey: ["/api/board/projects", projectId, "issues"] });
      // Also keep the legacy board query in sync
      qc.invalidateQueries({ queryKey: ["/api/projects", projectId, "issues"] });

      toast({ title: `Issue "${issue.title}" created!` });
      if (createMore) {
        reset();
      } else {
        reset();
        onClose();
      }
    },
    onError: (err: any) => {
      toast({ title: err.message ?? "Failed to create issue", variant: "destructive" });
    },
  });

  const addTask = () => setTasks((prev) => [...prev, { id: uid(), name: "", points: 0, priority: "no_priority", assignedTo: null }]);
  const updateTask = (id: string, patch: Partial<TaskDraft>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const removeTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const currentStatus = statuses.find((s) => s.key === status);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-[860px] w-full p-0 gap-0 bg-white rounded-2xl overflow-visible"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header breadcrumb */}
        <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b border-gray-100">
          {project?.teamName && (
            <>
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                {project.teamName}
              </span>
              <span className="text-gray-300">›</span>
            </>
          )}
          <Select value={templateId || "__none__"} onValueChange={(v) => setTemplateId(v === "__none__" ? "" : v)}>
            <SelectTrigger className="h-7 w-auto border-0 bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 px-3 gap-1 rounded-md">
              <SelectValue placeholder="From template…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No template</SelectItem>
              {templates.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Title */}
        <div className="px-5 pt-4">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Issue title"
            className="w-full text-xl font-bold text-gray-900 placeholder-gray-300 bg-transparent outline-none border-0"
          />
        </div>

        {/* Description */}
        <div className="px-5 pt-2">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description..."
            rows={2}
            className="resize-none border-0 bg-transparent p-0 text-sm text-gray-600 placeholder-gray-300 focus-visible:ring-0"
          />
        </div>

        {/* Metadata chips row */}
        <div className="px-5 py-3 flex flex-wrap items-center gap-2 border-y border-gray-100">
          {/* Status */}
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-7 w-auto border border-gray-200 bg-white hover:bg-gray-50 text-xs px-2.5 gap-1.5 rounded-full">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: currentStatus?.color ?? "#6B7280" }}
              />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority */}
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-7 w-auto border border-gray-200 bg-white hover:bg-gray-50 text-xs px-2.5 gap-1.5 rounded-full">
              <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
              <SelectValue>{PRIORITY_LABELS[priority]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Assignee */}
          <AssigneePicker
            members={members}
            selectedId={assigneeId}
            onSelect={setAssigneeId}
          />

          {/* Due Date */}
          <div className="relative">
            <button
              type="button"
              onClick={() => document.getElementById("dd-due")?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-dashed border-gray-300 hover:border-gray-400 text-xs text-gray-500"
            >
              <Calendar className="w-3.5 h-3.5" />
              {dueDate || "Due Date"}
            </button>
            <input
              id="dd-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {/* Publish Date */}
          <div className="relative">
            <button
              type="button"
              onClick={() => document.getElementById("dd-pub")?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-dashed border-gray-300 hover:border-gray-400 text-xs text-gray-500"
            >
              <Calendar className="w-3.5 h-3.5" />
              {publishDate || "Publish Date"}
            </button>
            <input
              id="dd-pub"
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Video fields */}
        <div className="px-5 py-3 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Video URL</label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Video Duration (H:MM:SS)</label>
            <Input
              value={videoDuration}
              onChange={(e) => setVideoDuration(e.target.value)}
              placeholder="0:01:00"
              className="h-8 text-sm font-mono"
            />
          </div>
        </div>

        {/* Task list */}
        <div className="px-5 pb-3">
          <button
            type="button"
            onClick={() => setTaskListOpen(!taskListOpen)}
            className="flex items-center gap-2 w-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className="flex-1 text-left">
              Task List {tasks.length > 0 && <span className="text-gray-400">({tasks.length})</span>}
            </span>
            {taskListOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {taskListOpen && (
            <div className="mt-2 border border-gray-100 rounded-xl">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 px-3 py-2 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50">
                  {/* Task name */}
                  <input
                    value={task.name}
                    onChange={(e) => updateTask(task.id, { name: e.target.value })}
                    placeholder="Task name"
                    className="flex-1 text-sm text-gray-800 bg-transparent outline-none placeholder-gray-300 min-w-0"
                  />
                  {/* Points */}
                  <input
                    type="number"
                    min={0}
                    value={task.points}
                    onChange={(e) => updateTask(task.id, { points: parseInt(e.target.value) || 0 })}
                    className="w-14 text-sm text-gray-600 border border-gray-200 rounded-md px-2 py-1 text-center font-mono outline-none focus:border-blue-300"
                  />
                  {/* Priority selector (compact) */}
                  <Select value={task.priority} onValueChange={(v) => updateTask(task.id, { priority: v })}>
                    <SelectTrigger className="h-7 w-28 border-gray-200 text-xs px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Assignee — compact avatar button */}
                  <AssigneePicker
                    members={members}
                    selectedId={task.assignedTo}
                    onSelect={(id) => updateTask(task.id, { assignedTo: id })}
                    compact
                  />
                  {/* Remove */}
                  <button onClick={() => removeTask(task.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addTask}
                className="flex items-center gap-2 px-3 py-2.5 w-full text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add task
              </button>
            </div>
          )}
        </div>

        {/* Save as Template inline row */}
        {showSaveTemplate && (
          <div className="px-5 py-3 flex items-center gap-2 border-t border-blue-100 bg-blue-50/60">
            <BookmarkPlus className="w-4 h-4 text-blue-500 shrink-0" />
            <Input
              autoFocus
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && templateName.trim()) saveAsTemplateMutation.mutate(templateName.trim());
                if (e.key === "Escape") { setShowSaveTemplate(false); setTemplateName(""); }
              }}
              placeholder="Template name…"
              className="h-7 text-sm flex-1 bg-white"
            />
            <Button
              size="sm"
              className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs"
              disabled={!templateName.trim() || saveAsTemplateMutation.isPending}
              onClick={() => saveAsTemplateMutation.mutate(templateName.trim())}
            >
              {saveAsTemplateMutation.isPending ? "Saving…" : <><Check className="w-3 h-3 mr-1" />Save</>}
            </Button>
            <Button
              size="sm" variant="ghost"
              className="h-7 px-2 text-gray-500"
              onClick={() => { setShowSaveTemplate(false); setTemplateName(""); }}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 flex items-center justify-between border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Switch id="create-more" checked={createMore} onCheckedChange={setCreateMore} />
            <Label htmlFor="create-more" className="text-sm text-gray-600 cursor-pointer">Create More</Label>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5"
              onClick={() => { setShowSaveTemplate((v) => !v); setTemplateName(title.trim()); }}
              title="Save current issue as a template"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              Save as Template
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { reset(); onClose(); }}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!title.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="bg-gray-900 hover:bg-gray-700 text-white px-5"
            >
              {createMutation.isPending ? "Creating…" : "Create Issue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
