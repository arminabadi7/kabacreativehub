import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import Home from "@/pages/Home";
import Affiliate from "@/pages/Affiliate";
import AffiliateDashboard from "@/pages/AffiliateDashboard";
import BookingPage from "@/pages/BookingPage";
import Login from "@/pages/Login";
import MemberLogin from "@/pages/MemberLogin";
import Dashboard from "@/pages/Dashboard";
import TeamsPage from "@/pages/members/TeamsPage";
import ClientsSection from "@/pages/members/ClientsSection";
import ClientDashboard from "@/pages/ClientDashboard";
import ClientLogin from "@/pages/ClientLogin";
import NotFound from "@/pages/not-found";

/** Redirects legacy /founder and /member-dashboard URLs to the unified /dashboard,
 *  preserving the sub-path and query string. */
function LegacyDashboardRedirect() {
  const path = window.location.pathname.replace(/^\/(member-dashboard|founder)/, "/dashboard");
  const target = (path === "" ? "/dashboard" : path) + window.location.search;
  return <Redirect to={target} replace />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/book" component={BookingPage} />
      <Route path="/affiliate" component={Affiliate} />
      <Route path="/affiliate-dashboard" component={AffiliateDashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/*" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/member-login" component={MemberLogin} />
      {/* Legacy routes → unified dashboard */}
      <Route path="/founder" component={LegacyDashboardRedirect} />
      <Route path="/founder/*" component={LegacyDashboardRedirect} />
      <Route path="/member-dashboard" component={LegacyDashboardRedirect} />
      <Route path="/member-dashboard/*" component={LegacyDashboardRedirect} />
      <Route path="/teams" component={TeamsPage} />
      <Route path="/clients" component={() => <ClientsSection />} />
      <Route path="/client" component={ClientDashboard} />
      <Route path="/client-login" component={ClientLogin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
