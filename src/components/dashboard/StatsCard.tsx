import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  label: string;
  value: string | number;
  change?: string;
  loading?: boolean;
}

export const StatsCard = ({ label, value, change, loading }: StatsCardProps) => {
  if (loading) {
    return (
      <Card variant="glass-hover">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="flex items-end justify-between">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass-hover">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-heading font-bold text-foreground">
            {value}
          </span>
          {change && (
            <Badge variant="success" className="text-xs">
              {change}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
