import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Home, 
  MessageSquare, 
  LayoutGrid, 
  Folder, 
  Scissors, 
  Users,
  Calendar,
  Settings,
  HelpCircle,
  LogOut,
  Edit,
  Search,
  Eye,
  Building2,
  Tag,
  FileText,
  FolderOpen,
  Clock,
  User,
  CreditCard,
  Wallet,
  Monitor,
  Box,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import ProfileSection from "./members/ProfileSection";
import FinancialSummary from "./members/FinancialSummary";
import ActivityOverview from "./members/ActivityOverview";
import UserInformation from "./members/UserInformation";
import TransactionsSection from "./members/TransactionsSection";
import BillingSection from "./members/BillingSection";
import PaymentsSection from "./members/PaymentsSection";
import ClippingArea from "./members/ClippingArea";
import ProjectsBoard from "./members/ProjectsBoard";
import TemplatesPage from "./members/TemplatesPage";
import TeamsPage from "./members/TeamsPage";
import ClientsSection from "./members/ClientsSection";
import IssueDetailPage from "./members/IssueDetailPage";
import StatusesPage from "./members/StatusesPage";
import WorkspacePage from "./members/WorkspacePage";
import MembersPage from "./members/MembersPage";
import MyIssuesPage from "./members/MyIssuesPage";
import BoardPage from "./members/BoardPage";
import HomePage from "./members/HomePage";
import TeamDetailPage from "./members/TeamDetailPage";
import { canAccessClipping, canAccessAdmin, canAccessSettings } from "@/lib/permissions";

type Member = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  profilePicture: string | null;
  role: string;
  memberSince: string;
};

type MembersDashboardProps = {
  fromFounderDashboard?: boolean;
  onBackToFounder?: () => void;
};

export default function MembersDashboard(props: MembersDashboardProps = {}) {
  const { fromFounderDashboard = false, onBackToFounder } = props;
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Normalize location - remove trailing slash for consistent matching
  const normalizedLocation = location.endsWith('/') && location !== '/' ? location.slice(0, -1) : location;
  
  // Parse issue detail route manually (use normalized location)
  const issueDetailMatch = normalizedLocation.match(/^\/member-dashboard\/projects\/([^\/]+)\/issues\/([^\/]+)$/);
  const issueDetailParams = issueDetailMatch ? {
    projectId: issueDetailMatch[1],
    issueId: issueDetailMatch[2]
  } : null;
  
  // Parse team detail route manually (use normalized location)
  const teamDetailMatch = normalizedLocation.match(/^\/member-dashboard\/teams\/([^\/]+)$/);
  const teamId = teamDetailMatch ? teamDetailMatch[1] : null;
  
  // Parse section from URL query parameter
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const sectionFromUrl = urlParams.get('section');
  
  // Debug logging
  console.log("[MembersDashboard] Current location:", location, "normalized:", normalizedLocation);
  console.log("[MembersDashboard] Issue detail match:", issueDetailMatch);
  console.log("[MembersDashboard] Issue detail params:", issueDetailParams);
  const [activeSection, setActiveSection] = useState(sectionFromUrl || "clients");
  
  // Update activeSection when location changes
  useEffect(() => {
    console.log("[MembersDashboard] useEffect - location:", location, "normalized:", normalizedLocation, "teamId:", teamId, "issueDetailParams:", issueDetailParams);
    
    // If we're on a team detail page, don't update activeSection
    if (teamId && normalizedLocation.match(/^\/member-dashboard\/teams\/([^\/]+)$/)) {
      console.log("[MembersDashboard] On team detail page, keeping current section");
      return;
    }
    // If we're on an issue detail page, don't update activeSection
    if (issueDetailParams) {
      console.log("[MembersDashboard] On issue detail page, keeping current section");
      return;
    }
    // If we're at /member-dashboard (base route), allow activeSection to be set
    // Don't override it if it's already set (e.g., from back button)
    if (normalizedLocation === "/member-dashboard") {
      console.log("[MembersDashboard] At base route, activeSection:", activeSection);
      // Allow activeSection to be set by the component (e.g., from back button)
      // Don't override it here
      return;
    }
    // If there's a section in the URL, use it
    if (sectionFromUrl) {
      console.log("[MembersDashboard] Setting activeSection from URL:", sectionFromUrl);
      setActiveSection(sectionFromUrl);
    }
  }, [location, normalizedLocation, sectionFromUrl, teamId, issueDetailParams, activeSection]);
  const [activeSubSection, setActiveSubSection] = useState<string | null>(null);
  const [menuMode, setMenuMode] = useState<"main" | "settings">("main");

  const { data: member, isLoading: memberLoading } = useQuery<Member>({
    queryKey: ["/api/members/session"],
    retry: false,
    // Don't fail on error - use mock member instead
    throwOnError: false,
    queryFn: async () => {
      try {
        const res = await fetch("/api/members/session", { credentials: "include" });
        if (!res.ok) {
          return null; // Return null on error, we'll use mock member
        }
        return await res.json();
      } catch (error) {
        return null; // Return null on error, we'll use mock member
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/members/logout", {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/member-login");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    },
  });

  // Temporarily allow access without login for testing
  // if (memberLoading) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="text-xl">Loading dashboard...</div>
  //       </div>
  //     </div>
  //   );
  // }

  // if (!member) {
  //   setLocation("/member-login");
  //   return null;
  // }

  // Mock member data for testing
  const mockMember: Member = {
    id: "mock-id",
    username: "testuser",
    email: "test@example.com",
    fullName: "Test User",
    profilePicture: null,
    role: "MEMBER",
    memberSince: new Date().toISOString(),
  };
  
  // Use mock member if real member is not loaded (for testing)
  const displayMember = member || mockMember;
  
  // Debug logging
  console.log("[MembersDashboard] Member session:", member);
  console.log("[MembersDashboard] Display member ID:", displayMember.id);
  console.log("[MembersDashboard] Display member username:", displayMember.username);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const renderContent = () => {
    // Check if we're viewing a team detail page (only if URL matches the pattern)
    if (teamId && normalizedLocation.match(/^\/member-dashboard\/teams\/([^\/]+)$/)) {
      console.log("[MembersDashboard] Rendering TeamDetailPage for teamId:", teamId);
      return (
        <TeamDetailPage 
          teamId={teamId} 
          onBackToTeams={() => {
            console.log("[MembersDashboard] Back to teams clicked - navigating to teams page");
            // Set activeSection to teams first - this ensures TeamsPage will render
            setActiveSection("teams");
            // Navigate to base route with trailing slash to ensure route matches
            // The wildcard route /member-dashboard/* should match /member-dashboard/
            setLocation("/member-dashboard/");
          }}
        />
      );
    }
    
    // Check if we're viewing an issue detail page (regardless of activeSection)
    if (issueDetailParams) {
      console.log("[MembersDashboard] Rendering IssueDetailPage");
      return (
        <IssueDetailPage 
          fromFounderDashboard={fromFounderDashboard}
          onBackToFounder={onBackToFounder}
        />
      );
    }

    if (activeSection === "profile") {
      return <ProfileSection member={displayMember} />;
    }
    if (activeSection === "billing") {
      return <BillingSection memberId={displayMember.id} />;
    }
    if (activeSection === "payments") {
      return <PaymentsSection />;
    }
    if (activeSection === "workspace") {
      return <WorkspacePage />;
    }
    if (activeSection === "teams") {
      return <TeamsPage />;
    }
    if (activeSection === "members") {
      return <MembersPage />;
    }
    if (activeSection === "clients") {
      return <ClientsSection />;
    }
    if (activeSection === "labels") {
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">Labels</h1>
          <p className="text-muted-foreground">Coming soon</p>
        </div>
      );
    }
    if (activeSection === "templates") {
      return <TemplatesPage />;
    }
    if (activeSection === "projects") {
      return <ProjectsBoard allowCreateProject={menuMode === "settings"} />;
    }
    if (activeSection === "statuses") {
      return <StatusesPage />;
    }
    if (activeSection === "clipping-area") {
      return <ClippingArea />;
    }
    if (activeSection === "home") {
      return <HomePage />;
    }
    if (activeSection === "my-issues") {
      return <MyIssuesPage />;
    }
    if (activeSection === "board") {
      return <BoardPage />;
    }
    if (activeSection === "persian") {
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">Persian</h1>
          <p className="text-muted-foreground">Coming soon</p>
        </div>
      );
    }
    if (activeSection === "calendar") {
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">Calendar</h1>
          <p className="text-muted-foreground">Coming soon</p>
        </div>
      );
    }
    if (activeSection === "settings") {
      return <ProfileSection member={displayMember} />;
    }
    if (activeSection === "help") {
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">Help</h1>
          <p className="text-muted-foreground">Coming soon</p>
        </div>
      );
    }
    return <ProfileSection member={displayMember} />;
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Sidebar - Fixed */}
      <div className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50">
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <Link href="/" className="flex items-center gap-2">
                <img src="/logo.png" alt="KabaContent" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-bold">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Kaba</span>
              <span className="text-gray-900">Content</span>
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 flex-shrink">
          {menuMode === "main" ? (
            <>
              {/* Back to Founder Dashboard (if accessed from founder) */}
              {fromFounderDashboard && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <button
                    onClick={() => {
                      if (onBackToFounder) {
                        onBackToFounder();
                      }
                    }}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Founder Dashboard
                  </button>
                </div>
              )}

              {/* Main Navigation */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveSection("home");
                    setLocation("/member-dashboard/");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection("my-issues");
                    setLocation("/member-dashboard/");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>My issues</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection("board");
                    setLocation("/member-dashboard/");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  <LayoutGrid className="w-5 h-5" />
                  <span>Board</span>
                </button>
              </div>

              {/* WORKSPACE Section */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">WORKSPACE</div>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setActiveSection("projects");
                      setLocation("/member-dashboard/");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                  >
                    <Folder className="w-5 h-5" />
                    <span>Projects</span>
                  </button>
                  {(fromFounderDashboard || canAccessClipping(displayMember.role)) && (
                    <button
                      onClick={() => {
                        setActiveSection("clipping-area");
                        setLocation("/member-dashboard/");
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                        activeSection === "clipping-area" 
                          ? "bg-blue-50 text-blue-700" 
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Scissors className={`w-5 h-5 ${activeSection === "clipping-area" ? "text-blue-700" : ""}`} />
                      <span>Clipping Area</span>
                    </button>
                )}
              </div>
              </div>

              {/* YOUR TEAMS Section */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">YOUR TEAMS</div>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setActiveSection("persian");
                      setLocation("/member-dashboard/");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                  >
                    <Users className="w-5 h-5" />
                    <span>Persian</span>
                    <span className="ml-auto">→</span>
                  </button>
                </div>
              </div>

              {/* Bottom Navigation */}
              <div className="space-y-1 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setActiveSection("calendar");
                    setLocation("/member-dashboard/");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Calendar</span>
                </button>
                <button
                  onClick={() => {
                    setMenuMode("settings");
                    setActiveSection("profile");
                    setLocation("/member-dashboard/");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection("help");
                    setLocation("/member-dashboard/");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span>Help</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Settings Menu */}
              {/* Back to Founder Dashboard (if accessed from founder) */}
              {fromFounderDashboard && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <button
                    onClick={() => {
                      if (onBackToFounder) {
                        onBackToFounder();
                      }
                    }}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Founder Dashboard
                  </button>
                </div>
              )}
              {menuMode === "settings" && (
                <div className="mb-4">
                  <button
                    onClick={() => setMenuMode("main")}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to app
                  </button>
                </div>
              )}

              <div className="space-y-1 mb-6">
                <button
                  onClick={() => {
                    setActiveSection("profile");
                    setLocation("/member-dashboard/");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                    activeSection === "profile" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection("billing");
                    setLocation("/member-dashboard/");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                    activeSection === "billing" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Billing</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection("payments");
                    setLocation("/member-dashboard/");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                    activeSection === "payments" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                  <span>Payments</span>
                </button>
              </div>

              <div className="mb-2">
                <div className="text-xs font-semibold text-gray-500 uppercase">Administration</div>
              </div>
              <div className="space-y-1 mb-6">
                <button
                  onClick={() => {
                    setActiveSection("workspace");
                    setLocation("/member-dashboard/");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                    activeSection === "workspace" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <span>Workspace</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection("teams");
                    setLocation("/member-dashboard/");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                    activeSection === "teams" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>Teams</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection("members");
                    setLocation("/member-dashboard/");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                    activeSection === "members" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Members</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection("clients");
                    setLocation("/member-dashboard/");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                    activeSection === "clients" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Monitor className="w-5 h-5" />
                  <span>Clients</span>
                </button>
              </div>

              <div className="mb-2">
                <div className="text-xs font-semibold text-gray-500 uppercase">Issues</div>
              </div>
              <div className="space-y-1 mb-6">
                <button
                  onClick={() => {
                    setActiveSection("labels");
                    setLocation("/member-dashboard/");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                    activeSection === "labels" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Tag className="w-5 h-5" />
                  <span>Labels</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection("templates");
                    setLocation("/member-dashboard/");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                    activeSection === "templates" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>Templates</span>
                </button>
              </div>

              <div className="mb-2">
                <div className="text-xs font-semibold text-gray-500 uppercase">Projects</div>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveSection("labels");
                    setLocation("/member-dashboard/");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                    activeSection === "labels" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Tag className="w-5 h-5" />
                  <span>Labels</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection("projects");
                    setLocation("/member-dashboard/");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                    activeSection === "projects" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Box className="w-5 h-5" />
                  <span>Projects</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection("statuses");
                    setLocation("/member-dashboard/");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                    activeSection === "statuses" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Clock className="w-5 h-5" />
                  <span>Statuses</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* User Profile at Bottom - Fixed */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              {displayMember.profilePicture ? (
                <img src={displayMember.profilePicture} alt={displayMember.username} className="w-full h-full rounded-full" />
              ) : (
                <span className="text-sm font-medium text-gray-600">
                  {displayMember.fullName?.[0] || displayMember.username[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {displayMember.fullName || displayMember.username}
              </div>
              <div className="text-xs text-gray-500 truncate">{displayMember.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - With left margin for fixed sidebar */}
      <div className="flex-1 ml-64">
        {/* Main Content */}
        <div className="h-screen overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

