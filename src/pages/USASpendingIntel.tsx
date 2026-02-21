import { useState, useCallback } from "react";
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

const USASpendingIntel = () => {
  const [fy, setFy] = useState("FY2024");
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(new Date());
  const [selectedAgency, setSelectedAgency] = useState<string | undefined>();

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setLastRefreshed(new Date());
  }, []);

  const handleFyChange = useCallback((newFy: string) => {
    setFy(newFy);
    setLastRefreshed(new Date());
  }, []);

  return (
    <DashboardLayout title="USASpending Intelligence">
      <div className="space-y-8 max-w-7xl mx-auto">
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
      </div>
    </DashboardLayout>
  );
};

export default USASpendingIntel;
