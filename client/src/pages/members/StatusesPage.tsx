import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Edit2, ArrowUp, ArrowDown } from "lucide-react";

type StatusStatistics = Record<string, number>;

export default function StatusesPage() {
  const { toast } = useToast();
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editingStatusValue, setEditingStatusValue] = useState("");
  const [newStatus, setNewStatus] = useState("");

  // Fetch status statistics
  const { data: statusStatistics, isLoading: statsLoading } = useQuery<StatusStatistics>({
    queryKey: ["/api/issues/status-statistics"],
    queryFn: async () => {
      const res = await fetch("/api/issues/status-statistics", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch status statistics");
      return res.json();
    },
  });

  // Fetch default statuses
  const { data: defaultStatuses = [], isLoading: defaultsLoading } = useQuery<string[]>({
    queryKey: ["/api/settings/default-statuses"],
    queryFn: async () => {
      const res = await fetch("/api/settings/default-statuses", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch default statuses");
      return res.json();
    },
  });

  const updateDefaultStatusesMutation = useMutation({
    mutationFn: async (statuses: string[]) => {
      const response = await apiRequest("PUT", "/api/settings/default-statuses", {
        statuses,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/default-statuses"] });
      toast({
        title: "Success!",
        description: "Default statuses updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update default statuses",
        variant: "destructive",
      });
    },
  });

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newStatuses = [...defaultStatuses];
    [newStatuses[index - 1], newStatuses[index]] = [newStatuses[index], newStatuses[index - 1]];
    updateDefaultStatusesMutation.mutate(newStatuses);
  };

  const handleMoveDown = (index: number) => {
    if (index === defaultStatuses.length - 1) return;
    const newStatuses = [...defaultStatuses];
    [newStatuses[index], newStatuses[index + 1]] = [newStatuses[index + 1], newStatuses[index]];
    updateDefaultStatusesMutation.mutate(newStatuses);
  };

  const handleStartEdit = (status: string) => {
    setEditingStatus(status);
    setEditingStatusValue(status);
  };

  const handleSaveEdit = () => {
    if (!editingStatus || !editingStatusValue.trim()) return;
    const newStatuses = defaultStatuses.map((s) =>
      s === editingStatus ? editingStatusValue.trim() : s
    );
    updateDefaultStatusesMutation.mutate(newStatuses);
    setEditingStatus(null);
    setEditingStatusValue("");
  };

  const handleCancelEdit = () => {
    setEditingStatus(null);
    setEditingStatusValue("");
  };

  const handleDelete = (status: string) => {
    const newStatuses = defaultStatuses.filter((s) => s !== status);
    updateDefaultStatusesMutation.mutate(newStatuses);
  };

  const handleAddStatus = () => {
    if (!newStatus.trim()) {
      toast({
        title: "Error",
        description: "Status name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    if (defaultStatuses.includes(newStatus.trim())) {
      toast({
        title: "Error",
        description: "Status already exists",
        variant: "destructive",
      });
      return;
    }
    const newStatuses = [...defaultStatuses, newStatus.trim()];
    updateDefaultStatusesMutation.mutate(newStatuses);
    setNewStatus("");
  };

  // Get all unique statuses from statistics
  const allStatuses = statusStatistics ? Object.keys(statusStatistics) : [];

  if (statsLoading || defaultsLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading statuses...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Statuses</h1>
      <p className="text-muted-foreground mb-6">
        View issue statistics and manage default statuses for project boards
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Issue Statistics by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {allStatuses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No issues found</p>
            ) : (
              <div className="space-y-3">
                {allStatuses.map((status) => (
                  <div
                    key={status}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium text-gray-900">{status}</span>
                    <span className="text-lg font-bold text-gray-700">
                      {statusStatistics?.[status] || 0}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Default Statuses Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Default Statuses for Project Boards</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              These statuses will appear by default in new project boards. You can still customize
              statuses per project board.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Add new status */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter status name (e.g., backlog)"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddStatus();
                    }
                  }}
                />
                <Button onClick={handleAddStatus} disabled={updateDefaultStatusesMutation.isPending}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              {/* Status list */}
              {defaultStatuses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No default statuses configured</p>
              ) : (
                <div className="space-y-2">
                  {defaultStatuses.map((status, index) => (
                    editingStatus === status ? (
                      <div
                        key={status}
                        className="flex items-center gap-2 p-3 bg-white border-2 border-blue-500 rounded-lg"
                      >
                        <Input
                          value={editingStatusValue}
                          onChange={(e) => setEditingStatusValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveEdit();
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          className="flex-1"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSaveEdit}
                          className="h-8"
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="h-8"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div
                        key={status}
                        className="flex items-center gap-2 p-3 bg-white border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === defaultStatuses.length - 1}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{status}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(status)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(status)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



