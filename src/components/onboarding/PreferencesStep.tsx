import { motion } from "framer-motion";
import { Settings, Bell, DollarSign, Building, FileText, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OnboardingData } from "@/pages/Onboarding";

interface PreferencesStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const contractTypeOptions = [
  { id: "federal", label: "Federal Contracts", description: "SAM.gov opportunities" },
  { id: "state", label: "State & Local", description: "State/city/county RFPs" },
  { id: "grants", label: "Grants", description: "Federal & state grants" },
  { id: "dibbs", label: "DIBBS", description: "Defense logistics" },
];

const agencyOptions = [
  "Department of Defense",
  "Department of Health and Human Services",
  "Department of Homeland Security",
  "General Services Administration",
  "Department of Veterans Affairs",
  "Department of Energy",
  "NASA",
  "Department of Justice",
];

const valueRanges = [
  { value: "0", label: "No minimum" },
  { value: "25000", label: "$25,000" },
  { value: "50000", label: "$50,000" },
  { value: "100000", label: "$100,000" },
  { value: "250000", label: "$250,000" },
  { value: "500000", label: "$500,000" },
  { value: "1000000", label: "$1,000,000" },
];

const maxValueRanges = [
  { value: "100000", label: "$100,000" },
  { value: "250000", label: "$250,000" },
  { value: "500000", label: "$500,000" },
  { value: "1000000", label: "$1,000,000" },
  { value: "5000000", label: "$5,000,000" },
  { value: "unlimited", label: "No maximum" },
];

const emailFrequencyOptions = [
  { value: "instant", label: "Instant", description: "Get notified immediately" },
  { value: "daily", label: "Daily Digest", description: "One email per day" },
  { value: "weekly", label: "Weekly Summary", description: "Weekly roundup" },
];

const PreferencesStep = ({ data, updateData }: PreferencesStepProps) => {
  const toggleContractType = (typeId: string) => {
    if (data.contractTypes.includes(typeId)) {
      updateData({
        contractTypes: data.contractTypes.filter((t) => t !== typeId),
      });
    } else {
      updateData({ contractTypes: [...data.contractTypes, typeId] });
    }
  };

  const toggleAgency = (agency: string) => {
    if (data.preferredAgencies.includes(agency)) {
      updateData({
        preferredAgencies: data.preferredAgencies.filter((a) => a !== agency),
      });
    } else {
      updateData({ preferredAgencies: [...data.preferredAgencies, agency] });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 rounded-2xl bg-success/20 flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
          Customize your preferences
        </h2>
        <p className="text-muted-foreground">
          Set your search preferences and notification settings
        </p>
      </motion.div>

      <div className="space-y-6">
        {/* Contract Types */}
        <Card variant="glass" className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Contract Types</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {contractTypeOptions.map((type) => (
              <button
                key={type.id}
                onClick={() => toggleContractType(type.id)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  data.contractTypes.includes(type.id)
                    ? "bg-primary/20 border-primary/40"
                    : "bg-secondary/50 border-border hover:border-primary/30"
                }`}
              >
                <div className="font-semibold">{type.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {type.description}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Preferred Agencies */}
        <Card variant="glass" className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Preferred Agencies</h3>
            <span className="text-xs text-muted-foreground">(Optional)</span>
          </div>

          {/* Selected Agencies */}
          {data.preferredAgencies.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {data.preferredAgencies.map((agency) => (
                <Badge
                  key={agency}
                  variant="secondary"
                  className="pl-3 pr-1 py-1.5 flex items-center gap-1"
                >
                  {agency}
                  <button
                    onClick={() => toggleAgency(agency)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {agencyOptions
              .filter((a) => !data.preferredAgencies.includes(a))
              .map((agency) => (
                <button
                  key={agency}
                  onClick={() => toggleAgency(agency)}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  + {agency}
                </button>
              ))}
          </div>
        </Card>

        {/* Contract Value Range */}
        <Card variant="glass" className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-success" />
            <h3 className="font-semibold">Contract Value Range</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Value</Label>
              <Select
                value={data.minContractValue}
                onValueChange={(value) =>
                  updateData({ minContractValue: value })
                }
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select minimum" />
                </SelectTrigger>
                <SelectContent>
                  {valueRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Maximum Value</Label>
              <Select
                value={data.maxContractValue}
                onValueChange={(value) =>
                  updateData({ maxContractValue: value })
                }
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select maximum" />
                </SelectTrigger>
                <SelectContent>
                  {maxValueRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Email Preferences */}
        <Card variant="glass" className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Email Notifications</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {emailFrequencyOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateData({ emailFrequency: option.value })}
                className={`p-4 rounded-lg border text-center transition-all ${
                  data.emailFrequency === option.value
                    ? "bg-primary/20 border-primary/40"
                    : "bg-secondary/50 border-border hover:border-primary/30"
                }`}
              >
                <div className="font-semibold">{option.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 text-success text-sm">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          You're almost done! Click "Complete Setup" to finish.
        </div>
      </motion.div>
    </div>
  );
};

export default PreferencesStep;
