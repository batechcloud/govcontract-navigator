import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lightweight loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

// Public pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Solutions = lazy(() => import("./pages/Solutions"));
const Docs = lazy(() => import("./pages/Docs"));
const Tutorials = lazy(() => import("./pages/Tutorials"));
const Blog = lazy(() => import("./pages/Blog"));
const Help = lazy(() => import("./pages/Help"));
const Pricing = lazy(() => import("./pages/Pricing"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CapabilityStatement = lazy(() => import("./pages/CapabilityStatement"));
const SectorBrowse = lazy(() => import("./pages/SectorBrowse"));

// Dashboard pages
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SearchHub = lazy(() => import("./pages/SearchHub"));
const TrackedContracts = lazy(() => import("./pages/TrackedContracts"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));
const Proposals = lazy(() => import("./pages/Proposals"));
const ProposalGenerator = lazy(() => import("./pages/ProposalGenerator"));
const ProposalEditor = lazy(() => import("./pages/ProposalEditor"));
const AIOpportunityChat = lazy(() => import("./pages/AIOpportunityChat"));
const USASpendingIntel = lazy(() => import("./pages/USASpendingIntel"));
const Settings = lazy(() => import("./pages/Settings"));
const ContractDetail = lazy(() => import("./pages/ContractDetail"));
const AdminSync = lazy(() => import("./pages/AdminSync"));
const AdminSyncJobDetail = lazy(() => import("./pages/AdminSyncJobDetail"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
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
              {/* Separate admin area with its own login */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<Navigate to="/admin/sync" replace />} />
              <Route path="/admin/sync" element={<AdminRoute><ErrorBoundary><AdminSync /></ErrorBoundary></AdminRoute>} />
              <Route path="/admin/sync/jobs/:jobId" element={<AdminRoute><ErrorBoundary><AdminSyncJobDetail /></ErrorBoundary></AdminRoute>} />
              <Route path="/dashboard/admin/sync" element={<Navigate to="/admin/sync" replace />} />
              
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
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
