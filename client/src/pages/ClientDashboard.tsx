import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogOut, Edit, Save, X, Instagram, Youtube, Facebook, Twitter, Calendar, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Client = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  tier: string | null;
  phoneNumber: string | null;
  instagramUsername: string | null;
  offerLink: string | null;
  createdAt: string;
  totalSpent: number;
  clientSince: string;
};

type SocialMediaAccount = {
  id: string;
  accountName: string | null;
  username: string;
  password: string | null;
  email: string | null;
  emailPassword: string | null;
  platforms: string; // JSON string array
  profilePhoto: string | null;
};

type Invoice = {
  id: string;
  clientId?: string;
  amount: number; // in cents
  currency: string;
  description: string;
  status: string; // "pending", "paid", "cancelled"
  paidAt: string | null;
  createdAt: string;
  date?: string; // For income records
  type?: string; // "invoice" or "income"
};

type NextPaymentInfo = {
  nextPaymentDate: string | null;
  amount: number; // in cents
  standardAmount?: number; // Standard tier price in cents
  tier: string | null;
  monthlyPaymentDate: number | null;
  nextPaymentNote?: string | null;
};

export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Client>>({});

  const { data: client, isLoading } = useQuery<Client>({
    queryKey: ["/api/clients/session"],
    queryFn: async () => {
      const res = await fetch("/api/clients/session", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          setLocation("/client-login");
        }
        throw new Error("Not authenticated");
      }
      return res.json();
    },
    retry: false,
  });

  const { data: socialAccounts, refetch: refetchAccounts } = useQuery<SocialMediaAccount[]>({
    queryKey: ["/api/clients/my-accounts"],
    queryFn: async () => {
      const res = await fetch("/api/clients/my-accounts", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return res.json();
    },
    enabled: !!client?.id,
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/clients/my-invoices"],
    queryFn: async () => {
      const res = await fetch("/api/clients/my-invoices", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    },
    enabled: !!client?.id,
  });

  const { data: nextPaymentInfo } = useQuery<NextPaymentInfo & { nextPaymentNote?: string | null }>({
    queryKey: ["/api/clients/next-payment"],
    queryFn: async () => {
      const res = await fetch("/api/clients/next-payment", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch next payment info");
      return res.json();
    },
    enabled: !!client?.id,
  });

  const { data: paymentPlans } = useQuery<Array<any>>({
    queryKey: ["/api/clients/my-payment-plans"],
    queryFn: async () => {
      const res = await fetch("/api/clients/my-payment-plans", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch payment plans");
      return res.json();
    },
    enabled: !!client?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<Client>) => {
      const response = await apiRequest("PUT", "/api/clients/profile", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients/session"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients/profile"] });
      setIsEditing(false);
      toast({
        title: "Success!",
        description: "Profile updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/clients/logout", {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/client-login");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!client) {
    setLocation("/login");
    return null;
  }

  const togglePasswordVisibility = (accountId: string) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  const getPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    switch (platformLower) {
      case "instagram":
        return <Instagram className="w-5 h-5 text-pink-600" />;
      case "youtube":
        return <Youtube className="w-5 h-5 text-red-600" />;
      case "facebook":
        return <Facebook className="w-5 h-5 text-blue-600" />;
      case "twitter":
        return <Twitter className="w-5 h-5 text-blue-400" />;
      case "tiktok":
        return <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold">T</div>;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-400" />;
    }
  };

  const parsePlatforms = (platformsString: string | null): string[] => {
    if (!platformsString) return [];
    try {
      return JSON.parse(platformsString);
    } catch {
      return [];
    }
  };

  const handleEditStart = () => {
    setEditFormData({
      fullName: client.fullName || "",
      email: client.email,
      phoneNumber: client.phoneNumber || "",
      instagramUsername: client.instagramUsername || "",
      offerLink: client.offerLink || "",
    });
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditFormData({});
  };

  const handleEditSave = () => {
    updateProfileMutation.mutate(editFormData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="KabaContent" className="w-10 h-10 rounded-lg" />
              <div>
                <h1 className="text-xl font-bold">KabaContent</h1>
                <p className="text-sm text-gray-600">Client Dashboard</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="social-accounts">Social Media Accounts</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Next Payment Card */}
            {nextPaymentInfo && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Next Payment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Next Payment Date</Label>
                      <div className="text-lg font-semibold text-gray-900 mt-1">
                        {nextPaymentInfo.nextPaymentDate
                          ? new Date(nextPaymentInfo.nextPaymentDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Not scheduled"}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Amount Due</Label>
                      <div className="text-lg font-semibold text-green-600 mt-1 flex items-center gap-1">
                        <DollarSign className="w-5 h-5" />
                        {nextPaymentInfo.amount > 0
                          ? (nextPaymentInfo.amount / 100).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "N/A"}
                      </div>
                      {nextPaymentInfo.tier && nextPaymentInfo.standardAmount && nextPaymentInfo.standardAmount > nextPaymentInfo.amount && (
                        <div className="text-xs text-gray-500 mt-1">
                          <span className="line-through">
                            ${(nextPaymentInfo.standardAmount / 100).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span className="text-green-600 ml-2">
                            {((nextPaymentInfo.standardAmount - nextPaymentInfo.amount) / nextPaymentInfo.standardAmount * 100).toFixed(1)}% discount
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {nextPaymentInfo.tier && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Tier:</span> {nextPaymentInfo.tier}
                      </p>
                    </div>
                  )}
                  {nextPaymentInfo.nextPaymentNote && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <Label className="text-xs text-gray-500">Note</Label>
                      <p className="text-sm text-gray-700 mt-1">{nextPaymentInfo.nextPaymentNote}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Profile Information</CardTitle>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={handleEditStart}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleEditCancel}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleEditSave} disabled={updateProfileMutation.isPending}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Username</Label>
                  <Input value={client.username} readOnly className="bg-gray-50" />
                  <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                </div>
                <div>
                  <Label>Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editFormData.email || client.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    />
                  ) : (
                    <Input value={client.email} readOnly className="bg-gray-50" />
                  )}
                </div>
                <div>
                  <Label>Full Name</Label>
                  {isEditing ? (
                    <Input
                      value={editFormData.fullName || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <Input value={client.fullName || "Not set"} readOnly className="bg-gray-50" />
                  )}
                </div>
                <div>
                  <Label>Phone Number</Label>
                  {isEditing ? (
                    <Input
                      value={editFormData.phoneNumber || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <Input value={client.phoneNumber || "Not set"} readOnly className="bg-gray-50" />
                  )}
                </div>
                <div>
                  <Label>Instagram Username</Label>
                  {isEditing ? (
                    <Input
                      value={editFormData.instagramUsername || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, instagramUsername: e.target.value })}
                      placeholder="Enter your Instagram username"
                    />
                  ) : (
                    <Input value={client.instagramUsername || "Not set"} readOnly className="bg-gray-50" />
                  )}
                </div>
                <div>
                  <Label>Offer Link</Label>
                  {isEditing ? (
                    <Input
                      type="url"
                      value={editFormData.offerLink || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, offerLink: e.target.value })}
                      placeholder="https://example.com/offer"
                    />
                  ) : (
                    <div className="space-y-2">
                      {client.offerLink ? (
                        <div className="flex items-center gap-2">
                          <Input value={client.offerLink} readOnly className="bg-gray-50 flex-1" />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const link = client.offerLink!;
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
                        <Input value="Not set" readOnly className="bg-gray-50" />
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Enter your offer or promotion link</p>
                </div>
                <div>
                  <Label>Subscription Tier</Label>
                  <Input value={client.tier || "Not set"} readOnly className="bg-gray-50" />
                  <p className="text-xs text-gray-500 mt-1">Contact support to change your tier</p>
                </div>
                <div>
                  <Label>Client Since</Label>
                  <Input value={new Date(client.createdAt).toLocaleDateString()} readOnly className="bg-gray-50" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <div className="space-y-6">
              {/* Next Payment Card */}
              {nextPaymentInfo && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Next Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Next Payment Date</Label>
                        <div className="text-lg font-semibold text-gray-900 mt-1">
                          {nextPaymentInfo.nextPaymentDate
                            ? new Date(nextPaymentInfo.nextPaymentDate).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "Not scheduled"}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Amount Due</Label>
                        <div className="text-lg font-semibold text-green-600 mt-1 flex items-center gap-1">
                          <DollarSign className="w-5 h-5" />
                          {nextPaymentInfo.amount > 0
                            ? (nextPaymentInfo.amount / 100).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "N/A"}
                        </div>
                        {nextPaymentInfo.tier && nextPaymentInfo.standardAmount && nextPaymentInfo.standardAmount > nextPaymentInfo.amount && (
                          <div className="text-xs text-gray-500 mt-1">
                            <span className="line-through">
                              ${(nextPaymentInfo.standardAmount / 100).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            <span className="text-green-600 ml-2">
                              {((nextPaymentInfo.standardAmount - nextPaymentInfo.amount) / nextPaymentInfo.standardAmount * 100).toFixed(1)}% discount
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {nextPaymentInfo.tier && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Tier:</span> {nextPaymentInfo.tier}
                        </p>
                      </div>
                    )}
                    {nextPaymentInfo.nextPaymentNote && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <Label className="text-xs text-gray-500">Note</Label>
                        <p className="text-sm text-gray-700 mt-1">{nextPaymentInfo.nextPaymentNote}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Payment Plans */}
              {paymentPlans && paymentPlans.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Plans</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      View your monthly payment plans and installments
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
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
                              {plan.installments && plan.installments.map((inst: any) => (
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
                                    <Badge variant={inst.status === "paid" ? "default" : inst.status === "overdue" ? "destructive" : "secondary"}>
                                      {inst.status === "paid" ? "✓ Paid" : inst.status === "overdue" ? "Overdue" : "Pending"}
                                    </Badge>
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
                  </CardContent>
                </Card>
              )}

              {/* Transactions Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    View all your payment transactions and invoices
                  </p>
                </CardHeader>
                <CardContent>
                  {invoices && invoices.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Paid Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.map((invoice) => {
                            // Use date field if available (for income records), otherwise use createdAt
                            const displayDate = invoice.date || invoice.createdAt;
                            return (
                              <TableRow key={invoice.id}>
                                <TableCell>
                                  {new Date(displayDate).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </TableCell>
                                <TableCell className="font-medium">{invoice.description}</TableCell>
                                <TableCell>
                                  <span className="font-semibold text-green-600">
                                    ${(invoice.amount / 100).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      invoice.status === "paid"
                                        ? "default"
                                        : invoice.status === "pending"
                                        ? "secondary"
                                        : "destructive"
                                    }
                                  >
                                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {invoice.paidAt
                                    ? new Date(invoice.paidAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      })
                                    : "-"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-2">No transactions found.</p>
                      <p className="text-sm text-gray-400">
                        Your payment history will appear here once you have transactions.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Social Media Accounts Tab */}
          <TabsContent value="social-accounts">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Accounts</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  View all accounts and credentials created for your social media platforms
                </p>
              </CardHeader>
              <CardContent>
                {socialAccounts && socialAccounts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Profile</TableHead>
                          <TableHead>Account Name</TableHead>
                          <TableHead>Platforms</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Password</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Email Password</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {socialAccounts.map((account) => {
                          const platforms = parsePlatforms(account.platforms);
                          const isPasswordRevealed = revealedPasswords[account.id];

                          return (
                            <TableRow key={account.id}>
                              <TableCell>
                                {account.profilePhoto ? (
                                  <img
                                    src={account.profilePhoto}
                                    alt={`${account.accountName} profile`}
                                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                    data-testid={`img-profile-${account.id}`}
                                  />
                                ) : (
                                  <div 
                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border border-gray-200"
                                    data-testid={`placeholder-profile-${account.id}`}
                                  >
                                    <span className="text-gray-500 text-sm font-medium">
                                      {account.accountName?.charAt(0)?.toUpperCase() || account.username?.charAt(0)?.toUpperCase() || "?"}
                                    </span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                {account.accountName || "Untitled Account"}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-2">
                                  {platforms.map((platform) => (
                                    <Badge key={platform} variant="outline" className="flex items-center gap-1">
                                      {getPlatformIcon(platform)}
                                      <span className="capitalize">{platform}</span>
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-sm">{account.username}</span>
                              </TableCell>
                              <TableCell>
                                {account.password ? (
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm">
                                      {isPasswordRevealed ? account.password : "••••••••"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => togglePasswordVisibility(account.id)}
                                      className="text-gray-500 hover:text-gray-700 p-1"
                                      title={isPasswordRevealed ? "Hide password" : "Show password"}
                                    >
                                      {isPasswordRevealed ? (
                                        <EyeOff className="w-4 h-4" />
                                      ) : (
                                        <Eye className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">Not set</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {account.email ? (
                                  <span className="font-mono text-sm">{account.email}</span>
                                ) : (
                                  <span className="text-gray-400 text-sm">Not set</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {account.emailPassword ? (
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm">
                                      {revealedPasswords[`email-${account.id}`] ? account.emailPassword : "••••••••"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => togglePasswordVisibility(`email-${account.id}`)}
                                      className="text-gray-500 hover:text-gray-700 p-1"
                                      title={revealedPasswords[`email-${account.id}`] ? "Hide password" : "Show password"}
                                    >
                                      {revealedPasswords[`email-${account.id}`] ? (
                                        <EyeOff className="w-4 h-4" />
                                      ) : (
                                        <Eye className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">Not set</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-2">No social media accounts added yet.</p>
                    <p className="text-sm text-gray-400">
                      Contact your account manager to add social media accounts for your platforms.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Subscription Tier</Label>
                  <Input value={client.tier || "Not set"} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Total Spent</Label>
                  <Input value={`$${(client.totalSpent / 100).toFixed(2)}`} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Client Since</Label>
                  <Input value={new Date(client.clientSince).toLocaleDateString()} readOnly className="bg-gray-50" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
