import { useState } from "react";
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
  BarChart3, 
  MoreHorizontal,
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
  ArrowLeft,
  Menu
} from "lucide-react";
import { Link } from "wouter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
import ClientsSection from "./members/ClientsSection";
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
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("profile");
  const [activeSubSection, setActiveSubSection] = useState<string | null>(null);
  const [menuMode, setMenuMode] = useState<"main" | "settings">("main");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: member, isLoading: memberLoading } = useQuery<Member>({
    queryKey: ["/api/members/session"],
    retry: false,
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

  const displayMember = member || mockMember;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const renderContent = () => {
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
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">Workspace</h1>
          <p className="text-muted-foreground">Coming soon</p>
        </div>
      );
    }
    if (activeSection === "teams") {
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">Teams</h1>
          <p className="text-muted-foreground">Coming soon</p>
        </div>
      );
    }
    if (activeSection === "members") {
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">Members</h1>
          <p className="text-muted-foreground">Coming soon</p>
        </div>
      );
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
      return <ProjectsBoard />;
    }
    if (activeSection === "statuses") {
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">Statuses</h1>
          <p className="text-muted-foreground">Coming soon</p>
        </div>
      );
    }
    if (activeSection === "clipping-area") {
      return <ClippingArea />;
    }
    if (activeSection === "home") {
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">Home</h1>
          <p className="text-muted-foreground">Coming soon</p>
        </div>
      );
    }
    if (activeSection === "my-issues") {
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">My issues</h1>
          <p className="text-muted-foreground">Coming soon</p>
        </div>
      );
    }
    if (activeSection === "board") {
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">Board</h1>
          <p className="text-muted-foreground">Coming soon</p>
        </div>
      );
    }
    if (activeSection === "views") {
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">Views</h1>
          <p className="text-muted-foreground">Coming soon</p>
        </div>
      );
    }
    if (activeSection === "more") {
      return (
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">More</h1>
          <p className="text-muted-foreground">Coming soon</p>
        </div>
      );
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

  const SidebarContent = () => (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-6 flex-shrink">
        {menuMode === "main" ? (
          <>
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

            <div className="space-y-1">
              <button
                onClick={() => { setActiveSection("home"); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </button>
              <button
                onClick={() => { setActiveSection("my-issues"); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                <MessageSquare className="w-5 h-5" />
                <span>My issues</span>
              </button>
              <button
                onClick={() => { setActiveSection("board"); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                <LayoutGrid className="w-5 h-5" />
                <span>Board</span>
              </button>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">WORKSPACE</div>
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveSection("projects"); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  <Folder className="w-5 h-5" />
                  <span>Projects</span>
                </button>
                {(fromFounderDashboard || canAccessClipping(displayMember.role)) && (
                  <button
                    onClick={() => { setActiveSection("clipping-area"); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 ${
                      activeSection === "clipping-area" ? "bg-blue-50 text-blue-700" : "text-gray-700"
                    }`}
                  >
                    <Scissors className="w-5 h-5" />
                    <span>Clipping Area</span>
                  </button>
                )}
                <button
                  onClick={() => { setActiveSection("views"); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Views</span>
                </button>
                <button
                  onClick={() => { setActiveSection("more"); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  <MoreHorizontal className="w-5 h-5" />
                  <span>More</span>
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">YOUR TEAMS</div>
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveSection("persian"); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  <Users className="w-5 h-5" />
                  <span>Persian</span>
                  <span className="ml-auto">→</span>
                </button>
              </div>
            </div>

            <div className="space-y-1 pt-4 border-t border-gray-200">
              <button
                onClick={() => { setActiveSection("calendar"); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                <Calendar className="w-5 h-5" />
                <span>Calendar</span>
              </button>
              <button
                onClick={() => {
                  setMenuMode("settings");
                  setActiveSection("profile");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 ${
                  menuMode === "settings" ? "bg-blue-50 text-blue-700" : "text-gray-700"
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => { setActiveSection("help"); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                <HelpCircle className="w-5 h-5" />
                <span>Help</span>
              </button>
            </div>
          </>
        ) : (
          <>
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
            {!fromFounderDashboard && (
              <div className="mb-4">
                <button
                  onClick={() => setMenuMode("main")}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  <span>←</span> Back to app
                </button>
              </div>
            )}

            <div className="space-y-1 mb-6">
              <button
                onClick={() => { setActiveSection("profile"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeSection === "profile" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => { setActiveSection("billing"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeSection === "billing" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Billing</span>
              </button>
              <button
                onClick={() => { setActiveSection("payments"); setMobileMenuOpen(false); }}
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
                onClick={() => { setActiveSection("workspace"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeSection === "workspace" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span>Workspace</span>
              </button>
              <button
                onClick={() => { setActiveSection("teams"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeSection === "teams" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Teams</span>
              </button>
              <button
                onClick={() => { setActiveSection("members"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeSection === "members" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Members</span>
              </button>
              <button
                onClick={() => { setActiveSection("clients"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeSection === "clients" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Clients</span>
              </button>
              <button
                onClick={() => { setActiveSection("labels"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeSection === "labels" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Tag className="w-5 h-5" />
                <span>Labels</span>
              </button>
              <button
                onClick={() => { setActiveSection("templates"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                  activeSection === "templates" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Templates</span>
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
          </>
        )}
      </div>

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
    </>
  );

  return (
    <div className="min-h-screen bg-white flex">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-gray-200 flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="KabaContent" className="w-8 h-8 rounded-lg" />
          <span className="text-xl font-bold">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Kaba</span>
            <span className="text-gray-900">Content</span>
          </span>
        </Link>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <Link href="/" className="flex items-center gap-2">
                <img src="/logo.png" alt="KabaContent" className="w-8 h-8 rounded-lg" />
                <span className="text-xl font-bold">
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Kaba</span>
                  <span className="text-gray-900">Content</span>
                </span>
              </Link>
            </div>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar - Fixed */}
      <div className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex-col z-10">
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="KabaContent" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-bold">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Kaba</span>
              <span className="text-gray-900">Content</span>
            </span>
          </Link>
        </div>
        <SidebarContent />
      </div>

      {/* Main Content Area - Responsive margin for sidebar */}
      <div className="flex-1 md:ml-64 pt-16 md:pt-0">
        {/* Main Content */}
        <div className="h-screen overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

