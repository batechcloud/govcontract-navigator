import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
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
const AdminAudit = lazy(() => import("./pages/AdminAudit"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminSupport = lazy(() => import("./pages/AdminSupport"));
const AdminWorkspaces = lazy(() => import("./pages/AdminWorkspaces"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000, // 24h — must be >= persister maxAge
      refetchOnWindowFocus: false,
    },
  },
});

// Persist React Query cache to localStorage so AI cards & profile data
// survive full page reloads (saves the 5–15s AI calls on every refresh).
const persister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
  key: "gcnav-rq-cache-v1",
  throttleTime: 1000,
});

const App = () => (
  <ErrorBoundary>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000,
        // Only persist queries the user benefits from on reload.
        dehydrateOptions: {
          shouldDehydrateQuery: (q) => {
            const k = String(q.queryKey?.[0] ?? "");
            return [
              "ai-recommendations",
              "ai-profile-score",
              "profile",
              "company-profile",
              "tracked-contracts",
            ].includes(k);
          },
        },
      }}
    >
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
                <Route path="/solutions" element={<ErrorBoundary><Solutions /></ErrorBoundary>} />
                <Route path="/docs" element={<ErrorBoundary><Docs /></ErrorBoundary>} />
                <Route path="/tutorials" element={<ErrorBoundary><Tutorials /></ErrorBoundary>} />
                <Route path="/blog" element={<ErrorBoundary><Blog /></ErrorBoundary>} />
                <Route path="/help" element={<ErrorBoundary><Help /></ErrorBoundary>} />
                <Route path="/pricing" element={<ErrorBoundary><Pricing /></ErrorBoundary>} />
                <Route path="/about" element={<ErrorBoundary><About /></ErrorBoundary>} />
                <Route path="/contact" element={<ErrorBoundary><Contact /></ErrorBoundary>} />
                <Route path="/privacy" element={<ErrorBoundary><Privacy /></ErrorBoundary>} />
                <Route path="/terms" element={<ErrorBoundary><Terms /></ErrorBoundary>} />
                <Route path="/forgot-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />
                <Route path="/reset-password" element={<ErrorBoundary><ResetPassword /></ErrorBoundary>} />
                <Route path="/capability-statement" element={<ProtectedRoute><ErrorBoundary><CapabilityStatement /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/sectors" element={<ProtectedRoute><Navigate to="/dashboard/sectors" replace /></ProtectedRoute>} />
                <Route path="/auth" element={<PublicOnlyRoute><ErrorBoundary><Auth /></ErrorBoundary></PublicOnlyRoute>} />

                {/* /demo redirect */}
                <Route path="/demo" element={<Navigate to="/contact" replace />} />

                {/* Protected dashboard routes */}
                <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><ErrorBoundary><Onboarding /></ErrorBoundary></ProtectedRoute>} />
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
                <Route path="/admin/login" element={<ErrorBoundary><AdminLogin /></ErrorBoundary>} />
                <Route path="/admin" element={<Navigate to="/admin/sync" replace />} />
                <Route path="/admin/sync" element={<AdminRoute><ErrorBoundary><AdminSync /></ErrorBoundary></AdminRoute>} />
                <Route path="/admin/sync/jobs/:jobId" element={<AdminRoute><ErrorBoundary><AdminSyncJobDetail /></ErrorBoundary></AdminRoute>} />
                <Route path="/admin/audit" element={<AdminRoute><ErrorBoundary><AdminAudit /></ErrorBoundary></AdminRoute>} />
                <Route path="/admin/support" element={<AdminRoute><ErrorBoundary><AdminSupport /></ErrorBoundary></AdminRoute>} />
                <Route path="/admin/workspaces" element={<AdminRoute><ErrorBoundary><AdminWorkspaces /></ErrorBoundary></AdminRoute>} />
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
    </PersistQueryClientProvider>
  </ErrorBoundary>
);

export default App;
