import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TemplateEditPage from "./TemplateEditPage";

type Template = {
  id: string;
  name: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  videoDuration: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function TemplatesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    description: "",
    videoUrl: "",
    videoDuration: "0:01:00",
  });

  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await apiRequest("DELETE", `/api/templates/${templateId}`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Success!",
        description: "Template deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/templates", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsCreateDialogOpen(false);
      setFormData({ name: "", title: "", description: "", videoUrl: "", videoDuration: "0:01:00" });
      toast({
        title: "Success!",
        description: "Template created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const response = await apiRequest("PUT", `/api/templates/${data.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
      setFormData({ name: "", title: "", description: "", videoUrl: "", videoDuration: "0:01:00" });
      toast({
        title: "Success!",
        description: "Template updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!formData.name.trim() || !formData.title.trim()) {
      toast({
        title: "Error",
        description: "Name and Title are required",
        variant: "destructive",
      });
      return;
    }
    createTemplateMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (selectedTemplate) {
      updateTemplateMutation.mutate({ ...formData, id: selectedTemplate.id });
    }
  };

  const handleEditClick = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      title: template.title,
      description: template.description || "",
      videoUrl: template.videoUrl || "",
      videoDuration: template.videoDuration || "0:01:00",
    });
    setIsEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Updated today";
    if (diffDays === 1) return "Updated 1 day ago";
    if (diffDays < 7) return `Updated ${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (selectedTemplate && isEditDialogOpen) {
    return (
      <TemplateEditPage
        template={selectedTemplate}
        onBack={() => {
          setIsEditDialogOpen(false);
          setSelectedTemplate(null);
        }}
      />
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Templates</h1>
      <p className="text-sm text-gray-600 mb-6">
        These templates are available when creating issues for any team in the workspace.
      </p>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Issue templates</h2>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                {templates?.length || 0} Issue templates
              </h3>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                variant="ghost"
                size="icon"
                className="w-8 h-8"
              >
                <Plus className="w-5 h-5 text-gray-700" />
              </Button>
            </div>

            <div className="space-y-0">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading templates...</div>
              ) : templates && templates.length > 0 ? (
                templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50 group cursor-pointer"
                    onClick={() => handleEditClick(template)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                      <div>
                        <div className="font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatDate(template.updatedAt)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 w-8 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this template?")) {
                          deleteTemplateMutation.mutate(template.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No templates yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Issue Template</DialogTitle>
            <DialogDescription>
              Create a new template for issues
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Template name"
              />
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Issue title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add description..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Video URL</Label>
                <Input
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="Enter video URL"
                />
              </div>
              <div>
                <Label>Video Duration (seconds)</Label>
                <Input
                  value={formData.videoDuration}
                  onChange={(e) => setFormData({ ...formData, videoDuration: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createTemplateMutation.isPending}>
              {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


