import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Users, Plus, X } from "lucide-react";
import { BoardProject } from "./types";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";

interface BoardSidebarProps {
  selectedProjectId: string | null;
  onSelectProject: (project: BoardProject) => void;
}

type Client = { id: string; username: string; fullName: string | null };
type Team   = { id: string; name: string };

export function BoardSidebar({ selectedProjectId, onSelectProject }: BoardSidebarProps) {
  const { toast } = useToast();
  const { can } = usePermissions();
  const canCreateProjects = can("create_projects");
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(
    new Set(["__none__", ...Array.from({ length: 20 }, (_, i) => String(i))])
  );
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName]             = useState("");
  const [clientId, setClientId]     = useState("");
  const [teamId, setTeamId]         = useState("");

  const { data: projects = [], isLoading } = useQuery<BoardProject[]>({
    queryKey: ["/api/board/projects"],
    queryFn: async () => {
      const res = await fetch("/api/board/projects", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients/list"],
    queryFn: async () => {
      const res = await fetch("/api/clients/list", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: showCreate,
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const res = await fetch("/api/teams", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: showCreate,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/projects", {
        name: name.trim(),
        clientId,
        teamId: teamId || undefined,
      });
      return res.json();
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["/api/board/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowCreate(false);
      setName("");
      setClientId("");
      setTeamId("");
      toast({ title: "Project created", description: `"${created.name}" is ready.` });
      // Auto-select the new project on the board
      onSelectProject({
        id: created.id,
        name: created.name,
        clientId: created.clientId ?? null,
        teamId: created.teamId ?? null,
        fileLink: created.fileLink ?? null,
        clientUsername: null,
        clientFullName: clients.find(c => c.id === created.clientId)?.fullName ?? null,
        teamName: teams.find(t => t.id === created.teamId)?.name ?? null,
      });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to create project", variant: "destructive" });
    },
  });

  // Group projects by team
  const groups: Record<string, BoardProject[]> = {};
  for (const p of projects) {
    const key = p.teamId ?? "__none__";
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }

  const toggleTeam = (key: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const canCreate = name.trim().length > 0 && clientId.length > 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Projects</span>
        {canCreateProjects && (
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
            title="New project"
          >
            {showCreate ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Inline create form */}
      {showCreate && (
        <div className="mx-2 mb-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm shrink-0 space-y-2">
          <p className="text-xs font-semibold text-gray-600">New Project</p>

          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canCreate && createMutation.mutate()}
            placeholder="Project name *"
            className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 bg-white"
          />

          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 bg-white text-gray-700"
          >
            <option value="">Select client *</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName || c.username}
              </option>
            ))}
          </select>

          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 bg-white text-gray-700"
          >
            <option value="">No team (optional)</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <div className="flex gap-1.5 pt-0.5">
            <button
              onClick={() => createMutation.mutate()}
              disabled={!canCreate || createMutation.isPending}
              className="flex-1 text-xs bg-black text-white rounded px-2 py-1.5 font-medium disabled:opacity-40 hover:bg-gray-800 transition-colors"
            >
              {createMutation.isPending ? "Creating…" : "Create"}
            </button>
            <button
              onClick={() => { setShowCreate(false); setName(""); setClientId(""); setTeamId(""); }}
              className="text-xs border border-gray-200 rounded px-2 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Project list */}
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-7 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {Object.entries(groups).map(([teamKey, teamProjects]) => {
              const isExpanded = expandedTeams.has(teamKey);
              const teamName = teamProjects[0]?.teamName ?? (teamKey === "__none__" ? null : teamKey);

              return (
                <div key={teamKey} className="mb-1">
                  {teamName && (
                    <button
                      onClick={() => toggleTeam(teamKey)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      {isExpanded
                        ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{teamName}</span>
                    </button>
                  )}

                  {(isExpanded || !teamName) && (
                    <div className={teamName ? "ml-3 border-l border-gray-100 pl-2" : ""}>
                      {teamProjects.map((project) => {
                        const active = project.id === selectedProjectId;
                        return (
                          <button
                            key={project.id}
                            onClick={() => onSelectProject(project)}
                            className={`
                              w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors text-left
                              ${active
                                ? "bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-500 -ml-0.5"
                                : "text-gray-700 hover:bg-gray-100"}
                            `}
                          >
                            {active
                              ? <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                              : <Folder className="w-3.5 h-3.5 shrink-0 text-gray-400" />}
                            <span className="truncate">{project.name}</span>
                            {project.clientFullName && (
                              <span className="ml-auto text-[10px] text-gray-400 shrink-0 truncate max-w-[60px]">
                                {project.clientFullName}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {projects.length === 0 && !showCreate && (
              <div className="px-3 py-8 text-center">
                <Folder className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No projects yet</p>
                {canCreateProjects && (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="mt-2 text-xs text-blue-500 hover:text-blue-700"
                  >
                    Create one
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
