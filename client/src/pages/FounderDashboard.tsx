import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LogOut, Plus } from "lucide-react";
import { Link } from "wouter";

type AffiliateWithStats = {
  id: string;
  username: string;
  email: string;
  paymentMethod?: string;
  paymentDetails?: string;
  createdAt: Date;
  totalClicks: number;
  totalConversions: number;
  totalCommission: number;
};

type Booking = {
  id: string;
  attendeeName: string;
  attendeeEmail: string;
  eventTime: string;
  referralId?: string;
  affiliateUsername?: string;
  tier?: string;
  status: string;
  createdAt: string;
  confirmedAt?: string;
};

const founderLoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const createBookingSchema = z.object({
  attendeeName: z.string().min(1, "Name is required"),
  attendeeEmail: z.string().email("Invalid email"),
  eventTime: z.string().min(1, "Event time is required"),
  affiliateUsername: z.string().optional(),
});

export default function FounderDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoginView, setIsLoginView] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loginForm = useForm({
    resolver: zodResolver(founderLoginSchema),
    defaultValues: {
      password: "",
    },
  });

  const { data: founderSession, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/founder/session"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/founder/session");
        if (response.ok) {
          return await response.json();
        }
        return null;
      } catch {
        return null;
      }
    },
  });

  const { data: affiliates, isLoading: affiliatesLoading } = useQuery<
    AffiliateWithStats[]
  >({
    queryKey: ["/api/founder/affiliates"],
    enabled: !!founderSession,
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/founder/bookings"],
    enabled: !!founderSession,
  });

  const createBookingForm = useForm({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      attendeeName: "",
      attendeeEmail: "",
      eventTime: "",
      affiliateUsername: "",
    },
  });

  const [selectedTiers, setSelectedTiers] = useState<Record<string, string>>({});

  const founderLoginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof founderLoginSchema>) => {
      const response = await apiRequest("POST", "/api/founder/login", data);
      return await response.json();
    },
    onSuccess: async () => {
      setIsLoginView(false);
      await queryClient.invalidateQueries({ queryKey: ["/api/founder/session"] });
      loginForm.reset();
      toast({
        title: "Success!",
        description: "You've been authenticated as founder.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Authentication failed",
        description: error.message || "Invalid founder password",
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
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createBookingSchema>) => {
      const response = await apiRequest("POST", "/api/founder/bookings", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/bookings"] });
      createBookingForm.reset();
      toast({
        title: "Success!",
        description: "Booking created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  const confirmBookingMutation = useMutation({
    mutationFn: async ({ bookingId, tier }: { bookingId: string; tier: string }) => {
      const response = await apiRequest("POST", `/api/founder/bookings/${bookingId}/confirm`, {
        tier,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/bookings"] });
      setSelectedTiers({});
      toast({
        title: "Success!",
        description: "Booking confirmed and sale recorded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm booking",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const onLoginSubmit = (data: z.infer<typeof founderLoginSchema>) => {
    founderLoginMutation.mutate(data);
  };

  const onCreateBookingSubmit = (data: z.infer<typeof createBookingSchema>) => {
    createBookingMutation.mutate(data);
  };

  const handleConfirmBooking = (bookingId: string) => {
    const tier = selectedTiers[bookingId];
    if (!tier) {
      toast({
        title: "Error",
        description: "Please select a tier",
        variant: "destructive",
      });
      return;
    }
    confirmBookingMutation.mutate({ bookingId, tier });
  };

  if (!founderSession && !sessionLoading) {
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
          <div className="max-w-md mx-auto">
            <Link href="/">
              <button
                className="mb-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-back-home"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Home
              </button>
            </Link>

            <Card>
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
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              data-testid="input-founder-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={founderLoginMutation.isPending}
                      data-testid="button-founder-login"
                    >
                      {founderLoginMutation.isPending ? "Authenticating..." : "Access Dashboard"}
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

  if (sessionLoading || affiliatesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl">Loading dashboard...</div>
        </div>
      </div>
    );
  }

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
            data-testid="button-founder-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Founder Dashboard</h1>
            <p className="text-muted-foreground">
              Manage affiliates, bookings, and scheduling
            </p>
          </div>

          <Tabs defaultValue="affiliates" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
            </TabsList>

            <TabsContent value="affiliates">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-total-affiliates">
                  {affiliates?.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-total-clicks">
                  {totalStats.clicks}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-total-conversions">
                  {totalStats.conversions}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-total-commission">
                  ${totalStats.commission.toLocaleString()}
                </div>
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
                data-testid="input-search-affiliates"
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
                        className="border-b hover:bg-muted/50 transition-colors"
                        data-testid={`row-affiliate-${affiliate.id}`}
                      >
                        <td className="py-3 px-4 font-medium" data-testid={`text-username-${affiliate.id}`}>
                          {affiliate.username}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground" data-testid={`text-email-${affiliate.id}`}>
                          {affiliate.email}
                        </td>
                        <td className="py-3 px-4 text-right" data-testid={`text-clicks-${affiliate.id}`}>
                          {affiliate.totalClicks}
                        </td>
                        <td className="py-3 px-4 text-right" data-testid={`text-conversions-${affiliate.id}`}>
                          {affiliate.totalConversions}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold" data-testid={`text-commission-${affiliate.id}`}>
                          ${affiliate.totalCommission.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm" data-testid={`text-joined-${affiliate.id}`}>
                          {new Date(affiliate.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredAffiliates.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No affiliates found
                </div>
              )}
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="bookings">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Pending Bookings</h2>
                  <Button 
                    onClick={() => {
                      const form = createBookingForm;
                      if (!form.getValues("attendeeName")) {
                        form.setFocus("attendeeName");
                      }
                    }}
                    size="sm"
                    variant="outline"
                    data-testid="button-add-booking"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Log Booking
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">New Booking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...createBookingForm}>
                      <form onSubmit={createBookingForm.handleSubmit(onCreateBookingSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={createBookingForm.control}
                            name="attendeeName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Attendee Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-attendee-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createBookingForm.control}
                            name="attendeeEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Attendee Email</FormLabel>
                                <FormControl>
                                  <Input {...field} type="email" data-testid="input-attendee-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createBookingForm.control}
                            name="eventTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Event Time</FormLabel>
                                <FormControl>
                                  <Input {...field} type="datetime-local" data-testid="input-event-time" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createBookingForm.control}
                            name="affiliateUsername"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Affiliate Username (Optional)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="If referred by affiliate" data-testid="input-affiliate-username" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button type="submit" disabled={createBookingMutation.isPending} data-testid="button-submit-booking">
                          {createBookingMutation.isPending ? "Creating..." : "Create Booking"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {(bookings || []).filter(b => b.status === "pending").map((booking) => (
                    <Card key={booking.id} data-testid={`booking-card-${booking.id}`}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <p className="font-semibold text-lg">{booking.attendeeName}</p>
                            <p className="text-sm text-muted-foreground">{booking.attendeeEmail}</p>
                            <p className="text-sm mt-1">
                              {new Date(booking.eventTime).toLocaleString()}
                            </p>
                            {booking.affiliateUsername && (
                              <p className="text-sm text-primary mt-1">
                                Referred by: {booking.affiliateUsername}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <Label>Select Tier</Label>
                              <Select
                                value={selectedTiers[booking.id] || ""}
                                onValueChange={(value) => setSelectedTiers({ ...selectedTiers, [booking.id]: value })}
                              >
                                <SelectTrigger data-testid={`select-tier-${booking.id}`}>
                                  <SelectValue placeholder="Choose tier..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Growth">Growth ($4,000/mo)</SelectItem>
                                  <SelectItem value="Domination">Domination ($7,000/mo)</SelectItem>
                                  <SelectItem value="Empire">Empire ($13,475/mo)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button 
                              onClick={() => handleConfirmBooking(booking.id)}
                              disabled={confirmBookingMutation.isPending}
                              data-testid={`button-confirm-booking-${booking.id}`}
                            >
                              {confirmBookingMutation.isPending ? "Confirming..." : "Confirm Sale"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(bookings || []).filter(b => b.status === "pending").length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No pending bookings
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-12 mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Google Calendar</h2>
            <p className="text-muted-foreground mb-6">
              All your bookings and appointments are synced here.
            </p>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <iframe
                  src="https://calendar.google.com/calendar/embed?src=917c18cec506eb1481e1deb5156a6d561900a80fdea4b234e72820460c74fc4230c%40group.calendar.google.com&ctz=America%2FToronto"
                  style={{
                    border: 0,
                    width: "100%",
                    height: "600px",
                    borderRadius: "0.5rem"
                  }}
                  frameBorder="0"
                  scrolling="no"
                  title="Google Calendar"
                  data-testid="embed-google-calendar"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
