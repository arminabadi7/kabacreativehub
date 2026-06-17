import { motion } from "framer-motion";
import { Play, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { TutorialVideoData } from "./VideoPlayerModal";

interface TutorialCardProps {
  video: TutorialVideoData;
  onClick: (video: TutorialVideoData) => void;
  /** "dashboard" = compact horizontal scroll card, "guides" = grid card */
  variant?: "dashboard" | "guides";
}

export function TutorialCard({ video, onClick, variant = "dashboard" }: TutorialCardProps) {
  const { isCompleted, watchPercentage } = video.progress;
  const isInProgress = !isCompleted && watchPercentage > 0;

  const handleClick = () => onClick(video);

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={handleClick}
      className={`
        group relative cursor-pointer rounded-xl overflow-hidden border bg-white
        shadow-sm hover:shadow-md transition-shadow
        ${variant === "dashboard" ? "w-64 shrink-0" : "w-full"}
      `}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <Play className="w-10 h-10 text-white/60" />
          </div>
        )}

        {/* Play overlay */}
        {!isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              <Play className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Completed overlay */}
        {isCompleted && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        )}

        {/* Duration badge */}
        {video.durationFormatted && (
          <div className="absolute bottom-2 right-2">
            <Badge
              variant="secondary"
              className="bg-black/70 text-white text-xs px-1.5 py-0.5 flex items-center gap-1 border-0"
            >
              <Clock className="w-2.5 h-2.5" />
              {video.durationFormatted}
            </Badge>
          </div>
        )}

        {/* Progress bar at bottom of thumbnail */}
        {isInProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
            <div
              className="h-full bg-cyan-400 transition-all"
              style={{ width: `${watchPercentage}%` }}
            />
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
            {video.title}
          </p>
          {isCompleted && (
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          )}
        </div>

        {video.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {video.description}
          </p>
        )}

        {/* Status chip */}
        <div className="mt-2">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckCircle className="w-3 h-3" /> Completed
            </span>
          ) : isInProgress ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-cyan-600">
              <Play className="w-3 h-3" /> {watchPercentage}% watched
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
              <Play className="w-3 h-3" /> Not started
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
