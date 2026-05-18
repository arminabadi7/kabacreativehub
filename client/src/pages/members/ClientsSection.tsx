import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Eye, EyeOff, Instagram, Facebook, Youtube, Music, Phone, Mail, Calendar, DollarSign, FileText, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Client = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  tier: string | null;
  phoneNumber: string | null;
  instagramUsername: string | null;
  totalSpent: number;
  clientSince: string;
  contractFilePath: string | null;
  calculatedTotalSpent?: number;
};

type SocialMediaAccount = {
  id: string;
  clientId: string;
  accountName: string;
  username: string;
  password: string;
  email: string | null;
  emailPassword: string | null;
  platforms: string; // JSON array string
  profilePhoto: string | null;
  createdAt: string;
  updatedAt: string;
};

const PLATFORMS = [
  { 
    value: "instagram", 
    label: "Instagram", 
    icon: Instagram,
    color: "bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500",
    textColor: "text-white"
  },
  { 
    value: "tiktok", 
    label: "TikTok", 
    icon: Music,
    color: "bg-black",
    textColor: "text-white"
  },
  { 
    value: "youtube", 
    label: "YouTube", 
    icon: Youtube,
    color: "bg-red-600",
    textColor: "text-white"
  },
  { 
    value: "facebook", 
    label: "Facebook", 
    icon: Facebook,
    color: "bg-blue-600",
    textColor: "text-white"
  },
] as const;

const getPlatformInfo = (platform: string) => {
  return PLATFORMS.find((p) => p.value === platform) || PLATFORMS[0];
};

export default function ClientsSection() {
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreateClientDialogOpen, setIsCreateClientDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SocialMediaAccount | null>(null);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  
  // Check founder session
  const { data: founderSession } = useQuery({
    queryKey: ["/api/founder/session"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/founder/session", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          console.log("✅ Founder session found:", data);
          return data;
        }
        return null;
      } catch (e) {
        console.log("Founder session check failed (not a founder):", e);
        return null;
      }
    },
    retry: false,
  });
  const [clientForm, setClientForm] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    tier: "",
    phoneNumber: "",
    instagramUsername: "",
    teamId: "",
  });

  const [formData, setFormData] = useState({
    accountName: "",
    username: "",
    password: "",
    email: "",
    emailPassword: "",
    platforms: [] as string[], // Array of selected platforms
  });

  const { data: clients, isLoading: clientsLoading, refetch: refetchClients } = useQuery<Client[]>({
    queryKey: ["/api/clients/list"],
    queryFn: async () => {
      console.log("🔍 Fetching clients from /api/clients/list...");
      console.log("🔍 Founder session:", founderSession);
      console.log("🔍 Cookies:", document.cookie);
      const res = await fetch("/api/clients/list", { 
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("📡 Response status:", res.status, res.statusText);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Failed to fetch clients:", res.status, errorText);
        // If 401, try to get more info about the session
        if (res.status === 401) {
          console.warn("⚠️ Not authenticated (401)");
          console.warn("⚠️ Session cookies:", document.cookie);
          // Try to check founder session
          try {
            const founderCheck = await fetch("/api/founder/session", { credentials: "include" });
            const founderData = await founderCheck.text();
            console.log("🔍 Founder session check:", founderCheck.status, founderData);
            if (founderCheck.ok) {
              console.log("✅ Founder session exists but clients endpoint still returned 401");
              console.log("⚠️ This might be a session cookie issue");
            }
          } catch (e) {
            console.error("Error checking founder session:", e);
          }
          return [];
        }
        throw new Error("Failed to fetch clients");
      }
      const data = await res.json();
      console.log("✅ Fetched response:", data);
      console.log("📊 Is array?", Array.isArray(data));
      console.log("📊 Data length:", Array.isArray(data) ? data.length : "N/A");
      const clientsArray = Array.isArray(data) ? data : [];
      console.log("✅ Returning clients array with", clientsArray.length, "items");
      if (clientsArray.length > 0) {
        console.log("📋 Client IDs:", clientsArray.map(c => c.id));
        console.log("📋 First client:", clientsArray[0]);
      }
      return clientsArray;
    },
    staleTime: 0, // Always consider data stale, so it refetches when invalidated
    refetchOnWindowFocus: true,
    enabled: true, // Always try to fetch, even if founder session check fails
  });
  
  // Debug: Log clients whenever they change
  React.useEffect(() => {
    console.log("🔔 Clients data changed:", {
      isLoading: clientsLoading,
      clients: clients,
      clientsLength: clients?.length || 0,
      isArray: Array.isArray(clients),
    });
  }, [clients, clientsLoading]);

  const { data: teams } = useQuery({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const res = await fetch("/api/teams", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json();
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: typeof clientForm) => {
      const response = await apiRequest("POST", "/api/clients", {
        username: data.username,
        email: data.email,
        password: data.password,
        fullName: data.fullName || undefined,
        tier: data.tier || undefined,
        phoneNumber: data.phoneNumber || undefined,
        instagramUsername: data.instagramUsername || undefined,
        teamId: data.teamId && data.teamId.trim() !== "" ? data.teamId : undefined,
      });
      return await response.json();
    },
    onSuccess: async (data) => {
      console.log("✅ Client created successfully:", data);
      // Reset form first
      setClientForm({
        username: "",
        email: "",
        password: "",
        fullName: "",
        tier: "",
        phoneNumber: "",
        instagramUsername: "",
        teamId: "",
      });
      // Close dialog
      setIsCreateClientDialogOpen(false);
      // Show success toast
      toast({
        title: "Success!",
        description: "Client created successfully.",
      });
      // Immediately invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/clients/list"] });
      // Also call refetch directly
      setTimeout(async () => {
        try {
          console.log("🔄 Refetching clients list...");
          const result = await refetchClients();
          console.log("✅ Refetch completed!");
          console.log("📊 Number of clients:", result.data?.length || 0);
          if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            console.log("✅ Clients are now visible:", result.data.map(c => ({ id: c.id, username: c.username, email: c.email })));
          }
        } catch (error) {
          console.error("❌ Error during refetch:", error);
        }
      }, 100);
    },
    onError: (error: any) => {
      console.error("Error creating client:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive",
      });
    },
  });

  const { data: clientDetails, isLoading: clientDetailsLoading } = useQuery<Client>({
    queryKey: ["/api/clients", selectedClientId],
    enabled: !!selectedClientId,
  });

  const { data: socialAccounts, isLoading: accountsLoading } = useQuery<SocialMediaAccount[]>({
    queryKey: ["/api/clients", selectedClientId, "social-accounts"],
    enabled: !!selectedClientId,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    phoneNumber: "",
    instagramUsername: "",
    email: "",
    fullName: "",
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: { accountName: string; username: string; password: string; email: string; emailPassword: string; platforms: string[] }) => {
      const response = await apiRequest("POST", `/api/clients/${selectedClientId}/social-accounts`, {
        ...data,
        platforms: JSON.stringify(data.platforms),
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", selectedClientId, "social-accounts"] });
      setIsAddDialogOpen(false);
      setFormData({ accountName: "", username: "", password: "", email: "", emailPassword: "", platforms: [] });
      toast({ title: "Success!", description: "Social media account created successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create account", variant: "destructive" });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async (data: { accountName?: string; username?: string; password?: string; email?: string; emailPassword?: string; platforms?: string[] }) => {
      const updateData: any = { ...data };
      if (data.platforms) {
        updateData.platforms = JSON.stringify(data.platforms);
      }
      const response = await apiRequest("PATCH", `/api/social-accounts/${editingAccount?.id}`, updateData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", selectedClientId, "social-accounts"] });
      setIsEditDialogOpen(false);
      setEditingAccount(null);
      toast({ title: "Success!", description: "Account updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update account", variant: "destructive" });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await apiRequest("DELETE", `/api/social-accounts/${accountId}`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", selectedClientId, "social-accounts"] });
      setDeleteAccountId(null);
      toast({ title: "Success!", description: "Account deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete account", variant: "destructive" });
    },
  });

  const handleAddAccount = () => {
    if (!formData.accountName || !formData.username || !formData.password) {
      toast({ title: "Error", description: "Account name, username, and password are required", variant: "destructive" });
      return;
    }
    if (formData.platforms.length === 0) {
      toast({ title: "Error", description: "Please select at least one platform", variant: "destructive" });
      return;
    }
    createAccountMutation.mutate(formData);
  };

  const handleEditClick = (account: SocialMediaAccount) => {
    setEditingAccount(account);
    try {
      const platforms = JSON.parse(account.platforms || "[]");
      setFormData({
        accountName: account.accountName,
        username: account.username,
        password: account.password,
        email: account.email || "",
        emailPassword: account.emailPassword || "",
        platforms: Array.isArray(platforms) ? platforms : [],
      });
    } catch {
      // Fallback for old data format (single platform)
      setFormData({
        accountName: account.accountName,
        username: account.username,
        password: account.password,
        email: account.email || "",
        emailPassword: account.emailPassword || "",
        platforms: account.platforms ? [account.platforms] : [],
      });
    }
    setIsEditDialogOpen(true);
  };

  const handleUpdateAccount = () => {
    if (!editingAccount) return;
    if (!formData.accountName || !formData.username || !formData.password) {
      toast({ title: "Error", description: "Account name, username, and password are required", variant: "destructive" });
      return;
    }
    if (formData.platforms.length === 0) {
      toast({ title: "Error", description: "Please select at least one platform", variant: "destructive" });
      return;
    }
    updateAccountMutation.mutate(formData);
  };

  const togglePlatform = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const getAccountPlatforms = (account: SocialMediaAccount): string[] => {
    try {
      const platforms = JSON.parse(account.platforms || "[]");
      return Array.isArray(platforms) ? platforms : [];
    } catch {
      // Fallback for old data format (single platform)
      return account.platforms ? [account.platforms] : [];
    }
  };

  const handleDeleteClick = (accountId: string) => {
    setDeleteAccountId(accountId);
  };

  const handleDeleteConfirm = () => {
    if (deleteAccountId) {
      deleteAccountMutation.mutate(deleteAccountId);
    }
  };

  const togglePasswordVisibility = (accountId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  const selectedClient = clientDetails || clients?.find((c) => c.id === selectedClientId);

  const updateClientMutation = useMutation({
    mutationFn: async (data: { phoneNumber?: string; instagramUsername?: string; email?: string; fullName?: string }) => {
      const response = await apiRequest("PATCH", `/api/clients/${selectedClientId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", selectedClientId] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsEditingContact(false);
      toast({ title: "Success!", description: "Client information updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update client information", variant: "destructive" });
    },
  });

  const uploadContractMutation = useMutation({
    mutationFn: async (file: File) => {
      // For now, we'll use a simple approach: convert file to base64 or use a file path
      // In production, you'd upload to S3 or similar and get a URL
      const formData = new FormData();
      formData.append("file", file);
      
      // For now, we'll use the file name as the path
      // In production, you'd upload the file and get a URL
      const filePath = `/contracts/${selectedClientId}/${file.name}`;
      
      const response = await apiRequest("POST", `/api/clients/${selectedClientId}/contract`, {
        filePath,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", selectedClientId] });
      toast({ title: "Success!", description: "Contract uploaded successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to upload contract", variant: "destructive" });
    },
  });

  const uploadProfilePhotoMutation = useMutation({
    mutationFn: async ({ accountId, file }: { accountId: string; file: File }) => {
      const formData = new FormData();
      formData.append("profilePhoto", file);
      
      const response = await fetch(`/api/social-accounts/${accountId}/profile-photo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload photo");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", selectedClientId, "social-accounts"] });
      toast({ title: "Success!", description: "Profile photo uploaded successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to upload profile photo", variant: "destructive" });
    },
  });

  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhotoForAccount, setUploadingPhotoForAccount] = useState<string | null>(null);

  const handleProfilePhotoSelect = (accountId: string, file: File) => {
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      toast({ title: "Error", description: "Only PNG and JPG images are allowed", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "File size must be less than 5MB", variant: "destructive" });
      return;
    }
    setUploadingPhotoForAccount(accountId);
    uploadProfilePhotoMutation.mutate({ accountId, file });
  };

  const handleFileSelect = (file: File) => {
    uploadContractMutation.mutate(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getTimeAsClient = (clientSince: string) => {
    const since = new Date(clientSince);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - since.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) {
      return `${diffYears} year${diffYears > 1 ? 's' : ''}`;
    } else if (diffMonths > 0) {
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
  };

  const handleSaveContact = () => {
    updateClientMutation.mutate(contactForm);
  };

  const handleEditContact = () => {
    if (selectedClient) {
      setContactForm({
        phoneNumber: selectedClient.phoneNumber || "",
        instagramUsername: selectedClient.instagramUsername || "",
        email: selectedClient.email || "",
        fullName: selectedClient.fullName || "",
      });
      setIsEditingContact(true);
    }
  };

  if (clientsLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-gray-500">Loading clients...</div>
      </div>
    );
  }

  if (!selectedClientId) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Clients</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => refetchClients()}
              variant="outline"
              className="mr-2"
            >
              Refresh
            </Button>
            <Button 
              onClick={() => setIsCreateClientDialogOpen(true)}
              className="bg-black text-white hover:bg-gray-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Client
            </Button>
          </div>
          <Dialog open={isCreateClientDialogOpen} onOpenChange={setIsCreateClientDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Client</DialogTitle>
                <DialogDescription>Add a new client to the system</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="client-username">Username *</Label>
                  <Input
                    id="client-username"
                    value={clientForm.username}
                    onChange={(e) => setClientForm({ ...clientForm, username: e.target.value })}
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <Label htmlFor="client-email">Email *</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <Label htmlFor="client-password">Password *</Label>
                  <Input
                    id="client-password"
                    type="password"
                    value={clientForm.password}
                    onChange={(e) => setClientForm({ ...clientForm, password: e.target.value })}
                    placeholder="Enter password (min 8 characters)"
                  />
                </div>
                <div>
                  <Label htmlFor="client-fullname">Full Name</Label>
                  <Input
                    id="client-fullname"
                    value={clientForm.fullName}
                    onChange={(e) => setClientForm({ ...clientForm, fullName: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="client-tier">Tier</Label>
                  <Select value={clientForm.tier} onValueChange={(value) => setClientForm({ ...clientForm, tier: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Growth">Growth</SelectItem>
                      <SelectItem value="Domination">Domination</SelectItem>
                      <SelectItem value="Empire">Empire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="client-phone">Phone Number</Label>
                  <Input
                    id="client-phone"
                    value={clientForm.phoneNumber}
                    onChange={(e) => setClientForm({ ...clientForm, phoneNumber: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="client-instagram">Instagram Username</Label>
                  <Input
                    id="client-instagram"
                    value={clientForm.instagramUsername}
                    onChange={(e) => setClientForm({ ...clientForm, instagramUsername: e.target.value })}
                    placeholder="Enter Instagram username"
                  />
                </div>
                <div>
                  <Label htmlFor="client-team">Team</Label>
                  <Select value={clientForm.teamId || undefined} onValueChange={(value) => setClientForm({ ...clientForm, teamId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams?.map((team: any) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateClientDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!clientForm.username || !clientForm.email || !clientForm.password) {
                      toast({
                        title: "Error",
                        description: "Username, email, and password are required",
                        variant: "destructive",
                      });
                      return;
                    }
                    createClientMutation.mutate(clientForm);
                  }}
                  disabled={createClientMutation.isPending}
                  className="bg-black text-white hover:bg-gray-900"
                >
                  {createClientMutation.isPending ? "Creating..." : "Create Client"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-3">
          {clientsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading clients...</div>
          ) : clients && Array.isArray(clients) && clients.length > 0 ? (
            clients.map((client) => (
              <Card
                key={client.id}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setSelectedClientId(client.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{client.fullName || client.username}</h3>
                      <p className="text-sm text-gray-600">{client.email}</p>
                      {client.tier && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {client.tier}
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      View Accounts →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div>No clients found</div>
              <div className="text-xs mt-2 text-gray-400">
                {clientsLoading ? "Loading..." : 
                 clients === undefined ? "Data not loaded yet" :
                 clients === null ? "Data is null" :
                 Array.isArray(clients) ? `Array with ${clients.length} items` :
                 `Data type: ${typeof clients}`}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (clientDetailsLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-gray-500">Loading client details...</div>
      </div>
    );
  }

  const totalSpent = selectedClient?.calculatedTotalSpent || selectedClient?.totalSpent || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => setSelectedClientId(null)} className="mb-2">
            ← Back to Clients
          </Button>
          <h1 className="text-3xl font-bold">
            {selectedClient?.fullName || selectedClient?.username}
          </h1>
        </div>
        <Button
          onClick={() => {
            setFormData({ accountName: "", username: "", password: "", email: "", emailPassword: "", platforms: [] });
            setIsAddDialogOpen(true);
          }}
          className="bg-black text-white hover:bg-gray-900"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Client Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <Label className="text-xs text-gray-500">Client Since</Label>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {selectedClient?.clientSince ? formatDate(selectedClient.clientSince) : "N/A"}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {selectedClient?.clientSince ? getTimeAsClient(selectedClient.clientSince) : ""}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <Label className="text-xs text-gray-500">Total Spent</Label>
            </div>
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(totalSpent)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <Label className="text-xs text-gray-500">Tier</Label>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {selectedClient?.tier || "Not set"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <Label className="text-xs text-gray-500">Email</Label>
            </div>
            <div className="text-sm font-medium text-gray-900 truncate">
              {selectedClient?.email || "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contact Information</CardTitle>
            {!isEditingContact ? (
              <Button variant="outline" size="sm" onClick={handleEditContact}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditingContact(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveContact} disabled={updateClientMutation.isPending} className="bg-black text-white hover:bg-gray-900">
                  {updateClientMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Phone Number</Label>
              {isEditingContact ? (
                <Input
                  value={contactForm.phoneNumber}
                  onChange={(e) => setContactForm({ ...contactForm, phoneNumber: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {selectedClient?.phoneNumber || "Not set"}
                  </span>
                </div>
              )}
            </div>
            <div>
              <Label>Instagram Username</Label>
              {isEditingContact ? (
                <Input
                  value={contactForm.instagramUsername}
                  onChange={(e) => setContactForm({ ...contactForm, instagramUsername: e.target.value })}
                  placeholder="@username"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Instagram className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {selectedClient?.instagramUsername ? `@${selectedClient.instagramUsername}` : "Not set"}
                  </span>
                </div>
              )}
            </div>
            <div>
              <Label>Email</Label>
              {isEditingContact ? (
                <Input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="client@example.com"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {selectedClient?.email || "Not set"}
                  </span>
                </div>
              )}
            </div>
            <div>
              <Label>Full Name</Label>
              {isEditingContact ? (
                <Input
                  value={contactForm.fullName}
                  onChange={(e) => setContactForm({ ...contactForm, fullName: e.target.value })}
                  placeholder="John Doe"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-gray-900">
                    {selectedClient?.fullName || "Not set"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Contract</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedClient?.contractFilePath ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {selectedClient.contractFilePath.split('/').pop() || "Contract File"}
                    </div>
                    <div className="text-xs text-gray-500">Contract uploaded</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // In production, this would download the file
                    window.open(selectedClient.contractFilePath || '', '_blank');
                  }}
                >
                  View
                </Button>
              </div>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop a new contract file here, or
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadContractMutation.isPending}
                >
                  {uploadContractMutation.isPending ? "Uploading..." : "Choose File"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileInputChange}
                  accept=".pdf,.doc,.docx"
                />
              </div>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop a contract file here, or
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadContractMutation.isPending}
              >
                {uploadContractMutation.isPending ? "Uploading..." : "Choose File"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInputChange}
                accept=".pdf,.doc,.docx"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Media Accounts Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Social Media Accounts</h2>

        {accountsLoading ? (
        <div className="text-center py-8 text-gray-500">Loading accounts...</div>
      ) : socialAccounts && socialAccounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {socialAccounts.map((account) => {
            const isPasswordVisible = showPasswords[account.id];
            const accountPlatforms = getAccountPlatforms(account);

            return (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative group">
                        {account.profilePhoto ? (
                          <img
                            src={account.profilePhoto}
                            alt={`${account.accountName} profile`}
                            className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                            data-testid={`img-profile-${account.id}`}
                          />
                        ) : (
                          <div 
                            className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-gray-200"
                            data-testid={`placeholder-profile-${account.id}`}
                          >
                            <span className="text-gray-500 text-lg font-medium">
                              {account.accountName?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                          </div>
                        )}
                        <label 
                          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                          htmlFor={`photo-upload-${account.id}`}
                        >
                          <Upload className="w-5 h-5 text-white" />
                        </label>
                        <input
                          id={`photo-upload-${account.id}`}
                          type="file"
                          className="hidden"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleProfilePhotoSelect(account.id, file);
                            }
                          }}
                          data-testid={`input-photo-${account.id}`}
                        />
                        {uploadProfilePhotoMutation.isPending && uploadingPhotoForAccount === account.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-lg">{account.accountName}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(account)}
                        className="w-8 h-8"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(account.id)}
                        className="w-8 h-8 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-500">Username</Label>
                    <p className="text-sm font-medium text-gray-900">{account.username}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Password</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 font-mono flex-1">
                        {isPasswordVisible ? account.password : "••••••••"}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePasswordVisibility(account.id)}
                        className="w-8 h-8"
                      >
                        {isPasswordVisible ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {account.email && (
                    <>
                      <div>
                        <Label className="text-xs text-gray-500">Email</Label>
                        <p className="text-sm font-medium text-gray-900 font-mono">{account.email}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Email Password</Label>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 font-mono flex-1">
                            {showPasswords[`email-${account.id}`] ? account.emailPassword : "••••••••"}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePasswordVisibility(`email-${account.id}`)}
                            className="w-8 h-8"
                          >
                            {showPasswords[`email-${account.id}`] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <Label className="text-xs text-gray-500 mb-2 block">Platforms</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {accountPlatforms.map((platform) => {
                        const platformInfo = getPlatformInfo(platform);
                        return (
                          <span
                            key={platform}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${platformInfo.color} ${platformInfo.textColor} shadow-sm`}
                          >
                            {platformInfo.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">No social media accounts yet</p>
            <Button
              onClick={() => {
                setFormData({ accountName: "", username: "", password: "", email: "", emailPassword: "", platforms: [] });
                setIsAddDialogOpen(true);
              }}
              className="bg-black text-white hover:bg-gray-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Account
            </Button>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Add Account Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Social Media Account</DialogTitle>
            <DialogDescription>Add a new social media account for this client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Account Name</Label>
              <Input
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder="e.g., Main Instagram Account"
              />
            </div>
            <div>
              <Label>Platforms</Label>
              <p className="text-xs text-gray-500 mb-2">Select one or more platforms</p>
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => {
                    const allPlatforms = PLATFORMS.map((p) => p.value);
                    const allSelected = allPlatforms.every((p) => formData.platforms.includes(p));
                    if (allSelected) {
                      // If all are selected, deselect all
                      setFormData({ ...formData, platforms: [] });
                    } else {
                      // Select all platforms
                      setFormData({ ...formData, platforms: allPlatforms });
                    }
                  }}
                  className={`w-full px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    formData.platforms.length === PLATFORMS.length
                      ? "bg-gray-900 text-white border-transparent"
                      : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  {formData.platforms.length === PLATFORMS.length ? "✓ All Platforms Selected" : "Select All Platforms"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = formData.platforms.includes(platform.value);
                  return (
                    <button
                      key={platform.value}
                      type="button"
                      onClick={() => togglePlatform(platform.value)}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? `${platform.color} ${platform.textColor} border-transparent`
                          : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{platform.label}</span>
                      {isSelected && (
                        <span className="ml-auto text-xs">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Username</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-gray-600 mb-3">Email Account (used to create these social media accounts)</p>
              <div className="space-y-3">
                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label>Email Password</Label>
                  <Input
                    type="password"
                    value={formData.emailPassword}
                    onChange={(e) => setFormData({ ...formData, emailPassword: e.target.value })}
                    placeholder="Enter email password"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAccount} disabled={createAccountMutation.isPending} className="bg-black text-white hover:bg-gray-900">
              {createAccountMutation.isPending ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Social Media Account</DialogTitle>
            <DialogDescription>Update the account information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Account Name</Label>
              <Input
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder="e.g., Main Instagram Account"
              />
            </div>
            <div>
              <Label>Platforms</Label>
              <p className="text-xs text-gray-500 mb-2">Select one or more platforms</p>
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => {
                    const allPlatforms = PLATFORMS.map((p) => p.value);
                    const allSelected = allPlatforms.every((p) => formData.platforms.includes(p));
                    if (allSelected) {
                      // If all are selected, deselect all
                      setFormData({ ...formData, platforms: [] });
                    } else {
                      // Select all platforms
                      setFormData({ ...formData, platforms: allPlatforms });
                    }
                  }}
                  className={`w-full px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    formData.platforms.length === PLATFORMS.length
                      ? "bg-gray-900 text-white border-transparent"
                      : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  {formData.platforms.length === PLATFORMS.length ? "✓ All Platforms Selected" : "Select All Platforms"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = formData.platforms.includes(platform.value);
                  return (
                    <button
                      key={platform.value}
                      type="button"
                      onClick={() => togglePlatform(platform.value)}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? `${platform.color} ${platform.textColor} border-transparent`
                          : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{platform.label}</span>
                      {isSelected && (
                        <span className="ml-auto text-xs">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Username</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-gray-600 mb-3">Email Account (used to create these social media accounts)</p>
              <div className="space-y-3">
                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label>Email Password</Label>
                  <Input
                    type="password"
                    value={formData.emailPassword}
                    onChange={(e) => setFormData({ ...formData, emailPassword: e.target.value })}
                    placeholder="Enter email password"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAccount} disabled={updateAccountMutation.isPending} className="bg-black text-white hover:bg-gray-900">
              {updateAccountMutation.isPending ? "Updating..." : "Update Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAccountId} onOpenChange={(open) => !open && setDeleteAccountId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the social media account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAccountId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

