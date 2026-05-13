import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Upload,
  FileText,
  Trash2,
  Download,
  Eye,
} from "lucide-react";
import { NaicsCodeSelector } from "@/components/company/NaicsCodeSelector";
import { PscCodeSelector } from "@/components/company/PscCodeSelector";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useCompanyProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";

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

const DOCUMENT_CATEGORIES = [
  { value: "capability_statement", label: "Capability Statement" },
  { value: "past_performance", label: "Past Performance" },
  { value: "certification", label: "Certifications" },
  { value: "resume", label: "Team Resumes" },
  { value: "general", label: "Other Documents" },
];

const CompanyProfile = () => {
  const { user } = useAuth();
  const { data: companyProfile, isLoading } = useCompanyProfile();
  const queryClient = useQueryClient();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string; type: string } | null>(null);
  
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
    psc_codes: [] as string[],
    certifications: [] as string[],
    capabilities: [] as string[],
  });
  
  const [newCapability, setNewCapability] = useState("");

  // Fetch user documents
  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["user-documents"],
    queryFn: async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("user_documents")
        .select("*")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", { description: "Maximum file size is 10MB." });
      return;
    }
    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("user_documents").insert({
        user_id: user.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: path,
        category: selectedCategory,
      });
      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ["user-documents"] });
      toast.success("Uploaded!", { description: `${file.name} has been saved.` });
    } catch (err: any) {
      toast.error("Upload failed", { description: err.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDoc = async (doc: any) => {
    try {
      await supabase.storage.from("documents").remove([doc.storage_path]);
      await supabase.from("user_documents").delete().eq("id", doc.id);
      queryClient.invalidateQueries({ queryKey: ["user-documents"] });
      toast.success("Deleted", { description: `${doc.file_name} removed.` });
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    }
  };

  const handleDownloadDoc = async (doc: any) => {
    const { data, error } = await supabase.storage.from("documents").download(doc.storage_path);
    if (error || !data) {
      toast.error("Error", { description: "Could not download file." });
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePreviewDoc = async (doc: any) => {
    const isPreviewable = /\.(pdf|png|jpg|jpeg|gif|webp|txt|svg)$/i.test(doc.file_name);
    if (!isPreviewable) {
      toast("Preview not available", { description: "This file type can't be previewed. Try downloading instead." });
      return;
    }
    const { data, error } = await supabase.storage.from("documents").download(doc.storage_path);
    if (error || !data) {
      toast.error("Error", { description: "Could not load preview." });
      return;
    }
    const url = URL.createObjectURL(data);
    setPreviewDoc({ url, name: doc.file_name, type: doc.file_type || "" });
  };

  const closePreview = () => {
    if (previewDoc) URL.revokeObjectURL(previewDoc.url);
    setPreviewDoc(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
        psc_codes: (companyProfile as any).psc_codes || [],
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
          psc_codes: formData.psc_codes,
          certifications: formData.certifications,
          capabilities: formData.capabilities,
        } as any, { onConflict: "user_id" });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["company-profile"] });
      toast.success("Saved!", { description: "Your business profile has been updated." });
    } catch (error: any) {
      toast.error("Error", { description: error.message || "Please try again." });
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
      <PageContainer variant="narrow" className="space-y-6">
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
                <div className="space-y-2 pt-2">
                  <Label>NAICS Codes</Label>
                  <NaicsCodeSelector
                    selected={formData.naics_codes}
                    onChange={(codes) => setFormData(prev => ({ ...prev, naics_codes: codes }))}
                  />
                </div>
                <div className="space-y-2 pt-2">
                  <Label>Product & Service Codes (PSC)</Label>
                  <PscCodeSelector
                    selected={formData.psc_codes}
                    onChange={(codes) => setFormData(prev => ({ ...prev, psc_codes: codes }))}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Documents */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Business Documents
            </CardTitle>
            <CardDescription>
              Upload your Capability Statement, past performance docs, certifications, and more.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1 sm:flex-none"
              >
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Upload File</>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Max 10MB. Supports PDF, Word, Excel, PowerPoint, images.</p>

            {docsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : documents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{doc.file_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {DOCUMENT_CATEGORIES.find(c => c.value === doc.category)?.label || "Other"}
                          </Badge>
                          <span>{formatFileSize(doc.file_size || 0)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => handlePreviewDoc(doc)} title="Preview">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadDoc(doc)} title="Download">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDoc(doc)} className="text-destructive hover:text-destructive" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate">{previewDoc?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 rounded-lg overflow-hidden bg-secondary/20">
            {previewDoc && (
              previewDoc.type.startsWith("image/") ? (
                <img src={previewDoc.url} alt={previewDoc.name} className="w-full h-full object-contain" />
              ) : previewDoc.name.endsWith(".pdf") ? (
                <iframe src={previewDoc.url} className="w-full h-full border-0" title={previewDoc.name} />
              ) : previewDoc.type.startsWith("text/") ? (
                <iframe src={previewDoc.url} className="w-full h-full border-0 bg-background p-4" title={previewDoc.name} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Preview not available for this file type.
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CompanyProfile;
