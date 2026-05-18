import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit, Upload, Link, Eye, EyeOff } from "lucide-react";
import FinancialSummary from "./FinancialSummary";
import ActivityOverview from "./ActivityOverview";
import UserInformation from "./UserInformation";
import TransactionsSection from "./TransactionsSection";

type Member = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  profilePicture: string | null;
  role: string;
  memberSince: string;
};

export default function ProfileSection({ member }: { member: Member }) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(member.fullName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { fullName: string }) => {
      const response = await apiRequest("PUT", `/api/members/${member.id}/profile`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members/session"] });
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

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("POST", `/api/members/change-password`, data);
      return await response.json();
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Success!",
        description: "Password changed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = () => {
    updateProfileMutation.mutate({ fullName });
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
      </div>

      {/* Profile Picture and Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700">Profile picture</Label>
              <div className="relative">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                  {member.profilePicture ? (
                    <img src={member.profilePicture} alt={member.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-medium text-gray-600">
                      {member.fullName?.[0] || member.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50">
                  <Upload className="w-3.5 h-3.5 text-gray-600" />
                </button>
              </div>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} className="bg-black text-white hover:bg-gray-900">
                Edit profile
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Email</Label>
              <Input value={member.email} readOnly className="bg-white mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Full name</Label>
              {isEditing ? (
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1"
                />
              ) : (
                <Input value={member.fullName || "Not set"} readOnly className="bg-white mt-1" />
              )}
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Username</Label>
              <Input value={member.username} readOnly className="bg-white mt-1" />
            </div>
            {isEditing && (
              <div className="flex gap-2 pt-2">
                <Button onClick={handleProfileUpdate} disabled={updateProfileMutation.isPending} className="bg-black text-white hover:bg-gray-900">
                  Save
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Current Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">New Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Confirm New Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handlePasswordChange}
                disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
                className="w-full bg-black text-white hover:bg-gray-900"
              >
                {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workspace Currency */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Link className="w-5 h-5 text-gray-700" />
            <CardTitle className="text-lg font-semibold text-gray-900">Workspace Currency</CardTitle>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-1">Exchange Rate</div>
              <div className="text-sm text-gray-700">
                1 point = 0.05208333333333333 USD
              </div>
            </div>
            <div className="px-3 py-1.5 bg-gray-100 rounded-md border border-gray-200">
              <span className="text-sm font-medium text-gray-900">USD</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      {member.id && member.id !== "mock-id" ? (
        <FinancialSummary memberId={member.id} />
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              Please log in to view your financial summary.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Overview */}
      <ActivityOverview memberId={member.id} />

      {/* User Information */}
      <UserInformation member={member} />

      {/* Transactions */}
      {member.id && member.id !== "mock-id" ? (
        <TransactionsSection memberId={member.id} />
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              Please log in to view your transactions.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


