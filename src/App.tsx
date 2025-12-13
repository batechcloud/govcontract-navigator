import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/auth/ProtectedRoute";

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

// Protected pages
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
    <AuthProvider>
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
            <Route 
              path="/auth" 
              element={
                <PublicOnlyRoute>
                  <Auth />
                </PublicOnlyRoute>
              } 
            />
            
            {/* Onboarding */}
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute requireOnboarding={false}>
                  <Onboarding />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected dashboard routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/search" element={<ProtectedRoute><SearchHub /></ProtectedRoute>} />
            <Route path="/dashboard/tracked" element={<ProtectedRoute><TrackedContracts /></ProtectedRoute>} />
            <Route path="/dashboard/journey" element={<ProtectedRoute><JourneyHub /></ProtectedRoute>} />
            <Route path="/dashboard/company" element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />
            <Route path="/dashboard/analytics" element={<ProtectedRoute><CompetitorAnalysis /></ProtectedRoute>} />
            <Route path="/dashboard/competitors" element={<ProtectedRoute><TrackedCompetitors /></ProtectedRoute>} />
            <Route path="/dashboard/win-loss" element={<ProtectedRoute><WinLossAnalysis /></ProtectedRoute>} />
            <Route path="/dashboard/saved-searches" element={<ProtectedRoute><SavedSearches /></ProtectedRoute>} />
            <Route path="/dashboard/proposals" element={<ProtectedRoute><Proposals /></ProtectedRoute>} />
            <Route path="/dashboard/proposals/generator" element={<ProtectedRoute><ProposalGenerator /></ProtectedRoute>} />
            <Route path="/dashboard/ai" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
            <Route path="/dashboard/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/dashboard/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/dashboard/teaming" element={<ProtectedRoute><TeamingPartners /></ProtectedRoute>} />
            <Route path="/dashboard/market" element={<ProtectedRoute><MarketWatch /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
