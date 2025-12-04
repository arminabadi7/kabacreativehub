import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Affiliate from "@/pages/Affiliate";
import AffiliateDashboard from "@/pages/AffiliateDashboard";
import FounderDashboard from "@/pages/FounderDashboard";
import BookingPage from "@/pages/BookingPage";
import Login from "@/pages/Login";
import MemberLogin from "@/pages/MemberLogin";
import MembersDashboard from "@/pages/MembersDashboard";
import ClientDashboard from "@/pages/ClientDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/book" component={BookingPage} />
      <Route path="/affiliate" component={Affiliate} />
      <Route path="/affiliate-dashboard" component={AffiliateDashboard} />
      <Route path="/founder" component={FounderDashboard} />
      <Route path="/login" component={Login} />
      <Route path="/member-login" component={MemberLogin} />
      <Route path="/member-dashboard" component={MembersDashboard} />
      <Route path="/client-dashboard" component={ClientDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
