import { ReactNode } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface FeatureGateProps {
  featureCode: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function FeatureGate({ 
  featureCode, 
  children, 
  fallback,
  showUpgradePrompt = true 
}: FeatureGateProps) {
  const { data: access, isLoading } = useFeatureAccess(featureCode);
  const { data: subscription } = useSubscription();

  if (isLoading) {
    return (
      <div className="animate-pulse bg-muted rounded-lg h-32" />
    );
  }

  if (access?.can_use) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return (
      <UpgradePrompt 
        featureCode={featureCode}
        currentPlan={subscription?.plan?.display_name || "Starter"}
        hasAccess={access?.has_access || false}
        usageExceeded={access?.has_access && !access?.can_use}
      />
    );
  }

  return null;
}

interface UpgradePromptProps {
  featureCode: string;
  currentPlan: string;
  hasAccess: boolean;
  usageExceeded?: boolean;
}

export function UpgradePrompt({ 
  featureCode, 
  currentPlan, 
  hasAccess,
  usageExceeded 
}: UpgradePromptProps) {
  const message = usageExceeded
    ? "You've reached your usage limit for this feature this month."
    : `This feature is not available on the ${currentPlan} plan.`;

  return (
    <Card className="glass-card border-primary/20">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          {usageExceeded ? (
            <Sparkles className="w-6 h-6 text-primary" />
          ) : (
            <Lock className="w-6 h-6 text-primary" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {usageExceeded ? "Usage Limit Reached" : "Upgrade Required"}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 max-w-md">
          {message}
        </p>
        <Button variant="hero" asChild>
          <Link to="/contact">
            <Sparkles className="w-4 h-4 mr-2" />
            Book a Demo
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Inline version for smaller UI elements
interface FeatureGateInlineProps {
  featureCode: string;
  children: ReactNode;
  lockedContent?: ReactNode;
}

export function FeatureGateInline({ 
  featureCode, 
  children, 
  lockedContent 
}: FeatureGateInlineProps) {
  const { data: access, isLoading } = useFeatureAccess(featureCode);

  if (isLoading) {
    return <span className="opacity-50">{children}</span>;
  }

  if (access?.can_use) {
    return <>{children}</>;
  }

  if (lockedContent) {
    return <>{lockedContent}</>;
  }

  return (
    <span className="opacity-50 cursor-not-allowed flex items-center gap-1">
      {children}
      <Lock className="w-3 h-3" />
    </span>
  );
}
