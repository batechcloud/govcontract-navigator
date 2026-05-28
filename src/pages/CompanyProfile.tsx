import { BusinessTab } from "@/components/settings/BusinessTab";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageTitle } from "@/hooks/usePageTitle";

const CompanyProfile = () => {
  usePageTitle("Company Profile");
  return (
    <DashboardLayout title="My Business">
      <PageContainer variant="narrow" className="space-y-6">
        <BusinessTab />
      </PageContainer>
    </DashboardLayout>
  );
};

export default CompanyProfile;
