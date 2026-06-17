import { useState, useRef, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactPlayer from "react-player";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTutorialProgress } from "@/hooks/useTutorialProgress";

export interface TutorialVideoData {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  durationFormatted: string | null;
  progress: {
    watchPercentage: number;
    watchPositionSeconds: number;
    isCompleted: boolean;
    completedAt: string | null;
    lastWatchedAt: string | null;
  };
}

interface VideoPlayerModalProps {
  video: TutorialVideoData | null;
  open: boolean;
  onClose: () => void;
}

export function VideoPlayerModal({ video, open, onClose }: VideoPlayerModalProps) {
  const { toast } = useToast();
  const [showCompletionBurst, setShowCompletionBurst] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(false);
  const [localPercentage, setLocalPercentage] = useState(0);

  // High-watermark: tracks the maximum fraction played (scrubbing forward
  // doesn't inflate it — only genuine playback raises the watermark).
  const maxPlayedFraction = useRef(0);
  const hasAutoCompleted = useRef(false);

  const { saveProgress, flushProgress, markComplete, isCompleting } =
    useTutorialProgress(video?.id ?? "");

  // Reset local state when a new video is opened
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      flushProgress();
      onClose();
    } else {
      // Seed state from existing progress
      maxPlayedFraction.current = (video?.progress.watchPercentage ?? 0) / 100;
      hasAutoCompleted.current = video?.progress.isCompleted ?? false;
      setLocalCompleted(video?.progress.isCompleted ?? false);
      setLocalPercentage(video?.progress.watchPercentage ?? 0);
      setShowCompletionBurst(false);
    }
  };

  // Throttle saves — only write to backend every ~5 seconds
  const lastSaveTime = useRef(0);

  const handleTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const el = e.currentTarget;
      if (!el.duration || el.duration === 0) return;

      const played = el.currentTime / el.duration;

      // High-watermark: only update if the new played fraction is greater
      if (played > maxPlayedFraction.current) {
        maxPlayedFraction.current = played;
        const pct = Math.round(played * 100);
        setLocalPercentage(pct);

        // Throttle backend saves to every 5 seconds
        const now = Date.now();
        if (now - lastSaveTime.current >= 5000) {
          lastSaveTime.current = now;
          saveProgress(Math.round(el.currentTime), pct);
        }

        // Auto-complete at 90%
        if (played >= 0.9 && !hasAutoCompleted.current) {
          hasAutoCompleted.current = true;
          setLocalCompleted(true);
          setShowCompletionBurst(true);
          markComplete();
          toast({
            title: "Tutorial completed! 🎉",
            description: `You've finished "${video?.title}"`,
          });
          setTimeout(() => setShowCompletionBurst(false), 2500);
        }
      }
    },
    [video?.id, video?.title, saveProgress, markComplete]
  );

  const handleManualComplete = () => {
    hasAutoCompleted.current = true;
    setLocalCompleted(true);
    setShowCompletionBurst(true);
    markComplete();
    toast({
      title: "Marked as complete ✅",
      description: `"${video?.title}" has been added to your completed guides.`,
    });
    setTimeout(() => setShowCompletionBurst(false), 2500);
  };

  if (!video) return null;

  const startSeconds = video.progress.watchPositionSeconds ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-gray-950 border-gray-800">
        {/* Close button */}
        <button
          onClick={() => handleOpenChange(false)}
          className="absolute top-3 right-3 z-50 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Completion burst overlay */}
        <AnimatePresence>
          {showCompletionBurst && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-green-500/90 rounded-full p-6 shadow-2xl">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player */}
        <div className="relative w-full aspect-video bg-black">
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              Loading player…
            </div>
          }>
            <ReactPlayer
              src={video.videoUrl}
              width="100%"
              height="100%"
              controls
              config={{
                youtube: { start: startSeconds > 0 ? startSeconds : undefined },
              }}
              onTimeUpdate={handleTimeUpdate}
            />
          </Suspense>
        </div>

        {/* Info panel */}
        <div className="p-5 bg-white">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <DialogTitle className="text-lg font-bold text-gray-900 leading-snug">
                {video.title}
              </DialogTitle>
              <div className="flex items-center gap-2 shrink-0">
                {video.durationFormatted && (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3" />
                    {video.durationFormatted}
                  </Badge>
                )}
                {localCompleted && (
                  <Badge className="bg-green-500 text-white flex items-center gap-1 text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          {video.description && (
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              {video.description}
            </p>
          )}

          {/* Progress bar */}
          <div className="mt-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Watch progress</span>
              <span>{localPercentage}%</span>
            </div>
            <Progress value={localPercentage} className="h-1.5" />
          </div>

          {/* Manual complete button */}
          {!localCompleted && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-green-700 border-green-300 hover:bg-green-50"
              onClick={handleManualComplete}
              disabled={isCompleting}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Complete
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
