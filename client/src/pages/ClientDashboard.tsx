import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Download, Upload, LogOut, Settings, User, CreditCard, FileText, Instagram, Youtube, Facebook, Twitter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
};

type SocialMediaAccount = {
  id: string;
  platform: string;
  username: string;
  password: string | null;
};

export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const { data: client, isLoading } = useQuery<Client>({
    queryKey: ["/api/clients/session"],
    retry: false,
  });

  const { data: socialAccounts } = useQuery<SocialMediaAccount[]>({
    queryKey: ["/api/clients", client?.id, "social-accounts"],
    enabled: !!client?.id,
  });

  const { data: contracts } = useQuery<any[]>({
    queryKey: ["/api/clients", client?.id, "contracts"],
    enabled: !!client?.id,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/clients/logout", {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/login");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
    switch (platform.toLowerCase()) {
      case "instagram":
        return <Instagram className="w-5 h-5" />;
      case "youtube":
        return <Youtube className="w-5 h-5" />;
      case "facebook":
        return <Facebook className="w-5 h-5" />;
      case "twitter":
        return <Twitter className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4">
              <img src="/logo.png" alt="KabaContent" className="w-8 h-8 md:w-10 md:h-10 rounded-lg" />
              <div>
                <h1 className="text-lg md:text-xl font-bold">KabaContent</h1>
                <p className="text-xs md:text-sm text-gray-600">Client Dashboard</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="text-sm"
            >
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="w-auto inline-flex">
              <TabsTrigger value="profile" className="text-xs md:text-sm whitespace-nowrap">Profile</TabsTrigger>
              <TabsTrigger value="social-accounts" className="text-xs md:text-sm whitespace-nowrap">Accounts</TabsTrigger>
              <TabsTrigger value="contracts" className="text-xs md:text-sm whitespace-nowrap">Contracts</TabsTrigger>
              <TabsTrigger value="billing" className="text-xs md:text-sm whitespace-nowrap">Billing</TabsTrigger>
            </TabsList>
          </div>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input value={client.email} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Full Name</Label>
                  <Input value={client.fullName || "Not set"} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Username</Label>
                  <Input value={client.username} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Subscription Tier</Label>
                  <Input value={client.tier || "Not set"} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input value={client.phoneNumber || "Not set"} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Instagram Username</Label>
                  <Input value={client.instagramUsername || "Not set"} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Client Since</Label>
                  <Input value={new Date(client.clientSince).toLocaleDateString()} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Total Spent</Label>
                  <Input value={`$${(client.totalSpent / 100).toFixed(2)}`} readOnly className="bg-gray-50" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Media Accounts Tab */}
          <TabsContent value="social-accounts">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                {socialAccounts && socialAccounts.length > 0 ? (
                  <div className="space-y-4">
                    {socialAccounts.map((account) => (
                      <div key={account.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getPlatformIcon(account.platform)}
                            <div>
                              <p className="font-medium">{account.platform}</p>
                              <p className="text-sm text-gray-600">@{account.username}</p>
                            </div>
                          </div>
                          {account.password && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono">
                                {revealedPasswords[account.id] ? account.password : "••••••••"}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(account.id)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                {revealedPasswords[account.id] ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No social media accounts added yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts">
            <Card>
              <CardHeader>
                <CardTitle>Contracts & Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {contracts && contracts.length > 0 ? (
                  <div className="space-y-2">
                    {contracts.map((contract) => (
                      <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium">{contract.name}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(contract.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No contracts or documents available.</p>
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

