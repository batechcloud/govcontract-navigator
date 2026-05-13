import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/PageContainer";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SpendingHeader } from "@/components/usaspending/SpendingHeader";
import { SpendingSnapshot } from "@/components/usaspending/SpendingSnapshot";
import { TopAgencies } from "@/components/usaspending/TopAgencies";
import { SpendingByCategory } from "@/components/usaspending/SpendingByCategory";
import { AwardExplorer } from "@/components/usaspending/AwardExplorer";
import { TopRecipients } from "@/components/usaspending/TopRecipients";
import { SpendingTrends } from "@/components/usaspending/SpendingTrends";
import { GeographicSpending } from "@/components/usaspending/GeographicSpending";
import { SmallBusinessIntel } from "@/components/usaspending/SmallBusinessIntel";
import { USASpendingGuide } from "@/components/usaspending/USASpendingGuide";

const getDefaultFY = () => {
  const now = new Date();
  // Federal FY starts Oct 1, so if we're in Oct-Dec, current FY = year+1
  const currentFY = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
  return `FY${currentFY - 1}`;
};

const USASpendingIntel = () => {
  const queryClient = useQueryClient();
  const [fy, setFy] = useState(getDefaultFY());
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(new Date());
  const [selectedAgency, setSelectedAgency] = useState<string | undefined>();

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setLastRefreshed(new Date());
    // Invalidate all USASpending queries to force refetch
    queryClient.invalidateQueries({ queryKey: ["usa-snapshot"] });
    queryClient.invalidateQueries({ queryKey: ["usa-top-agencies"] });
    queryClient.invalidateQueries({ queryKey: ["usa-category"] });
    queryClient.invalidateQueries({ queryKey: ["usa-awards"] });
    queryClient.invalidateQueries({ queryKey: ["usa-recipients"] });
    queryClient.invalidateQueries({ queryKey: ["usa-trends"] });
    queryClient.invalidateQueries({ queryKey: ["usa-geo"] });
    queryClient.invalidateQueries({ queryKey: ["usa-sb"] });
  }, [queryClient]);

  const handleFyChange = useCallback((newFy: string) => {
    setFy(newFy);
    setLastRefreshed(new Date());
  }, []);

  return (
    <DashboardLayout title="USASpending Intelligence">
      <PageContainer variant="wide" animate={false} className="space-y-8">
        <SpendingHeader fy={fy} onFyChange={handleFyChange} onRefresh={handleRefresh} lastRefreshed={lastRefreshed} />
        <SpendingSnapshot fy={fy} refreshKey={refreshKey} />
        <TopAgencies fy={fy} refreshKey={refreshKey} onAgencySelect={setSelectedAgency} />
        <SpendingByCategory fy={fy} refreshKey={refreshKey} />
        <AwardExplorer fy={fy} refreshKey={refreshKey} prefilledAgency={selectedAgency} />
        <TopRecipients fy={fy} refreshKey={refreshKey} />
        <SpendingTrends refreshKey={refreshKey} />
        <GeographicSpending fy={fy} refreshKey={refreshKey} />
        <SmallBusinessIntel fy={fy} refreshKey={refreshKey} />
      <USASpendingGuide />
      </PageContainer>
    </DashboardLayout>
  );
};

export default USASpendingIntel;
