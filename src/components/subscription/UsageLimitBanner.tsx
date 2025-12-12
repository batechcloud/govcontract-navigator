import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface UsageLimitBannerProps {
  featureCode: string;
  featureName: string;
  className?: string;
  showAlways?: boolean;
}

export function UsageLimitBanner({ 
  featureCode, 
  featureName,
  className,
  showAlways = false 
}: UsageLimitBannerProps) {
  const { data: access, isLoading } = useFeatureAccess(featureCode);

  if (isLoading || !access?.usage_limit) {
    return null;
  }

  const usagePercent = (access.current_usage / access.usage_limit) * 100;
  const isNearLimit = usagePercent >= 80;
  const isAtLimit = usagePercent >= 100;

  // Only show if near limit or showAlways is true
  if (!showAlways && !isNearLimit) {
    return null;
  }

  return (
    <div 
      className={cn(
        "rounded-lg p-4 border",
        isAtLimit 
          ? "bg-destructive/10 border-destructive/30" 
          : isNearLimit 
            ? "bg-accent/10 border-accent/30"
            : "bg-muted/50 border-border",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {(isNearLimit || isAtLimit) && (
              <AlertTriangle 
                className={cn(
                  "w-4 h-4",
                  isAtLimit ? "text-destructive" : "text-accent"
                )} 
              />
            )}
            <span className="text-sm font-medium text-foreground">
              {featureName} Usage
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Progress 
              value={Math.min(usagePercent, 100)} 
              className={cn(
                "h-2 flex-1",
                isAtLimit && "[&>div]:bg-destructive"
              )}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {access.current_usage} / {access.usage_limit}
            </span>
          </div>
          {isAtLimit && (
            <p className="text-xs text-destructive mt-2">
              You've reached your monthly limit. Upgrade for more.
            </p>
          )}
          {isNearLimit && !isAtLimit && (
            <p className="text-xs text-accent mt-2">
              {access.remaining} uses remaining this month.
            </p>
          )}
        </div>
        {(isNearLimit || isAtLimit) && (
          <Button variant="outline" size="sm" asChild>
            <Link to="/pricing">
              <Sparkles className="w-3 h-3 mr-1" />
              Upgrade
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

// Compact version for sidebars/headers
interface UsageBadgeProps {
  featureCode: string;
  className?: string;
}

export function UsageBadge({ featureCode, className }: UsageBadgeProps) {
  const { data: access, isLoading } = useFeatureAccess(featureCode);

  if (isLoading || !access?.usage_limit) {
    return null;
  }

  const usagePercent = (access.current_usage / access.usage_limit) * 100;
  const isNearLimit = usagePercent >= 80;
  const isAtLimit = usagePercent >= 100;

  return (
    <span 
      className={cn(
        "text-xs px-2 py-0.5 rounded-full",
        isAtLimit 
          ? "bg-destructive/20 text-destructive" 
          : isNearLimit 
            ? "bg-accent/20 text-accent"
            : "bg-muted text-muted-foreground",
        className
      )}
    >
      {access.remaining ?? "∞"} left
    </span>
  );
}
