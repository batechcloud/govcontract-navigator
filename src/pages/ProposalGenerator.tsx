import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Sparkles, Search, FileText, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ProposalGenerator() {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    opportunityId: "",
    opportunityTitle: "",
    customInstructions: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleGenerate = async () => {
    if (!formData.opportunityTitle) {
      toast.error("Please enter the opportunity title");
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    toast.success("Proposal generated successfully!");
    setIsGenerating(false);
    setStep(2);
  };

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
            Generate a complete proposal draft in seconds using AI
          </p>
        </motion.div>

        {step === 1 && (
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
                  Enter the opportunity ID to auto-populate details
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
                  placeholder="Add any specific requirements or areas to emphasize..."
                  rows={4}
                  value={formData.customInstructions}
                  onChange={handleChange}
                />
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">What AI will generate:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Executive Summary
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Technical Approach
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Management Plan
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Past Performance Summary
                  </li>
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
                    Generating Proposal...
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
        )}

        {step === 2 && (
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
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                View & Edit Proposal
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
