import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { FileText, Download, Sparkles, Check, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export default function CapabilityStatement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: companyProfile } = useCompanyProfile();
  const [formData, setFormData] = useState({
    companyName: "",
    tagline: "",
    naicsCodes: "",
    coreCompetencies: "",
    differentiators: "",
    pastPerformance: "",
    certifications: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    website: ""
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  useEffect(() => {
    if (companyProfile && !autoFilled) {
      const pastPerf = Array.isArray(companyProfile.past_performance)
        ? companyProfile.past_performance
            .map((p: Record<string, unknown>) => `${p.project_name || p.title || ""} - ${p.description || ""}`.trim())
            .filter(Boolean)
            .join("\n")
        : "";

      setFormData(prev => ({
        ...prev,
        companyName: companyProfile.company_name || prev.companyName,
        naicsCodes: companyProfile.naics_codes?.join(", ") || prev.naicsCodes,
        coreCompetencies: companyProfile.capabilities?.join("\n") || prev.coreCompetencies,
        certifications: companyProfile.certifications?.join(", ") || prev.certifications,
        pastPerformance: pastPerf || prev.pastPerformance,
        contactEmail: user?.email || prev.contactEmail,
      }));
      setAutoFilled(true);
      toast.success("Auto-filled from your company profile!", { icon: <UserCheck className="w-4 h-4" /> });
    }
  }, [companyProfile, autoFilled, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const buildCapabilityStatementText = () => {
    const lines = [
      `CAPABILITY STATEMENT`,
      `====================`,
      ``,
      `Company: ${formData.companyName}`,
      formData.tagline ? `Tagline: ${formData.tagline}` : "",
      ``,
      formData.naicsCodes ? `NAICS Codes: ${formData.naicsCodes}` : "",
      ``,
      `CORE COMPETENCIES`,
      `------------------`,
      formData.coreCompetencies,
      ``,
      formData.differentiators ? `DIFFERENTIATORS\n----------------\n${formData.differentiators}\n` : "",
      formData.pastPerformance ? `PAST PERFORMANCE\n-----------------\n${formData.pastPerformance}\n` : "",
      formData.certifications ? `CERTIFICATIONS: ${formData.certifications}\n` : "",
      `CONTACT INFORMATION`,
      `--------------------`,
      formData.contactName ? `Name: ${formData.contactName}` : "",
      formData.contactEmail ? `Email: ${formData.contactEmail}` : "",
      formData.contactPhone ? `Phone: ${formData.contactPhone}` : "",
      formData.website ? `Website: ${formData.website}` : "",
    ].filter(Boolean).join("\n");
    return lines;
  };

  const handleGenerate = async () => {
    if (!formData.companyName || !formData.coreCompetencies) {
      toast.error("Please fill in at least your company name and core competencies");
      return;
    }

    setIsGenerating(true);

    try {
      const content = buildCapabilityStatementText();
      const blob = new Blob([content], { type: "text/plain" });
      const fileName = `Capability_Statement_${formData.companyName.replace(/\s+/g, "_")}.txt`;

      // Download locally
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      // Auto-save to user's documents if logged in
      if (user) {
        const path = `${user.id}/${Date.now()}_${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(path, blob);

        if (!uploadError) {
          await supabase.from("user_documents").insert({
            user_id: user.id,
            file_name: fileName,
            file_type: "text/plain",
            file_size: blob.size,
            storage_path: path,
            category: "capability_statement",
          });
          queryClient.invalidateQueries({ queryKey: ["user-documents"] });
          toast.success("Generated & saved to your Business Documents!", {
            icon: <Check className="w-4 h-4" />,
          });
        } else {
          toast.success("Downloaded! (Could not auto-save to your account)");
        }
      } else {
        toast.success("Capability statement generated! Sign in to auto-save future statements.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Free Tool</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Capability Statement <span className="text-primary">Generator</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create a professional capability statement in minutes. No account required.
            </p>
            {user && (
              <p className="text-sm text-primary mt-3">
                ✓ Signed in — your statement will be auto-saved to My Business documents.
              </p>
            )}
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <motion.div
              className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Enter Your Company Information</h2>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input 
                      id="companyName" 
                      name="companyName"
                      placeholder="Your Company LLC"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input 
                      id="tagline" 
                      name="tagline"
                      placeholder="Your company's mission or tagline"
                      value={formData.tagline}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="naicsCodes">NAICS Codes</Label>
                  <Input 
                    id="naicsCodes" 
                    name="naicsCodes"
                    placeholder="541512, 541511, 541519"
                    value={formData.naicsCodes}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-muted-foreground">Separate multiple codes with commas</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coreCompetencies">Core Competencies *</Label>
                  <Textarea 
                    id="coreCompetencies" 
                    name="coreCompetencies"
                    placeholder="List your main capabilities and services..."
                    rows={3}
                    value={formData.coreCompetencies}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="differentiators">Differentiators</Label>
                  <Textarea 
                    id="differentiators" 
                    name="differentiators"
                    placeholder="What makes your company unique?"
                    rows={3}
                    value={formData.differentiators}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pastPerformance">Past Performance</Label>
                  <Textarea 
                    id="pastPerformance" 
                    name="pastPerformance"
                    placeholder="Key contracts or projects you've completed..."
                    rows={3}
                    value={formData.pastPerformance}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certifications">Certifications</Label>
                  <Input 
                    id="certifications" 
                    name="certifications"
                    placeholder="8(a), HUBZone, WOSB, SDVOSB, etc."
                    value={formData.certifications}
                    onChange={handleChange}
                  />
                </div>

                <div className="border-t border-border/50 pt-6">
                  <h3 className="font-medium text-foreground mb-4">Contact Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Name</Label>
                      <Input 
                        id="contactName" 
                        name="contactName"
                        placeholder="John Doe"
                        value={formData.contactName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email</Label>
                      <Input 
                        id="contactEmail" 
                        name="contactEmail"
                        type="email"
                        placeholder="john@company.com"
                        value={formData.contactEmail}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Phone</Label>
                      <Input 
                        id="contactPhone" 
                        name="contactPhone"
                        placeholder="(555) 123-4567"
                        value={formData.contactPhone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input 
                        id="website" 
                        name="website"
                        placeholder="www.yourcompany.com"
                        value={formData.website}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    "Generating..."
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Generate Capability Statement
                    </>
                  )}
                </Button>

                {!user && (
                  <p className="text-center text-sm text-muted-foreground">
                    Want more features? <a href="/auth" className="text-primary hover:underline">Sign up for free</a> to auto-save your statements.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
