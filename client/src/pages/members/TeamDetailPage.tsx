import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft,
  Users,
  FolderOpen,
  FileText,
  Building2,
  Clock,
  Target,
  CheckCircle2,
  Circle,
  X,
  Plus,
  TrendingUp
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Team = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
};

type Member = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  role: string;
  profilePicture: string | null;
  teamId?: string | null;
};

type Client = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  teamId?: string | null;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  clientId: string | null;
  teamId?: string | null;
  createdAt: string;
};

type Issue = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  projectId: string | null;
  createdAt: string;
  project?: {
    id: string;
    name: string;
  };
};

type TeamDetails = {
  team: Team;
  members: Member[];
  clients: Client[];
  projects: Project[];
  issues: Issue[];
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  manager: "bg-purple-100 text-purple-800",
  editor: "bg-blue-100 text-blue-800",
  clipper: "bg-green-100 text-green-800",
  member: "bg-gray-100 text-gray-800",
};

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-orange-500",
  unstarted: "bg-gray-500",
  "in_progress": "bg-blue-500",
  editing: "bg-orange-500",
  ready_for_editing: "bg-orange-500",
  ready_for_caption: "bg-orange-500",
  ready_for_upload: "bg-purple-500",
  completed: "bg-green-500",
  done: "bg-green-600",
};

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  unstarted: "Unstarted",
  "in_progress": "In Progress",
  editing: "Editing",
  ready_for_editing: "Ready for Editing",
  ready_for_caption: "Ready for Caption",
  ready_for_upload: "Ready for Upload",
  completed: "Completed",
  done: "Done",
};

type TeamStatistics = {
  totalTasksCompleted: number;
  totalPointsEarned: number;
  totalIssuesRemaining: number;
  totalTasksRemaining: number;
};

type TeamDetailPageProps = {
  teamId: string;
  onBackToTeams?: () => void;
};

export default function TeamDetailPage({ teamId, onBackToTeams }: TeamDetailPageProps) {
  console.log("[TeamDetailPage] Component rendered with teamId:", teamId);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const { data: teamDetails, isLoading, error: teamDetailsError } = useQuery<TeamDetails>({
    queryKey: ["/api/teams", teamId, "details"],
    queryFn: async () => {
      console.log("[TeamDetailPage] Fetching team details for teamId:", teamId);
      const res = await fetch(`/api/teams/${teamId}/details`, { credentials: "include" });
      console.log("[TeamDetailPage] Response status:", res.status, res.statusText);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("[TeamDetailPage] Failed to fetch team details:", res.status, errorText);
        throw new Error(`Failed to fetch team details: ${res.status} ${errorText}`);
      }
      const data = await res.json();
      console.log("[TeamDetailPage] Team details fetched successfully:", data);
      return data;
    },
  });

  // Fetch all members, clients, and projects for assignment
  const { data: allMembers } = useQuery<Member[]>({
    queryKey: ["/api/members/list-public"],
    queryFn: async () => {
      const res = await fetch("/api/members/list-public", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch members");
      return res.json();
    },
  });

  const { data: allClients } = useQuery<Client[]>({
    queryKey: ["/api/clients/list"],
    queryFn: async () => {
      const res = await fetch("/api/clients/list", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  const { data: allProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  // Fetch team statistics
  const { data: teamStats } = useQuery<TeamStatistics>({
    queryKey: ["/api/teams", teamId, "statistics"],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/statistics`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch team statistics");
      return res.json();
    },
  });

  // Assignment mutations
  const assignMemberMutation = useMutation({
    mutationFn: async (data: { memberId: string; teamId: string | null }) => {
      const response = await apiRequest("PATCH", `/api/members/${data.memberId}/team`, {
        teamId: data.teamId,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "details"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/list-public"] });
      toast({
        title: "Success",
        description: "Member assignment updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign member",
        variant: "destructive",
      });
    },
  });

  const assignMultipleMembersMutation = useMutation({
    mutationFn: async (memberIds: string[]) => {
      const promises = memberIds.map(memberId =>
        apiRequest("PATCH", `/api/members/${memberId}/team`, { teamId })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "details"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/list-public"] });
      setSelectedMemberIds([]);
      toast({
        title: "Success",
        description: "Members assigned successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign members",
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
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "details"] });
      toast({
        title: "Success",
        description: "Client assignment updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign client",
        variant: "destructive",
      });
    },
  });

  const assignProjectMutation = useMutation({
    mutationFn: async (data: { projectId: string; teamId: string | null }) => {
      const response = await apiRequest("PATCH", `/api/projects/${data.projectId}/team`, {
        teamId: data.teamId,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "details"] });
      toast({
        title: "Success",
        description: "Project assignment updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign project",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading team details...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading team details...</p>
        </div>
      </div>
    );
  }

  if (teamDetailsError) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-500">Error loading team: {teamDetailsError instanceof Error ? teamDetailsError.message : "Unknown error"}</p>
          <p className="text-sm text-gray-500 mt-2">Team ID: {teamId}</p>
        </div>
      </div>
    );
  }

  if (!teamDetails) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-500">Team not found</p>
          <p className="text-sm text-gray-500 mt-2">Team ID: {teamId}</p>
        </div>
      </div>
    );
  }

  const { team, members, clients, projects, issues } = teamDetails;

  // Group issues by status
  const issuesByStatus = issues.reduce((acc, issue) => {
    const status = issue.status || "unstarted";
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(issue);
    return acc;
  }, {} as Record<string, Issue[]>);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => {
            console.log("[TeamDetailPage] Back button clicked, onBackToTeams:", !!onBackToTeams);
            if (onBackToTeams) {
              onBackToTeams();
            } else {
              console.log("[TeamDetailPage] No callback, navigating to /dashboard");
              setLocation("/dashboard");
            }
          }}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Teams
        </Button>
        <div>
          <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
          {team.description && (
            <p className="text-muted-foreground">{team.description}</p>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Members</p>
                <p className="text-3xl font-bold">{members.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Projects</p>
                <p className="text-3xl font-bold">{projects.length}</p>
              </div>
              <FolderOpen className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Issues</p>
                <p className="text-3xl font-bold">{issues.length}</p>
              </div>
              <FileText className="w-10 h-10 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clients</p>
                <p className="text-3xl font-bold">{clients.length}</p>
              </div>
              <Building2 className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Statistics */}
      {teamStats && (
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle>Team Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium text-gray-700">Tasks Completed</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{teamStats.totalTasksCompleted}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-medium text-gray-700">Points Earned</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{teamStats.totalPointsEarned.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <p className="text-sm font-medium text-gray-700">Issues Remaining</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{teamStats.totalIssuesRemaining}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <p className="text-sm font-medium text-gray-700">Tasks Remaining</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">{teamStats.totalTasksRemaining}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members Section */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members ({members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Assign Members Section */}
            <div className="mb-6 pb-6 border-b">
              <Label className="text-sm font-semibold mb-3 block">Assign Members</Label>
              {allMembers && (
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {allMembers
                    .filter(m => !m.teamId || m.teamId === teamId)
                    .map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`assign-member-${member.id}`}
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
                          htmlFor={`assign-member-${member.id}`}
                          className="text-sm font-normal cursor-pointer flex-1 flex items-center gap-2"
                        >
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={member.profilePicture || undefined} />
                            <AvatarFallback className="bg-gray-200 text-xs">
                              {(member.fullName?.[0] || member.username[0] || "?").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.fullName || member.username}</span>
                          {member.teamId === teamId && (
                            <Badge variant="outline" className="ml-auto text-xs">Current</Badge>
                          )}
                        </Label>
                      </div>
                    ))}
                </div>
              )}
              {selectedMemberIds.length > 0 && (
                <Button
                  onClick={() => assignMultipleMembersMutation.mutate(selectedMemberIds)}
                  disabled={assignMultipleMembersMutation.isPending}
                  className="mt-3 w-full"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Assign {selectedMemberIds.length} Member{selectedMemberIds.length > 1 ? 's' : ''}
                </Button>
              )}
            </div>

            {/* Current Members */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Current Members</Label>
              {members.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No members in this team</p>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.profilePicture || undefined} />
                          <AvatarFallback className="bg-gray-200">
                            {(member.fullName?.[0] || member.username[0] || "?").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.fullName || member.username}
                          </p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={ROLE_COLORS[member.role] || ROLE_COLORS.member}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => assignMemberMutation.mutate({ memberId: member.id, teamId: null })}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Clients Section */}
        <Card>
          <CardHeader>
            <CardTitle>Clients ({clients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Assign Client Section */}
            <div className="mb-6 pb-6 border-b">
              <Label className="text-sm font-semibold mb-3 block">Assign Client</Label>
              {allClients && (
                <Select
                  onValueChange={(clientId) => {
                    if (clientId) {
                      assignClientMutation.mutate({ clientId, teamId });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {allClients
                      .filter(c => !c.teamId || c.teamId === teamId)
                      .map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.fullName || client.username}
                          {client.teamId === teamId && " (Current)"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Current Clients */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Current Clients</Label>
              {clients.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No clients assigned to this team</p>
              ) : (
                <div className="space-y-3">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {client.fullName || client.username}
                        </p>
                        <p className="text-sm text-gray-500">{client.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => assignClientMutation.mutate({ clientId: client.id, teamId: null })}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Projects ({projects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Assign Project Section */}
          <div className="mb-6 pb-6 border-b">
            <Label className="text-sm font-semibold mb-3 block">Assign Project</Label>
            {allProjects && (
              <Select
                onValueChange={(projectId) => {
                  if (projectId) {
                    assignProjectMutation.mutate({ projectId, teamId });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project to assign" />
                </SelectTrigger>
                <SelectContent>
                  {allProjects
                    .filter(p => !p.teamId || p.teamId === teamId)
                    .map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                        {project.teamId === teamId && " (Current)"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Current Projects */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Current Projects</Label>
            {projects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No projects assigned to this team</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell className="text-gray-500">
                          {project.description || "No description"}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/dashboard?section=projects&project=${project.id}`)}
                            >
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => assignProjectMutation.mutate({ projectId: project.id, teamId: null })}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Issues Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Current Issues ({issues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No issues in this team's projects</p>
          ) : (
            <div className="space-y-6">
              {/* Issues by Status */}
              {Object.entries(issuesByStatus).map(([status, statusIssues]) => (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status] || "bg-gray-500"}`}></div>
                    <h3 className="font-semibold text-gray-900">
                      {STATUS_LABELS[status] || status} ({statusIssues.length})
                    </h3>
                  </div>
                  <div className="space-y-2 ml-4">
                    {statusIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => {
                          if (issue.projectId) {
                            setLocation(`/dashboard/projects/${issue.projectId}/issues/${issue.id}`);
                          }
                        }}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{issue.title}</p>
                          {issue.project && (
                            <p className="text-sm text-gray-500 mt-1">
                              Project: {issue.project.name}
                            </p>
                          )}
                          {issue.description && (
                            <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                              {issue.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (issue.projectId) {
                              setLocation(`/dashboard/projects/${issue.projectId}/issues/${issue.id}`);
                            }
                          }}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

