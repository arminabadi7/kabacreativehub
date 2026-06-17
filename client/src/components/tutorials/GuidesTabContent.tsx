import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TutorialCard } from "./TutorialCard";
import { VideoPlayerModal } from "./VideoPlayerModal";
import type { TutorialVideoData } from "./VideoPlayerModal";

type FilterType = "all" | "completed" | "in_progress" | "not_started";

export function GuidesTabContent() {
  const [activeVideo, setActiveVideo] = useState<TutorialVideoData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: tutorials = [], isLoading } = useQuery<TutorialVideoData[]>({
    queryKey: ["/api/tutorials"],
    queryFn: async () => {
      const res = await fetch("/api/tutorials", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tutorials");
      return res.json();
    },
    staleTime: 30_000,
  });

  const openVideo = (video: TutorialVideoData) => {
    setActiveVideo(video);
    setModalOpen(true);
  };

  // Apply search + filter
  const filtered = tutorials.filter((v) => {
    const matchesSearch =
      !search ||
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      (v.description ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "completed" && v.progress.isCompleted) ||
      (filter === "in_progress" && !v.progress.isCompleted && v.progress.watchPercentage > 0) ||
      (filter === "not_started" && v.progress.watchPercentage === 0 && !v.progress.isCompleted);

    return matchesSearch && matchesFilter;
  });

  const filterLabels: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "completed", label: "Completed" },
    { value: "in_progress", label: "In Progress" },
    { value: "not_started", label: "Not Started" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        Loading guides…
      </div>
    );
  }

  if (tutorials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">No guides yet</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-xs">
          Tutorial videos will appear here once your account manager publishes them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search guides…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filterLabels.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.value)}
              className={
                filter === f.value
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : ""
              }
            >
              {f.label}
              {f.value !== "all" && (
                <span className="ml-1.5 text-xs opacity-70">
                  (
                  {f.value === "completed"
                    ? tutorials.filter((v) => v.progress.isCompleted).length
                    : f.value === "in_progress"
                    ? tutorials.filter(
                        (v) => !v.progress.isCompleted && v.progress.watchPercentage > 0
                      ).length
                    : tutorials.filter(
                        (v) =>
                          v.progress.watchPercentage === 0 && !v.progress.isCompleted
                      ).length}
                  )
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No guides match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((video) => (
            <TutorialCard
              key={video.id}
              video={video}
              onClick={openVideo}
              variant="guides"
            />
          ))}
        </div>
      )}

      <VideoPlayerModal
        video={activeVideo}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
