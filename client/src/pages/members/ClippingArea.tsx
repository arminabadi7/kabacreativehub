import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Plus, Edit2, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Clip = {
  id: string;
  projectId: string;
  clipNumber: number;
  filePath: string;
  isValid: boolean | null;
  rejectionNote: string | null;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  fileLocation: string | null;
};

export default function ClippingArea() {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [addClipDialogOpen, setAddClipDialogOpen] = useState(false);
  const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [editingClipId, setEditingClipId] = useState<string | null>(null);
  const [editClipNumber, setEditClipNumber] = useState("");
  const [editClipFilePath, setEditClipFilePath] = useState("");
  const [rejectionNote, setRejectionNote] = useState("");
  const [newClipNumber, setNewClipNumber] = useState("");
  const [newClipFilePath, setNewClipFilePath] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectFileLocation, setNewProjectFileLocation] = useState("");
  const [projectFileLocation, setProjectFileLocation] = useState("");

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: clips, isLoading } = useQuery<Clip[]>({
    queryKey: ["/api/clips/pending", selectedProjectId],
    queryFn: async () => {
      const url = selectedProjectId 
        ? `/api/clips/pending?projectId=${selectedProjectId}`
        : "/api/clips/pending";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clips");
      return res.json();
    },
    enabled: !!selectedProjectId,
  });

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);

  // Update project file location state when project changes
  useEffect(() => {
    if (selectedProject) {
      setProjectFileLocation(selectedProject.fileLocation || "");
    }
  }, [selectedProject]);

  const pendingClips = clips || [];

  const startEditing = (clip: Clip) => {
    setEditingClipId(clip.id);
    setEditClipNumber(clip.clipNumber.toString());
    setEditClipFilePath(clip.filePath);
  };

  const cancelEditing = () => {
    setEditingClipId(null);
    setEditClipNumber("");
    setEditClipFilePath("");
  };

  const updateClipMutation = useMutation({
    mutationFn: async (data: { clipId: string; clipNumber?: number; filePath?: string }) => {
      const response = await apiRequest("PATCH", `/api/clips/${data.clipId}`, {
        clipNumber: data.clipNumber,
        filePath: data.filePath,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clips/pending", selectedProjectId] });
      setEditingClipId(null);
      toast({
        title: "Success!",
        description: "Clip updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update clip",
        variant: "destructive",
      });
    },
  });

  const handleSaveEdit = (clipId: string) => {
    const clipNumber = parseInt(editClipNumber);
    if (!clipNumber || !editClipFilePath.trim()) {
      toast({
        title: "Error",
        description: "Clip number and file path are required",
        variant: "destructive",
      });
      return;
    }
    updateClipMutation.mutate({
      clipId,
      clipNumber,
      filePath: editClipFilePath.trim(),
    });
  };

  const approveClipMutation = useMutation({
    mutationFn: async (clipId: string) => {
      const response = await apiRequest("PATCH", `/api/clips/${clipId}`, {
        isValid: true,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clips/pending", selectedProjectId] });
      toast({
        title: "Success!",
        description: "Clip approved and moved to issues.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve clip",
        variant: "destructive",
      });
    },
  });

  const rejectClipMutation = useMutation({
    mutationFn: async (data: { clipId: string; note?: string }) => {
      const response = await apiRequest("PATCH", `/api/clips/${data.clipId}`, {
        isValid: false,
        rejectionNote: data.note || null,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clips/pending", selectedProjectId] });
      setRejectDialogOpen(false);
      setRejectionNote("");
      setSelectedClip(null);
      toast({
        title: "Success!",
        description: "Clip marked as not valid.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject clip",
        variant: "destructive",
      });
    },
  });

  const addClipMutation = useMutation({
    mutationFn: async (data: { clipNumber: number; filePath: string }) => {
      if (!selectedProjectId) {
        throw new Error("No project selected");
      }
      const response = await apiRequest("POST", "/api/clips", {
        projectId: selectedProjectId,
        ...data,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clips/pending", selectedProjectId] });
      setAddClipDialogOpen(false);
      setNewClipNumber("");
      setNewClipFilePath("");
      toast({
        title: "Success!",
        description: "Clip added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add clip",
        variant: "destructive",
      });
    },
  });

  const addProjectMutation = useMutation({
    mutationFn: async (data: { name: string; fileLocation?: string }) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setAddProjectDialogOpen(false);
      setNewProjectName("");
      setNewProjectFileLocation("");
      toast({
        title: "Success!",
        description: "Project created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (data: { projectId: string; fileLocation?: string }) => {
      const response = await apiRequest("PATCH", `/api/projects/${data.projectId}`, {
        fileLocation: data.fileLocation,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success!",
        description: "Project file location updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update project",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (clipId: string) => {
    approveClipMutation.mutate(clipId);
  };

  const handleRejectClick = (clip: Clip) => {
    setSelectedClip(clip);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (selectedClip) {
      rejectClipMutation.mutate({
        clipId: selectedClip.id,
        note: rejectionNote || undefined,
      });
    }
  };

  const handleAddClip = () => {
    const clipNumber = parseInt(newClipNumber);
    if (!clipNumber || !newClipFilePath.trim()) {
      toast({
        title: "Error",
        description: "Clip number and file path are required",
        variant: "destructive",
      });
      return;
    }
    addClipMutation.mutate({
      clipNumber,
      filePath: newClipFilePath.trim(),
    });
  };

  const handleAddProject = () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }
    addProjectMutation.mutate({
      name: newProjectName.trim(),
      fileLocation: newProjectFileLocation.trim() || undefined,
    });
  };

  const handleUpdateProjectFileLocation = () => {
    if (!selectedProjectId) return;
    updateProjectMutation.mutate({
      projectId: selectedProjectId,
      fileLocation: projectFileLocation.trim() || undefined,
    });
  };

  if (!selectedProjectId) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Clipping Area</h1>
            <p className="text-gray-600">
              Select a project to review and approve clips.
            </p>
          </div>
          <Button 
            onClick={() => setAddProjectDialogOpen(true)}
            className="bg-black text-white hover:bg-gray-900"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects?.map((project) => (
            <Card 
              key={project.id} 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setSelectedProjectId(project.id)}
            >
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
                {project.fileLocation && (
                  <p className="text-sm text-gray-500 truncate">{project.fileLocation}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={addProjectDialogOpen} onOpenChange={setAddProjectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Create a new project for clipping.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Project Name</Label>
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <Label>File Location / Path (Optional)</Label>
                <Input
                  value={newProjectFileLocation}
                  onChange={(e) => setNewProjectFileLocation(e.target.value)}
                  placeholder="Drive path or cloud download link"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddProjectDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddProject}
                disabled={addProjectMutation.isPending}
                className="bg-black text-white hover:bg-gray-900"
              >
                {addProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedProjectId(null)}
              className="text-gray-600"
            >
              ← Back to Projects
            </Button>
            <h1 className="text-3xl font-bold">{selectedProject?.name}</h1>
          </div>
          <p className="text-gray-600 mb-4">
            Review and approve clips that were chosen and highlighted in the Premiere project.
          </p>
          <div className="flex items-center gap-2 mb-4">
            <Label className="text-sm font-medium">Project File Location / Path:</Label>
            <Input
              value={projectFileLocation}
              onChange={(e) => setProjectFileLocation(e.target.value)}
              onBlur={handleUpdateProjectFileLocation}
              placeholder="Drive path or cloud download link"
              className="max-w-md"
            />
          </div>
        </div>
        <Button 
          onClick={() => setAddClipDialogOpen(true)}
          className="bg-black text-white hover:bg-gray-900"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Clip
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Review ({pendingClips.length})</h2>
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading clips...</div>
          ) : pendingClips.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No clips pending review
            </div>
          ) : (
            pendingClips.map((clip) => (
              <Card key={clip.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {editingClipId === clip.id ? (
                      <>
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xl text-gray-700 flex-shrink-0">
                          <Input
                            type="number"
                            value={editClipNumber}
                            onChange={(e) => setEditClipNumber(e.target.value)}
                            className="w-12 text-center font-bold"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 mb-1">Clip {editClipNumber}</div>
                          <div className="text-sm text-gray-600 mb-1">File Path / Location:</div>
                          <Input
                            value={editClipFilePath}
                            onChange={(e) => setEditClipFilePath(e.target.value)}
                            className="text-sm font-mono"
                            placeholder="/Projects/Client1/Episode_01/Clip_001.mp4"
                          />
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            onClick={() => handleSaveEdit(clip.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={updateClipMutation.isPending}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={cancelEditing}
                            size="sm"
                            variant="outline"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xl text-gray-700 flex-shrink-0">
                          {clip.clipNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 mb-1">Clip {clip.clipNumber}</div>
                          <div className="text-sm text-gray-600 mb-1">File Path / Location:</div>
                          <div className="text-sm text-gray-900 font-mono">{clip.filePath}</div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            onClick={() => startEditing(clip)}
                            size="sm"
                            variant="outline"
                            title="Edit clip"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleApprove(clip.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={approveClipMutation.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Valid
                          </Button>
                          <Button
                            onClick={() => handleRejectClick(clip)}
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={rejectClipMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Not Valid
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Clip</DialogTitle>
            <DialogDescription>
              Optional: Add a note explaining why this clip is not valid.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rejection Note (Optional)</Label>
              <Textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              Mark as Not Valid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addClipDialogOpen} onOpenChange={setAddClipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Clip</DialogTitle>
            <DialogDescription>
              Add a new clip to the clipping area for review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Clip Number</Label>
              <Input
                type="number"
                value={newClipNumber}
                onChange={(e) => setNewClipNumber(e.target.value)}
                placeholder="Enter clip number (e.g., 1, 2, 3...)"
              />
            </div>
            <div>
              <Label>File Path / Location</Label>
              <Input
                value={newClipFilePath}
                onChange={(e) => setNewClipFilePath(e.target.value)}
                placeholder="/Projects/Client1/Episode_01/Clip_001.mp4"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddClipDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddClip}
              disabled={addClipMutation.isPending}
              className="bg-black text-white hover:bg-gray-900"
            >
              {addClipMutation.isPending ? "Adding..." : "Add Clip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
