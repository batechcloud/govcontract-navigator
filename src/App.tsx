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
            <Route 
              path="/auth" 
              element={
                <PublicOnlyRoute>
                  <Auth />
                </PublicOnlyRoute>
              } 
            />
            
            {/* Onboarding - protected but doesn't require completed onboarding */}
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute requireOnboarding={false}>
                  <Onboarding />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected dashboard routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/search" 
              element={
                <ProtectedRoute>
                  <SearchHub />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/tracked" 
              element={
                <ProtectedRoute>
                  <TrackedContracts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/journey" 
              element={
                <ProtectedRoute>
                  <JourneyHub />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/company" 
              element={
                <ProtectedRoute>
                  <CompanyProfile />
                </ProtectedRoute>
              } 
            />
            
            {/* Competitor Intelligence routes */}
            <Route 
              path="/dashboard/analytics" 
              element={
                <ProtectedRoute>
                  <CompetitorAnalysis />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/competitors" 
              element={
                <ProtectedRoute>
                  <TrackedCompetitors />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/win-loss" 
              element={
                <ProtectedRoute>
                  <WinLossAnalysis />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
