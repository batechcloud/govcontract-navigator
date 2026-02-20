import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Sparkles, Search, FileText, ArrowRight, Loader2, Building2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useCompanyProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function ProposalGenerator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: companyProfile, isLoading: profileLoading } = useCompanyProfile();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProposalId, setGeneratedProposalId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    opportunityId: "",
    opportunityTitle: "",
    customInstructions: "",
  });

  // Fetch user documents count
  const { data: docsCount = 0 } = useQuery({
    queryKey: ["user-documents-count"],
    queryFn: async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return 0;
      const { count } = await supabase
        .from("user_documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", u.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerate = async () => {
    if (!formData.opportunityTitle) {
      toast.error("Please enter the opportunity title");
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-proposal", {
        body: {
          opportunityId: formData.opportunityId,
          opportunityTitle: formData.opportunityTitle,
          customInstructions: formData.customInstructions,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedProposalId(data.proposal.id);
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Proposal generated successfully!");
    } catch (err: any) {
      console.error("Generate error:", err);
      toast.error(err.message || "Failed to generate proposal. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const profileComplete = companyProfile?.company_name && (companyProfile?.capabilities?.length ?? 0) > 0;

  return (
    <DashboardLayout title="AI Proposal Generator">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">AI Proposal Generator</h2>
          <p className="text-muted-foreground">
            AI pulls your business profile, documents, and past performance to craft a winning proposal
          </p>
        </motion.div>

        {/* Data Sources Status */}
        <motion.div
          className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-5 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Data Sources for Your Proposal
          </h3>
          {profileLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              <DataSourceItem
                label="Business Profile"
                ready={!!profileComplete}
                detail={profileComplete ? companyProfile!.company_name : "Not set up yet"}
                link="/dashboard/company"
              />
              <DataSourceItem
                label="Certifications"
                ready={(companyProfile?.certifications?.length ?? 0) > 0}
                detail={
                  (companyProfile?.certifications?.length ?? 0) > 0
                    ? companyProfile!.certifications!.join(", ")
                    : "None added"
                }
                link="/dashboard/company"
              />
              <DataSourceItem
                label="Business Documents"
                ready={docsCount > 0}
                detail={docsCount > 0 ? `${docsCount} document${docsCount > 1 ? "s" : ""} uploaded` : "None uploaded"}
                link="/dashboard/company"
              />
              <DataSourceItem
                label="Capabilities"
                ready={(companyProfile?.capabilities?.length ?? 0) > 0}
                detail={
                  (companyProfile?.capabilities?.length ?? 0) > 0
                    ? `${companyProfile!.capabilities!.length} listed`
                    : "None added"
                }
                link="/dashboard/company"
              />
            </div>
          )}
        </motion.div>

        {!generatedProposalId ? (
          <motion.div
            className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="opportunityId">Opportunity ID (Optional)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="opportunityId"
                    name="opportunityId"
                    placeholder="Enter SAM.gov notice ID or search..."
                    className="pl-10"
                    value={formData.opportunityId}
                    onChange={handleChange}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the opportunity ID for more targeted proposals
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="opportunityTitle">Opportunity Title *</Label>
                <Input
                  id="opportunityTitle"
                  name="opportunityTitle"
                  placeholder="e.g., IT Support Services for Department of Defense"
                  value={formData.opportunityTitle}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customInstructions">Custom Instructions (Optional)</Label>
                <Textarea
                  id="customInstructions"
                  name="customInstructions"
                  placeholder="Add any specific requirements, areas to emphasize, or contract details..."
                  rows={4}
                  value={formData.customInstructions}
                  onChange={handleChange}
                />
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">What AI will generate:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {["Executive Summary", "Technical Approach", "Management Plan", "Past Performance Summary", "Pricing Strategy Notes", "Match Score"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={handleGenerate}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Proposal — this may take 30-60 seconds...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Proposal
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Proposal Generated!</h3>
              <p className="text-muted-foreground mb-6">
                Your AI-generated proposal is ready for review and editing.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => navigate(`/dashboard/proposals/${generatedProposalId}`)}
                >
                  View & Edit Proposal
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeneratedProposalId(null);
                    setFormData({ opportunityId: "", opportunityTitle: "", customInstructions: "" });
                  }}
                >
                  Generate Another
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

function DataSourceItem({
  label,
  ready,
  detail,
  link,
}: {
  label: string;
  ready: boolean;
  detail: string;
  link: string;
}) {
  return (
    <Link
      to={link}
      className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20 border border-border/30 hover:border-primary/30 transition-colors"
    >
      {ready ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{detail}</p>
      </div>
    </Link>
  );
}
