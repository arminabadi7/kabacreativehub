import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Edit, Trash2, Eye, EyeOff, GripVertical,
  Video, CheckCircle, BookOpen, ExternalLink, Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TutorialVideo {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  durationFormatted: string | null;
  order: number;
  isPublished: boolean;
  isArchived: boolean;
  targetTiers: string | null;
  targetClientIds: string | null;
  createdAt: string;
  updatedAt: string;
}

const TIER_OPTIONS = ["Growth", "Domination", "Empire"];

function formatDurationInput(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function parseDurationInput(value: string): number | null {
  if (!value.trim()) return null;
  const match = value.match(/^(\d+):(\d{1,2})$/);
  if (match) return parseInt(match[1]) * 60 + parseInt(match[2]);
  const num = parseInt(value);
  return isNaN(num) ? null : num;
}

// ─── Form Modal ───────────────────────────────────────────────────────────────
interface FormModalProps {
  open: boolean;
  onClose: () => void;
  existing?: TutorialVideo | null;
}

function TutorialFormModal({ open, onClose, existing }: FormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!existing;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [videoUrl, setVideoUrl] = useState(existing?.videoUrl ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(existing?.thumbnailUrl ?? "");
  const [duration, setDuration] = useState(formatDurationInput(existing?.durationSeconds ?? null));
  const [isPublished, setIsPublished] = useState(existing?.isPublished ?? false);
  const [selectedTiers, setSelectedTiers] = useState<string[]>(() => {
    if (!existing?.targetTiers) return [];
    try { return JSON.parse(existing.targetTiers); } catch { return []; }
  });

  // Reset when modal opens with new data
  const handleOpen = (open: boolean) => {
    if (open) {
      setTitle(existing?.title ?? "");
      setDescription(existing?.description ?? "");
      setVideoUrl(existing?.videoUrl ?? "");
      setThumbnailUrl(existing?.thumbnailUrl ?? "");
      setDuration(formatDurationInput(existing?.durationSeconds ?? null));
      setIsPublished(existing?.isPublished ?? false);
      setSelectedTiers(() => {
        if (!existing?.targetTiers) return [];
        try { return JSON.parse(existing.targetTiers); } catch { return []; }
      });
    } else {
      onClose();
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        videoUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        durationSeconds: parseDurationInput(duration) ?? undefined,
        isPublished,
        targetTiers: selectedTiers.length > 0 ? JSON.stringify(selectedTiers) : null,
      };
      if (isEdit) {
        return apiRequest("PUT", `/api/founder/tutorials/${existing!.id}`, payload);
      } else {
        return apiRequest("POST", "/api/founder/tutorials", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/tutorials"] });
      toast({ title: isEdit ? "Tutorial updated" : "Tutorial created" });
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.message?.includes("Must be a valid URL")
        ? "Please enter a valid video URL (YouTube, Vimeo, or Loom)"
        : err?.message || "Failed to save tutorial";
      toast({ title: msg, variant: "destructive" });
    },
  });

  const toggleTier = (tier: string) => {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Tutorial" : "New Tutorial"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Welcome to KabaContent"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this video covers"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Video URL *</Label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or Vimeo / Loom URL"
            />
            <p className="text-xs text-gray-500">
              Supports YouTube, Vimeo, and Loom links
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Thumbnail URL</Label>
            <Input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://... (leave blank to show default)"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Duration</Label>
            <Input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 4:30 or 270 (seconds)"
              className="w-36"
            />
            <p className="text-xs text-gray-500">Format: m:ss or total seconds</p>
          </div>

          <div className="space-y-2">
            <Label>Target Tiers (leave empty = all clients)</Label>
            <div className="flex gap-2">
              {TIER_OPTIONS.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => toggleTier(tier)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedTiers.includes(tier)
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
            <Label htmlFor="published" className="cursor-pointer">
              {isPublished ? "Published (visible to clients)" : "Draft (hidden from clients)"}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !title.trim() || !videoUrl.trim()}
          >
            {saveMutation.isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Tutorial"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Management Panel ────────────────────────────────────────────────────
export function TutorialManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<TutorialVideo | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<TutorialVideo | null>(null);

  const { data: videos = [], isLoading } = useQuery<TutorialVideo[]>({
    queryKey: ["/api/founder/tutorials"],
    queryFn: async () => {
      const res = await fetch("/api/founder/tutorials", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tutorials");
      return res.json();
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      apiRequest("PUT", `/api/founder/tutorials/${id}`, { isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/tutorials"] });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/founder/tutorials/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/tutorials"] });
      toast({ title: "Tutorial archived" });
      setArchiveTarget(null);
    },
    onError: () => toast({ title: "Failed to archive", variant: "destructive" }),
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; order: number }[]) =>
      apiRequest("PUT", "/api/founder/tutorials/reorder", items),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["/api/founder/tutorials"] }),
  });

  const active = videos.filter((v) => !v.isArchived);
  const archived = videos.filter((v) => v.isArchived);

  const moveItem = (index: number, direction: "up" | "down") => {
    const items = [...active];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    [items[index], items[swapIdx]] = [items[swapIdx], items[index]];
    const updates = items.map((v, i) => ({ id: v.id, order: i }));
    reorderMutation.mutate(updates);
  };

  const openCreate = () => {
    setEditingVideo(null);
    setFormOpen(true);
  };

  const openEdit = (video: TutorialVideo) => {
    setEditingVideo(video);
    setFormOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tutorials & Guides</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage onboarding videos shown to clients on their dashboard.
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Tutorial
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Published", value: active.filter((v) => v.isPublished).length, icon: Eye, color: "text-green-600" },
          { label: "Drafts", value: active.filter((v) => !v.isPublished).length, icon: EyeOff, color: "text-yellow-600" },
          { label: "Archived", value: archived.length, icon: Trash2, color: "text-gray-400" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active tutorials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-4 h-4" />
            Active Tutorials
            <span className="text-sm font-normal text-gray-400">({active.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-gray-400">Loading…</div>
          ) : active.length === 0 ? (
            <div className="py-10 text-center">
              <Video className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No tutorials yet</p>
              <p className="text-sm text-gray-400 mt-1">Click "New Tutorial" to add your first guide.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {active.map((video, index) => (
                  <motion.div
                    key={video.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                  >
                    {/* Order controls */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveItem(index, "up")}
                        disabled={index === 0}
                        className="text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveItem(index, "down")}
                        disabled={index === active.length - 1}
                        className="text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-16 h-10 rounded overflow-hidden bg-gray-100 shrink-0">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                          <Video className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {video.title}
                        </p>
                        {video.durationFormatted && (
                          <span className="text-xs text-gray-400 flex items-center gap-0.5 shrink-0">
                            <Clock className="w-3 h-3" />
                            {video.durationFormatted}
                          </span>
                        )}
                      </div>
                      {video.description && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {video.description}
                        </p>
                      )}
                      {/* Targeting chips */}
                      {video.targetTiers && (
                        <div className="flex gap-1 mt-1">
                          {(() => {
                            try {
                              return (JSON.parse(video.targetTiers) as string[]).map((t) => (
                                <Badge key={t} variant="outline" className="text-xs px-1.5 py-0">
                                  {t}
                                </Badge>
                              ));
                            } catch { return null; }
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Publish toggle */}
                      <div className="flex items-center gap-1.5">
                        <Switch
                          checked={video.isPublished}
                          onCheckedChange={(checked) =>
                            togglePublishMutation.mutate({ id: video.id, isPublished: checked })
                          }
                        />
                        <span className="text-xs text-gray-500 w-16">
                          {video.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-blue-600"
                        title="Open URL"
                        onClick={() => window.open(video.videoUrl, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-gray-900"
                        onClick={() => openEdit(video)}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-red-600"
                        onClick={() => setArchiveTarget(video)}
                        title="Archive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archived (collapsed) */}
      {archived.length > 0 && (
        <Card className="border-dashed border-gray-300">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              Archived ({archived.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {archived.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-400"
                >
                  <span className="line-through truncate">{video.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create / Edit form modal */}
      <TutorialFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingVideo(null); }}
        existing={editingVideo}
      />

      {/* Archive confirm dialog */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this tutorial?</AlertDialogTitle>
            <AlertDialogDescription>
              "{archiveTarget?.title}" will be hidden from clients. You can un-archive it by
              editing it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => archiveTarget && archiveMutation.mutate(archiveTarget.id)}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
