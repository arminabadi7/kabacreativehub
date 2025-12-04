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
  Search
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
};

type Client = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  tier?: string;
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
  role: z.enum(["admin", "manager", "editor", "clipper", "employee"]).optional(),
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
  const [showFounderPassword, setShowFounderPassword] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>({}); // Store passwords for all user types
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateWithStats | null>(null);
  const [affiliateDetailDialogOpen, setAffiliateDetailDialogOpen] = useState(false);
  
  // Update section when URL changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");
    if (section) {
      setActiveSection(section);
    }
  }, [location]);

  const loginForm = useForm({
    resolver: zodResolver(founderLoginSchema),
    defaultValues: {
      password: "",
    },
  });

  const createUserForm = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
      accountType: "member" as const,
      role: "employee" as const,
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
    enabled: !!founderSession && activeSection === "user-management",
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
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<{ clientId: string; accountId: string } | null>(null);
  const [addingAccount, setAddingAccount] = useState<string | null>(null);
  const [deleteConfirmAccount, setDeleteConfirmAccount] = useState<{ clientId: string; accountId: string; accountName: string } | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [accountForm, setAccountForm] = useState({ username: "", password: "", accountName: "" });

  // Fetch accounts for expanded client (must be at top level)
  const { data: accounts, refetch: refetchAccounts } = useQuery<any[]>({
    queryKey: ["/api/founder/clients", expandedClient, "social-accounts"],
    queryFn: async () => {
      if (!expandedClient) return [];
      const response = await apiRequest("GET", `/api/founder/clients/${expandedClient}/social-accounts`);
      return await response.json();
    },
    enabled: !!expandedClient && !!founderSession,
  });

  // Account management mutations (must be at top level)
  const createAccountMutation = useMutation({
    mutationFn: async (data: { clientId: string; username: string; password: string; platforms: string[]; accountName?: string }) => {
      const response = await apiRequest("POST", `/api/founder/clients/${data.clientId}/social-accounts`, {
        username: data.username,
        password: data.password,
        platforms: data.platforms,
        accountName: data.accountName || null,
      });
      return await response.json();
    },
    onSuccess: () => {
      refetchAccounts();
      setAddingAccount(null);
      setSelectedPlatforms([]);
      setAccountForm({ username: "", password: "", accountName: "" });
      toast({
        title: "Success!",
        description: "Account created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async (data: { clientId: string; accountId: string; username?: string; password?: string; platforms?: string[]; accountName?: string }) => {
      const response = await apiRequest("PUT", `/api/founder/clients/${data.clientId}/social-accounts/${data.accountId}`, {
        username: data.username,
        password: data.password,
        platforms: data.platforms,
        accountName: data.accountName,
      });
      return await response.json();
    },
    onSuccess: () => {
      refetchAccounts();
      setEditingAccount(null);
      setSelectedPlatforms([]);
      setAccountForm({ username: "", password: "", accountName: "" });
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
      queryClient.invalidateQueries({ queryKey: ["/api/clients/list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/affiliates/all"] });
      setCreateUserDialogOpen(false);
      createUserForm.reset();
      toast({
        title: "Success!",
        description: "User account created successfully.",
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
      setEditingAccount({ clientId: expandedClient!, accountId: account.id });
      setAccountForm({
        username: account.username,
        password: account.password || "",
        accountName: account.accountName || "",
      });
      try {
        const platforms = JSON.parse(account.platforms || "[]");
        setSelectedPlatforms(platforms);
      } catch {
        setSelectedPlatforms([]);
      }
    };

    const startAdding = () => {
      setAddingAccount(expandedClient);
      setAccountForm({ username: "", password: "", accountName: "" });
      setSelectedPlatforms([]);
    };

    if (clientsLoading) {
      return (
        <div className="p-6">
          <div className="text-center py-8 text-gray-500">Loading clients...</div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Clients</h1>
        <p className="text-gray-600 mb-6">Manage client accounts and social media profiles</p>

        <div className="space-y-4">
          {(clients || []).map((client) => {
            const isExpanded = expandedClient === client.id;
            return (
              <Card key={client.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{client.fullName || client.username}</h3>
                        <p className="text-sm text-gray-600">{client.email}</p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                          <div>
                            <Label className="text-xs text-gray-500">Client Since</Label>
                            <p className="text-sm font-medium">
                              {new Date(client.clientSince || client.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Duration</Label>
                            <p className="text-sm font-medium">{client.durationText || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Tier</Label>
                            <p className="text-sm font-medium">{client.tier || "Not set"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Next Payment</Label>
                            <p className="text-sm font-medium">
                              {client.nextPaymentDate
                                ? new Date(client.nextPaymentDate).toLocaleDateString()
                                : "Not set"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Total Spent</Label>
                            <p className="text-sm font-medium">
                              ${((client.totalSpent || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                      >
                        {isExpanded ? "Collapse" : "View Accounts"}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold">Social Media Accounts</h4>
                          <Button onClick={startAdding} size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Account
                          </Button>
                        </div>

                        {addingAccount === client.id && (
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
                                        clientId: client.id,
                                        username: accountForm.username,
                                        password: accountForm.password,
                                        platforms: selectedPlatforms,
                                        accountName: accountForm.accountName || undefined,
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
                                      setAccountForm({ username: "", password: "", accountName: "" });
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
                          {(accounts || []).map((account: any) => {
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
                                              clientId: client.id,
                                              accountId: account.id,
                                              username: accountForm.username,
                                              password: accountForm.password,
                                              platforms: selectedPlatforms,
                                              accountName: accountForm.accountName || undefined,
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
                                            setAccountForm({ username: "", password: "", accountName: "" });
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
                                    <div className="flex-1">
                                      {account.accountName && (
                                        <h5 className="font-semibold mb-2">{account.accountName}</h5>
                                      )}
                                      <div className="space-y-2">
                                        <div>
                                          <Label className="text-xs text-gray-500">Username</Label>
                                          <p className="text-sm font-mono">{account.username}</p>
                                        </div>
                                        <div>
                                          <Label className="text-xs text-gray-500">Password</Label>
                                          <p className="text-sm font-mono">{account.password || "Not set"}</p>
                                        </div>
                                        <div>
                                          <Label className="text-xs text-gray-500">Platforms</Label>
                                          <div className="flex flex-wrap gap-2 mt-1">
                                            {accountPlatforms.map((platform: string) => (
                                              <span
                                                key={platform}
                                                className={`px-3 py-1 rounded-full text-xs font-medium text-white ${platformColors[platform as keyof typeof platformColors]}`}
                                              >
                                                {platformIcons[platform as keyof typeof platformIcons]} {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => startEditing(account)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDeleteConfirmAccount({
                                          clientId: client.id,
                                          accountId: account.id,
                                          accountName: account.accountName || account.username,
                                        })}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                          {(!accounts || accounts.length === 0) && !addingAccount && (
                            <div className="text-center py-8 text-gray-500">
                              No accounts yet. Click "Add Account" to create one.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {(!clients || clients.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              No clients yet
            </div>
          )}
        </div>

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

    const getPasswordForUser = (userId: string, userType: string) => {
      // Check userPasswords first (for newly created users)
      if (userPasswords[userId]) {
        return userPasswords[userId];
      }
      // Check affiliatePasswords for backward compatibility
      if (userType === "affiliate" && affiliatePasswords[userId]) {
        return affiliatePasswords[userId];
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
          <Button onClick={() => setCreateUserDialogOpen(true)} className="bg-black text-white hover:bg-gray-900">
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
                      const password = getPasswordForUser(user.id, userType);
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
                              {userType === "member" ? "Employee" :
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
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new member, client, or affiliate account.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Form {...createUserForm}>
                  <form onSubmit={createUserForm.handleSubmit(onCreateUserSubmit)} className="space-y-4">
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
                              <SelectItem value="member">Member (Employee)</SelectItem>
                              <SelectItem value="client">Client</SelectItem>
                              <SelectItem value="affiliate">Affiliate</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
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
                            User will be required to change password on first login (for employees/clients)
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
                            <Select onValueChange={field.onChange} defaultValue={field.value || "employee"}>
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
                                <SelectItem value="employee">Employee</SelectItem>
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
      </div>
    );
  };

  const menuItems = [
    { id: "members-dashboard", label: "Members Dashboard", icon: LayoutGrid },
    { id: "finances", label: "Finances", icon: DollarSign },
    { id: "affiliates", label: "Affiliates", icon: Users },
    { id: "clients", label: "Clients", icon: Building2 },
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
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 h-screen">
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
