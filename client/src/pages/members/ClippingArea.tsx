import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Plus } from "lucide-react";
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

type Template = {
  id: string;
  name: string;
  title: string;
  description: string | null;
  teamId: string | null;
};

export default function ClippingArea() {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [addClipDialogOpen, setAddClipDialogOpen] = useState(false);
  const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);
  const [templateSelectDialogOpen, setTemplateSelectDialogOpen] = useState(false);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [newClipNumber, setNewClipNumber] = useState("");
  const [newClipFilePath, setNewClipFilePath] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectFileLocation, setNewProjectFileLocation] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: templates } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  const { data: pendingClips, isLoading: isLoadingPending } = useQuery<Clip[]>({
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

  const { data: validClips, isLoading: isLoadingValid } = useQuery<Clip[]>({
    queryKey: ["/api/clips/valid", selectedProjectId],
    queryFn: async () => {
      const url = selectedProjectId 
        ? `/api/clips/valid?projectId=${selectedProjectId}`
        : "/api/clips/valid";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clips");
      return res.json();
    },
    enabled: !!selectedProjectId,
  });

  const { data: invalidClips, isLoading: isLoadingInvalid } = useQuery<Clip[]>({
    queryKey: ["/api/clips/invalid", selectedProjectId],
    queryFn: async () => {
      const url = selectedProjectId 
        ? `/api/clips/invalid?projectId=${selectedProjectId}`
        : "/api/clips/invalid";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clips");
      return res.json();
    },
    enabled: !!selectedProjectId,
  });

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);

  const validateClipMutation = useMutation({
    mutationFn: async (data: { clipId: string; templateId?: string }) => {
      const response = await apiRequest("PATCH", `/api/clips/${data.clipId}/validate`, {
        status: "valid",
        templateId: data.templateId,
      });
      return await response.json();
    },
    onSuccess: async (data) => {
      console.log("[ClippingArea] Clip validated, response data:", data);
      
      // Invalidate clips queries
      queryClient.invalidateQueries({ queryKey: ["/api/clips/pending", selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/clips/valid", selectedProjectId] });
      
      // Invalidate issues query - this will cause the issues list to refetch
      await queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "issues"] });
      
      // If an issue was created, invalidate its tasks query
      if (data?.issueId) {
        console.log("[ClippingArea] Issue created with ID:", data.issueId);
        // Wait a bit to ensure tasks are fully created on the server
        setTimeout(() => {
          console.log("[ClippingArea] Invalidating task queries for issue:", data.issueId);
          queryClient.invalidateQueries({ queryKey: ["/api/issues", data.issueId, "tasks"] });
          // Invalidate all issue task queries to ensure fresh data
          queryClient.invalidateQueries({ 
            predicate: (query) => {
              return Array.isArray(query.queryKey) &&
                     query.queryKey[0] === "/api/issues" && 
                     query.queryKey[2] === "tasks";
            }
          });
        }, 1000); // 1 second delay to ensure server has finished creating tasks
      }
      
      setTemplateSelectDialogOpen(false);
      setSelectedClip(null);
      setSelectedTemplateId("");
      toast({
        title: "Success!",
        description: "Clip validated and issue created in backlog.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to validate clip",
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
      queryClient.invalidateQueries({ queryKey: ["/api/clips/invalid", selectedProjectId] });
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
    mutationFn: async (data: { clipNumber: number; filePath?: string }) => {
      if (!selectedProjectId) {
        throw new Error("Please select a project first");
      }
      const requestBody: any = {
        projectId: selectedProjectId,
        clipNumber: data.clipNumber,
      };
      // Only include filePath if it's provided and not empty
      // If empty or not provided, don't include it (backend will handle as null)
      if (data.filePath && data.filePath.trim()) {
        requestBody.filePath = data.filePath.trim();
      }
      // If filePath is empty, don't include it - backend will set to null
      const response = await apiRequest("POST", "/api/clips", requestBody);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clips/pending", selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/clips/valid", selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/clips/invalid", selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "clips"] });
      setAddClipDialogOpen(false);
      setNewClipNumber("");
      setNewClipFilePath("");
      toast({
        title: "Success!",
        description: "Clip added successfully.",
      });
    },
    onError: async (error: any) => {
      console.error("Add clip error:", error);
      console.error("Error type:", typeof error);
      console.error("Error message:", error?.message);
      
      // Try to extract error message from response
      let errorMessage = "Failed to add clip";
      
      if (error?.message) {
        // Error format from apiRequest is usually "500: {\"error\":\"...\"}"
        const message = error.message;
        console.error("Raw error message:", message);
        
        // Try to extract JSON from the message
        const jsonMatch = message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const errorObj = JSON.parse(jsonMatch[0]);
            console.error("Parsed error object:", errorObj);
            errorMessage = errorObj.error || errorObj.details || errorObj.message || errorMessage;
            if (errorObj.code) {
              errorMessage += ` (Code: ${errorObj.code})`;
            }
          } catch (parseError) {
            console.error("Failed to parse error JSON:", parseError);
            // Fall back to extracting text after colon
            const parts = message.split(":");
            if (parts.length > 1) {
              errorMessage = parts.slice(1).join(":").trim();
            } else {
              errorMessage = message;
            }
          }
        } else {
          // No JSON found, use the message as-is or extract after colon
          if (message.includes(":")) {
            const parts = message.split(":");
            errorMessage = parts.slice(1).join(":").trim() || message;
          } else {
            errorMessage = message;
          }
        }
      }
      
      // Show full error in console for debugging
      console.error("Full error object:", error);
      console.error("Final error message to display:", errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
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

  const handleApprove = (clip: Clip) => {
    setSelectedClip(clip);
    setTemplateSelectDialogOpen(true);
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

  const handleValidateWithTemplate = () => {
    if (selectedClip && selectedTemplateId) {
      validateClipMutation.mutate({
        clipId: selectedClip.id,
        templateId: selectedTemplateId,
      });
    } else {
      toast({
        title: "Error",
        description: "Please select a template",
        variant: "destructive",
      });
    }
  };

  const handleAddClip = () => {
    const clipNumber = parseInt(newClipNumber);
    if (!clipNumber) {
      toast({
        title: "Error",
        description: "Clip number is required",
        variant: "destructive",
      });
      return;
    }
    addClipMutation.mutate({
      clipNumber,
      filePath: newClipFilePath.trim() || "",
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

  const renderClipCard = (clip: Clip, showActions: boolean = true) => (
    <Card key={clip.id} className="border border-gray-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Left: Number Circle */}
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xl text-gray-700 flex-shrink-0">
            {clip.clipNumber}
          </div>
          
          {/* Middle: Clip Info */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 mb-1">Clip {clip.clipNumber}</div>
            <div className="text-sm text-gray-600 mb-1">File Path / Location</div>
            <div className="text-sm text-gray-900 font-mono">{clip.filePath}</div>
          </div>
          
          {/* Right: Action Buttons */}
          {showActions && (
            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={() => handleApprove(clip)}
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                disabled={validateClipMutation.isPending}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Valid
              </Button>
              <Button
                onClick={() => handleRejectClick(clip)}
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
                disabled={rejectClipMutation.isPending}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Not Valid
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // If no project selected, show project selection
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
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Clipping Area</h1>
          <p className="text-gray-600">
            Review and approve clips that were chosen and highlighted in the Premiere project.
          </p>
        </div>
        <Button 
          onClick={() => setAddClipDialogOpen(true)}
          className="bg-black text-white hover:bg-gray-900 rounded-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Clip
        </Button>
      </div>

      {/* Pending Review Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Pending Review ({pendingClips?.length || 0})
        </h2>
        <div className="space-y-3">
          {isLoadingPending ? (
            <div className="text-center py-8 text-gray-500">Loading clips...</div>
          ) : pendingClips && pendingClips.length > 0 ? (
            pendingClips.map((clip) => renderClipCard(clip, true))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No clips pending review
            </div>
          )}
        </div>
      </div>

      {/* Valid Clips Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Valid Clips ({validClips?.length || 0})
        </h2>
        <div className="space-y-3">
          {isLoadingValid ? (
            <div className="text-center py-8 text-gray-500">Loading clips...</div>
          ) : validClips && validClips.length > 0 ? (
            validClips.map((clip) => (
              <Card key={clip.id} className="border border-green-200 bg-green-50 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center font-bold text-xl text-green-700 flex-shrink-0">
                      {clip.clipNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 mb-1">Clip {clip.clipNumber}</div>
                      <div className="text-sm text-gray-600 mb-1">File Path / Location</div>
                      <div className="text-sm text-gray-900 font-mono">{clip.filePath}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No valid clips
            </div>
          )}
        </div>
      </div>

      {/* Not Valid Clips Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Not Valid Clips ({invalidClips?.length || 0})
        </h2>
        <div className="space-y-3">
          {isLoadingInvalid ? (
            <div className="text-center py-8 text-gray-500">Loading clips...</div>
          ) : invalidClips && invalidClips.length > 0 ? (
            invalidClips.map((clip) => (
              <Card key={clip.id} className="border border-red-200 bg-red-50 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center font-bold text-xl text-red-700 flex-shrink-0">
                      {clip.clipNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 mb-1">Clip {clip.clipNumber}</div>
                      <div className="text-sm text-gray-600 mb-1">File Path / Location</div>
                      <div className="text-sm text-gray-900 font-mono">{clip.filePath}</div>
                      {clip.rejectionNote && (
                        <div className="text-sm text-red-600 mt-2">Note: {clip.rejectionNote}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No invalid clips
            </div>
          )}
        </div>
      </div>

      {/* Template Selection Dialog */}
      <Dialog open={templateSelectDialogOpen} onOpenChange={setTemplateSelectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Template</DialogTitle>
            <DialogDescription>
              Choose an issue template to create an issue for this clip in the project board.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateSelectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleValidateWithTemplate}
              disabled={!selectedTemplateId || validateClipMutation.isPending}
              className="bg-black text-white hover:bg-gray-900"
            >
              {validateClipMutation.isPending ? "Creating..." : "Create Issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
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

      {/* Add Clip Dialog */}
      <Dialog open={addClipDialogOpen} onOpenChange={setAddClipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Clip</DialogTitle>
            <DialogDescription>
              Add a new clip to the clipping area for review.
            </DialogDescription>
          </DialogHeader>
          {!selectedProjectId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800">
                Please select a project first before adding a clip.
              </p>
            </div>
          )}
          <div className="space-y-4 py-4">
            <div>
              <Label>Clip Number</Label>
              <Input
                type="number"
                value={newClipNumber}
                onChange={(e) => setNewClipNumber(e.target.value)}
                placeholder="Enter clip number (e.g., 1, 2, 3...)"
                disabled={!selectedProjectId}
              />
            </div>
            <div>
              <Label>File Path / Location (Optional)</Label>
              <Input
                value={newClipFilePath}
                onChange={(e) => setNewClipFilePath(e.target.value)}
                placeholder="/Projects/Client1/Episode_01/Clip_001.mp4"
                disabled={!selectedProjectId}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddClipDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddClip}
              disabled={addClipMutation.isPending || !selectedProjectId}
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
