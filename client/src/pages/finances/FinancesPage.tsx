import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Edit, Trash2, Users, UserCheck, ExternalLink, ChevronDown, ChevronRight, CreditCard, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Income = {
  id: string;
  amount: number;
  source: string;
  description: string | null;
  date: string;
  clientId: string | null;
  createdAt: string;
  updatedAt: string;
};

type Client = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
};

type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string;
  isSubscription: boolean;
  subscriptionDate: string | null;
  nextPaymentDate: string | null;
  date: string;
  memberId: string | null;
  createdAt: string;
  updatedAt: string;
};

const EXPENSE_CATEGORIES = [
  { value: "monthly_payment", label: "Monthly Payment / Subscription" },
  { value: "office_equipment", label: "Office Equipment" },
  { value: "supplies", label: "Supplies" },
  { value: "repairs", label: "Repairs" },
  { value: "utilities", label: "Utilities" },
  { value: "internet", label: "Internet" },
  { value: "food_drink", label: "Food & Drink" },
  { value: "travel", label: "Travel" },
  { value: "tech", label: "Tech" },
  { value: "tools_software", label: "Tools & Software" },
  { value: "employee_payment", label: "Member Payment" },
  { value: "affiliate_payment", label: "Affiliate Payment" },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347'];

type MemberFinancialData = {
  id: string;
  username: string;
  fullName: string | null;
  role?: string;
  currentBalance: number;
  currentBalanceUSD: number;
  totalEarned: number;
  totalEarnedUSD: number;
  totalPaid: number;
  totalPaidUSD: number;
};

type MemberTransaction = {
  id: string;
  type: string;
  points: number;
  description: string;
  createdAt: string;
};

type AffiliateFinancialData = {
  id: string;
  username: string;
  email: string;
  totalCommission: number;
  totalConversions: number;
};

type MemberFinancialSummary = {
  totalPointsPaid: number;
  totalUSDPaid: number;
  totalCurrentOwed: number;
  totalCurrentOwedUSD: number;
  totalPointsEarned: number;
  totalEarnedUSD: number;
  pointsToUsdRate: number;
  members: MemberFinancialData[];
};

type AffiliateFinancialSummary = {
  totalCommissionPaid: number;
  totalCommissionOwed: number;
  affiliates: AffiliateFinancialData[];
};

function MemberAffiliateFinancialSummary() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Affiliate payment state
  const [affiliatePayDialogOpen, setAffiliatePayDialogOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateFinancialData | null>(null);
  const [affiliatePayAmount, setAffiliatePayAmount] = useState("");
  const [affiliatePayFull, setAffiliatePayFull] = useState(false);

  // Member payment state
  const [memberPayDialogOpen, setMemberPayDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberFinancialData | null>(null);
  const [memberPayPoints, setMemberPayPoints] = useState("");
  const [memberPayFull, setMemberPayFull] = useState(false);
  const [memberPayNote, setMemberPayNote] = useState("");

  // Expanded member rows (for transaction history)
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const { data: memberSummary, isLoading: memberLoading } = useQuery<MemberFinancialSummary>({
    queryKey: ["/api/founder/finances/members"],
  });

  const { data: affiliateSummary, isLoading: affiliateLoading, error: affiliateError } = useQuery<AffiliateFinancialSummary>({
    queryKey: ["/api/founder/finances/affiliates"],
    queryFn: async () => {
      const res = await fetch("/api/founder/finances/affiliates", { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      return res.json();
    },
    retry: false,
  });

  // Fetch transactions for expanded member
  const { data: expandedMemberTxs, isLoading: txLoading } = useQuery<MemberTransaction[]>({
    queryKey: ["/api/founder/members", expandedMemberId, "transactions"],
    queryFn: async () => {
      const res = await fetch(`/api/founder/members/${expandedMemberId}/transactions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    enabled: !!expandedMemberId,
  });

  const rate = memberSummary?.pointsToUsdRate ?? 0.05208333;

  const formatPoints = (pts: number) => pts.toLocaleString("en-US");
  const formatUSD = (usd: number) => `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const ptsToUSD = (pts: number) => formatUSD(pts * rate);

  // Affiliate payment mutation
  const affiliatePayMutation = useMutation({
    mutationFn: async (data: { affiliateId: string; amount?: string; payFullBalance: boolean }) => {
      const sessionCheck = await fetch("/api/founder/session", { credentials: "include" });
      if (!sessionCheck.ok) throw new Error("Founder session expired. Please log in again.");
      const response = await apiRequest("POST", `/api/founder/affiliates/${data.affiliateId}/pay`, {
        amount: data.amount,
        payFullBalance: data.payFullBalance,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses/summary"] });
      setAffiliatePayDialogOpen(false);
      toast({
        title: "Payment Processed!",
        description: `Paid $${(data.transaction.amount / 100).toFixed(2)} to ${selectedAffiliate?.username}.`,
      });
    },
    onError: (error: any) => {
      toast({ title: "Payment Failed", description: error.message || "Failed to process payment", variant: "destructive" });
    },
  });

  // Member payment mutation
  const memberPayMutation = useMutation({
    mutationFn: async ({ memberId, points, note }: { memberId: string; points: number; note: string }) => {
      const response = await apiRequest("POST", `/api/founder/members/${memberId}/pay`, { points, note });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/members"] });
      if (expandedMemberId) {
        queryClient.invalidateQueries({ queryKey: ["/api/founder/members", expandedMemberId, "transactions"] });
      }
      setMemberPayDialogOpen(false);
      setMemberPayPoints("");
      setMemberPayNote("");
      setMemberPayFull(false);
      toast({
        title: "Payment Recorded!",
        description: `Marked ${memberPayFull ? selectedMember?.currentBalance : memberPayPoints} pts paid to ${selectedMember?.fullName || selectedMember?.username}. New balance: ${data.newBalance} pts (${formatUSD(data.newBalance * rate)})`,
      });
    },
    onError: (error: any) => {
      toast({ title: "Payment Failed", description: error.message || "Failed to record payment", variant: "destructive" });
    },
  });

  const handleMemberPay = () => {
    if (!selectedMember) return;
    const points = memberPayFull ? selectedMember.currentBalance : Math.round(parseFloat(memberPayPoints));
    if (!points || points <= 0) {
      toast({ title: "Invalid Amount", description: "Enter a valid points amount", variant: "destructive" });
      return;
    }
    memberPayMutation.mutate({ memberId: selectedMember.id, points, note: memberPayNote });
  };

  return (
    <div className="space-y-6">
      {/* ── Summary Cards ── */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" /> Members Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All-Time Earned</CardTitle>
              <Award className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {memberLoading ? "..." : formatPoints(memberSummary?.totalPointsEarned || 0)} pts
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {memberLoading ? "..." : formatUSD(memberSummary?.totalEarnedUSD || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Currently Owed</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {memberLoading ? "..." : formatPoints(memberSummary?.totalCurrentOwed || 0)} pts
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {memberLoading ? "..." : formatUSD(memberSummary?.totalCurrentOwedUSD || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {memberLoading ? "..." : formatPoints(memberSummary?.totalPointsPaid || 0)} pts
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {memberLoading ? "..." : formatUSD(memberSummary?.totalUSDPaid || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exchange Rate</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold text-gray-700 tabular-nums break-all"
                title={memberLoading ? undefined : `$${rate} per point (exact)`}
              >
                {memberLoading ? "..." : `$${rate}`}
              </div>
              <p className="text-xs text-gray-500 mt-1">per point</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Affiliate Cards ── */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4" /> Affiliates Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Owed</CardTitle>
              <TrendingDown className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {affiliateLoading ? "..." : formatUSD(affiliateSummary?.totalCommissionOwed || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">{affiliateSummary?.affiliates.length || 0} affiliates</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {affiliateLoading ? "..." : formatUSD(affiliateSummary?.totalCommissionPaid || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Total paid to affiliates</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Members Financial Summary Table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Members Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {memberLoading ? (
            <div className="text-center py-8 text-gray-500">Loading member data...</div>
          ) : memberSummary && memberSummary.members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold w-6"></th>
                    <th className="text-left py-3 px-4 font-semibold">Member</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-500">Role</th>
                    <th className="text-right py-3 px-4 font-semibold text-orange-700">Owed (pts)</th>
                    <th className="text-right py-3 px-4 font-semibold text-orange-700">Owed (USD)</th>
                    <th className="text-right py-3 px-4 font-semibold text-blue-700">All-Time Earned (pts)</th>
                    <th className="text-right py-3 px-4 font-semibold text-blue-700">All-Time Earned (USD)</th>
                    <th className="text-right py-3 px-4 font-semibold text-green-700">Total Paid (pts)</th>
                    <th className="text-right py-3 px-4 font-semibold text-green-700">Total Paid (USD)</th>
                    <th className="text-center py-3 px-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {memberSummary.members.map((member) => (
                    <React.Fragment key={member.id}>
                      <tr
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedMemberId(expandedMemberId === member.id ? null : member.id)}
                      >
                        <td className="py-3 px-4 text-gray-400">
                          {expandedMemberId === member.id
                            ? <ChevronDown className="w-4 h-4" />
                            : <ChevronRight className="w-4 h-4" />}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          <div>{member.fullName || member.username}</div>
                          {member.fullName && <div className="text-xs text-gray-400">@{member.username}</div>}
                        </td>
                        <td className="py-3 px-4 text-gray-500 capitalize">{member.role || "member"}</td>
                        <td className="py-3 px-4 text-right font-semibold text-orange-600">
                          {formatPoints(member.currentBalance)}
                        </td>
                        <td className="py-3 px-4 text-right text-orange-500">
                          {ptsToUSD(member.currentBalance)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-blue-600">
                          {formatPoints(member.totalEarned)}
                        </td>
                        <td className="py-3 px-4 text-right text-blue-500">
                          {formatUSD(member.totalEarnedUSD)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600">
                          {formatPoints(member.totalPaid)}
                        </td>
                        <td className="py-3 px-4 text-right text-green-500">
                          {formatUSD(member.totalPaidUSD)}
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          {member.currentBalance > 0 && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => {
                                setSelectedMember(member);
                                setMemberPayPoints("");
                                setMemberPayFull(false);
                                setMemberPayNote("");
                                setMemberPayDialogOpen(true);
                              }}
                            >
                              Pay
                            </Button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded transaction history */}
                      {expandedMemberId === member.id && (
                        <tr key={`${member.id}-txs`} className="bg-gray-50">
                          <td colSpan={10} className="px-8 py-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Transaction History</p>
                            {txLoading ? (
                              <p className="text-sm text-gray-400">Loading...</p>
                            ) : expandedMemberTxs && expandedMemberTxs.length > 0 ? (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-1 px-2">Date</th>
                                    <th className="text-left py-1 px-2">Type</th>
                                    <th className="text-left py-1 px-2">Description</th>
                                    <th className="text-right py-1 px-2">Points</th>
                                    <th className="text-right py-1 px-2">USD</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {expandedMemberTxs.map((tx) => (
                                    <tr key={tx.id} className="border-b border-gray-200">
                                      <td className="py-1 px-2 text-gray-500">
                                        {new Date(tx.createdAt).toLocaleDateString()}
                                      </td>
                                      <td className="py-1 px-2">
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                          tx.type === "earned" ? "bg-blue-100 text-blue-700" :
                                          tx.type === "paid" ? "bg-green-100 text-green-700" :
                                          tx.type === "bonus" ? "bg-purple-100 text-purple-700" :
                                          tx.type === "deducted" ? "bg-orange-100 text-orange-700" :
                                          "bg-red-100 text-red-700"
                                        }`}>
                                          {tx.type === "deducted" ? "Deducted" : tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                        </span>
                                      </td>
                                      <td className="py-1 px-2 text-gray-600">{tx.description}</td>
                                      <td className={`py-1 px-2 text-right font-medium ${
                                        tx.type === "paid" || tx.type === "penalty" || tx.type === "deducted" ? "text-red-600" : "text-blue-600"
                                      }`}>
                                        {tx.type === "paid" || tx.type === "deducted" || tx.type === "penalty" ? "-" : "+"}{formatPoints(tx.points)}
                                      </td>
                                      <td className={`py-1 px-2 text-right ${
                                        tx.type === "paid" || tx.type === "penalty" || tx.type === "deducted" ? "text-red-500" : "text-blue-500"
                                      }`}>
                                        {ptsToUSD(tx.points)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="text-sm text-gray-400">No transactions yet.</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No members found</div>
          )}
        </CardContent>
      </Card>

      {/* ── Affiliates Table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Affiliates Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {affiliateLoading ? (
            <div className="text-center py-8 text-gray-500">Loading affiliate data...</div>
          ) : affiliateError ? (
            <div className="text-center py-8 text-red-500">
              Error loading affiliates: {affiliateError instanceof Error ? affiliateError.message : "Unknown error"}
            </div>
          ) : affiliateSummary && affiliateSummary.affiliates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold">Affiliate</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-right py-3 px-4 font-semibold">Conversions</th>
                    <th className="text-right py-3 px-4 font-semibold text-purple-700">Commission Owed</th>
                    <th className="text-center py-3 px-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliateSummary.affiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td
                        className="py-3 px-4 font-medium flex items-center gap-2 cursor-pointer"
                        onClick={() => setLocation(`/dashboard?section=affiliates&affiliate=${encodeURIComponent(affiliate.username)}`)}
                      >
                        {affiliate.username}
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      </td>
                      <td className="py-3 px-4 text-gray-600">{affiliate.email}</td>
                      <td className="py-3 px-4 text-right">{affiliate.totalConversions}</td>
                      <td className="py-3 px-4 text-right text-purple-600 font-semibold">
                        {formatUSD(affiliate.totalCommission)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {affiliate.totalCommission > 0 && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAffiliate(affiliate);
                              setAffiliatePayAmount("");
                              setAffiliatePayFull(false);
                              setAffiliatePayDialogOpen(true);
                            }}
                          >
                            Pay
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No affiliates found</div>
          )}
        </CardContent>
      </Card>

      {/* ── Pay Member Dialog ── */}
      <Dialog open={memberPayDialogOpen} onOpenChange={setMemberPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Member</DialogTitle>
            <DialogDescription>
              Record a payment to {selectedMember?.fullName || selectedMember?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-orange-50 rounded-lg text-center">
                <p className="text-xs text-gray-500 mb-1">Currently Owed</p>
                <p className="font-bold text-orange-600">{formatPoints(selectedMember?.currentBalance || 0)} pts</p>
                <p className="text-xs text-gray-500">{ptsToUSD(selectedMember?.currentBalance || 0)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-gray-500 mb-1">All-Time Earned</p>
                <p className="font-bold text-blue-600">{formatPoints(selectedMember?.totalEarned || 0)} pts</p>
                <p className="text-xs text-gray-500">{formatUSD(selectedMember?.totalEarnedUSD || 0)}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-gray-500 mb-1">Previously Paid</p>
                <p className="font-bold text-green-600">{formatPoints(selectedMember?.totalPaid || 0)} pts</p>
                <p className="text-xs text-gray-500">{formatUSD(selectedMember?.totalPaidUSD || 0)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="memberPayFull"
                checked={memberPayFull}
                onChange={(e) => { setMemberPayFull(e.target.checked); if (e.target.checked) setMemberPayPoints(""); }}
                className="h-4 w-4"
              />
              <Label htmlFor="memberPayFull" className="cursor-pointer">
                Pay full balance ({formatPoints(selectedMember?.currentBalance || 0)} pts — {ptsToUSD(selectedMember?.currentBalance || 0)})
              </Label>
            </div>

            {!memberPayFull && (
              <div className="space-y-1">
                <Label htmlFor="memberPayPoints">Points to Pay</Label>
                <Input
                  id="memberPayPoints"
                  type="number"
                  min="1"
                  max={selectedMember?.currentBalance || 0}
                  value={memberPayPoints}
                  onChange={(e) => setMemberPayPoints(e.target.value)}
                  placeholder="Enter points amount"
                />
                {memberPayPoints && !isNaN(parseFloat(memberPayPoints)) && (
                  <p className="text-xs text-gray-500">≈ {ptsToUSD(parseFloat(memberPayPoints))}</p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="memberPayNote">Note (optional)</Label>
              <Input
                id="memberPayNote"
                value={memberPayNote}
                onChange={(e) => setMemberPayNote(e.target.value)}
                placeholder="e.g. Weekly payout"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberPayDialogOpen(false)} disabled={memberPayMutation.isPending}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleMemberPay}
              disabled={memberPayMutation.isPending || (!memberPayFull && (!memberPayPoints || parseFloat(memberPayPoints) <= 0))}
            >
              {memberPayMutation.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Pay Affiliate Dialog ── */}
      <Dialog open={affiliatePayDialogOpen} onOpenChange={setAffiliatePayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Affiliate Commission</DialogTitle>
            <DialogDescription>Pay commission to {selectedAffiliate?.username}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600">Current Balance Owed</div>
              <div className="text-2xl font-bold text-purple-600">
                {selectedAffiliate ? formatUSD(selectedAffiliate.totalCommission) : "$0.00"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="affiliatePayFull"
                checked={affiliatePayFull}
                onChange={(e) => { setAffiliatePayFull(e.target.checked); if (e.target.checked) setAffiliatePayAmount(""); }}
                className="h-4 w-4"
              />
              <Label htmlFor="affiliatePayFull" className="cursor-pointer">
                Pay full balance (${selectedAffiliate?.totalCommission.toFixed(2) || "0.00"})
              </Label>
            </div>
            {!affiliatePayFull && (
              <div>
                <Label htmlFor="affiliatePayAmount">Payment Amount (USD)</Label>
                <Input
                  id="affiliatePayAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedAffiliate?.totalCommission || 0}
                  value={affiliatePayAmount}
                  onChange={(e) => setAffiliatePayAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="mt-1"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAffiliatePayDialogOpen(false)} disabled={affiliatePayMutation.isPending}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (!selectedAffiliate) return;
                affiliatePayMutation.mutate({ affiliateId: selectedAffiliate.id, amount: affiliatePayAmount, payFullBalance: affiliatePayFull });
              }}
              disabled={affiliatePayMutation.isPending || (!affiliatePayFull && (!affiliatePayAmount || parseFloat(affiliatePayAmount) <= 0))}
            >
              {affiliatePayMutation.isPending ? "Processing..." : affiliatePayFull ? "Pay Full Balance" : "Pay Amount"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FinancesPage() {
  const { toast } = useToast();
  const [addIncomeDialogOpen, setAddIncomeDialogOpen] = useState(false);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [incomeForm, setIncomeForm] = useState({ amount: "", source: "", description: "", date: new Date().toISOString().split('T')[0], clientId: "" });
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: "office_equipment",
    description: "",
    isSubscription: false,
    subscriptionDate: "",
    date: new Date().toISOString().split('T')[0],
    memberId: "",
  });

  const { data: income, isLoading: incomeLoading } = useQuery<Income[]>({
    queryKey: ["/api/founder/finances/income"],
  });

  const { data: expenses, isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/founder/finances/expenses"],
  });

  const { data: monthlyIncome } = useQuery<{ total: number }>({
    queryKey: ["/api/founder/finances/income/summary", "monthly"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/founder/finances/income/summary?period=monthly", {});
      return await response.json();
    },
  });

  const { data: yearlyIncome } = useQuery<{ total: number }>({
    queryKey: ["/api/founder/finances/income/summary", "yearly"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/founder/finances/income/summary?period=yearly", {});
      return await response.json();
    },
  });

  const { data: allTimeIncome } = useQuery<{ total: number }>({
    queryKey: ["/api/founder/finances/income/summary", "all-time"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/founder/finances/income/summary?period=all-time", {});
      return await response.json();
    },
  });

  const { data: monthlyExpenses } = useQuery<{ total: number }>({
    queryKey: ["/api/founder/finances/expenses/summary", "monthly"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/founder/finances/expenses/summary?period=monthly", {});
      return await response.json();
    },
  });

  const { data: yearlyExpenses } = useQuery<{ total: number }>({
    queryKey: ["/api/founder/finances/expenses/summary", "yearly"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/founder/finances/expenses/summary?period=yearly", {});
      return await response.json();
    },
  });

  const { data: allTimeExpenses } = useQuery<{ total: number }>({
    queryKey: ["/api/founder/finances/expenses/summary", "all-time"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/founder/finances/expenses/summary?period=all-time", {});
      return await response.json();
    },
  });

  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients/list"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/clients/list", {});
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      const data = await response.json();
      // The endpoint returns clients with stats, but we just need the basic client info
      return Array.isArray(data) ? data : [];
    },
    enabled: addIncomeDialogOpen || !!editingIncome, // Only fetch when dialog is open
  });

  const { data: memberPayments } = useQuery<{ total: number }>({
    queryKey: ["/api/founder/finances/expenses/employee-payments"],
  });

  const createIncomeMutation = useMutation({
    mutationFn: async (data: { amount: number; source: string; description?: string; date: string; clientId?: string }) => {
      const response = await apiRequest("POST", "/api/founder/finances/income", {
        amount: Math.round(data.amount * 100), // Convert to cents
        source: data.source,
        description: data.description || null,
        date: data.date,
        clientId: data.clientId && data.clientId !== "none" && data.clientId.trim() !== "" ? data.clientId : null,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to create income" }));
        throw new Error(errorData.details || errorData.error || "Failed to create income");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/income"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/income/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/income/summary", "monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/income/summary", "yearly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/income/summary", "all-time"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients/my-invoices"] });
      setAddIncomeDialogOpen(false);
      setIncomeForm({ amount: "", source: "", description: "", date: new Date().toISOString().split('T')[0], clientId: "" });
      toast({ title: "Success!", description: "Income record added successfully." });
    },
    onError: (error: any) => {
      console.error("Income creation error:", error);
      let errorMessage = "Failed to add income";
      try {
        if (error?.responseText) {
          const errorObj = JSON.parse(error.responseText);
          errorMessage = errorObj.details || errorObj.error || errorMessage;
        } else if (error?.message) {
          errorMessage = error.message;
        }
      } catch (e) {
        // If parsing fails, use default message
      }
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    },
  });

  const updateIncomeMutation = useMutation({
    mutationFn: async (data: { id: string; amount?: number; source?: string; description?: string; date?: string; clientId?: string }) => {
      const response = await apiRequest("PATCH", `/api/founder/finances/income/${data.id}`, {
        amount: data.amount ? Math.round(data.amount * 100) : undefined,
        source: data.source,
        description: data.description || null,
        date: data.date,
        clientId: data.clientId || null,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/income"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/income/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/income/summary", "monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/income/summary", "yearly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/income/summary", "all-time"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients/my-invoices"] });
      setEditingIncome(null);
      toast({ title: "Success!", description: "Income record updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update income", variant: "destructive" });
    },
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/founder/finances/income/${id}`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/income"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/income/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/income/summary", "monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/income/summary", "yearly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/income/summary", "all-time"] });
      toast({ title: "Success!", description: "Income record deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete income", variant: "destructive" });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/founder/finances/expenses", {
        amount: Math.round(parseFloat(data.amount) * 100), // Convert to cents
        category: data.category,
        description: data.description,
        isSubscription: data.isSubscription,
        subscriptionDate: data.isSubscription && data.subscriptionDate ? data.subscriptionDate : null,
        date: data.date,
        memberId: data.memberId || null,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses/summary", "monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses/summary", "yearly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses/summary", "all-time"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses/employee-payments"] });
      setAddExpenseDialogOpen(false);
      setExpenseForm({
        amount: "",
        category: "office_equipment",
        description: "",
        isSubscription: false,
        subscriptionDate: "",
        date: new Date().toISOString().split('T')[0],
        memberId: "",
      });
      toast({ title: "Success!", description: "Expense added successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add expense", variant: "destructive" });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/founder/finances/expenses/${data.id}`, {
        amount: data.amount ? Math.round(data.amount * 100) : undefined,
        category: data.category,
        description: data.description,
        isSubscription: data.isSubscription,
        subscriptionDate: data.isSubscription && data.subscriptionDate ? data.subscriptionDate : null,
        date: data.date,
        memberId: data.memberId || null,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses/summary", "monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses/summary", "yearly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses/summary", "all-time"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses/employee-payments"] });
      setEditingExpense(null);
      toast({ title: "Success!", description: "Expense updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update expense", variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/founder/finances/expenses/${id}`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses/summary", "monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses/summary", "yearly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses/summary", "all-time"] });
      queryClient.invalidateQueries({ queryKey: ["/api/founder/finances/expenses/employee-payments"] });
      toast({ title: "Success!", description: "Expense deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete expense", variant: "destructive" });
    },
  });

  const handleAddIncome = () => {
    if (!incomeForm.amount || !incomeForm.source) {
      toast({ title: "Error", description: "Amount and source are required", variant: "destructive" });
      return;
    }
    createIncomeMutation.mutate({
      amount: parseFloat(incomeForm.amount),
      source: incomeForm.source,
      description: incomeForm.description,
      date: incomeForm.date,
      clientId: incomeForm.clientId || undefined,
    });
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income);
    setIncomeForm({
      amount: (income.amount / 100).toFixed(2),
      source: income.source,
      description: income.description || "",
      date: new Date(income.date).toISOString().split('T')[0],
      clientId: income.clientId || "",
    });
    setAddIncomeDialogOpen(true);
  };

  const handleUpdateIncome = () => {
    if (!editingIncome || !incomeForm.amount || !incomeForm.source) {
      toast({ title: "Error", description: "Amount and source are required", variant: "destructive" });
      return;
    }
    updateIncomeMutation.mutate({ 
      id: editingIncome.id, 
      amount: parseFloat(incomeForm.amount),
      source: incomeForm.source,
      description: incomeForm.description,
      date: incomeForm.date,
      clientId: incomeForm.clientId,
    });
  };

  const handleAddExpense = () => {
    if (!expenseForm.amount || !expenseForm.description) {
      toast({ title: "Error", description: "Amount and description are required", variant: "destructive" });
      return;
    }
    if (expenseForm.isSubscription && !expenseForm.subscriptionDate) {
      toast({ title: "Error", description: "Subscription date is required for subscriptions", variant: "destructive" });
      return;
    }
    createExpenseMutation.mutate(expenseForm);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      amount: (expense.amount / 100).toFixed(2),
      category: expense.category,
      description: expense.description,
      isSubscription: expense.isSubscription,
      subscriptionDate: expense.subscriptionDate ? new Date(expense.subscriptionDate).toISOString().split('T')[0] : "",
      date: new Date(expense.date).toISOString().split('T')[0],
      memberId: expense.memberId || "",
    });
    setAddExpenseDialogOpen(true);
  };

  const handleUpdateExpense = () => {
    if (!editingExpense || !expenseForm.amount || !expenseForm.description) {
      toast({ title: "Error", description: "Amount and description are required", variant: "destructive" });
      return;
    }
    if (expenseForm.isSubscription && !expenseForm.subscriptionDate) {
      toast({ title: "Error", description: "Subscription date is required for subscriptions", variant: "destructive" });
      return;
    }
    updateExpenseMutation.mutate({ id: editingExpense.id, ...expenseForm });
  };

  // Prepare chart data
  const incomeChartData = income?.map(i => ({
    date: new Date(i.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: i.amount / 100,
  })) || [];

  const expenseChartData = expenses?.map(e => ({
    date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: e.amount / 100,
  })) || [];

  const expenseByCategoryData = expenses?.reduce((acc, e) => {
    const category = EXPENSE_CATEGORIES.find(c => c.value === e.category)?.label || e.category;
    acc[category] = (acc[category] || 0) + (e.amount / 100);
    return acc;
  }, {} as Record<string, number>) || {};

  const pieChartData = Object.entries(expenseByCategoryData).map(([name, value]) => ({ name, value }));

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCategory = (category: string) => {
    return EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Finances</h1>
          <p className="text-gray-600">Track income, expenses, and financial overview</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => {
            setEditingIncome(null);
            setIncomeForm({ amount: "", source: "", description: "", date: new Date().toISOString().split('T')[0], clientId: "" });
            setAddIncomeDialogOpen(true);
          }} className="bg-black text-white hover:bg-gray-900">
            <Plus className="w-4 h-4 mr-2" />
            Add Income
          </Button>
          <Button onClick={() => {
            setEditingExpense(null);
            setExpenseForm({
              amount: "",
              category: "office_equipment",
              description: "",
              isSubscription: false,
              subscriptionDate: "",
              date: new Date().toISOString().split('T')[0],
              memberId: "",
            });
            setAddExpenseDialogOpen(true);
          }} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Income Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(monthlyIncome?.total || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yearly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(yearlyIncome?.total || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All-Time Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(allTimeIncome?.total || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(monthlyExpenses?.total || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yearly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(yearlyExpenses?.total || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All-Time Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(allTimeExpenses?.total || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(memberPayments?.total || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total paid to members</p>
          </CardContent>
        </Card>
      </div>

      {/* Member & Affiliate Financial Summary */}
      <MemberAffiliateFinancialSummary />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Income Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={incomeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#00C49F" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                <Legend />
                <Bar dataKey="amount" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Income and Expenses Lists */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {incomeLoading || expensesLoading ? (
                <div className="text-center py-8 text-gray-500">Loading transactions...</div>
              ) : (() => {
                // Combine income and expenses into a single transactions array
                const transactions = [
                  ...(income || []).map(item => ({
                    id: `income-${item.id}`,
                    originalId: item.id,
                    originalItem: item,
                    type: 'income' as const,
                    date: item.date,
                    description: item.description || item.source,
                    source: item.source,
                    category: null,
                    amount: item.amount,
                    isSubscription: false,
                    nextPaymentDate: null,
                    createdAt: item.createdAt,
                  })),
                  ...(expenses || []).map(item => ({
                    id: `expense-${item.id}`,
                    originalId: item.id,
                    originalItem: item,
                    type: 'expense' as const,
                    date: item.date,
                    description: item.description,
                    source: null,
                    category: item.category,
                    amount: item.amount,
                    isSubscription: item.isSubscription,
                    nextPaymentDate: item.nextPaymentDate,
                    createdAt: item.createdAt,
                  })),
                ].sort((a, b) => {
                  // Sort by date (most recent first)
                  const dateA = new Date(a.date).getTime();
                  const dateB = new Date(b.date).getTime();
                  if (dateA !== dateB) {
                    return dateB - dateA;
                  }
                  // If same date, sort by creation time
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });

                return transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Date</th>
                          <th className="text-left py-3 px-4 font-semibold">Type</th>
                          <th className="text-left py-3 px-4 font-semibold">Description</th>
                          <th className="text-left py-3 px-4 font-semibold">Category/Source</th>
                          <th className="text-right py-3 px-4 font-semibold">Amount</th>
                          <th className="text-right py-3 px-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{new Date(transaction.date).toLocaleDateString()}</td>
                            <td className="py-3 px-4">
                              {transaction.type === 'income' ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                  Income
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                  Expense
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-gray-600">{transaction.description}</td>
                            <td className="py-3 px-4">
                              {transaction.type === 'income' ? (
                                <span className="text-gray-600">{transaction.source}</span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                  {formatCategory(transaction.category || '')}
                                </span>
                              )}
                            </td>
                            <td className={`py-3 px-4 text-right font-semibold ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                {transaction.type === 'income' ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        handleEditIncome(transaction.originalItem as Income);
                                      }}
                                      className="h-8 w-8"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        if (confirm("Are you sure you want to delete this income record?")) {
                                          deleteIncomeMutation.mutate(transaction.originalId);
                                        }
                                      }}
                                      className="h-8 w-8 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        handleEditExpense(transaction.originalItem as Expense);
                                      }}
                                      className="h-8 w-8"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        if (confirm("Are you sure you want to delete this expense?")) {
                                          deleteExpenseMutation.mutate(transaction.originalId);
                                        }
                                      }}
                                      className="h-8 w-8 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No transactions yet</div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Income Records</CardTitle>
            </CardHeader>
            <CardContent>
              {incomeLoading ? (
                <div className="text-center py-8 text-gray-500">Loading income...</div>
              ) : income && income.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Date</th>
                        <th className="text-left py-3 px-4 font-semibold">Source</th>
                        <th className="text-left py-3 px-4 font-semibold">Description</th>
                        <th className="text-right py-3 px-4 font-semibold">Amount</th>
                        <th className="text-right py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {income.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{new Date(item.date).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-medium">{item.source}</td>
                          <td className="py-3 px-4 text-gray-600">{item.description || "-"}</td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditIncome(item)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this income record?")) {
                                    deleteIncomeMutation.mutate(item.id);
                                  }
                                }}
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No income records yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {expensesLoading ? (
                <div className="text-center py-8 text-gray-500">Loading expenses...</div>
              ) : expenses && expenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Date</th>
                        <th className="text-left py-3 px-4 font-semibold">Category</th>
                        <th className="text-left py-3 px-4 font-semibold">Description</th>
                        <th className="text-left py-3 px-4 font-semibold">Subscription</th>
                        <th className="text-left py-3 px-4 font-semibold">Next Payment</th>
                        <th className="text-right py-3 px-4 font-semibold">Amount</th>
                        <th className="text-right py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => (
                        <tr key={expense.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{new Date(expense.date).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {formatCategory(expense.category)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{expense.description}</td>
                          <td className="py-3 px-4">
                            {expense.isSubscription ? (
                              <span className="text-green-600">Yes</span>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {expense.nextPaymentDate ? (
                              <span className="text-blue-600">
                                {new Date(expense.nextPaymentDate).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-red-600">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditExpense(expense)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this expense?")) {
                                    deleteExpenseMutation.mutate(expense.id);
                                  }
                                }}
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No expenses yet</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Income Dialog */}
      <Dialog open={addIncomeDialogOpen} onOpenChange={(open) => {
        setAddIncomeDialogOpen(open);
        if (!open) {
          setEditingIncome(null);
          setIncomeForm({ amount: "", source: "", description: "", date: new Date().toISOString().split('T')[0], clientId: "" });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingIncome ? "Edit Income" : "Add Income"}</DialogTitle>
            <DialogDescription>
              {editingIncome ? "Update income record" : "Add a new income record"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Amount (USD)</Label>
              <Input
                type="number"
                step="0.01"
                value={incomeForm.amount}
                onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Source</Label>
              <Input
                value={incomeForm.source}
                onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                placeholder="e.g., Client Payment, Affiliate Commission"
              />
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={incomeForm.description}
                onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={incomeForm.date}
                onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Link to Client (Optional)</Label>
              <Select
                value={incomeForm.clientId || undefined}
                onValueChange={(value) => setIncomeForm({ ...incomeForm, clientId: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={clientsLoading ? "Loading clients..." : "Select a client (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {clientsLoading ? (
                    <SelectItem value="loading" disabled>Loading clients...</SelectItem>
                  ) : clients && clients.length > 0 ? (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.fullName || client.username} ({client.email})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-clients" disabled>No clients available</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                If linked to a client, this will also create a transaction in their dashboard
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddIncomeDialogOpen(false);
              setEditingIncome(null);
              setIncomeForm({ amount: "", source: "", description: "", date: new Date().toISOString().split('T')[0], clientId: "" });
            }}>
              Cancel
            </Button>
            <Button
              onClick={editingIncome ? handleUpdateIncome : handleAddIncome}
              disabled={createIncomeMutation.isPending || updateIncomeMutation.isPending}
              className="bg-black text-white hover:bg-gray-900"
            >
              {editingIncome
                ? (updateIncomeMutation.isPending ? "Updating..." : "Update")
                : (createIncomeMutation.isPending ? "Adding..." : "Add Income")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={addExpenseDialogOpen} onOpenChange={(open) => {
        setAddExpenseDialogOpen(open);
        if (!open) {
          setEditingExpense(null);
          setExpenseForm({
            amount: "",
            category: "office_equipment",
            description: "",
            isSubscription: false,
            subscriptionDate: "",
            date: new Date().toISOString().split('T')[0],
            memberId: "",
          });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
            <DialogDescription>
              {editingExpense ? "Update expense record" : "Add a new expense record"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Amount (USD)</Label>
              <Input
                type="number"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={expenseForm.category}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="Describe the expense..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isSubscription"
                checked={expenseForm.isSubscription}
                onChange={(e) => setExpenseForm({ ...expenseForm, isSubscription: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isSubscription" className="cursor-pointer">
                Monthly Payment / Subscription
              </Label>
            </div>
            {expenseForm.isSubscription && (
              <div>
                <Label>Subscription Start Date</Label>
                <Input
                  type="date"
                  value={expenseForm.subscriptionDate}
                  onChange={(e) => setExpenseForm({ ...expenseForm, subscriptionDate: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Next payment date will be calculated automatically (1 month from start date)
                </p>
              </div>
            )}
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddExpenseDialogOpen(false);
              setEditingExpense(null);
              setExpenseForm({
                amount: "",
                category: "office_equipment",
                description: "",
                isSubscription: false,
                subscriptionDate: "",
                date: new Date().toISOString().split('T')[0],
                memberId: "",
              });
            }}>
              Cancel
            </Button>
            <Button
              onClick={editingExpense ? handleUpdateExpense : handleAddExpense}
              disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
              className="bg-black text-white hover:bg-gray-900"
            >
              {editingExpense
                ? (updateExpenseMutation.isPending ? "Updating..." : "Update")
                : (createExpenseMutation.isPending ? "Adding..." : "Add Expense")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

