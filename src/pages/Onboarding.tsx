import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import WelcomeStep from "@/components/onboarding/WelcomeStep";
import CompanyInfoStep from "@/components/onboarding/CompanyInfoStep";
import CapabilitiesStep from "@/components/onboarding/CapabilitiesStep";
import PreferencesStep from "@/components/onboarding/PreferencesStep";
import { usePageTitle } from "@/hooks/usePageTitle";

export interface OnboardingData {
  // Company Info
  companyName: string;
  samUei: string;
  cageCode: string;
  yearFounded: string;
  employeeCount: string;
  annualRevenue: string;
  // Capabilities
  naicsCodes: string[];
  certifications: string[];
  capabilities: string[];
  // Preferences
  contractTypes: string[];
  preferredAgencies: string[];
  minContractValue: string;
  maxContractValue: string;
  emailFrequency: string;
}

const initialData: OnboardingData = {
  companyName: "",
  samUei: "",
  cageCode: "",
  yearFounded: "",
  employeeCount: "",
  annualRevenue: "",
  naicsCodes: [],
  certifications: [],
  capabilities: [],
  contractTypes: [],
  preferredAgencies: [],
  minContractValue: "",
  maxContractValue: "",
  emailFrequency: "daily",
};

const steps = [
  { id: 1, title: "Welcome", description: "Let's get started" },
  { id: 2, title: "Company Info", description: "Tell us about your business" },
  { id: 3, title: "Capabilities", description: "What can you do?" },
  { id: 4, title: "Preferences", description: "Customize your experience" },
];

const Onboarding = () => {
  usePageTitle("Welcome");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = (currentStep / steps.length) * 100;

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in", {
          description: "You need to be signed in to complete onboarding.",
        });
        navigate("/auth");
        return;
      }

      // Save company profile
      const { error: companyError } = await supabase
        .from("company_profiles")
        .upsert(
          {
            user_id: user.id,
            company_name: data.companyName || "My Company",
            sam_uei: data.samUei || null,
            cage_code: data.cageCode || null,
            year_founded: data.yearFounded ? parseInt(data.yearFounded) : null,
            employee_count: data.employeeCount || null,
            annual_revenue: data.annualRevenue || null,
            naics_codes: data.naicsCodes,
            certifications: data.certifications,
            capabilities: data.capabilities,
            contract_types: data.contractTypes,
            preferred_agencies: data.preferredAgencies,
            min_contract_value: data.minContractValue || null,
            max_contract_value: data.maxContractValue || null,
          },
          { onConflict: "user_id" },
        );

      if (companyError) throw companyError;

      // Update profile to mark onboarding as complete
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          notification_preferences: {
            email_frequency: data.emailFrequency,
            quiet_hours_start: null,
            quiet_hours_end: null,
          },
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // ProtectedRoute reads useProfile() from React Query; invalidate so
      // /dashboard sees onboarding_completed=true instead of the stale cache.
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["company-profile", user.id] });

      toast.success("Welcome aboard!", {
        description: "Your profile has been set up successfully.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error("Error saving profile", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Mark onboarding as complete so the user can access the dashboard
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("id", user.id);
        await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      // Still navigate even if the update fails
      navigate("/dashboard");
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep onNext={nextStep} onSkip={handleSkip} />;
      case 2:
        return <CompanyInfoStep data={data} updateData={updateData} />;
      case 3:
        return <CapabilitiesStep data={data} updateData={updateData} />;
      case 4:
        return <PreferencesStep data={data} updateData={updateData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 dot-grid opacity-30 pointer-events-none" />
      <div className="fixed top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 py-6 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">GC</span>
            </div>
            <span className="font-heading font-bold text-xl">GC Navigator</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Skip for now
          </Button>
        </div>
      </header>

      {/* Progress */}
      <div className="relative z-10 px-6 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 ${
                  step.id === currentStep
                    ? "text-foreground"
                    : step.id < currentStep
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step.id === currentStep
                      ? "bg-primary text-primary-foreground glow-primary"
                      : step.id < currentStep
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step.id}
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </div>

      {/* Content */}
      <main className="relative z-10 flex-1 px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Navigation */}
      {currentStep > 1 && (
        <footer className="fixed bottom-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-xl border-t border-border py-4 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button variant="outline" onClick={prevStep}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}
            </div>
            <Button variant="hero" onClick={nextStep} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : currentStep === steps.length ? (
                "Complete Setup"
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Onboarding;
