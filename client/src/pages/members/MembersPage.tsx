import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Users, CheckCircle2, Clock, TrendingUp, DollarSign, Target, Briefcase } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Member = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  role: string;
  teamId: string | null;
  createdAt: string;
};

type MemberStatistics = {
  pointsEarned: number;
  pointsPaid: number;
  currentBalance: number;
  tasksCompleted: number;
  tasksRemaining: number;
  pointsFromTasks: number;
  issuesWorkedOn: number;
};

type MemberWithStats = Member & {
  statistics?: MemberStatistics;
};

export default function MembersPage() {
  const { data: members, isLoading, error } = useQuery<Member[]>({
    queryKey: ["/api/members/list-public"],
  });

  const [searchTerm, setSearchTerm] = React.useState("");

  // Fetch statistics for all members
  const memberIds = members?.map(m => m.id) || [];
  const statisticsQueries = useQuery<Record<string, MemberStatistics>>({
    queryKey: ["/api/members/statistics", memberIds],
    queryFn: async () => {
      if (!memberIds.length) return {};
      const statsPromises = memberIds.map(async (id) => {
        try {
          const res = await fetch(`/api/members/${id}/statistics`, { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            return { id, statistics: data };
          }
          // Return default stats if request fails
          return { 
            id, 
            statistics: {
              pointsEarned: 0,
              pointsPaid: 0,
              currentBalance: 0,
              tasksCompleted: 0,
              tasksRemaining: 0,
              pointsFromTasks: 0,
              issuesWorkedOn: 0,
            } as MemberStatistics
          };
        } catch {
          return { 
            id, 
            statistics: {
              pointsEarned: 0,
              pointsPaid: 0,
              currentBalance: 0,
              tasksCompleted: 0,
              tasksRemaining: 0,
              pointsFromTasks: 0,
              issuesWorkedOn: 0,
            } as MemberStatistics
          };
        }
      });
      const results = await Promise.all(statsPromises);
      const statsMap: Record<string, MemberStatistics> = {};
      results.forEach(({ id, statistics }) => {
        statsMap[id] = statistics;
      });
      return statsMap;
    },
    enabled: memberIds.length > 0,
  });

  const statistics = statisticsQueries.data || {};

  // Combine members with their statistics
  const membersWithStats: MemberWithStats[] = (members || []).map(member => ({
    ...member,
    statistics: statistics[member.id] || {
      pointsEarned: 0,
      pointsPaid: 0,
      currentBalance: 0,
      tasksCompleted: 0,
      tasksRemaining: 0,
      pointsFromTasks: 0,
      issuesWorkedOn: 0,
    },
  }));

  // Filter members based on search
  const filteredMembers = membersWithStats.filter((member) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.username?.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower) ||
      member.fullName?.toLowerCase().includes(searchLower) ||
      member.role?.toLowerCase().includes(searchLower)
    );
  });

  // Group members by role for summary
  const membersByRole = filteredMembers.reduce((acc, member) => {
    const role = member.role || "member";
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(member);
    return acc;
  }, {} as Record<string, MemberWithStats[]>);

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    manager: "Manager",
    editor: "Editor",
    clipper: "Clipper",
    member: "Member",
  };

  // Calculate totals
  const totalTasksCompleted = filteredMembers.reduce(
    (sum, m) => sum + (m.statistics?.tasksCompleted || 0),
    0
  );
  const totalPointsEarned = filteredMembers.reduce(
    (sum, m) => sum + (m.statistics?.pointsEarned || 0),
    0
  );
  const totalBalance = filteredMembers.reduce(
    (sum, m) => sum + (m.statistics?.currentBalance || 0),
    0
  );
  const totalTasksRemaining = filteredMembers.reduce(
    (sum, m) => sum + (m.statistics?.tasksRemaining || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading members...</div>
      </div>
    );
  }

  if (error) {
    console.error("[MembersPage] Error loading members:", error);
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-red-600 mb-2">Error loading members</p>
              <p className="text-sm text-gray-500">{(error as Error).message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log("[MembersPage] Total members received:", members?.length || 0);
  console.log("[MembersPage] Members data:", members);
  console.log("[MembersPage] Filtered members count:", filteredMembers.length);
  console.log("[MembersPage] Members with stats:", membersWithStats.length);
  console.log("[MembersPage] Is loading:", isLoading);
  console.log("[MembersPage] Has error:", !!error);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Members</h1>
        <p className="text-muted-foreground">View all members, their roles, work completed, and earnings</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, email, username, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Members</p>
                <div className="text-2xl font-bold">
                  {members?.length || 0}
                  {searchTerm && filteredMembers.length !== members?.length && (
                    <span className="text-lg text-gray-500"> ({filteredMembers.length} shown)</span>
                  )}
                </div>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tasks Completed</p>
                <div className="text-2xl font-bold">{totalTasksCompleted}</div>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Points Earned</p>
                <div className="text-2xl font-bold">{totalPointsEarned.toLocaleString()}</div>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                <div className="text-2xl font-bold">{totalBalance.toLocaleString()}</div>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tasks Remaining</p>
                <div className="text-2xl font-bold">{totalTasksRemaining}</div>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(roleLabels).map(([role, label]) => (
          <Card key={role}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {membersByRole[role]?.length || 0}
              </div>
              <p className="text-sm text-gray-600">{label}s</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Members ({filteredMembers.length}
            {members && members.length > 0 && filteredMembers.length !== members.length 
              ? ` of ${members.length} total` 
              : ""})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMembers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Tasks Completed</TableHead>
                    <TableHead>Tasks Remaining</TableHead>
                    <TableHead>Issues Worked On</TableHead>
                    <TableHead>Points Earned</TableHead>
                    <TableHead>Points Paid</TableHead>
                    <TableHead>Current Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {member.fullName || member.username}
                          </div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.role === "admin" ? "bg-red-100 text-red-800" :
                          member.role === "manager" ? "bg-purple-100 text-purple-800" :
                          member.role === "editor" ? "bg-blue-100 text-blue-800" :
                          member.role === "clipper" ? "bg-green-100 text-green-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {roleLabels[member.role] || member.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="font-medium">{member.statistics?.tasksCompleted || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">{member.statistics?.tasksRemaining || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{member.statistics?.issuesWorkedOn || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{member.statistics?.pointsEarned?.toLocaleString() || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{member.statistics?.pointsPaid?.toLocaleString() || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium font-semibold">{member.statistics?.currentBalance?.toLocaleString() || 0}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : members && members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No members found in the system.</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">
                {searchTerm ? "No members found matching your search." : "No members to display."}
              </p>
              {members && members.length > 0 && filteredMembers.length === 0 && (
                <p className="text-sm text-gray-400 mt-2">
                  Found {members.length} member(s) total, but none match your search filter.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

