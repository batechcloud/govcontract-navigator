import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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

// Dashboard pages (no auth required for now)
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import SearchHub from "./pages/SearchHub";
import TrackedContracts from "./pages/TrackedContracts";
import JourneyHub from "./pages/JourneyHub";
import CompanyProfile from "./pages/CompanyProfile";
import CompetitorAnalysis from "./pages/CompetitorAnalysis";
import TrackedCompetitors from "./pages/TrackedCompetitors";
import WinLossAnalysis from "./pages/WinLossAnalysis";
import SavedSearches from "./pages/SavedSearches";
import Proposals from "./pages/Proposals";
import ProposalGenerator from "./pages/ProposalGenerator";
import AIAssistant from "./pages/AIAssistant";
import Documents from "./pages/Documents";
import Calendar from "./pages/Calendar";
import TeamingPartners from "./pages/TeamingPartners";
import MarketWatch from "./pages/MarketWatch";
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
          
          {/* Dashboard routes (no auth for now) */}
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/search" element={<SearchHub />} />
          <Route path="/dashboard/tracked" element={<TrackedContracts />} />
          <Route path="/dashboard/journey" element={<JourneyHub />} />
          <Route path="/dashboard/company" element={<CompanyProfile />} />
          <Route path="/dashboard/analytics" element={<CompetitorAnalysis />} />
          <Route path="/dashboard/competitors" element={<TrackedCompetitors />} />
          <Route path="/dashboard/win-loss" element={<WinLossAnalysis />} />
          <Route path="/dashboard/saved-searches" element={<SavedSearches />} />
          <Route path="/dashboard/proposals" element={<Proposals />} />
          <Route path="/dashboard/proposals/generator" element={<ProposalGenerator />} />
          <Route path="/dashboard/ai" element={<AIAssistant />} />
          <Route path="/dashboard/documents" element={<Documents />} />
          <Route path="/dashboard/calendar" element={<Calendar />} />
          <Route path="/dashboard/teaming" element={<TeamingPartners />} />
          <Route path="/dashboard/market" element={<MarketWatch />} />
          <Route path="/dashboard/settings" element={<Settings />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
