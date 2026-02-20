import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import {
  FileText, Download, Save, ArrowLeft, Loader2, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle,
} from "docx";
import { saveAs } from "file-saver";

const SECTIONS = [
  { key: "executive_summary", label: "Executive Summary" },
  { key: "technical_approach", label: "Technical Approach" },
  { key: "management_plan", label: "Management Plan" },
  { key: "past_performance", label: "Past Performance" },
  { key: "pricing_notes", label: "Pricing Notes" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

export default function ProposalEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});

  const { data: proposal, isLoading } = useQuery({
    queryKey: ["proposal", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const getValue = (key: SectionKey) =>
    edits[key] ?? (proposal as any)?.[key] ?? "";

  const handleEdit = (key: string, value: string) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!id || Object.keys(edits).length === 0) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("proposals")
        .update(edits)
        .eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      setEdits({});
      toast.success("Proposal saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const exportToWord = async () => {
    if (!proposal) return;

    const titleRun = (text: string) =>
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 28, font: "Calibri" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      });

    const sectionHeading = (text: string) =>
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 24, font: "Calibri", color: "2E4057" })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        },
      });

    const bodyParagraphs = (text: string) =>
      (text || "").split("\n\n").map(
        (para) =>
          new Paragraph({
            children: [new TextRun({ text: para.trim(), size: 22, font: "Calibri" })],
            spacing: { after: 200 },
            alignment: AlignmentType.JUSTIFIED,
          })
      );

    const children = [
      titleRun(proposal.opportunity_title),
      new Paragraph({
        children: [
          new TextRun({ text: `Opportunity ID: ${proposal.opportunity_id}`, italics: true, size: 20, color: "666666", font: "Calibri" }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Generated: ${new Date(proposal.ai_generated_at || proposal.created_at).toLocaleDateString()}`, italics: true, size: 20, color: "666666", font: "Calibri" }),
        ],
        spacing: { after: 400 },
      }),
    ];

    if (proposal.match_score) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Match Score: ${proposal.match_score}/100`, bold: true, size: 22, font: "Calibri", color: "2E7D32" }),
          ],
          spacing: { after: 400 },
        })
      );
    }

    for (const section of SECTIONS) {
      const content = getValue(section.key);
      if (content) {
        children.push(sectionHeading(section.label), ...bodyParagraphs(content));
      }
    }

    const doc = new Document({
      sections: [{ children }],
      styles: {
        default: {
          document: {
            run: { font: "Calibri", size: 22 },
          },
        },
      },
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `Proposal_${proposal.opportunity_title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 40)}.docx`;
    saveAs(blob, fileName);
    toast.success("Word document downloaded!");
  };

  const exportToText = () => {
    if (!proposal) return;
    const lines = [
      proposal.opportunity_title,
      `Opportunity ID: ${proposal.opportunity_id}`,
      `Generated: ${new Date(proposal.ai_generated_at || proposal.created_at).toLocaleDateString()}`,
      proposal.match_score ? `Match Score: ${proposal.match_score}/100` : "",
      "",
    ];
    for (const section of SECTIONS) {
      const content = getValue(section.key);
      if (content) {
        lines.push(`${"=".repeat(40)}`, section.label.toUpperCase(), `${"=".repeat(40)}`, "", content, "");
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const fileName = `Proposal_${proposal.opportunity_title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 40)}.txt`;
    saveAs(blob, fileName);
    toast.success("Text file downloaded!");
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Proposal">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!proposal) {
    return (
      <DashboardLayout title="Proposal">
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Proposal Not Found</h3>
          <Button variant="outline" onClick={() => navigate("/dashboard/proposals")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Proposals
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const hasEdits = Object.keys(edits).length > 0;

  return (
    <DashboardLayout title="Proposal">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="min-w-0">
            <Button variant="ghost" size="sm" className="mb-2" onClick={() => navigate("/dashboard/proposals")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h2 className="text-xl font-bold text-foreground truncate">{proposal.opportunity_title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline">{proposal.status}</Badge>
              {proposal.match_score && (
                <Badge className="bg-emerald-500/20 text-emerald-400">
                  {proposal.match_score}% match
                </Badge>
              )}
              {proposal.ai_generated_at && (
                <span className="text-xs text-muted-foreground">
                  AI generated {new Date(proposal.ai_generated_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasEdits && (
              <Button onClick={handleSave} disabled={isSaving} variant="hero" size="sm">
                {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Save Changes
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToWord}>
                  <FileText className="w-4 h-4 mr-2" />
                  Download as Word (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToText}>
                  <FileText className="w-4 h-4 mr-2" />
                  Download as Text (.txt)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="executive_summary">
            <TabsList className="w-full flex-wrap h-auto gap-1 bg-card/50 p-1">
              {SECTIONS.map((s) => (
                <TabsTrigger key={s.key} value={s.key} className="text-xs sm:text-sm">
                  {s.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {SECTIONS.map((s) => (
              <TabsContent key={s.key} value={s.key}>
                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">{s.label}</h3>
                    {edits[s.key] !== undefined && (
                      <Badge variant="outline" className="text-xs text-accent">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Edited
                      </Badge>
                    )}
                  </div>
                  <Textarea
                    value={getValue(s.key)}
                    onChange={(e) => handleEdit(s.key, e.target.value)}
                    className="min-h-[300px] text-sm leading-relaxed"
                    placeholder={`Write your ${s.label.toLowerCase()} here...`}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
