import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Save,
  Plus,
  X,
  Award,
  FileText,
  Target,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useCompanyProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const CERTIFICATION_OPTIONS = [
  "8(a) Business Development",
  "HUBZone",
  "Women-Owned Small Business (WOSB)",
  "Economically Disadvantaged WOSB (EDWOSB)",
  "Service-Disabled Veteran-Owned (SDVOSB)",
  "Veteran-Owned Small Business (VOSB)",
  "Small Disadvantaged Business (SDB)",
  "Minority-Owned Business",
  "GSA Schedule Holder",
  "ISO 9001 Certified",
  "ISO 27001 Certified",
  "CMMC Level 1",
  "CMMC Level 2",
  "CMMC Level 3",
];

const EMPLOYEE_COUNT_OPTIONS = [
  "1-10",
  "11-50",
  "51-100",
  "101-250",
  "251-500",
  "500+",
];

const REVENUE_OPTIONS = [
  "Under $500K",
  "$500K - $1M",
  "$1M - $5M",
  "$5M - $10M",
  "$10M - $25M",
  "$25M - $50M",
  "$50M+",
];

const CompanyProfile = () => {
  const { user } = useAuth();
  const { data: companyProfile, isLoading } = useCompanyProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    sam_uei: "",
    cage_code: "",
    duns_number: "",
    year_founded: "",
    employee_count: "",
    annual_revenue: "",
    naics_codes: [] as string[],
    certifications: [] as string[],
    capabilities: [] as string[],
  });
  
  const [newNaics, setNewNaics] = useState("");
  const [newCapability, setNewCapability] = useState("");

  // Load existing data
  useEffect(() => {
    if (companyProfile) {
      setFormData({
        company_name: companyProfile.company_name || "",
        sam_uei: companyProfile.sam_uei || "",
        cage_code: companyProfile.cage_code || "",
        duns_number: companyProfile.duns_number || "",
        year_founded: companyProfile.year_founded?.toString() || "",
        employee_count: companyProfile.employee_count || "",
        annual_revenue: companyProfile.annual_revenue || "",
        naics_codes: companyProfile.naics_codes || [],
        certifications: companyProfile.certifications || [],
        capabilities: companyProfile.capabilities || [],
      });
    }
  }, [companyProfile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addNaicsCode = () => {
    if (newNaics && !formData.naics_codes.includes(newNaics)) {
      setFormData((prev) => ({
        ...prev,
        naics_codes: [...prev.naics_codes, newNaics],
      }));
      setNewNaics("");
    }
  };

  const removeNaicsCode = (code: string) => {
    setFormData((prev) => ({
      ...prev,
      naics_codes: prev.naics_codes.filter((c) => c !== code),
    }));
  };

  const toggleCertification = (cert: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter((c) => c !== cert)
        : [...prev.certifications, cert],
    }));
  };

  const addCapability = () => {
    if (newCapability && !formData.capabilities.includes(newCapability)) {
      setFormData((prev) => ({
        ...prev,
        capabilities: [...prev.capabilities, newCapability],
      }));
      setNewCapability("");
    }
  };

  const removeCapability = (cap: string) => {
    setFormData((prev) => ({
      ...prev,
      capabilities: prev.capabilities.filter((c) => c !== cap),
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from("company_profiles")
        .upsert({
          user_id: user.id,
          company_name: formData.company_name || "My Company",
          sam_uei: formData.sam_uei || null,
          cage_code: formData.cage_code || null,
          duns_number: formData.duns_number || null,
          year_founded: formData.year_founded ? parseInt(formData.year_founded) : null,
          employee_count: formData.employee_count || null,
          annual_revenue: formData.annual_revenue || null,
          naics_codes: formData.naics_codes,
          certifications: formData.certifications,
          capabilities: formData.capabilities,
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["company-profile"] });
      
      toast({
        title: "Profile saved",
        description: "Your company profile has been updated.",
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error saving profile",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Company Profile">
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Company Profile">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Company Information */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Company Information
            </CardTitle>
            <CardDescription>
              Basic information about your business for contract matching.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  placeholder="Your Company, LLC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sam_uei">SAM.gov UEI</Label>
                <Input
                  id="sam_uei"
                  value={formData.sam_uei}
                  onChange={(e) => handleInputChange("sam_uei", e.target.value)}
                  placeholder="12-character UEI"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cage_code">CAGE Code</Label>
                <Input
                  id="cage_code"
                  value={formData.cage_code}
                  onChange={(e) => handleInputChange("cage_code", e.target.value)}
                  placeholder="5-character code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duns_number">DUNS Number</Label>
                <Input
                  id="duns_number"
                  value={formData.duns_number}
                  onChange={(e) => handleInputChange("duns_number", e.target.value)}
                  placeholder="9-digit number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year_founded">Year Founded</Label>
                <Input
                  id="year_founded"
                  type="number"
                  value={formData.year_founded}
                  onChange={(e) => handleInputChange("year_founded", e.target.value)}
                  placeholder="2020"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_count">Employee Count</Label>
                <Select
                  value={formData.employee_count}
                  onValueChange={(value) => handleInputChange("employee_count", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_COUNT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="annual_revenue">Annual Revenue</Label>
                <Select
                  value={formData.annual_revenue}
                  onValueChange={(value) => handleInputChange("annual_revenue", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    {REVENUE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NAICS Codes */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              NAICS Codes
            </CardTitle>
            <CardDescription>
              Industry codes that describe your business capabilities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newNaics}
                onChange={(e) => setNewNaics(e.target.value)}
                placeholder="Enter NAICS code (e.g., 541512)"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addNaicsCode())}
              />
              <Button type="button" variant="outline" onClick={addNaicsCode}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.naics_codes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No NAICS codes added yet.</p>
              ) : (
                formData.naics_codes.map((code) => (
                  <Badge key={code} variant="secondary" className="px-3 py-1.5">
                    {code}
                    <button
                      type="button"
                      onClick={() => removeNaicsCode(code)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Certifications
            </CardTitle>
            <CardDescription>
              Select certifications your business holds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {CERTIFICATION_OPTIONS.map((cert) => (
                <Badge
                  key={cert}
                  variant={formData.certifications.includes(cert) ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => toggleCertification(cert)}
                >
                  {formData.certifications.includes(cert) && (
                    <span className="mr-1">✓</span>
                  )}
                  {cert}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Capabilities */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Core Capabilities
            </CardTitle>
            <CardDescription>
              List the services and capabilities your company provides.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                value={newCapability}
                onChange={(e) => setNewCapability(e.target.value)}
                placeholder="Describe a core capability..."
                className="min-h-[60px]"
              />
              <Button type="button" variant="outline" onClick={addCapability} className="shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {formData.capabilities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No capabilities added yet.</p>
              ) : (
                formData.capabilities.map((cap, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 border border-border/50"
                  >
                    <span className="flex-1 text-sm">{cap}</span>
                    <button
                      type="button"
                      onClick={() => removeCapability(cap)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button variant="hero" size="lg" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default CompanyProfile;
