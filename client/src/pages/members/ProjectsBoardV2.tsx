/**
 * ProjectsBoardV2 — Unified Project Board System
 *
 * Replaces both the old ProjectsBoard.tsx and BoardPage.tsx.
 * Left panel: project browser (team → project tree).
 * Right panel: kanban board for the selected project.
 */
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers, ChevronRight } from "lucide-react";
import { BoardSidebar } from "@/components/boards/BoardSidebar";
import { KanbanBoard } from "@/components/boards/KanbanBoard";
import { BoardProject } from "@/components/boards/types";

interface ProjectsBoardV2Props {
  /** Pre-select a project by ID (e.g. coming from a sidebar link) */
  initialProjectId?: string | null;
}

export default function ProjectsBoardV2({ initialProjectId }: ProjectsBoardV2Props) {
  const [selectedProject, setSelectedProject] = useState<BoardProject | null>(null);

  // If initialProjectId supplied, fetch + pre-select
  const { data: allProjects } = useQuery<BoardProject[]>({
    queryKey: ["/api/board/projects"],
    queryFn: async () => {
      const res = await fetch("/api/board/projects", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  useEffect(() => {
    if (initialProjectId && allProjects && !selectedProject) {
      const found = allProjects.find((p) => p.id === initialProjectId);
      if (found) setSelectedProject(found);
    }
    // If nothing selected yet, pick the first project automatically
    if (!selectedProject && allProjects && allProjects.length > 0 && !initialProjectId) {
      setSelectedProject(allProjects[0]);
    }
  }, [initialProjectId, allProjects]);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* ── Left panel: project navigator ── */}
      <div className="w-56 shrink-0 border-r border-gray-100 flex flex-col bg-gray-50/50">
        <BoardSidebar
          selectedProjectId={selectedProject?.id ?? null}
          onSelectProject={setSelectedProject}
        />
      </div>

      {/* ── Right panel: board ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedProject ? (
          <KanbanBoard project={selectedProject} />
        ) : (
          <EmptyState onSelect={setSelectedProject} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ onSelect }: { onSelect: (p: BoardProject) => void }) {
  const { data: projects = [] } = useQuery<BoardProject[]>({
    queryKey: ["/api/board/projects"],
  });

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Layers className="w-8 h-8 text-gray-300" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Select a project</h2>
      <p className="text-sm text-gray-400 mb-6 max-w-xs">
        Choose a project from the left panel to open its board and start managing work.
      </p>
      {projects.length > 0 && (
        <div className="space-y-1.5 w-full max-w-xs">
          {projects.slice(0, 5).map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm text-gray-700 font-medium"
            >
              <span className="flex-1 text-left truncate">{p.name}</span>
              {p.teamName && <span className="text-xs text-gray-400 truncate">{p.teamName}</span>}
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
