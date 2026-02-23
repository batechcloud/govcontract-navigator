import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
import SectorBrowse from "./pages/SectorBrowse";

// Dashboard pages
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import SearchHub from "./pages/SearchHub";
import TrackedContracts from "./pages/TrackedContracts";
import CompanyProfile from "./pages/CompanyProfile";
import Proposals from "./pages/Proposals";
import ProposalGenerator from "./pages/ProposalGenerator";
import ProposalEditor from "./pages/ProposalEditor";
import AIOpportunityChat from "./pages/AIOpportunityChat";
import USASpendingIntel from "./pages/USASpendingIntel";
import Settings from "./pages/Settings";
import ContractDetail from "./pages/ContractDetail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

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
            <Route path="/sectors" element={<Navigate to="/dashboard/sectors" replace />} />
            <Route path="/auth" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
            
            {/* /demo redirect */}
            <Route path="/demo" element={<Navigate to="/contact" replace />} />
            
            {/* Protected dashboard routes */}
            <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><Onboarding /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><ErrorBoundary><Dashboard /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/search" element={<ProtectedRoute><ErrorBoundary><SearchHub /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/tracked" element={<ProtectedRoute><ErrorBoundary><TrackedContracts /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/company" element={<ProtectedRoute><ErrorBoundary><CompanyProfile /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/proposals" element={<ProtectedRoute><ErrorBoundary><Proposals /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/proposals/generator" element={<ProtectedRoute><ErrorBoundary><ProposalGenerator /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/proposals/:id" element={<ProtectedRoute><ErrorBoundary><ProposalEditor /></ErrorBoundary></ProtectedRoute>} />
             <Route path="/dashboard/ai" element={<ProtectedRoute><ErrorBoundary><AIOpportunityChat /></ErrorBoundary></ProtectedRoute>} />
             <Route path="/dashboard/ai/chat" element={<Navigate to="/dashboard/ai" replace />} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><ErrorBoundary><Settings /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/sectors" element={<ProtectedRoute><ErrorBoundary><SectorBrowse /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/usaspending" element={<ProtectedRoute><ErrorBoundary><USASpendingIntel /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard/contract/:contractId" element={<ProtectedRoute><ErrorBoundary><ContractDetail /></ErrorBoundary></ProtectedRoute>} />
            
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
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
