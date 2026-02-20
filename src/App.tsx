import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Public pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Solutions from "./pages/Solutions";
import Docs from "./pages/Docs";
import Tutorials from "./pages/Tutorials";
import Blog from "./pages/Blog";
import Help from "./pages/Help";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CapabilityStatement from "./pages/CapabilityStatement";

// Dashboard pages
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import SearchHub from "./pages/SearchHub";
import TrackedContracts from "./pages/TrackedContracts";
import CompanyProfile from "./pages/CompanyProfile";
import Proposals from "./pages/Proposals";
import ProposalGenerator from "./pages/ProposalGenerator";
import AIAssistant from "./pages/AIAssistant";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/tutorials" element={<Tutorials />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/help" element={<Help />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/capability-statement" element={<CapabilityStatement />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Dashboard routes */}
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/search" element={<SearchHub />} />
          <Route path="/dashboard/tracked" element={<TrackedContracts />} />
          <Route path="/dashboard/company" element={<CompanyProfile />} />
          <Route path="/dashboard/proposals" element={<Proposals />} />
          <Route path="/dashboard/proposals/generator" element={<ProposalGenerator />} />
          <Route path="/dashboard/ai" element={<AIAssistant />} />
          <Route path="/dashboard/settings" element={<Settings />} />
          
          {/* Redirects from old routes */}
          <Route path="/dashboard/journey" element={<Navigate to="/dashboard/tracked" replace />} />
          <Route path="/dashboard/analytics" element={<Navigate to="/dashboard/ai" replace />} />
          <Route path="/dashboard/competitors" element={<Navigate to="/dashboard/ai" replace />} />
          <Route path="/dashboard/win-loss" element={<Navigate to="/dashboard/ai" replace />} />
          <Route path="/dashboard/saved-searches" element={<Navigate to="/dashboard/search" replace />} />
          <Route path="/dashboard/calendar" element={<Navigate to="/dashboard/tracked" replace />} />
          <Route path="/dashboard/teaming" element={<Navigate to="/dashboard/ai" replace />} />
          <Route path="/dashboard/market" element={<Navigate to="/dashboard/ai" replace />} />
          <Route path="/dashboard/documents" element={<Navigate to="/dashboard/proposals" replace />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
