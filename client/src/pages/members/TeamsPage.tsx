import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Trash2, Edit, X, CheckCircle2, Clock, Target, TrendingUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type Team = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
};

type Client = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  teamId: string | null;
};

type Member = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  role: string;
  teamId: string | null;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  teamId: string | null;
};

type TeamStatistics = {
  totalTasksCompleted: number;
  totalPointsEarned: number;
  totalIssuesRemaining: number;
  totalTasksRemaining: number;
};

export default function TeamsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  const { data: teams, isLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const res = await fetch("/api/teams", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json();
    },
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients/list"],
    queryFn: async () => {
      const res = await fetch("/api/clients/list", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  const { data: members } = useQuery<Member[]>({
    queryKey: ["/api/members/list"],
    queryFn: async () => {
      const res = await fetch("/api/members/list", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/teams", data);
      const team = await response.json();
      
      // Assign members to the team
      if (selectedMemberIds.length > 0) {
        await Promise.all(
          selectedMemberIds.map(memberId =>
            apiRequest("PATCH", `/api/members/${memberId}/team`, { teamId: team.id })
          )
        );
      }
      
      // Assign clients to the team
      if (selectedClientIds.length > 0) {
        await Promise.all(
          selectedClientIds.map(clientId =>
            apiRequest("PATCH", `/api/clients/${clientId}/team`, { teamId: team.id })
          )
        );
      }
      
      // Assign projects to the team
      if (selectedProjectIds.length > 0) {
        await Promise.all(
          selectedProjectIds.map(projectId =>
            apiRequest("PATCH", `/api/projects/${projectId}/team`, { teamId: team.id })
          )
        );
      }
      
      return team;
    },
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients/list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsCreateDialogOpen(false);
      setFormData({ name: "", description: "" });
      setSelectedMemberIds([]);
      setSelectedClientIds([]);
      setSelectedProjectIds([]);
      toast({
        title: "Success!",
        description: "Team created successfully.",
      });
      // Automatically navigate to the team detail page
      if (team?.id) {
        setLocation(`/member-dashboard/teams/${team.id}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive",
      });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async (data: { teamId: string; updates: typeof formData }) => {
      const response = await apiRequest("PATCH", `/api/teams/${data.teamId}`, data.updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setIsEditDialogOpen(false);
      setEditingTeam(null);
      setFormData({ name: "", description: "" });
      toast({
        title: "Success!",
        description: "Team updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update team",
        variant: "destructive",
      });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await apiRequest("DELETE", `/api/teams/${teamId}`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients/list"] });
      setDeleteTeamId(null);
      toast({
        title: "Success!",
        description: "Team deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete team",
        variant: "destructive",
      });
    },
  });

  const assignClientMutation = useMutation({
    mutationFn: async (data: { clientId: string; teamId: string | null }) => {
      const response = await apiRequest("PATCH", `/api/clients/${data.clientId}/team`, {
        teamId: data.teamId,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients/list"] });
      toast({
        title: "Success!",
        description: "Client assigned to team successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign client to team",
        variant: "destructive",
      });
    },
  });

  const assignMemberMutation = useMutation({
    mutationFn: async (data: { memberId: string; teamId: string | null }) => {
      const response = await apiRequest("PATCH", `/api/members/${data.memberId}/team`, {
        teamId: data.teamId,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/list"] });
      toast({
        title: "Success!",
        description: "Member assigned to team successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign member to team",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive",
      });
      return;
    }
    createTeamMutation.mutate(formData);
  };

  const assignProjectMutation = useMutation({
    mutationFn: async (data: { projectId: string; teamId: string | null }) => {
      const response = await apiRequest("PATCH", `/api/projects/${data.projectId}/team`, {
        teamId: data.teamId,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success!",
        description: "Project assigned to team successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign project to team",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingTeam || !formData.name.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive",
      });
      return;
    }
    updateTeamMutation.mutate({
      teamId: editingTeam.id,
      updates: formData,
    });
  };

  const getClientsForTeam = (teamId: string) => {
    return clients?.filter((client) => client.teamId === teamId) || [];
  };

  const getMembersForTeam = (teamId: string) => {
    return members?.filter((member) => member.teamId === teamId) || [];
  };

  const getProjectsForTeam = (teamId: string) => {
    return projects?.filter((project) => project.teamId === teamId) || [];
  };

  // Component to fetch and display team statistics
  function TeamStatistics({ teamId }: { teamId: string }) {
    const { data: stats } = useQuery<TeamStatistics>({
      queryKey: ["/api/teams", teamId, "statistics"],
      queryFn: async () => {
        const res = await fetch(`/api/teams/${teamId}/statistics`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch team statistics");
        return res.json();
      },
    });

    if (!stats) return null;

    return (
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Tasks Completed</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.totalTasksCompleted}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span>Points Earned</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.totalPointsEarned}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
            <Clock className="w-4 h-4 text-orange-500" />
            <span>Issues Remaining</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.totalIssuesRemaining}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
            <Target className="w-4 h-4 text-purple-500" />
            <span>Tasks Remaining</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.totalTasksRemaining}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading teams...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Teams</h1>
          <p className="text-muted-foreground">Manage teams, assign members, clients, and projects, and track team performance</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white hover:bg-gray-900">
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Team Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter team description"
                  rows={3}
                />
              </div>
              
              {/* Members Selection */}
              <div>
                <Label>Assign Members</Label>
                <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg p-2 space-y-2">
                  {members?.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-2">No members available</p>
                  ) : (
                    members?.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`member-${member.id}`}
                          checked={selectedMemberIds.includes(member.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMemberIds([...selectedMemberIds, member.id]);
                            } else {
                              setSelectedMemberIds(selectedMemberIds.filter(id => id !== member.id));
                            }
                          }}
                        />
                        <Label
                          htmlFor={`member-${member.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {member.fullName || member.username}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Clients Selection */}
              <div>
                <Label>Assign Clients</Label>
                <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg p-2 space-y-2">
                  {clients?.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-2">No clients available</p>
                  ) : (
                    clients?.map((client) => (
                      <div key={client.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`client-${client.id}`}
                          checked={selectedClientIds.includes(client.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedClientIds([...selectedClientIds, client.id]);
                            } else {
                              setSelectedClientIds(selectedClientIds.filter(id => id !== client.id));
                            }
                          }}
                        />
                        <Label
                          htmlFor={`client-${client.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {client.fullName || client.username}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Projects Selection */}
              <div>
                <Label>Assign Projects</Label>
                <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg p-2 space-y-2">
                  {projects?.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-2">No projects available</p>
                  ) : (
                    projects?.map((project) => (
                      <div key={project.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`project-${project.id}`}
                          checked={selectedProjectIds.includes(project.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProjectIds([...selectedProjectIds, project.id]);
                            } else {
                              setSelectedProjectIds(selectedProjectIds.filter(id => id !== project.id));
                            }
                          }}
                        />
                        <Label
                          htmlFor={`project-${project.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {project.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  setSelectedMemberIds([]);
                  setSelectedClientIds([]);
                  setSelectedProjectIds([]);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createTeamMutation.isPending}>
                  {createTeamMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {teams && teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No teams yet. Create your first team to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams?.map((team) => {
            const teamClients = getClientsForTeam(team.id);
            const teamMembers = getMembersForTeam(team.id);
            const teamProjects = getProjectsForTeam(team.id);
            return (
              <Card 
                key={team.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={(e) => {
                  // Don't navigate if clicking on buttons or selects
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.closest('[role="combobox"]') || target.closest('[role="listbox"]')) {
                    return;
                  }
                  setLocation(`/member-dashboard/teams/${team.id}`);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      {team.description && (
                        <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(team);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTeamId(team.id);
                        }}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Summary Info Only */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Members</Label>
                        <p className="font-medium">{teamMembers.length}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Projects</Label>
                        <p className="font-medium">{teamProjects.length}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Clients</Label>
                        <p className="font-medium">{teamClients.length}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Issues</Label>
                        <p className="font-medium">-</p>
                        <p className="text-xs text-gray-400">Click to view</p>
                      </div>
                    </div>
                    
                    {/* Team Statistics */}
                    <TeamStatistics teamId={team.id} />
                    
                    <p className="text-xs text-gray-500 text-center pt-2 border-t">
                      Click to view details and manage assignments
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Team Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter team name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter team description"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateTeamMutation.isPending}>
                {updateTeamMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deleteTeamId && (
        <Dialog open={!!deleteTeamId} onOpenChange={(open) => !open && setDeleteTeamId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Team</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this team? This will unassign all clients from this team.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteTeamId(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => deleteTeamMutation.mutate(deleteTeamId)}
                disabled={deleteTeamMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteTeamMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


