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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Building2,
  Save,
  Plus,
  X,
  ChevronDown,
  Loader2,
  Shield,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useCompanyProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const CERTIFICATION_OPTIONS = [
  { value: "Small Business", description: "Registered small business" },
  { value: "Veteran-Owned", description: "Owned by a military veteran" },
  { value: "Woman-Owned", description: "Owned by a woman" },
  { value: "Minority-Owned", description: "Owned by a minority individual" },
  { value: "HUBZone", description: "Located in a historically underutilized area" },
  { value: "8(a) Program", description: "SBA development program participant" },
];

const EMPLOYEE_COUNT_OPTIONS = ["1-10", "11-50", "51-100", "101-250", "251-500", "500+"];
const REVENUE_OPTIONS = ["Under $500K", "$500K - $1M", "$1M - $5M", "$5M - $10M", "$10M - $25M", "$25M+"];

const CompanyProfile = () => {
  const { user } = useAuth();
  const { data: companyProfile, isLoading } = useCompanyProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  
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
  
  const [newCapability, setNewCapability] = useState("");

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
      toast({ title: "Saved!", description: "Your business profile has been updated." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="My Business">
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Business">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 max-w-3xl"
      >
        {/* Basic Info */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Tell Us About Your Business
            </CardTitle>
            <CardDescription>
              This helps us find the best contract matches for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Business Name *</Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  placeholder="Your Company, LLC"
                />
              </div>
              <div className="space-y-2">
                <Label>How many employees?</Label>
                <Select value={formData.employee_count} onValueChange={(v) => handleInputChange("employee_count", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_COUNT_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Annual Revenue</Label>
                <Select value={formData.annual_revenue} onValueChange={(v) => handleInputChange("annual_revenue", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {REVENUE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year Founded</Label>
                <Input
                  type="number"
                  value={formData.year_founded}
                  onChange={(e) => handleInputChange("year_founded", e.target.value)}
                  placeholder="2020"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What You Do */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>What Does Your Business Do?</CardTitle>
            <CardDescription>
              Describe your services in your own words. This helps match you with the right contracts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                value={newCapability}
                onChange={(e) => setNewCapability(e.target.value)}
                placeholder="e.g., We provide IT support and cybersecurity services..."
                className="min-h-[60px]"
              />
              <Button variant="outline" onClick={addCapability} className="shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {formData.capabilities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add what your business does to get better matches.</p>
              ) : (
                formData.capabilities.map((cap, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <span className="flex-1 text-sm">{cap}</span>
                    <button onClick={() => removeCapability(cap)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Business Certifications
            </CardTitle>
            <CardDescription>
              Do any of these apply to your business? They can help you qualify for more contracts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {CERTIFICATION_OPTIONS.map(cert => (
                <button
                  key={cert.value}
                  onClick={() => toggleCertification(cert.value)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    formData.certifications.includes(cert.value)
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {formData.certifications.includes(cert.value) && <span className="text-primary">✓</span>}
                    <span className="text-sm font-medium text-foreground">{cert.value}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{cert.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Advanced / Government IDs */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <Card variant="glass">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>Advanced: Government IDs</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
                </CardTitle>
                <CardDescription className="text-left">
                  Optional — add these if you already have them.
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SAM.gov UEI</Label>
                    <Input
                      value={formData.sam_uei}
                      onChange={(e) => handleInputChange("sam_uei", e.target.value)}
                      placeholder="12-character ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CAGE Code</Label>
                    <Input
                      value={formData.cage_code}
                      onChange={(e) => handleInputChange("cage_code", e.target.value)}
                      placeholder="5-character code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>DUNS Number</Label>
                    <Input
                      value={formData.duns_number}
                      onChange={(e) => handleInputChange("duns_number", e.target.value)}
                      placeholder="9-digit number"
                    />
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Save */}
        <div className="flex justify-end">
          <Button variant="hero" size="lg" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Profile</>
            )}
          </Button>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default CompanyProfile;
