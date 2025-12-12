import { motion } from "framer-motion";
import { Building2, Hash, Calendar, Users, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OnboardingData } from "@/pages/Onboarding";

interface CompanyInfoStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const employeeRanges = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "500+", label: "500+ employees" },
];

const revenueRanges = [
  { value: "0-500k", label: "Under $500K" },
  { value: "500k-1m", label: "$500K - $1M" },
  { value: "1m-5m", label: "$1M - $5M" },
  { value: "5m-20m", label: "$5M - $20M" },
  { value: "20m+", label: "$20M+" },
];

const CompanyInfoStep = ({ data, updateData }: CompanyInfoStepProps) => {
  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
          Tell us about your company
        </h2>
        <p className="text-muted-foreground">
          This helps us match you with the right opportunities
        </p>
      </motion.div>

      <Card variant="glass" className="p-6 sm:p-8">
        <div className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Company Name *
            </Label>
            <Input
              id="companyName"
              placeholder="Enter your company name"
              value={data.companyName}
              onChange={(e) => updateData({ companyName: e.target.value })}
              className="bg-secondary/50"
            />
          </div>

          {/* SAM UEI & CAGE Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="samUei" className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                SAM UEI
              </Label>
              <Input
                id="samUei"
                placeholder="12 character UEI"
                value={data.samUei}
                onChange={(e) => updateData({ samUei: e.target.value })}
                className="bg-secondary/50"
                maxLength={12}
              />
              <p className="text-xs text-muted-foreground">
                Unique Entity ID from SAM.gov
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cageCode" className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                CAGE Code
              </Label>
              <Input
                id="cageCode"
                placeholder="5 character code"
                value={data.cageCode}
                onChange={(e) => updateData({ cageCode: e.target.value })}
                className="bg-secondary/50"
                maxLength={5}
              />
              <p className="text-xs text-muted-foreground">
                Commercial and Government Entity code
              </p>
            </div>
          </div>

          {/* Year Founded */}
          <div className="space-y-2">
            <Label htmlFor="yearFounded" className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Year Founded
            </Label>
            <Input
              id="yearFounded"
              type="number"
              placeholder="e.g., 2015"
              value={data.yearFounded}
              onChange={(e) => updateData({ yearFounded: e.target.value })}
              className="bg-secondary/50"
              min="1900"
              max={new Date().getFullYear()}
            />
          </div>

          {/* Employee Count & Revenue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                Number of Employees
              </Label>
              <Select
                value={data.employeeCount}
                onValueChange={(value) => updateData({ employeeCount: value })}
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {employeeRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                Annual Revenue
              </Label>
              <Select
                value={data.annualRevenue}
                onValueChange={(value) => updateData({ annualRevenue: value })}
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {revenueRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-6">
        * Required fields. Other fields are optional but help improve matching.
      </p>
    </div>
  );
};

export default CompanyInfoStep;
