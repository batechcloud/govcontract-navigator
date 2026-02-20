import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  Sparkles, Search, FileText, ArrowRight, Loader2, Building2,
  CheckCircle2, AlertCircle, ChevronDown, Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useCompanyProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTrackedContracts } from "@/hooks/useTrackedContracts";

export default function ProposalGenerator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: companyProfile, isLoading: profileLoading } = useCompanyProfile();
  const { data: trackedContracts = [] } = useTrackedContracts();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProposalId, setGeneratedProposalId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    opportunityId: "",
    opportunityTitle: "",
    agency: "",
    customInstructions: "",
  });

  // Pre-fill from URL params (e.g. from Search Hub "Start Bid" or tracked contracts)
  useEffect(() => {
    const title = searchParams.get("title");
    const oppId = searchParams.get("opportunityId");
    const agency = searchParams.get("agency");
    if (title || oppId || agency) {
      setFormData(prev => ({
        ...prev,
        opportunityTitle: title ? decodeURIComponent(title) : prev.opportunityTitle,
        opportunityId: oppId ? decodeURIComponent(oppId) : prev.opportunityId,
        agency: agency ? decodeURIComponent(agency) : prev.agency,
      }));
    }
  }, [searchParams]);

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

  const handleSelectTrackedContract = (contract: typeof trackedContracts[0]) => {
    setFormData(prev => ({
      ...prev,
      opportunityId: contract.contract_id,
      opportunityTitle: contract.contract_title,
      agency: contract.contract_agency || "",
    }));
    toast.success(`Loaded: ${contract.contract_title}`);
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
          agency: formData.agency,
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
                link="/dashboard/documents"
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

              {/* Tracked Contract Picker */}
              {trackedContracts.length > 0 && (
                <div className="space-y-2">
                  <Label>Pick from Saved Contracts</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between font-normal text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <Bookmark className="w-4 h-4" />
                          {formData.opportunityTitle
                            ? <span className="text-foreground truncate max-w-xs">{formData.opportunityTitle}</span>
                            : "Select a tracked opportunity…"}
                        </span>
                        <ChevronDown className="w-4 h-4 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto bg-card border-border">
                      <DropdownMenuLabel className="text-xs text-muted-foreground">Your tracked opportunities</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {trackedContracts.map((contract) => (
                        <DropdownMenuItem
                          key={contract.id}
                          onClick={() => handleSelectTrackedContract(contract)}
                          className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
                        >
                          <span className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                            {contract.contract_title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {contract.contract_agency || "Unknown agency"}
                            {contract.match_score ? ` · ${contract.match_score}% match` : ""}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="text-xs text-muted-foreground">Or fill in the fields below manually</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="opportunityId">Opportunity / Solicitation ID (Optional)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="opportunityId"
                    name="opportunityId"
                    placeholder="e.g. N0001926R0018"
                    className="pl-10"
                    value={formData.opportunityId}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="opportunityTitle">Opportunity Title *</Label>
                <Input
                  id="opportunityTitle"
                  name="opportunityTitle"
                  placeholder="e.g. IT Support Services for Department of Defense"
                  value={formData.opportunityTitle}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agency">Awarding Agency (Optional)</Label>
                <Input
                  id="agency"
                  name="agency"
                  placeholder="e.g. Department of Homeland Security"
                  value={formData.agency}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customInstructions">Custom Instructions (Optional)</Label>
                <Textarea
                  id="customInstructions"
                  name="customInstructions"
                  placeholder="Add specific requirements, areas to emphasize, or any extra context about this contract…"
                  rows={3}
                  value={formData.customInstructions}
                  onChange={handleChange}
                />
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2 text-sm">AI will generate all of these:</h4>
                <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                  {[
                    "Executive Summary",
                    "Technical Approach",
                    "Management Plan",
                    "Past Performance Summary",
                    "Pricing Strategy Notes",
                    "Match Score",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={handleGenerate}
                className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                disabled={isGenerating || !formData.opportunityTitle.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating — this may take 30–60 seconds…
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
                    setFormData({ opportunityId: "", opportunityTitle: "", agency: "", customInstructions: "" });
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
