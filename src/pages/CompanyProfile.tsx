import { BusinessTab } from "@/components/settings/BusinessTab";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageContainer } from "@/components/layout/PageContainer";

const CompanyProfile = () => {
  return (
    <DashboardLayout title="My Business">
      <PageContainer variant="narrow" className="space-y-6">
        <BusinessTab />
      </PageContainer>
    </DashboardLayout>
  );
};

export default CompanyProfile;
