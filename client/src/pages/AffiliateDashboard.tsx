import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
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
} from "lucide-react";
import type { Affiliate, Referral } from "@shared/schema";

const registerSchema = z.object({
  username: z
    .string()
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters"),
  email: z.string().email("Please enter a valid email address"),
});

const paymentSchema = z.object({
  paymentMethod: z.enum(["paypal", "etransfer", "banktransfer"]),
  paymentDetails: z.string().min(1, "Payment details are required"),
});

export default function AffiliateDashboard() {
  const [currentAffiliate, setCurrentAffiliate] = useState<string | null>(
    localStorage.getItem("kaba_affiliate_username")
  );
  const { toast } = useToast();

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });

  const paymentForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: "paypal",
      paymentDetails: "",
    },
  });

  const { data: affiliate, isLoading: affiliateLoading } = useQuery<Affiliate>({
    queryKey: ["/api/affiliates", currentAffiliate],
    enabled: !!currentAffiliate,
  });

  const { data: stats } = useQuery<{
    totalClicks: number;
    totalConversions: number;
    totalCommission: number;
  }>({
    queryKey: ["/api/affiliates", currentAffiliate, "stats"],
    enabled: !!currentAffiliate,
  });

  const { data: referrals } = useQuery<Referral[]>({
    queryKey: ["/api/affiliates", currentAffiliate, "referrals"],
    enabled: !!currentAffiliate,
  });

  const registerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof registerSchema>) => {
      return await apiRequest<Affiliate>("/api/affiliates", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      localStorage.setItem("kaba_affiliate_username", data.username);
      setCurrentAffiliate(data.username);
      queryClient.invalidateQueries({ queryKey: ["/api/affiliates", data.username] });
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

  const paymentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof paymentSchema>) => {
      return await apiRequest<Affiliate>(
        `/api/affiliates/${currentAffiliate}/payment`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/affiliates", currentAffiliate] });
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

  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(data);
  };

  const onPaymentSubmit = (data: z.infer<typeof paymentSchema>) => {
    paymentMutation.mutate(data);
  };

  const copyReferralLink = () => {
    if (currentAffiliate) {
      const link = `${window.location.origin}/?ref=${currentAffiliate}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard.",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("kaba_affiliate_username");
    setCurrentAffiliate(null);
  };

  if (!currentAffiliate) {
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
                <CardTitle className="text-3xl">Join Our Affiliate Program</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Earn 25% commission on every sale you refer. Register below to get your unique referral link.
                </p>
              </CardHeader>
              <CardContent>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="johnsmith"
                              {...field}
                              data-testid="input-username"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john@example.com"
                              {...field}
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Affiliate Account"}
                    </Button>
                  </form>
                </Form>
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-total-commission">
                  ${stats?.totalCommission?.toLocaleString() || 0}
                </div>
              </CardContent>
            </Card>
          </div>

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
                      value={`${window.location.origin}/?ref=${currentAffiliate}`}
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
