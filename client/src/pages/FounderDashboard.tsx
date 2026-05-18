import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ArrowLeft, 
  LogOut, 
  Plus,
  Users,
  DollarSign,
  UserPlus,
  Calendar,
  FolderOpen,
  FileText,
  Scissors,
  Settings,
  LayoutGrid,
  Building2,
  HelpCircle,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Search,
  Briefcase,
  Upload
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import MembersDashboard from "./MembersDashboard";
import FinancesPage from "./finances/FinancesPage";

type AffiliateWithStats = {
  id: string;
  username: string;
  email: string;
  fullName?: string | null;
  country?: string | null;
  telegramAccount?: string | null;
  phoneNumber?: string | null;
  instagramUsername?: string | null;
  paymentMethod?: string;
  paymentDetails?: string;
  createdAt: Date;
  totalClicks: number;
  totalConversions: number;
  totalCommission: number;
  currentBalance?: number;
  totalPaid?: number;
};

type Booking = {
  id: string;
  attendeeName: string;
  attendeeEmail: string;
  eventTime: string | Date;
  referralId?: string | null;
  affiliateUsername?: string | null;
  tier?: string | null;
  status: string;
  saleStatus?: string | null;
  commissionAmount?: number | null;
  commissionPaid?: boolean;
  createdAt: string | Date;
  confirmedAt?: string | Date | null;
  soldAt?: string | Date | null;
};

type Member = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  role: string;
  passwordHash?: string;
  createdAt: Date | string;
  mustChangePassword?: boolean | null;
};

type Client = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  tier?: string;
  offerLink?: string | null;
  createdAt: string;
  passwordHash?: string;
};

const founderLoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const createUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().optional(),
  accountType: z.enum(["member", "client", "affiliate"]),
  role: z.enum(["admin", "manager", "editor", "clipper", "member"]).optional(),
});

const createClientSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().optional(),
});

export default function FounderDashboard() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoginView, setIsLoginView] = useState(true);
  
  // Get section from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const urlSection = urlParams.get("section");
  const [activeSection, setActiveSection] = useState<string | null>(urlSection || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [createUserDialogContext, setCreateUserDialogContext] = useState<"members" | "user-management" | "clients" | null>(null);
  const [createClientDialogOpen, setCreateClientDialogOpen] = useState(false);
  const [showFounderPassword, setShowFounderPassword] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>({}); // Store passwords for all user types
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateWithStats | null>(null);
  const [affiliateDetailDialogOpen, setAffiliateDetailDialogOpen] = useState(false);
  
  // Members section state (must be at top level for hooks)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberDetailDialogOpen, setMemberDetailDialogOpen] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  
  // Update section when URL changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");
    const openDialog = params.get("openDialog");
    const accountType = params.get("accountType");
    
    if (section) {
      setActiveSection(section);
    }
    
    // If section is user-management and openDialog param exists, open the dialog
    if (section === "user-management" && openDialog === "create-user") {
      // Set form defaults based on accountType param
      const defaultAccountType = accountType === "member" || accountType === "client" || accountType === "affiliate" 
        ? accountType 
        : "member";
      
      const resetData: any = {
        username: "",
        email: "",
        password: "",
        fullName: "",
        accountType: defaultAccountType,
      };
      if (defaultAccountType === "member") {
        resetData.role = "member";
      }
      createUserForm.reset(resetData);
      setCreateUserDialogContext("user-management");
      setCreateUserDialogOpen(true);
      
      // Clean up URL params after opening dialog
      const newParams = new URLSearchParams(window.location.search);
      newParams.delete("openDialog");
      newParams.delete("accountType");
      const newUrl = window.location.pathname + (newParams.toString() ? `?${newParams.toString()}` : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, [location]);

  const loginForm = useForm({
    resolver: zodResolver(founderLoginSchema),
    defaultValues: {
      password: "",
    },
  });

  const createUserForm = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
      accountType: "member",
      role: "member",
    },
  });

  const createClientForm = useForm({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
    },
  });

  // Auto-suggest username from email
  const emailValue = createUserForm.watch("email");
  useEffect(() => {
    if (emailValue && !createUserForm.getValues("username")) {
      // Extract username from email (part before @)
      const suggestedUsername = emailValue.split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .substring(0, 30);
      if (suggestedUsername) {
        createUserForm.setValue("username", suggestedUsername);
      }
    }
  }, [emailValue]);

  // Auto-suggest username from email for client form
  const clientEmailValue = createClientForm.watch("email");
  useEffect(() => {
    if (clientEmailValue && !createClientForm.getValues("username")) {
      // Extract username from email (part before @)
      const suggestedUsername = clientEmailValue.split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .substring(0, 30);
      if (suggestedUsername) {
        createClientForm.setValue("username", suggestedUsername);
      }
    }
  }, [clientEmailValue]);

  const { data: founderSession, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/founder/session"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/founder/session", {
          credentials: "include", // Important: include cookies
        });
        if (response.ok) {
          return await response.json();
        }
        return null;
      } catch {
        return null;
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes to keep session alive
    retry: false,
  });

  const { data: affiliates, isLoading: affiliatesLoading } = useQuery<
    AffiliateWithStats[]
  >({
    queryKey: ["/api/founder/affiliates"],
    enabled: !!founderSession,
  });

  const { data: bookings, isLoading: bookingsLoading, refetch: refetchBookings } = useQuery<Booking[]>({
    queryKey: ["/api/founder/bookings"],
    enabled: !!founderSession,
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: calendarEvents, isLoading: calendarLoading } = useQuery<any[]>({
    queryKey: ["/api/founder/calendar-events"],
    enabled: !!founderSession,
  });

  const { data: members } = useQuery<Member[]>({
    queryKey: ["/api/members/list"],
    enabled: !!founderSession && (activeSection === "user-management" || activeSection === "members"),
  });

  // Fetch member stats for all members (for points display)
  const { data: allMemberStats } = useQuery<Record<string, { currentBalance: number; pointsEarned: number; pointsPaid: number }>>({
    queryKey: ["/api/members/all-stats"],
    queryFn: async () => {
      if (!members || members.length === 0) return {};
      const statsMap: Record<string, any> = {};
      await Promise.all(
        members.map(async (member) => {
          try {
            const res = await fetch(`/api/members/${member.id}/stats`, { credentials: "include" });
            if (res.ok) {
              const stats = await res.json();
              statsMap[member.id] = stats;
            }
          } catch (error) {
            console.error(`Error fetching stats for member ${member.id}:`, error);
          }
        })
      );
      return statsMap;
    },
    enabled: !!founderSession && !!members && members.length > 0 && (activeSection === "user-management" || activeSection === "members"),
  });

  const { data: clients } = useQuery<Array<Client & {
    totalSpent: number;
    durationText: string;
    nextPaymentDate: string | null;
  }>>({
    queryKey: ["/api/clients/list"],
    enabled: !!founderSession && (activeSection === "bookings-clients" || activeSection === "clients"),
  });

  // Fetch affiliates with password hashes for User Management
  const { data: allAffiliatesForManagement, isLoading: allAffiliatesLoading } = useQuery<Array<AffiliateWithStats & { passwordHash?: string }>>({
    queryKey: ["/api/founder/affiliates/all"],
    enabled: !!founderSession,
  });

  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [bookingEdits, setBookingEdits] = useState<Record<string, { affiliateUsername?: string; tier?: string; status?: string }>>({});
  // Store plain text passwords for newly created affiliates (affiliateId -> password)
  const [affiliatePasswords, setAffiliatePasswords] = useState<Record<string, string>>({});
  
  // Clients section state
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<{ clientId: string; accountId: string } | null>(null);
  const [addingAccount, setAddingAccount] = useState<string | null>(null);
  const [deleteConfirmAccount, setDeleteConfirmAccount] = useState<{ clientId: string; accountId: string; accountName: string } | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [accountForm, setAccountForm] = useState({ username: "", password: "", accountName: "", email: "", emailPassword: "" });

  // Fetch accounts for selected client (must be at top level)
  const { data: accounts, refetch: refetchAccounts } = useQuery<any[]>({
    queryKey: ["/api/founder/clients", selectedClientId, "social-accounts"],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const response = await apiRequest("GET", `/api/founder/clients/${selectedClientId}/social-accounts`);
      return await response.json();
    },
    enabled: !!selectedClientId && !!founderSession,
  });
  
  // Fetch selected client details
  const { data: selectedClient, isLoading: selectedClientLoading, refetch: refetchSelectedClient } = useQuery<Client & { nextPaymentDate?: string | null; nextPaymentAmount?: number | null; nextPaymentNote?: string | null }>({
    queryKey: ["/api/founder/clients", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null;
      const response = await apiRequest("GET", `/api/founder/clients/${selectedClientId}`);
      return await response.json();
    },
    enabled: !!selectedClientId && !!founderSession,
  });

  // Fetch payment plans for selected client (must be at top level, not inside renderClientsSection)
  const { data: paymentPlans, refetch: refetchPaymentPlans } = useQuery<Array<any>>({
    queryKey: ["/api/founder/clients", selectedClientId, "payment-plans"],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const response = await apiRequest("GET", `/api/founder/clients/${selectedClientId}/payment-plans`);
      return await response.json();
    },
    enabled: !!selectedClientId && !!founderSession,
  });

  // Account management mutations (must be at top level)
  const createAccountMutation = useMutation({
    mutationFn: async (data: { clientId: string; username: string; password: string; platforms: string[]; accountName?: string; email?: string; emailPassword?: string }) => {
      const response = await apiRequest("POST", `/api/founder/clients/${data.clientId}/social-accounts`, {
        username: data.username,
        password: data.password,
        platforms: data.platforms,
        accountName: data.accountName || null,
        email: data.email || null,
        emailPassword: data.emailPassword || null,
      });
      return await response.json();
    },
    onSuccess: () => {
      refetchAccounts();
      setAddingAccount(null);
      setSelectedPlatforms([]);
      setAccountForm({ username: "", password: "", accountName: "", email: "", emailPassword: "" });
      toast({
        title: "Success!",
        description: "Account created successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Error creating account:", error);
      let errorMessage = "Failed to create account";
      try {
        if (error?.responseText) {
          const errorObj = JSON.parse(error.responseText);
          errorMessage = errorObj.error || errorObj.details || errorMessage;
        } else if (error?.message) {
          errorMessage = error.message;
        }
      } catch (e) {
        // Use default message
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async (data: { clientId: string; accountId: string; username?: string; password?: string; platforms?: string[]; accountName?: string; email?: string; emailPassword?: string }) => {
      const response = await apiRequest("PUT", `/api/founder/clients/${data.clientId}/social-accounts/${data.accountId}`, {
        username: data.username,
        password: data.password,
        platforms: data.platforms,
        accountName: data.accountName,
        email: data.email,
        emailPassword: data.emailPassword,
      });
      return await response.json();
    },
    onSuccess: () => {
      refetchAccounts();
      setEditingAccount(null);
      setSelectedPlatforms([]);
      setAccountForm({ username: "", password: "", accountName: "", email: "", emailPassword: "" });
      toast({
        title: "Success!",
        description: "Account updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update account",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (data: { clientId: string; accountId: string }) => {
      const response = await apiRequest("DELETE", `/api/founder/clients/${data.clientId}/social-accounts/${data.accountId}`);
      return await response.json();
    },
    onSuccess: () => {
      refetchAccounts();
      setDeleteConfirmAccount(null);
      toast({
        title: "Success!",
        description: "Account deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  const [uploadingPhotoForAccount, setUploadingPhotoForAccount] = useState<string | null>(null);

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
      refetchAccounts();
      setUploadingPhotoForAccount(null);
      toast({ title: "Success!", description: "Profile photo uploaded successfully." });
    },
    onError: (error: any) => {
      setUploadingPhotoForAccount(null);
      toast({ title: "Error", description: error.message || "Failed to upload profile photo", variant: "destructive" });
    },
  });

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

  const founderLoginMutation = useMutation({
    mutationFn: async (data: { password: string }) => {
      try {
        const response = await fetch("/api/founder/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
          credentials: "include",
        });

        if (!response.ok) {
          let errorMessage = "Failed to authenticate";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        return await response.json();
      } catch (error: any) {
        // Network errors (failed to fetch)
        if (error.message?.includes("fetch") || error.message?.includes("Failed to fetch")) {
          throw new Error("Cannot connect to server. Please make sure the server is running.");
        }
        // If it's already an Error with a message, throw it
        if (error instanceof Error) {
          throw error;
        }
        // Otherwise, create a new error
        throw new Error(error.message || "An unexpected error occurred");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/session"] });
      setIsLoginView(false);
      setActiveSection("affiliates");
    },
    onError: (error: any) => {
      toast({
        title: "Authentication Failed",
        description: error.message || "Invalid password or connection error",
        variant: "destructive",
      });
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: async (data: { bookingId: string; affiliateUsername?: string; tier?: string; status?: string; saleStatus?: string }) => {
      const response = await apiRequest("PATCH", `/api/founder/bookings/${data.bookingId}`, {
        affiliateUsername: data.affiliateUsername,
        tier: data.tier,
        status: data.status,
        saleStatus: data.saleStatus,
      });
      return await response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/bookings"] });
      // Invalidate affiliate queries if affiliateUsername is set
      if (variables.affiliateUsername) {
        queryClient.invalidateQueries({ queryKey: ["/api/affiliates", variables.affiliateUsername, "bookings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/affiliates", variables.affiliateUsername, "commissions"] });
      }
      toast({
        title: "Success!",
        description: "Booking updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update booking",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createUserSchema>) => {
      const response = await apiRequest("POST", "/api/founder/create-user", data);
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Store plain text password for all user types (founder can view/share)
      if (data.plainPassword && data.id) {
        setUserPasswords((prev) => ({
          ...prev,
          [data.id]: data.plainPassword,
        }));
        // Also update affiliatePasswords for backward compatibility
        if (variables.accountType === "affiliate") {
          setAffiliatePasswords((prev) => ({
            ...prev,
            [data.id]: data.plainPassword,
          }));
        }
      }
      queryClient.invalidateQueries({ queryKey: ["/api/members/list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/list-public"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/all-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients/list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/affiliates/all"] });
      setCreateUserDialogOpen(false);
      createUserForm.reset();
      setCreateUserDialogContext(null);
      const accountTypeLabel = variables.accountType === "member" ? "Member" : variables.accountType === "client" ? "Client" : "Affiliate";
      toast({
        title: "Success!",
        description: `${accountTypeLabel} account created successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/founder/logout", {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setIsLoginView(true);
      setActiveSection(null);
    },
  });

  const onLoginSubmit = (data: z.infer<typeof founderLoginSchema>) => {
    founderLoginMutation.mutate(data);
  };

  const onCreateUserSubmit = (data: z.infer<typeof createUserSchema>) => {
    createUserMutation.mutate(data);
  };

  const onCreateClientSubmit = (data: z.infer<typeof createClientSchema>) => {
    createUserMutation.mutate({
      ...data,
      accountType: "client" as const,
    });
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoginView || !founderSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Link href="/">
            <button className="mb-8 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </button>
          </Link>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl">Founder Dashboard</CardTitle>
              <p className="text-muted-foreground mt-2">
                Enter your founder password to access the dashboard.
              </p>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Founder Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showFounderPassword ? "text" : "password"}
                              placeholder="••••••••"
                              {...field}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowFounderPassword(!showFounderPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showFounderPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-black text-white hover:bg-gray-900"
                    disabled={founderLoginMutation.isPending}
                  >
                    {founderLoginMutation.isPending ? "Authenticating..." : "Access Dashboard"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (activeSection === "finances") {
      return <FinancesPage />;
    }
    if (activeSection === "affiliates") {
      return renderAffiliatesSection();
    }
    if (activeSection === "clients") {
      return renderClientsSection();
    }
    if (activeSection === "members") {
      return renderMembersSection();
    }
    if (activeSection === "bookings-clients") {
      return renderBookingsClientsSection();
    }
    if (activeSection === "user-management") {
      return renderUserManagementSection();
    }
    // Default to affiliates
    return renderAffiliatesSection();
  };

  const renderAffiliatesSection = () => {
    const filteredAffiliates = (affiliates || []).filter((affiliate) =>
      affiliate.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalStats = {
      clicks: affiliates?.reduce((sum, a) => sum + a.totalClicks, 0) || 0,
      conversions: affiliates?.reduce((sum, a) => sum + a.totalConversions, 0) || 0,
      commission: affiliates?.reduce((sum, a) => sum + a.totalCommission, 0) || 0,
    };

    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Affiliates</h1>
        <p className="text-gray-600 mb-6">Manage all affiliate accounts and track performance</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{affiliates?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalStats.clicks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalStats.conversions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${(totalStats.commission / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Affiliates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Username</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-right py-3 px-4 font-semibold">Clicks</th>
                    <th className="text-right py-3 px-4 font-semibold">Conversions</th>
                    <th className="text-right py-3 px-4 font-semibold">Commission</th>
                    <th className="text-left py-3 px-4 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAffiliates.map((affiliate) => (
                    <tr 
                      key={affiliate.id} 
                      className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedAffiliate(affiliate);
                        setAffiliateDetailDialogOpen(true);
                      }}
                    >
                      <td className="py-3 px-4 font-medium">{affiliate.username}</td>
                      <td className="py-3 px-4 text-gray-600">{affiliate.email}</td>
                      <td className="py-3 px-4 text-right">{affiliate.totalClicks}</td>
                      <td className="py-3 px-4 text-right">{affiliate.totalConversions}</td>
                      <td 
                        className="py-3 px-4 text-right font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/affiliate-dashboard#total-commission`, '_blank');
                        }}
                        title="View in Affiliate Dashboard"
                      >
                        ${(affiliate.totalCommission / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {new Date(affiliate.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAffiliates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No affiliates found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Affiliate Detail Dialog */}
        <Dialog open={affiliateDetailDialogOpen} onOpenChange={setAffiliateDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Affiliate Details</DialogTitle>
              <DialogDescription>
                Complete information for {selectedAffiliate?.username}
              </DialogDescription>
            </DialogHeader>
            {selectedAffiliate && (
              <div className="space-y-6 py-4">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Username</Label>
                      <p className="text-sm text-gray-900 mt-1">{selectedAffiliate.username}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Email</Label>
                      <p className="text-sm text-gray-900 mt-1">{selectedAffiliate.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                      <p className="text-sm text-gray-900 mt-1">{selectedAffiliate.fullName || "Not set"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Country</Label>
                      <p className="text-sm text-gray-900 mt-1">{selectedAffiliate.country || "Not set"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                      <p className="text-sm text-gray-900 mt-1">{selectedAffiliate.phoneNumber || "Not set"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Telegram Account</Label>
                      <p className="text-sm text-gray-900 mt-1">{selectedAffiliate.telegramAccount || "Not set"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Instagram Username</Label>
                      <p className="text-sm text-gray-900 mt-1">{selectedAffiliate.instagramUsername || "Not set"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Account Created</Label>
                      <p className="text-sm text-gray-900 mt-1">
                        {new Date(selectedAffiliate.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                {(selectedAffiliate.paymentMethod || selectedAffiliate.paymentDetails) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedAffiliate.paymentMethod && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Payment Method</Label>
                          <p className="text-sm text-gray-900 mt-1 capitalize">{selectedAffiliate.paymentMethod}</p>
                        </div>
                      )}
                      {selectedAffiliate.paymentDetails && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Payment Details</Label>
                          <p className="text-sm text-gray-900 mt-1 break-words">{selectedAffiliate.paymentDetails}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Performance Stats */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Performance Statistics</h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Total Clicks</Label>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{selectedAffiliate.totalClicks}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Total Conversions</Label>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{selectedAffiliate.totalConversions}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Total Commission</Label>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        ${(selectedAffiliate.totalCommission / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Commission Breakdown */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div 
                      className="cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/affiliate-dashboard#total-commission`, '_blank');
                      }}
                      title="View in Affiliate Dashboard"
                    >
                      <Label className="text-sm font-medium text-gray-700">Total Commission</Label>
                      <p className="text-xl font-bold text-green-600 mt-1 hover:underline">
                        ${((selectedAffiliate.totalCommission || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Lifetime commissions from referrals</p>
                    </div>
                    <div 
                      className="cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/affiliate-dashboard#current-balance`, '_blank');
                      }}
                      title="View in Affiliate Dashboard"
                    >
                      <Label className="text-sm font-medium text-gray-700">Current Balance</Label>
                      <p className="text-xl font-bold text-blue-600 mt-1 hover:underline">
                        ${((selectedAffiliate.currentBalance || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Available commissions not paid yet</p>
                    </div>
                    <div 
                      className="cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/affiliate-dashboard#total-paid`, '_blank');
                      }}
                      title="View in Affiliate Dashboard"
                    >
                      <Label className="text-sm font-medium text-gray-700">Total Paid</Label>
                      <p className="text-xl font-bold text-purple-600 mt-1 hover:underline">
                        ${((selectedAffiliate.totalPaid || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Lifetime commissions paid out</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAffiliateDetailDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const renderBookingsClientsSection = () => {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Bookings & Clients</h1>
            <p className="text-gray-600">Manage bookings and client information</p>
          </div>
          <Button
            onClick={() => refetchBookings()}
            disabled={bookingsLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${bookingsLoading ? 'animate-spin' : ''}`} />
            {bookingsLoading ? 'Syncing...' : 'Refresh Bookings'}
          </Button>
        </div>

        {bookingsLoading && (
          <div className="text-center py-8 text-gray-500">
            Loading bookings...
          </div>
        )}

        <div className="space-y-4">
          {(bookings || []).map((booking) => (
            <Card key={booking.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="font-semibold text-lg">{booking.attendeeName}</p>
                    <p className="text-sm text-gray-600">{booking.attendeeEmail}</p>
                    <p className="text-sm mt-2">
                      {booking.eventTime ? new Date(booking.eventTime).toLocaleString() : 'Date not available'}
                    </p>
                    {booking.affiliateUsername && (
                      <p className="text-sm text-blue-600 mt-2">
                        Referred by: {booking.affiliateUsername}
                        {booking.referralId && (
                          <span className="ml-2 text-green-600 font-medium">
                            (automatically from Calendly)
                          </span>
                        )}
                      </p>
                    )}
                    {booking.tier && (
                      <p className="text-sm text-blue-600 mt-2">
                        Tier: {booking.tier}
                      </p>
                    )}
                    {booking.status && (
                      <p className="text-sm text-gray-600 mt-2">
                        Status: {booking.status}
                      </p>
                    )}
                    {booking.saleStatus === "sold" && (
                      <p className="text-sm text-green-600 font-semibold mt-2">
                        ✓ Sold
                        {booking.commissionAmount && (
                          <span className="ml-2">
                            (Commission: ${(booking.commissionAmount / 100).toFixed(2)})
                          </span>
                        )}
                      </p>
                    )}
                    {booking.saleStatus === "failed" && (
                      <p className="text-sm text-red-600 font-semibold mt-2">
                        ✗ Failed
                      </p>
                    )}
                  </div>

                  {!expandedBooking && booking.saleStatus !== "sold" && booking.saleStatus !== "failed" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          updateBookingMutation.mutate({
                            bookingId: booking.id,
                            saleStatus: "sold",
                          });
                        }}
                        disabled={updateBookingMutation.isPending}
                      >
                        Sold
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => {
                          updateBookingMutation.mutate({
                            bookingId: booking.id,
                            saleStatus: "failed",
                          });
                        }}
                        disabled={updateBookingMutation.isPending}
                      >
                        Failed
                      </Button>
                    </div>
                  )}

                  {expandedBooking === booking.id && (
                    <div className="space-y-3 pt-4 border-t">
                      <div>
                        <Label className="text-xs">Affiliate</Label>
                        <Select
                          value={bookingEdits[booking.id]?.affiliateUsername || booking.affiliateUsername || "none"}
                          onValueChange={(value) => setBookingEdits({
                            ...bookingEdits,
                            [booking.id]: { ...bookingEdits[booking.id], affiliateUsername: value === "none" ? undefined : value }
                          })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select affiliate..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {(affiliates || []).map((aff) => (
                              <SelectItem key={aff.id} value={aff.username}>
                                {aff.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Pricing Tier</Label>
                        <Select
                          value={bookingEdits[booking.id]?.tier || booking.tier || ""}
                          onValueChange={(value) => setBookingEdits({
                            ...bookingEdits,
                            [booking.id]: { ...bookingEdits[booking.id], tier: value }
                          })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select tier..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Growth">Growth ($4,000/mo)</SelectItem>
                            <SelectItem value="Domination">Domination ($7,000/mo)</SelectItem>
                            <SelectItem value="Empire">Empire ($13,475/mo)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Status</Label>
                        <Select
                          value={bookingEdits[booking.id]?.status || booking.status || ""}
                          onValueChange={(value) => setBookingEdits({
                            ...bookingEdits,
                            [booking.id]: { ...bookingEdits[booking.id], status: value }
                          })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select status..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="call_scheduled">Call Scheduled</SelectItem>
                            <SelectItem value="no_show">No Show</SelectItem>
                            <SelectItem value="follow_up">Follow Up</SelectItem>
                            <SelectItem value="no_interest">No Interest</SelectItem>
                            <SelectItem value="sale">Sale</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => updateBookingMutation.mutate({
                            bookingId: booking.id,
                            ...bookingEdits[booking.id],
                          })}
                          disabled={updateBookingMutation.isPending}
                        >
                          {updateBookingMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setExpandedBooking(null);
                            setBookingEdits((prev) => {
                              const newEdits = { ...prev };
                              delete newEdits[booking.id];
                              return newEdits;
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {expandedBooking !== booking.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedBooking(booking.id)}
                    >
                      Edit Details
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {(bookings || []).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No bookings yet
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Google Calendar</h2>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <iframe
                src="https://calendar.google.com/calendar/embed?src=OTE3MThjZWM1MDZlYjE0ODFlMWRlYjUxNTZhNmQ1NjE5MGE4MGZkZWE0YjIzNGU3MjgyMDQ2Yzc0ZmM0MjMwY0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t&ctz=America%2FToronto"
                style={{
                  border: 0,
                  width: "100%",
                  height: "600px",
                  borderRadius: "0.5rem"
                }}
                frameBorder="0"
                scrolling="no"
                title="Google Calendar"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Next Payment Form Component
  function NextPaymentForm({ clientId, client, onUpdate }: { clientId: string; client?: any; onUpdate?: () => void }) {
    const { toast } = useToast();
    const [nextPaymentDate, setNextPaymentDate] = useState(
      client?.nextPaymentDate ? new Date(client.nextPaymentDate).toISOString().split('T')[0] : ""
    );
    const [nextPaymentAmount, setNextPaymentAmount] = useState(
      client?.nextPaymentAmount ? (client.nextPaymentAmount / 100).toFixed(2) : ""
    );
    const [nextPaymentNote, setNextPaymentNote] = useState(client?.nextPaymentNote || "");
    const [isSaving, setIsSaving] = useState(false);

    // Tier pricing in cents
    const tierPricing: Record<string, number> = {
      "Growth": 400000, // $4,000 in cents
      "Domination": 700000, // $7,000 in cents
      "Empire": 1347500, // $13,475 in cents
    };

    const standardTierAmount = client?.tier ? (tierPricing[client.tier] || 0) : 0;
    const customAmount = nextPaymentAmount ? parseFloat(nextPaymentAmount) * 100 : null;
    const discountAmount = customAmount && customAmount < standardTierAmount ? standardTierAmount - customAmount : 0;
    const discountPercentage = standardTierAmount > 0 && discountAmount > 0 
      ? ((discountAmount / standardTierAmount) * 100).toFixed(1) 
      : "0";

    // Update form when client data changes
    useEffect(() => {
      if (client) {
        setNextPaymentDate(client.nextPaymentDate ? new Date(client.nextPaymentDate).toISOString().split('T')[0] : "");
        setNextPaymentAmount(client.nextPaymentAmount ? (client.nextPaymentAmount / 100).toFixed(2) : "");
        setNextPaymentNote(client.nextPaymentNote || "");
      }
    }, [client]);

    const handleSave = async () => {
      setIsSaving(true);
      try {
        const response = await apiRequest("PUT", `/api/founder/clients/${clientId}/next-payment`, {
          nextPaymentDate: nextPaymentDate || null,
          nextPaymentAmount: nextPaymentAmount ? Math.round(parseFloat(nextPaymentAmount) * 100) : null,
          nextPaymentNote: nextPaymentNote || null,
        });
        
        if (!response.ok) {
          throw new Error("Failed to update next payment");
        }
        
        toast({
          title: "Success!",
          description: "Next payment information updated successfully.",
        });
        
        if (onUpdate) {
          onUpdate();
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to update next payment",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <Label>Next Payment Date</Label>
          <Input
            type="date"
            value={nextPaymentDate}
            onChange={(e) => setNextPaymentDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Standard Tier Price</Label>
          <Input
            value={standardTierAmount > 0 ? `$${(standardTierAmount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "No tier set"}
            readOnly
            className="mt-1 bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            {client?.tier ? `Standard price for ${client.tier} tier` : "Set client tier first"}
          </p>
        </div>
        <div>
          <Label>Custom Payment Amount (USD)</Label>
          <Input
            type="number"
            step="0.01"
            value={nextPaymentAmount}
            onChange={(e) => setNextPaymentAmount(e.target.value)}
            placeholder={standardTierAmount > 0 ? (standardTierAmount / 100).toFixed(2) : "0.00"}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter amount to charge. Leave empty or set to standard price to use tier pricing.
            {discountAmount > 0 && (
              <span className="block text-green-600 font-medium mt-1">
                Discount: ${(discountAmount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({discountPercentage}% off)
              </span>
            )}
          </p>
        </div>
        <div>
          <Label>Note (Optional)</Label>
          <Input
            type="text"
            value={nextPaymentNote}
            onChange={(e) => setNextPaymentNote(e.target.value)}
            placeholder="e.g., 1-month discount, promotional pricing..."
            className="mt-1"
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-black text-white hover:bg-gray-900"
        >
          {isSaving ? "Saving..." : "Save Next Payment Info"}
        </Button>
      </div>
    );
  }

  // Payment Plan Form Component
  function PaymentPlanForm({ clientId, client, onUpdate }: { clientId: string; client?: any; onUpdate?: () => void }) {
    const { toast } = useToast();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [totalAmount, setTotalAmount] = useState("");
    const [note, setNote] = useState("");
    const [installments, setInstallments] = useState<Array<{ amount: string; dueDate: string }>>([{ amount: "", dueDate: "" }]);
    const [isCreating, setIsCreating] = useState(false);

    const tierPricing: Record<string, number> = {
      "Growth": 400000, // $4,000 in cents
      "Domination": 700000, // $7,000 in cents
      "Empire": 1347500, // $13,475 in cents
    };

    const standardTierAmount = client?.tier ? (tierPricing[client.tier] || 0) : 0;

    const addInstallment = () => {
      setInstallments([...installments, { amount: "", dueDate: "" }]);
    };

    const removeInstallment = (index: number) => {
      setInstallments(installments.filter((_, i) => i !== index));
    };

    const updateInstallment = (index: number, field: "amount" | "dueDate", value: string) => {
      const updated = [...installments];
      updated[index] = { ...updated[index], [field]: value };
      setInstallments(updated);
    };

    const calculateTotal = () => {
      return installments.reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0) * 100, 0);
    };

    const handleCreate = async () => {
      if (!totalAmount || parseFloat(totalAmount) <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid total amount",
          variant: "destructive",
        });
        return;
      }

      if (installments.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one installment",
          variant: "destructive",
        });
        return;
      }

      const totalInCents = Math.round(parseFloat(totalAmount) * 100);
      const calculatedTotal = calculateTotal();

      if (calculatedTotal !== totalInCents) {
        toast({
          title: "Error",
          description: `Installment amounts ($${(calculatedTotal / 100).toFixed(2)}) must equal total amount ($${(totalInCents / 100).toFixed(2)})`,
          variant: "destructive",
        });
        return;
      }

      for (const inst of installments) {
        if (!inst.amount || parseFloat(inst.amount) <= 0) {
          toast({
            title: "Error",
            description: "All installments must have a valid amount",
            variant: "destructive",
          });
          return;
        }
        if (!inst.dueDate) {
          toast({
            title: "Error",
            description: "All installments must have a due date",
            variant: "destructive",
          });
          return;
        }
      }

      setIsCreating(true);
      try {
        const response = await apiRequest("POST", `/api/founder/clients/${clientId}/payment-plans`, {
          month,
          year,
          totalAmount: totalInCents,
          currency: "USD",
          note: note || null,
          installments: installments.map(inst => ({
            amount: Math.round(parseFloat(inst.amount) * 100),
            dueDate: new Date(inst.dueDate).toISOString(),
          })),
        });

        if (!response.ok) {
          throw new Error("Failed to create payment plan");
        }

        toast({
          title: "Success!",
          description: "Payment plan created successfully.",
        });

        // Reset form
        setTotalAmount("");
        setNote("");
        setInstallments([{ amount: "", dueDate: "" }]);

        if (onUpdate) {
          onUpdate();
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to create payment plan",
          variant: "destructive",
        });
      } finally {
        setIsCreating(false);
      }
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Month</Label>
            <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {new Date(year, m - 1, 1).toLocaleDateString('en-US', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Year</Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <Label>Total Amount (USD)</Label>
          <Input
            type="number"
            step="0.01"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder={standardTierAmount > 0 ? (standardTierAmount / 100).toFixed(2) : "0.00"}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            {client?.tier ? `Standard price for ${client.tier} tier: $${(standardTierAmount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Set client tier first"}
          </p>
        </div>
        <div>
          <Label>Note (Optional)</Label>
          <Input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., Split payment plan..."
            className="mt-1"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Installments</Label>
            <Button type="button" variant="outline" size="sm" onClick={addInstallment}>
              <Plus className="w-4 h-4 mr-1" />
              Add Installment
            </Button>
          </div>
          <div className="space-y-2">
            {installments.map((inst, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Amount (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={inst.amount}
                    onChange={(e) => updateInstallment(index, "amount", e.target.value)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Due Date</Label>
                  <Input
                    type="date"
                    value={inst.dueDate}
                    onChange={(e) => updateInstallment(index, "dueDate", e.target.value)}
                    className="mt-1"
                  />
                </div>
                {installments.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInstallment(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {installments.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Total: ${(calculateTotal() / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {totalAmount && parseFloat(totalAmount) > 0 && (
                <span className={calculateTotal() !== Math.round(parseFloat(totalAmount) * 100) ? "text-red-600" : "text-green-600"}>
                  {" "}(Target: ${(Math.round(parseFloat(totalAmount) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </span>
              )}
            </p>
          )}
        </div>
        <Button
          onClick={handleCreate}
          disabled={isCreating}
          className="bg-black text-white hover:bg-gray-900"
        >
          {isCreating ? "Creating..." : "Create Payment Plan"}
        </Button>
      </div>
    );
  }

  const renderClientsSection = () => {
    const clientsLoading = false; // Clients are already loaded at top level

    const platformColors = {
      instagram: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500",
      tiktok: "bg-black",
      youtube: "bg-red-600",
      facebook: "bg-blue-600",
    };

    const platformIcons = {
      instagram: "📷",
      tiktok: "🎵",
      youtube: "▶️",
      facebook: "👥",
    };

    const allPlatforms = ["instagram", "tiktok", "youtube", "facebook"];

    const togglePlatform = (platform: string) => {
      if (platform === "all") {
        if (selectedPlatforms.length === allPlatforms.length) {
          setSelectedPlatforms([]);
        } else {
          setSelectedPlatforms([...allPlatforms]);
        }
      } else {
        if (selectedPlatforms.includes(platform)) {
          setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
        } else {
          setSelectedPlatforms([...selectedPlatforms, platform]);
        }
      }
    };


    const startEditing = (account: any) => {
      setEditingAccount({ clientId: selectedClientId!, accountId: account.id });
      setAccountForm({
        username: account.username,
        password: account.password || "",
        accountName: account.accountName || "",
        email: account.email || "",
        emailPassword: account.emailPassword || "",
      });
      try {
        const platforms = JSON.parse(account.platforms || "[]");
        setSelectedPlatforms(platforms);
      } catch {
        setSelectedPlatforms([]);
      }
    };

    const startAdding = () => {
      setAddingAccount(selectedClientId);
      setAccountForm({ username: "", password: "", accountName: "", email: "", emailPassword: "" });
      setSelectedPlatforms([]);
    };

    // Show client list if no client is selected
    if (!selectedClientId) {
      if (clientsLoading) {
        return (
          <div className="p-6">
            <div className="text-center py-8 text-gray-500">Loading clients...</div>
          </div>
        );
      }

      return (
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Clients</h1>
              <p className="text-gray-600">Manage client accounts and social media profiles</p>
            </div>
            <Button onClick={() => {
              createUserForm.reset({
                username: "",
                email: "",
                password: "",
                fullName: "",
                accountType: "client",
                role: "member",
              });
              setCreateUserDialogContext("clients");
              setCreateUserDialogOpen(true);
            }} className="bg-black text-white hover:bg-gray-900">
              <Plus className="w-4 h-4 mr-2" />
              Create Client
            </Button>
          </div>

          <div className="space-y-3">
            {clients && Array.isArray(clients) && clients.length > 0 ? (
              clients.map((client) => (
                <Card
                  key={client.id}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{client.fullName || client.username}</h3>
                        <p className="text-sm text-gray-600">{client.email}</p>
                        {client.tier && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {client.tier}
                          </span>
                        )}
                        {client.offerLink && (
                          <div className="mt-2 flex items-center gap-2">
                            <Label className="text-xs text-gray-500">Offer Link:</Label>
                            <a
                              href={client.offerLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-blue-600 hover:underline truncate max-w-xs"
                            >
                              {client.offerLink}
                            </a>
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        View Details →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No clients found</div>
            )}
          </div>
        </div>
      );
    }

    // Show client detail page when a client is selected
    if (selectedClientLoading) {
      return (
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">Loading client details...</div>
        </div>
      );
    }

    const currentClient = selectedClient || clients?.find((c) => c.id === selectedClientId);

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => setSelectedClientId(null)} className="mb-2">
              ← Back to Clients
            </Button>
            <h1 className="text-3xl font-bold">
              {currentClient?.fullName || currentClient?.username}
            </h1>
          </div>
          <Button
            onClick={() => {
              setAccountForm({ username: "", password: "", accountName: "", email: "", emailPassword: "" });
              setSelectedPlatforms([]);
              setAddingAccount(selectedClientId);
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
              <Label className="text-xs text-gray-500">Client Since</Label>
              <div className="text-lg font-semibold text-gray-900 mt-1">
                {currentClient?.createdAt ? new Date(currentClient.createdAt).toLocaleDateString() : "N/A"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Label className="text-xs text-gray-500">Total Spent</Label>
              <div className="text-lg font-semibold text-green-600 mt-1">
                ${((currentClient && 'totalSpent' in currentClient ? (currentClient as any).totalSpent : 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Label className="text-xs text-gray-500">Tier</Label>
              <div className="text-lg font-semibold text-gray-900 mt-1">
                {currentClient?.tier || "Not set"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Label className="text-xs text-gray-500">Email</Label>
              <div className="text-lg font-semibold text-gray-900 mt-1">
                {currentClient?.email || "N/A"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Offer Link */}
        <Card>
          <CardContent className="p-4">
            <Label className="text-xs text-gray-500 mb-2 block">Offer Link</Label>
            {currentClient?.offerLink ? (
              <div className="flex items-center gap-2">
                <Input 
                  value={currentClient.offerLink} 
                  readOnly 
                  className="bg-gray-50 flex-1 text-sm" 
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const link = currentClient.offerLink!;
                    // Ensure the link has a protocol
                    const url = link.startsWith('http://') || link.startsWith('https://') 
                      ? link 
                      : `https://${link}`;
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                >
                  Open Link
                </Button>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">No offer link set by client</div>
            )}
          </CardContent>
        </Card>

        {/* Next Payment Section */}
        <Card>
          <CardHeader>
            <CardTitle>Next Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedClientId && (
              <NextPaymentForm 
                clientId={selectedClientId} 
                client={currentClient} 
                onUpdate={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/founder/clients", selectedClientId] });
                  queryClient.invalidateQueries({ queryKey: ["/api/clients/next-payment"] });
                }} 
              />
            )}
          </CardContent>
        </Card>

        {/* Payment Plans Section */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Plans</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedClientId && (
              <>
                <PaymentPlanForm
                  clientId={selectedClientId}
                  client={currentClient}
                  onUpdate={() => {
                    refetchPaymentPlans();
                  }}
                />
                
                {paymentPlans && paymentPlans.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <Label className="text-sm font-semibold">Existing Payment Plans</Label>
                    {paymentPlans.map((plan: any) => (
                      <Card key={plan.id} className="border">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">
                                {new Date(plan.year, plan.month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Total: ${(plan.totalAmount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              {plan.note && (
                                <p className="text-xs text-gray-500 mt-1">{plan.note}</p>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            {plan.installments && plan.installments.map((inst: any, idx: number) => (
                              <div key={inst.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex-1">
                                  <div className="font-medium">
                                    ${(inst.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    Due: {new Date(inst.dueDate).toLocaleDateString('en-US')}
                                  </div>
                                </div>
                                <div className="text-xs">
                                  <span className={`px-2 py-1 rounded ${
                                    inst.status === "paid" 
                                      ? "bg-green-100 text-green-800" 
                                      : inst.status === "overdue"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}>
                                    {inst.status === "paid" ? "✓ Paid" : inst.status === "overdue" ? "Overdue" : "Pending"}
                                  </span>
                                  {inst.paidAt && (
                                    <div className="text-gray-500 mt-1">
                                      Paid: {new Date(inst.paidAt).toLocaleDateString('en-US')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Social Media Accounts Section */}
        <Card>
          <CardHeader>
            <CardTitle>Social Media Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {addingAccount === selectedClientId && (
              <Card className="mb-4 border-2 border-blue-200">
                <CardContent className="pt-6">
                  <h5 className="font-semibold mb-4">Add New Account</h5>
                  <div className="space-y-4">
                    <div>
                      <Label>Account Name (Optional)</Label>
                      <Input
                        placeholder="e.g., Main Account"
                        value={accountForm.accountName}
                        onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Username</Label>
                      <Input
                        placeholder="username"
                        value={accountForm.username}
                        onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <Input
                        type="password"
                        placeholder="password"
                        value={accountForm.password}
                        onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                      />
                    </div>
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm text-gray-600 mb-3">Email Account (used to create these social media accounts)</p>
                      <div className="space-y-3">
                        <div>
                          <Label>Email Address</Label>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            value={accountForm.email}
                            onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Email Password</Label>
                          <Input
                            type="password"
                            placeholder="email password"
                            value={accountForm.emailPassword}
                            onChange={(e) => setAccountForm({ ...accountForm, emailPassword: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label>Platforms</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => togglePlatform("all")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedPlatforms.length === allPlatforms.length
                              ? "bg-gray-800 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          All Platforms
                        </button>
                        {allPlatforms.map((platform) => (
                          <button
                            key={platform}
                            type="button"
                            onClick={() => togglePlatform(platform)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                              selectedPlatforms.includes(platform)
                                ? `${platformColors[platform as keyof typeof platformColors]} text-white`
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            <span>{platformIcons[platform as keyof typeof platformIcons]}</span>
                            <span className="capitalize">{platform}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (!accountForm.username || !accountForm.password || selectedPlatforms.length === 0) {
                            toast({
                              title: "Error",
                              description: "Please fill in username, password, and select at least one platform",
                              variant: "destructive",
                            });
                            return;
                          }
                          createAccountMutation.mutate({
                            clientId: selectedClientId!,
                            username: accountForm.username,
                            password: accountForm.password,
                            platforms: selectedPlatforms,
                            accountName: accountForm.accountName || undefined,
                            email: accountForm.email || undefined,
                            emailPassword: accountForm.emailPassword || undefined,
                          });
                        }}
                        disabled={createAccountMutation.isPending}
                      >
                        {createAccountMutation.isPending ? "Creating..." : "Create Account"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAddingAccount(null);
                          setSelectedPlatforms([]);
                          setAccountForm({ username: "", password: "", accountName: "", email: "", emailPassword: "" });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {accounts && accounts.length > 0 ? (
                accounts.map((account: any) => {
                  const isEditing = editingAccount?.accountId === account.id;
                  const accountPlatforms = (() => {
                    try {
                      return JSON.parse(account.platforms || "[]");
                    } catch {
                      return [];
                    }
                  })();

                  if (isEditing) {
                    return (
                      <Card key={account.id} className="border-2 border-blue-200">
                        <CardContent className="pt-6">
                          <h5 className="font-semibold mb-4">Edit Account</h5>
                          <div className="space-y-4">
                            <div>
                              <Label>Account Name (Optional)</Label>
                              <Input
                                value={accountForm.accountName}
                                onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Username</Label>
                              <Input
                                value={accountForm.username}
                                onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Password</Label>
                              <Input
                                type="password"
                                value={accountForm.password}
                                onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                              />
                            </div>
                            <div className="border-t pt-4 mt-4">
                              <p className="text-sm text-gray-600 mb-3">Email Account (used to create these social media accounts)</p>
                              <div className="space-y-3">
                                <div>
                                  <Label>Email Address</Label>
                                  <Input
                                    type="email"
                                    placeholder="email@example.com"
                                    value={accountForm.email}
                                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label>Email Password</Label>
                                  <Input
                                    type="password"
                                    placeholder="email password"
                                    value={accountForm.emailPassword}
                                    onChange={(e) => setAccountForm({ ...accountForm, emailPassword: e.target.value })}
                                  />
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label>Platforms</Label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => togglePlatform("all")}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    selectedPlatforms.length === allPlatforms.length
                                      ? "bg-gray-800 text-white"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  }`}
                                >
                                  All Platforms
                                </button>
                                {allPlatforms.map((platform) => (
                                  <button
                                    key={platform}
                                    type="button"
                                    onClick={() => togglePlatform(platform)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                      selectedPlatforms.includes(platform)
                                        ? `${platformColors[platform as keyof typeof platformColors]} text-white`
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                  >
                                    <span>{platformIcons[platform as keyof typeof platformIcons]}</span>
                                    <span className="capitalize">{platform}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  if (!accountForm.username || !accountForm.password || selectedPlatforms.length === 0) {
                                    toast({
                                      title: "Error",
                                      description: "Please fill in username, password, and select at least one platform",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  updateAccountMutation.mutate({
                                    clientId: selectedClientId!,
                                    accountId: account.id,
                                    username: accountForm.username,
                                    password: accountForm.password,
                                    platforms: selectedPlatforms,
                                    accountName: accountForm.accountName || undefined,
                                    email: accountForm.email || undefined,
                                    emailPassword: accountForm.emailPassword || undefined,
                                  });
                                }}
                                disabled={updateAccountMutation.isPending}
                              >
                                {updateAccountMutation.isPending ? "Saving..." : "Save Changes"}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingAccount(null);
                                  setSelectedPlatforms([]);
                                  setAccountForm({ username: "", password: "", accountName: "", email: "", emailPassword: "" });
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  return (
                    <Card key={account.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="relative group flex-shrink-0">
                              {account.profilePhoto ? (
                                <img
                                  src={account.profilePhoto}
                                  alt={`${account.accountName} profile`}
                                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                  data-testid={`img-profile-${account.id}`}
                                />
                              ) : (
                                <div 
                                  className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-gray-200"
                                  data-testid={`placeholder-profile-${account.id}`}
                                >
                                  <span className="text-gray-500 text-xl font-medium">
                                    {account.accountName?.charAt(0)?.toUpperCase() || account.username?.charAt(0)?.toUpperCase() || "?"}
                                  </span>
                                </div>
                              )}
                              <label 
                                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                                htmlFor={`founder-photo-upload-${account.id}`}
                              >
                                <Upload className="w-5 h-5 text-white" />
                              </label>
                              <input
                                id={`founder-photo-upload-${account.id}`}
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
                            <div className="flex-1">
                              <h5 className="font-semibold mb-2">{account.accountName || "Untitled Account"}</h5>
                              <div className="space-y-2">
                                <div>
                                  <Label className="text-xs text-gray-500">Username</Label>
                                  <p className="text-sm font-mono">{account.username}</p>
                                </div>
                              <div>
                                <Label className="text-xs text-gray-500">Password</Label>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-mono">
                                    {revealedPasswords[account.id] ? account.password : "••••••••"}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setRevealedPasswords(prev => ({
                                        ...prev,
                                        [account.id]: !prev[account.id]
                                      }));
                                    }}
                                  >
                                    {revealedPasswords[account.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </Button>
                                </div>
                              </div>
                              {account.email && (
                                <>
                                  <div>
                                    <Label className="text-xs text-gray-500">Email</Label>
                                    <p className="text-sm font-mono">{account.email}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-500">Email Password</Label>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-mono">
                                        {revealedPasswords[`email-${account.id}`] ? account.emailPassword : "••••••••"}
                                      </p>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setRevealedPasswords(prev => ({
                                            ...prev,
                                            [`email-${account.id}`]: !prev[`email-${account.id}`]
                                          }));
                                        }}
                                      >
                                        {revealedPasswords[`email-${account.id}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      </Button>
                                    </div>
                                  </div>
                                </>
                              )}
                              <div>
                                <Label className="text-xs text-gray-500">Platforms</Label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {accountPlatforms.map((platform: string) => (
                                    <span
                                      key={platform}
                                      className={`px-2 py-1 text-xs rounded ${platformColors[platform as keyof typeof platformColors]} text-white`}
                                    >
                                      {platformIcons[platform as keyof typeof platformIcons]} {platform}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditing(account)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirmAccount({ clientId: selectedClientId!, accountId: account.id, accountName: account.accountName || "this account" })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No accounts yet. Click "Add Account" to create one.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmAccount} onOpenChange={() => setDeleteConfirmAccount(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the account "{deleteConfirmAccount?.accountName}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmAccount(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteConfirmAccount) {
                    deleteAccountMutation.mutate({
                      clientId: deleteConfirmAccount.clientId,
                      accountId: deleteConfirmAccount.accountId,
                    });
                  }
                }}
                disabled={deleteAccountMutation.isPending}
              >
                {deleteAccountMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const renderMembersSection = () => {
    // Filter members based on search term
    const filteredMembers = (members || []).filter((member) => {
      const searchLower = memberSearchTerm.toLowerCase();
      return (
        member.username?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.fullName?.toLowerCase().includes(searchLower) ||
        member.role?.toLowerCase().includes(searchLower)
      );
    });

    // Group members by role
    const membersByRole = filteredMembers.reduce((acc, member) => {
      const role = member.role || "member";
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(member);
      return acc;
    }, {} as Record<string, Member[]>);

    const roleLabels: Record<string, string> = {
      admin: "Admin",
      manager: "Manager",
      editor: "Editor",
      clipper: "Clipper",
      member: "Member",
    };

    const roleColors: Record<string, string> = {
      admin: "bg-red-100 text-red-800 border-red-200",
      manager: "bg-purple-100 text-purple-800 border-purple-200",
      editor: "bg-blue-100 text-blue-800 border-blue-200",
      clipper: "bg-green-100 text-green-800 border-green-200",
      member: "bg-gray-100 text-gray-800 border-gray-200",
    };

    if (!founderSession) {
      return null;
    }

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Members</h1>
            <p className="text-gray-600">Track and manage all members</p>
          </div>
          <Button
            onClick={() => {
              // Navigate to user-management section with query params to open dialog
              setLocation("/founder?section=user-management&openDialog=create-user&accountType=member");
            }}
            className="bg-black text-white hover:bg-gray-900"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name, email, username, or role..."
              value={memberSearchTerm}
              onChange={(e) => setMemberSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{members?.length || 0}</div>
              <p className="text-sm text-gray-600">Total Members</p>
            </CardContent>
          </Card>
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
            <CardTitle>All Members ({filteredMembers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Points</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedMember(member);
                          setMemberDetailDialogOpen(true);
                        }}
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium">
                            {member.fullName || member.username}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{member.username}</td>
                        <td className="py-3 px-4 text-gray-600">{member.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColors[member.role || "member"]}`}
                          >
                            {roleLabels[member.role || "member"]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {allMemberStats?.[member.id]?.currentBalance || 0} pts
                            </span>
                            <span className="text-xs text-gray-500">
                              Earned: {allMemberStats?.[member.id]?.pointsEarned || 0} | Paid: {allMemberStats?.[member.id]?.pointsPaid || 0}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMember(member);
                              setMemberDetailDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "No members found matching your search" : "No members yet"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member Detail Dialog */}
        <Dialog open={memberDetailDialogOpen} onOpenChange={setMemberDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Member Details</DialogTitle>
              <DialogDescription>
                View and manage member information
              </DialogDescription>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Full Name</Label>
                    <p className="font-medium">{selectedMember.fullName || "Not set"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Username</Label>
                    <p className="font-medium">{selectedMember.username}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Email</Label>
                    <p className="font-medium">{selectedMember.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Role</Label>
                    <p className="font-medium">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColors[selectedMember.role || "member"]}`}
                      >
                        {roleLabels[selectedMember.role || "member"]}
                      </span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Member Since</Label>
                    <p className="font-medium">
                      {new Date(selectedMember.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Must Change Password</Label>
                    <p className="font-medium">
                      {selectedMember.mustChangePassword ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Current Balance</Label>
                    <p className="font-medium text-green-600">
                      {allMemberStats?.[selectedMember.id]?.currentBalance || 0} pts
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Total Earned</Label>
                    <p className="font-medium text-blue-600">
                      {allMemberStats?.[selectedMember.id]?.pointsEarned || 0} pts
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Total Paid</Label>
                    <p className="font-medium text-purple-600">
                      {allMemberStats?.[selectedMember.id]?.pointsPaid || 0} pts
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingUser(selectedMember);
                      setEditUserDialogOpen(true);
                      setMemberDetailDialogOpen(false);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Member
                  </Button>
                  <Button variant="outline" onClick={() => setMemberDetailDialogOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const renderUserManagementSection = () => {
    // Combine all users into a single array
    type UnifiedUser = (Member & { userType: "member"; type: "member" }) | 
                       (Client & { userType: "client"; type: "client" }) | 
                       (AffiliateWithStats & { userType: "affiliate"; type: "affiliate" });
    
    const allUsers: UnifiedUser[] = [
      ...(members || []).map(m => ({ ...m, userType: "member" as const, type: "member" as const })),
      ...(clients || []).map(c => ({ ...c, userType: "client" as const, type: "client" as const })),
      ...(allAffiliatesForManagement || affiliates || []).map(a => ({ ...a, userType: "affiliate" as const, type: "affiliate" as const })),
    ];

    // Filter users based on search term
    const filteredUsers = allUsers.filter(user => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        user.username?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        (user as any).fullName?.toLowerCase().includes(search)
      );
    });

    const togglePasswordVisibility = (userId: string) => {
      setRevealedPasswords(prev => ({
        ...prev,
        [userId]: !prev[userId],
      }));
    };

    const getPasswordForUser = (user: UnifiedUser) => {
      // First check if user has plainPassword from database
      if ((user as any).plainPassword) {
        return (user as any).plainPassword;
      }
      // Check userPasswords (for newly created users)
      if (userPasswords[user.id]) {
        return userPasswords[user.id];
      }
      // Check affiliatePasswords for backward compatibility
      if (user.userType === "affiliate" && affiliatePasswords[user.id]) {
        return affiliatePasswords[user.id];
      }
      return null;
    };

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">User Management</h1>
            <p className="text-gray-600">Create and manage all user accounts (Members, Clients, Affiliates)</p>
          </div>
          <Button 
            onClick={() => {
              createUserForm.reset({
                username: "",
                email: "",
                password: "",
                fullName: "",
                accountType: "member" as const,
                role: "member" as const,
              });
              setCreateUserDialogContext("user-management");
              setCreateUserDialogOpen(true);
            }} 
            className="bg-black text-white hover:bg-gray-900"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by username, email, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Unified Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        {searchTerm ? "No users found matching your search." : "No users yet. Create your first user account."}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const userType = user.userType || (user as any).type || "unknown";
                      const password = getPasswordForUser(user);
                      const isPasswordRevealed = revealedPasswords[user.id];
                      
                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{(user as any).fullName || "-"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              userType === "member" ? "bg-blue-100 text-blue-800" :
                              userType === "client" ? "bg-green-100 text-green-800" :
                              "bg-purple-100 text-purple-800"
                            }`}>
                              {userType === "member" ? "Member" :
                               userType === "client" ? "Client" :
                               "Affiliate"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {(user as any).role || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {password ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-gray-700">
                                  {isPasswordRevealed ? password : "••••••••"}
                                </span>
                                <button
                                  onClick={() => togglePasswordVisibility(user.id)}
                                  className="text-gray-500 hover:text-gray-700"
                                  type="button"
                                >
                                  {isPasswordRevealed ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Not available</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingUser(user);
                                  setEditUserDialogOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                type="button"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  // TODO: Implement delete functionality
                                  toast({
                                    title: "Delete User",
                                    description: "Delete functionality will be implemented.",
                                    variant: "destructive",
                                  });
                                }}
                                className="text-red-600 hover:text-red-900"
                                type="button"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Members ({members?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {members?.map((member) => (
                  <div key={member.id} className="p-3 border rounded-lg hover:bg-gray-50">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{member.username}</p>
                      <p className="text-xs text-gray-600">{member.email}</p>
                      {member.passwordHash && (
                        <div className="mt-1">
                          <p className="text-xs font-medium text-gray-700">Password Hash:</p>
                          <p className="text-xs text-gray-500 font-mono break-all">{member.passwordHash}</p>
                          <p className="text-xs text-gray-400 italic mt-0.5">(Password is hashed and cannot be retrieved)</p>
                        </div>
                      )}
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Role:</span> {member.role}
                        </p>
                        {member.fullName && (
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Full Name:</span> {member.fullName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(!members || members.length === 0) && (
                  <p className="text-center text-gray-500 py-4 text-sm">No members yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clients ({clients?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {clients?.map((client) => (
                  <div key={client.id} className="p-3 border rounded-lg hover:bg-gray-50">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{client.username}</p>
                      <p className="text-xs text-gray-600">{client.email}</p>
                      {client.offerLink && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Offer Link:</p>
                          <a 
                            href={client.offerLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline break-all"
                          >
                            {client.offerLink}
                          </a>
                        </div>
                      )}
                      {client.passwordHash && (
                        <div className="mt-1">
                          <p className="text-xs font-medium text-gray-700">Password Hash:</p>
                          <p className="text-xs text-gray-500 font-mono break-all">{client.passwordHash}</p>
                          <p className="text-xs text-gray-400 italic mt-0.5">(Password is hashed and cannot be retrieved)</p>
                        </div>
                      )}
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        {client.tier && (
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Tier:</span> {client.tier}
                          </p>
                        )}
                        {client.fullName && (
                          <p className="text-xs text-gray-500">
                            <span className="font-medium">Full Name:</span> {client.fullName}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Since:</span> {new Date(client.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!clients || clients.length === 0) && (
                  <p className="text-center text-gray-500 py-4 text-sm">No clients yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Affiliates ({allAffiliatesForManagement?.length ?? (affiliates?.length ?? 0)})</CardTitle>
            </CardHeader>
            <CardContent>
              {allAffiliatesLoading && !allAffiliatesForManagement ? (
                <div className="text-center py-8 text-gray-500 text-sm">Loading affiliates...</div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {(allAffiliatesForManagement && allAffiliatesForManagement.length > 0) ? (
                    allAffiliatesForManagement.map((affiliate) => (
                  <div key={affiliate.id} className="p-4 border rounded-lg hover:bg-gray-50 bg-white">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">Username: {affiliate.username}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{affiliate.email}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-1">Login Credentials:</p>
                        {affiliatePasswords[affiliate.id] ? (
                          <>
                            <p className="text-xs text-gray-600 mb-1">
                              <span className="font-medium">Username:</span> <span className="font-mono">{affiliate.username}</span>
                            </p>
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Password:</span> <span className="font-mono">{affiliatePasswords[affiliate.id]}</span>
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-500 italic">
                            Password not available (account was created before this feature was added, or password was reset)
                          </p>
                        )}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs font-medium text-gray-700">Clicks</p>
                          <p className="text-sm font-semibold text-gray-900">{affiliate.totalClicks}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700">Conversions</p>
                          <p className="text-sm font-semibold text-gray-900">{affiliate.totalConversions}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700">Commission</p>
                          <p className="text-sm font-semibold text-gray-900">${(affiliate.totalCommission / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700">Joined</p>
                          <p className="text-sm font-semibold text-gray-900">{new Date(affiliate.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      {affiliate.paymentMethod && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-1">Payment Information</p>
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Method:</span> {affiliate.paymentMethod}
                          </p>
                          {affiliate.paymentDetails && (
                            <p className="text-xs text-gray-600 mt-1">
                              <span className="font-medium">Details:</span> {affiliate.paymentDetails}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    </div>
                    ))
                  ) : (affiliates && affiliates.length > 0) ? (
                    // Fallback to regular affiliates if /all endpoint hasn't loaded yet
                    affiliates.map((affiliate) => (
                      <div key={affiliate.id} className="p-4 border rounded-lg hover:bg-gray-50 bg-white">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">{affiliate.username}</p>
                              <p className="text-xs text-gray-600 mt-0.5">{affiliate.email}</p>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs font-medium text-gray-700">Clicks</p>
                              <p className="text-sm font-semibold text-gray-900">{affiliate.totalClicks}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-700">Conversions</p>
                              <p className="text-sm font-semibold text-gray-900">{affiliate.totalConversions}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-700">Commission</p>
                              <p className="text-sm font-semibold text-gray-900">${(affiliate.totalCommission / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-700">Joined</p>
                              <p className="text-sm font-semibold text-gray-900">{new Date(affiliate.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8 text-sm">No affiliates yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create User Dialog */}
        <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {createUserDialogContext === "members" ? "Create New Member" 
                  : createUserDialogContext === "clients" ? "Create New Client"
                  : "Create New User"}
              </DialogTitle>
              <DialogDescription>
                {createUserDialogContext === "members" 
                  ? "Create a new member account with a specific role."
                  : createUserDialogContext === "clients"
                  ? "Create a new client account."
                  : "Create a new member, client, or affiliate account."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Form {...createUserForm}>
                  <form onSubmit={createUserForm.handleSubmit(onCreateUserSubmit)} className="space-y-4">
                    {createUserDialogContext !== "clients" && (
                      <FormField
                        control={createUserForm.control}
                        name="accountType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="client">Client</SelectItem>
                                <SelectItem value="affiliate">Affiliate</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={createUserForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createUserForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              {...field}
                              placeholder="user@example.com"
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Username will be auto-suggested from email
                          </p>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createUserForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="username"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createUserForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} placeholder="Set initial password" />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            User will be required to change password on first login (for members/clients)
                          </p>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createUserForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {createUserForm.watch("accountType") === "member" && (
                      <FormField
                        control={createUserForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || "member"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="clipper">Clipper</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setCreateUserDialogOpen(false);
                          createUserForm.reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-black text-white hover:bg-gray-900"
                        disabled={createUserMutation.isPending}
                      >
                        {createUserMutation.isPending ? "Creating..." : "Create User"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and password.
              </DialogDescription>
            </DialogHeader>
            {editingUser && (
              <EditUserDialogContent
                user={editingUser}
                onClose={() => {
                  setEditUserDialogOpen(false);
                  setEditingUser(null);
                }}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/members/list"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/clients/list"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/founder/affiliates"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/founder/affiliates/all"] });
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // Edit User Dialog Component
  function EditUserDialogContent({ user, onClose, onSuccess }: { user: any; onClose: () => void; onSuccess: () => void }) {
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const userType = user.userType || user.type || "unknown";
    // Get password from stored passwords
    const currentPassword = (user as any).plainPassword || userPasswords[user.id] || (userType === "affiliate" ? affiliatePasswords[user.id] : null) || null;

    const updatePasswordMutation = useMutation({
      mutationFn: async (password: string) => {
        const response = await apiRequest("PUT", `/api/founder/users/${user.id}/password`, {
          password,
          userType,
        });
        return await response.json();
      },
      onSuccess: (data) => {
        // Store the new password in state
        setUserPasswords(prev => ({
          ...prev,
          [user.id]: data.plainPassword,
        }));
        onSuccess();
        onClose();
        toast({
          title: "Success!",
          description: "Password updated successfully.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update password",
          variant: "destructive",
        });
      },
    });

    const handleUpdatePassword = () => {
      if (!newPassword || newPassword.length < 8) {
        toast({
          title: "Error",
          description: "Password must be at least 8 characters",
          variant: "destructive",
        });
        return;
      }
      updatePasswordMutation.mutate(newPassword);
    };

    return (
      <div className="space-y-4 py-4">
        <div>
          <Label>Username</Label>
          <Input value={user.username} disabled className="bg-gray-50" />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={user.email} disabled className="bg-gray-50" />
        </div>
        <div>
          <Label>Current Password</Label>
          <div className="flex items-center gap-2">
            <Input
              type={showPassword ? "text" : "password"}
              value={currentPassword || "Not available"}
              disabled
              className="bg-gray-50 font-mono"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          {!currentPassword && (
            <p className="text-xs text-gray-500 mt-1">
              Password not available. Set a new password below.
            </p>
          )}
        </div>
        <div>
          <Label>New Password</Label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password (min 8 characters)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to keep current password
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdatePassword}
            disabled={!newPassword || newPassword.length < 8 || updatePasswordMutation.isPending}
            className="bg-black text-white hover:bg-gray-900"
          >
            {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
          </Button>
        </DialogFooter>
      </div>
    );
  }

  const menuItems = [
    { id: "members-dashboard", label: "Members Dashboard", icon: LayoutGrid },
    { id: "finances", label: "Finances", icon: DollarSign },
    { id: "affiliates", label: "Affiliates", icon: Users },
    { id: "clients", label: "Clients", icon: Building2 },
    { id: "members", label: "Members", icon: Briefcase },
    { id: "bookings-clients", label: "Bookings & Clients", icon: Calendar },
    { id: "user-management", label: "User Management", icon: UserPlus },
  ];

  // If members dashboard is active, render it full screen (it has its own sidebar)
  if (activeSection === "members-dashboard") {
    return <MembersDashboard fromFounderDashboard={true} onBackToFounder={() => setActiveSection("affiliates")} />;
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 h-screen z-50">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="KabaContent" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-bold">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Kaba</span>
              <span className="text-gray-900">Content</span>
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id || (!activeSection && item.id === "affiliates");
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* User Profile at Bottom */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold">
              F
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Founder</p>
              <p className="text-xs text-gray-500 truncate">Full Access</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 overflow-y-auto bg-white">
        {renderContent()}
      </div>
    </div>
  );
}
