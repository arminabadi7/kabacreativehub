import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Copy,
  DollarSign,
  Users,
  MousePointerClick,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react";
import type { Affiliate, Referral } from "@shared/schema";
import { CountrySelect } from "@/components/CountrySelect";

const registerSchema = z.object({
  username: z
    .string()
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

const paymentSchema = z.object({
  paymentMethod: z.enum(["paypal", "etransfer", "banktransfer"]),
  paymentDetails: z.string().min(1, "Payment details are required"),
});

const profileSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email"),
  fullName: z.string().optional(),
  country: z.string().optional(),
  telegramAccount: z.string().optional(),
  instagramUsername: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export default function AffiliateDashboard() {
  const [isLogin, setIsLogin] = useState(false); // Default to Sign Up
  const { toast } = useToast();
  const [location] = useLocation();
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const { data: affiliate, isLoading: affiliateLoading, refetch: refetchSession } = useQuery<Affiliate>({
    queryKey: ["/api/auth/session"],
    retry: false,
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const paymentForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: "paypal",
      paymentDetails: "",
    },
  });

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: affiliate?.username || "",
      email: affiliate?.email || "",
      fullName: affiliate?.fullName || "",
      country: affiliate?.country || "",
      telegramAccount: affiliate?.telegramAccount || "",
      instagramUsername: affiliate?.instagramUsername || "",
      phoneNumber: affiliate?.phoneNumber || "",
    },
  });

  // Update form when affiliate data loads
  useEffect(() => {
    if (affiliate) {
      profileForm.reset({
        username: affiliate.username || "",
        email: affiliate.email || "",
        fullName: affiliate.fullName || "",
        country: affiliate.country || "",
        telegramAccount: affiliate.telegramAccount || "",
        instagramUsername: affiliate.instagramUsername || "",
        phoneNumber: affiliate.phoneNumber || "",
      });
    }
  }, [affiliate, profileForm]);

  const { data: stats } = useQuery<{
    totalClicks: number;
    totalConversions: number;
    totalCommission: number;
  }>({
    queryKey: ["/api/affiliates", affiliate?.username, "stats"],
    enabled: !!affiliate?.username,
  });

  const { data: referrals } = useQuery<Referral[]>({
    queryKey: ["/api/affiliates", affiliate?.username, "referrals"],
    enabled: !!affiliate?.username,
  });

  type Booking = {
    id: string;
    attendeeName: string;
    attendeeEmail: string;
    eventTime: string;
    tier?: string;
    status: string;
    saleStatus?: string | null;
    commissionAmount?: number | null;
    commissionPaid?: boolean;
    createdAt: string;
  };

  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["/api/affiliates", affiliate?.username, "bookings"],
    enabled: !!affiliate?.username,
    refetchInterval: 30000, // Refetch every 30 seconds to sync with founder dashboard updates
  });

  const { data: commissions, refetch: refetchCommissions, isLoading: commissionsLoading } = useQuery<{
    currentBalance: { usd: string };
    totalEarned: { usd: string };
    totalPaid: { usd: string };
  }>({
    queryKey: ["/api/affiliates", affiliate?.username, "commissions"],
    queryFn: async () => {
      if (!affiliate?.username) throw new Error("No affiliate username");
      const res = await fetch(`/api/affiliates/${affiliate.username}/commissions`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!affiliate?.username,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 0,
    gcTime: 0,
    retry: 1,
  });
  
  // Refetch when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Affiliate Dashboard] Page visible, refetching commissions...');
        refetchCommissions();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetchCommissions]);
  
  // Also refetch on focus
  useEffect(() => {
    const handleFocus = () => {
      console.log('[Affiliate Dashboard] Window focused, refetching commissions...');
      refetchCommissions();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchCommissions]);

  // Debug logging and validation for commissions
  // Scroll to hash anchor when page loads
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && affiliate) {
      // Wait for content to render, then scroll
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight the element briefly
          element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
          }, 2000);
        }
      }, 500);
    }
  }, [affiliate, location]);

  useEffect(() => {
    if (commissions && affiliate?.username === 'mojgan') {
      const balance = parseFloat(commissions.currentBalance.usd);
      const expectedBalance = 2918.75;
      
      console.log('[Affiliate Dashboard] Commissions data:', {
        currentBalance: commissions.currentBalance.usd,
        currentBalanceParsed: balance,
        totalEarned: commissions.totalEarned.usd,
        totalPaid: commissions.totalPaid.usd,
        raw: commissions,
      });
      
      if (Math.abs(balance - expectedBalance) > 0.01) {
        console.error('[Affiliate Dashboard] ⚠️ BALANCE MISMATCH!', {
          displayed: balance,
          expected: expectedBalance,
          difference: Math.abs(balance - expectedBalance),
        });
      } else {
        console.log('[Affiliate Dashboard] ✅ Balance is correct');
      }
    }
  }, [commissions, affiliate?.username]);

  type Transaction = {
    id: string;
    amount: number;
    description: string | null;
    status: string;
    paidAt: string | null;
    createdAt: string;
  };

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/affiliates", affiliate?.username, "transactions"],
    enabled: !!affiliate?.username,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const registerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof registerSchema>) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return await response.json();
    },
    onSuccess: async () => {
      await refetchSession();
      toast({
        title: "Success!",
        description: "Your affiliate account has been created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create affiliate account",
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return await response.json();
    },
    onSuccess: async () => {
      await refetchSession();
      toast({
        title: "Success!",
        description: "You've been logged in.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof paymentSchema>) => {
      const response = await apiRequest(
        "PUT",
        `/api/affiliates/${affiliate?.username}/payment`,
        data
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({
        title: "Success!",
        description: "Payment information has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update payment information",
        variant: "destructive",
      });
    },
  });

  const profileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const response = await apiRequest(
        "PUT",
        `/api/affiliates/${affiliate?.username}/profile`,
        data
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({
        title: "Success!",
        description: "Profile information has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile information",
        variant: "destructive",
      });
    },
  });

  const requestPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!affiliate?.id) {
        throw new Error("Affiliate not found");
      }
      const response = await apiRequest(
        "POST",
        `/api/affiliates/${affiliate.username}/request-payment`,
        {}
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affiliates", affiliate?.username, "commissions"] });
      toast({
        title: "Payment Request Sent!",
        description: "Your payment request has been sent to the founder. You will be notified when payment is processed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Request failed",
        description: error.message || "Failed to send payment request",
        variant: "destructive",
      });
    },
  });

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(data);
  };

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onPaymentSubmit = (data: z.infer<typeof paymentSchema>) => {
    paymentMutation.mutate(data);
  };

  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    profileMutation.mutate(data);
  };

  // Calculate account duration
  const getAccountDuration = () => {
    if (!affiliate?.createdAt) return "N/A";
    const created = new Date(affiliate.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      if (remainingMonths === 0) {
        return `${years} year${years !== 1 ? 's' : ''}`;
      }
      return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
  };

  const copyReferralLink = () => {
    if (affiliate?.username) {
      const link = `${window.location.origin}/?ref=${affiliate.username}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard.",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      queryClient.clear();
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  if (!affiliate && !affiliateLoading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/90 via-primary/85 to-secondary/90 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
            <Link href="/">
              <button className="font-bold text-2xl flex items-center gap-2 hover:opacity-80 transition-opacity">
                <span className="inline-block">
                  <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                    Kaba
                  </span>
                  <span className="text-white">Content</span>
                </span>
              </button>
            </Link>
          </div>
        </nav>

        <div className="pt-24 pb-16 px-4 md:px-8">
          <div className="max-w-2xl mx-auto">
            <Link href="/">
              <button className="mb-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-home">
                <ArrowLeft className="w-5 h-5" />
                Back to Home
              </button>
            </Link>

            <Card>
              <CardHeader>
                {/* Sign Up / Login Toggle Buttons */}
                <div className="flex gap-2 mb-6">
                  <Button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 rounded-full ${
                      !isLogin
                        ? "bg-black text-white hover:bg-gray-900"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Sign Up
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 rounded-full ${
                      isLogin
                        ? "bg-black text-white hover:bg-gray-900"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Sign In
                  </Button>
                </div>
                <CardTitle className="text-3xl">{isLogin ? "Login" : "Join Our Affiliate Program"}</CardTitle>
                <p className="text-muted-foreground mt-2">
                  {isLogin
                    ? "Login to access your affiliate dashboard."
                    : "Earn 25% commission on every sale you refer. Register below to get your unique referral link."}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLogin ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username or Email</Label>
                      <Input
                        id="login-username"
                        placeholder="johnsmith or john@example.com"
                        autoComplete="username"
                        data-testid="input-login-username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          data-testid="input-login-password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                      onClick={() => {
                        const usernameInput = document.getElementById('login-username') as HTMLInputElement;
                        const passwordInput = document.getElementById('login-password') as HTMLInputElement;
                        const emailOrUsername = usernameInput?.value;
                        const password = passwordInput?.value;
                        if (emailOrUsername && password) {
                          loginMutation.mutate({ emailOrUsername, password });
                        }
                      }}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="signup-username">Username</Label>
                      <Input
                        id="signup-username"
                        placeholder="johnsmith"
                        autoComplete="username"
                        data-testid="input-username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="john@example.com"
                        autoComplete="email"
                        data-testid="input-email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          data-testid="input-password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                      onClick={() => {
                        const usernameInput = document.getElementById('signup-username') as HTMLInputElement;
                        const emailInput = document.getElementById('signup-email') as HTMLInputElement;
                        const passwordInput = document.getElementById('signup-password') as HTMLInputElement;
                        const username = usernameInput?.value;
                        const email = emailInput?.value;
                        const password = passwordInput?.value;
                        if (username && email && password) {
                          registerMutation.mutate({ username, email, password });
                        }
                      }}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Affiliate Account"}
                    </Button>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (affiliateLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/90 via-primary/85 to-secondary/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/">
            <button className="font-bold text-2xl flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="inline-block">
                <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  Kaba
                </span>
                <span className="text-white">Content</span>
              </span>
            </button>
          </Link>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-white"
            data-testid="button-logout"
          >
            Logout
          </Button>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Affiliate Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Welcome back, {affiliate?.username}!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-total-clicks">
                  {stats?.totalClicks || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-total-conversions">
                  {stats?.totalConversions || 0}
                </div>
              </CardContent>
            </Card>

            <Card id="total-commission">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-total-commission">
                  ${stats?.totalCommission ? (stats.totalCommission / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card id="current-balance">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      console.log('[Affiliate Dashboard] Refreshing commissions...');
                      refetchCommissions();
                    }}
                    className="h-6 w-6"
                    title="Refresh balance"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                      <path d="M3 21v-5h5" />
                    </svg>
                  </Button>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1" data-testid="current-balance">
                  {(() => {
                    const balance = commissions?.currentBalance?.usd;
                    // Debug logging
                    if (affiliate?.username === 'mojgan') {
                      console.log('[Affiliate Dashboard] Current Balance Display:', {
                        rawCommissions: commissions,
                        balanceValue: balance,
                        type: typeof balance,
                      });
                    }
                    return `$${balance || "0.00"}`;
                  })()}
                </div>
                <p className="text-xs text-muted-foreground mt-2 mb-4">
                  Available commissions not paid yet
                </p>
                {commissions && parseFloat(commissions.currentBalance.usd) > 0 && (
                  <Button
                    onClick={() => requestPaymentMutation.mutate()}
                    disabled={requestPaymentMutation.isPending}
                    className="w-full"
                  >
                    {requestPaymentMutation.isPending ? "Requesting..." : "Request Payment"}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">
                  ${commissions?.totalEarned.usd || "0.00"}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Lifetime commissions from referrals
                </p>
              </CardContent>
            </Card>

            <Card id="total-paid">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">
                  ${commissions?.totalPaid.usd || "0.00"}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Lifetime commissions paid out
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Profile Information Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly className="bg-muted" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter your full name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <CountrySelect
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Select your country"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="telegramAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telegram Account</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="@username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="instagramUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram Username</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="@username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+1 (555) 123-4567" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Account Created: {affiliate?.createdAt ? new Date(affiliate.createdAt).toLocaleDateString() : "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Account Duration: {getAccountDuration()}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={profileMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    {profileMutation.isPending ? "Saving..." : "Save Profile"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Your Referral Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Share this link to earn commissions</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={`${window.location.origin}/?ref=${affiliate?.username}`}
                      readOnly
                      data-testid="input-referral-link"
                    />
                    <Button onClick={copyReferralLink} size="icon" data-testid="button-copy-link">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">How it works:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>1. Share your referral link with potential customers</li>
                    <li>2. When they book a call and become a client, you earn 25%</li>
                    <li>3. Commission is paid on their first month's subscription</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
                    <FormField
                      control={paymentForm.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={affiliate?.paymentMethod || field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-payment-method">
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="paypal">PayPal</SelectItem>
                              <SelectItem value="etransfer">E-Transfer</SelectItem>
                              <SelectItem value="banktransfer">Bank Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="paymentDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Details</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Email, phone, or account number"
                              {...field}
                              defaultValue={affiliate?.paymentDetails || ""}
                              data-testid="input-payment-details"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={paymentMutation.isPending}
                      data-testid="button-update-payment"
                    >
                      {paymentMutation.isPending ? "Updating..." : "Update Payment Info"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Bookings Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Referred Bookings</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                All bookings from people who used your referral link
              </p>
            </CardHeader>
            <CardContent>
              {!bookings || bookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No bookings yet. Share your link to start earning commissions!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Attendee</th>
                        <th className="text-left py-3 px-4">Date & Time</th>
                        <th className="text-left py-3 px-4">Tier</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-right py-3 px-4">Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr
                          key={booking.id}
                          className="border-b hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{booking.attendeeName}</div>
                              <div className="text-sm text-muted-foreground">{booking.attendeeEmail}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              {new Date(booking.eventTime).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(booking.eventTime).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {booking.tier ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                                {booking.tier}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not set</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {booking.saleStatus === "sold" ? (
                              <span className="flex items-center gap-2 text-green-600 font-medium">
                                <CheckCircle2 className="h-4 w-4" />
                                Sold
                              </span>
                            ) : booking.saleStatus === "failed" ? (
                              <span className="flex items-center gap-2 text-red-600 font-medium">
                                <XCircle className="h-4 w-4" />
                                Failed
                              </span>
                            ) : (
                              <span className="text-muted-foreground capitalize text-sm">
                                {booking.status === "call_scheduled" ? "Call Scheduled" :
                                 booking.status === "no_show" ? "No Show" :
                                 booking.status === "follow_up" ? "Follow Up" :
                                 booking.status === "no_interest" ? "No Interest" :
                                 booking.status === "sale" ? "Sale" :
                                 booking.status || "Pending"}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {booking.saleStatus === "sold" && booking.commissionAmount ? (
                              <span className="font-semibold text-green-600 text-lg">
                                ${(booking.commissionAmount / 100).toFixed(2)}
                              </span>
                            ) : booking.saleStatus === "sold" ? (
                              <span className="text-muted-foreground text-sm">Calculating...</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transactions Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Payment Transactions</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                History of commission payments received
              </p>
            </CardHeader>
            <CardContent>
              {!transactions || transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payments received yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Description</th>
                        <th className="text-right py-3 px-4">Amount</th>
                        <th className="text-left py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              {transaction.description || "Commission payment"}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-semibold text-green-600 text-lg">
                              ${(transaction.amount / 100).toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {transaction.status === "paid" ? (
                              <span className="flex items-center gap-2 text-green-600 font-medium">
                                <CheckCircle2 className="h-4 w-4" />
                                Paid
                              </span>
                            ) : (
                              <span className="text-muted-foreground capitalize text-sm">
                                {transaction.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              {!referrals || referrals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No referrals yet. Share your link to start earning!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">IP Address</th>
                        <th className="text-left py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map((referral) => (
                        <tr
                          key={referral.id}
                          className="border-b hover-elevate"
                          data-testid={`row-referral-${referral.id}`}
                        >
                          <td className="py-3 px-4">
                            {new Date(referral.timestamp).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">{referral.visitorIP || "N/A"}</td>
                          <td className="py-3 px-4">
                            {referral.converted ? (
                              <span className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                Converted
                              </span>
                            ) : (
                              <span className="flex items-center gap-2 text-muted-foreground">
                                <XCircle className="h-4 w-4" />
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
