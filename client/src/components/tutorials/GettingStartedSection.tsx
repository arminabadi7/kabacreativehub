import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TutorialCard } from "./TutorialCard";
import { VideoPlayerModal } from "./VideoPlayerModal";
import type { TutorialVideoData } from "./VideoPlayerModal";
import { useToast } from "@/hooks/use-toast";

interface GettingStartedSectionProps {
  clientId: string;
}

export function GettingStartedSection({ clientId }: GettingStartedSectionProps) {
  const { toast } = useToast();
  const storageKey = `kaba_tutorials_collapsed_${clientId}`;
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(storageKey) === "true"; } catch { return false; }
  });
  const [activeVideo, setActiveVideo] = useState<TutorialVideoData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [allJustCompleted, setAllJustCompleted] = useState(false);

  const { data: tutorials = [], isLoading } = useQuery<TutorialVideoData[]>({
    queryKey: ["/api/tutorials"],
    queryFn: async () => {
      const res = await fetch("/api/tutorials", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tutorials");
      return res.json();
    },
    refetchInterval: false,
    staleTime: 30_000,
  });

  const incomplete = tutorials.filter((v) => !v.progress.isCompleted);
  const completedCount = tutorials.length - incomplete.length;
  const totalCount = tutorials.length;
  const allComplete = totalCount > 0 && completedCount === totalCount;

  // Detect when all tutorials were just completed during this session
  useEffect(() => {
    if (allComplete && totalCount > 0) {
      setAllJustCompleted(true);
      toast({
        title: "🎉 You've completed all tutorials!",
        description: "The guides are always available in the Guides tab.",
      });
    }
  }, [allComplete]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(storageKey, String(next)); } catch {}
  };

  const openVideo = (video: TutorialVideoData) => {
    setActiveVideo(video);
    setModalOpen(true);
  };

  // Don't render if loading, no tutorials, or all complete (with exit animation done)
  if (isLoading) return null;
  if (totalCount === 0) return null;

  return (
    <>
      <AnimatePresence>
        {!allComplete && (
          <motion.div
            key="getting-started"
            initial={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-lg">
              {/* Header bar */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-400/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-base leading-none">
                      Getting Started
                    </h2>
                    <p className="text-gray-400 text-xs mt-1">
                      {completedCount} of {totalCount} complete
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Overall progress bar */}
                  <div className="hidden sm:flex items-center gap-2 w-32">
                    <Progress
                      value={(completedCount / totalCount) * 100}
                      className="h-1.5 bg-gray-700"
                    />
                    <span className="text-xs text-gray-400 shrink-0">
                      {Math.round((completedCount / totalCount) * 100)}%
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleCollapsed}
                    className="text-gray-400 hover:text-white hover:bg-gray-700/50 h-8 w-8 p-0"
                  >
                    {collapsed ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Cards row */}
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5">
                      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-700">
                        {incomplete.map((video) => (
                          <TutorialCard
                            key={video.id}
                            video={video}
                            onClick={openVideo}
                            variant="dashboard"
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <VideoPlayerModal
        video={activeVideo}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
