import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/PageContainer";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { usePageTitle } from "@/hooks/usePageTitle";

const getDefaultFY = () => {
  const now = new Date();
  // Federal FY starts Oct 1, so if we're in Oct-Dec, current FY = year+1
  const currentFY = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
  return `FY${currentFY - 1}`;
};

const USASpendingIntel = () => {
  usePageTitle("Spending Intelligence");
  const queryClient = useQueryClient();
  const [fy, setFy] = useState(getDefaultFY());
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(new Date());
  const [selectedAgency, setSelectedAgency] = useState<string | undefined>();
  const [tab, setTab] = useState("overview");

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

  const handleAgencySelect = useCallback((agency: string) => {
    setSelectedAgency(agency);
    setTab("awards");
  }, []);

  return (
    <DashboardLayout title="USASpending Intelligence">
      <PageContainer variant="wide" animate={false} className="space-y-6">
        <SpendingHeader fy={fy} onFyChange={handleFyChange} onRefresh={handleRefresh} lastRefreshed={lastRefreshed} />

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="w-full sm:w-auto flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="awards">Find Past Awards</TabsTrigger>
            <TabsTrigger value="competitors">Who Wins</TabsTrigger>
            <TabsTrigger value="help">How to Use This</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 mt-0">
            <p className="text-sm text-muted-foreground">
              Start here: how much the government spent this year, which agencies spent the most, and what
              they bought.
            </p>
            <SpendingSnapshot fy={fy} refreshKey={refreshKey} />
            <TopAgencies fy={fy} refreshKey={refreshKey} onAgencySelect={handleAgencySelect} />
            <SpendingByCategory fy={fy} refreshKey={refreshKey} />
            <SpendingTrends refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="awards" className="space-y-8 mt-0">
            <p className="text-sm text-muted-foreground">
              Search contracts the government already awarded. Use them to see realistic pricing, repeat
              buyers, and who you'd be competing against.
            </p>
            <AwardExplorer fy={fy} refreshKey={refreshKey} prefilledAgency={selectedAgency} />
          </TabsContent>

          <TabsContent value="competitors" className="space-y-8 mt-0">
            <p className="text-sm text-muted-foreground">
              See the companies winning the most work, how much goes to small businesses, and which states
              get the money.
            </p>
            <TopRecipients fy={fy} refreshKey={refreshKey} />
            <SmallBusinessIntel fy={fy} refreshKey={refreshKey} />
            <GeographicSpending fy={fy} refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="help" className="mt-0">
            <USASpendingGuide />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </DashboardLayout>
  );
};

export default USASpendingIntel;
