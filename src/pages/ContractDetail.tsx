import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Building2, Clock, DollarSign, MapPin, FileText, Heart,
  ExternalLink, MessageSquare, Sparkles, Hash, Calendar, Globe, Tag,
  StickyNote, Shield, Save, Paperclip, Download, Brain, Loader2, RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrackedContracts, useTrackContract, useUpdateContractNotes, useUpdateContractStatus, TrackedContract } from "@/hooks/useTrackedContracts";
import { SearchResult } from "@/hooks/useSearch";
import { supabase } from "@/integrations/supabase/client";
import { useWinProbability, ContractScoreInput, ContractScoreResult } from "@/hooks/useWinProbability";
import { WinScoreModal } from "@/components/search/WinScoreModal";
import { toast } from "sonner";
import { PIPELINE_STATUSES } from "@/components/tracked/KanbanBoard";

function getDaysLeft(deadline: string | null) {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (days < 0) return { text: "Expired", cls: "text-destructive", days };
  if (days === 0) return { text: "Due today", cls: "text-destructive", days };
  if (days <= 3) return { text: `${days} days left`, cls: "text-destructive", days };
  if (days <= 7) return { text: `${days} days left`, cls: "text-accent", days };
  return { text: `${days} days left`, cls: "text-success", days };
}

interface ContractData {
  id: string;
  title: string;
  agency: string;
  type?: string;
  setAside?: string;
  value?: string;
  deadline?: string;
  postedDate?: string;
  location?: string;
  naicsCode?: string;
  description?: string;
  solicitationNumber?: string;
  link?: string;
  matchScore?: number;
  resourceLinks?: string[];
}

function extractFilename(url: string, index: number): string {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/");
    const last = segments[segments.length - 1];
    if (last && last.length > 3 && /\.\w{2,5}$/.test(last)) {
      return decodeURIComponent(last);
    }
  } catch { /* fallback */ }
  return `Attachment ${index + 1}`;
}

function trackedToContractData(tc: TrackedContract): ContractData {
  return {
    id: tc.contract_id,
    title: tc.contract_title,
    agency: tc.contract_agency || "",
    value: tc.contract_value || undefined,
    deadline: tc.response_deadline || undefined,
    postedDate: tc.posted_date || undefined,
    naicsCode: tc.naics_code || undefined,
    setAside: tc.set_aside || undefined,
    matchScore: tc.match_score || undefined,
    resourceLinks: tc.resource_links || undefined,
  };
}

const ContractDetail = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Data from router state (coming from search results)
  const stateData = (location.state as { contractData?: SearchResult })?.contractData;

  // Tracked contracts from DB
  const { data: trackedContracts } = useTrackedContracts();
  const trackContract = useTrackContract();
  const updateNotes = useUpdateContractNotes();
  const updateStatus = useUpdateContractStatus();
  const winScore = useWinProbability();
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [scoreResult, setScoreResult] = useState<ContractScoreResult | null>(null);

  // Direct-fetch fallback state (for new-tab / direct URL access)
  const [fetchedContract, setFetchedContract] = useState<ContractData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // AI Summary state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const summaryFetchedRef = useRef(false);

  // Find tracked version by contract_id or by table id
  const tracked = trackedContracts?.find(
    (c) => c.contract_id === contractId || c.id === contractId
  );

  // Build display data: prefer router state, fallback to tracked, then fetched
  const contract: ContractData | null = stateData
    ? {
        id: stateData.id,
        title: stateData.title,
        agency: stateData.agency,
        type: stateData.type,
        setAside: stateData.setAside,
        value: stateData.value,
        deadline: stateData.deadline,
        postedDate: stateData.postedDate,
        location: stateData.location,
        naicsCode: stateData.naicsCode,
        description: stateData.description,
        solicitationNumber: stateData.solicitationNumber,
        link: stateData.link,
        matchScore: stateData.matchScore,
        resourceLinks: stateData.resourceLinks,
      }
    : tracked
      ? trackedToContractData(tracked)
      : fetchedContract;

  // Fallback: fetch contract when no state data and not tracked
  useEffect(() => {
    if (stateData || tracked || fetchedContract || fetchLoading || !contractId) return;

    const fetchContract = async () => {
      setFetchLoading(true);
      try {
        // 1) Check cached_contracts table first
        const { data: cached } = await supabase
          .from("cached_contracts")
          .select("*")
          .eq("contract_id", contractId)
          .limit(1)
          .maybeSingle();

        if (cached) {
          setFetchedContract({
            id: cached.contract_id,
            title: cached.title || "Untitled",
            agency: cached.agency || "Federal Agency",
            type: cached.contract_type || undefined,
            setAside: cached.set_aside || undefined,
            value: cached.value ? (cached.value >= 1000000 ? `$${(Number(cached.value) / 1000000).toFixed(1)}M` : cached.value >= 1000 ? `$${(Number(cached.value) / 1000).toFixed(0)}K` : `$${cached.value}`) : undefined,
            deadline: cached.deadline || undefined,
            postedDate: cached.posted_date || undefined,
            location: cached.location || undefined,
            naicsCode: cached.naics_code || undefined,
            description: cached.description || undefined,
            solicitationNumber: cached.solicitation_number || undefined,
            link: cached.url || undefined,
            matchScore: cached.match_score || undefined,
            resourceLinks: cached.resource_links || undefined,
          });
          return;
        }

        // 2) Call sam-refresh-single edge function
        const { data, error } = await supabase.functions.invoke("sam-refresh-single", {
          body: { noticeId: contractId },
        });

        if (error || !data?.result) {
          setFetchedContract(null);
          return;
        }

        const r = data.result;
        setFetchedContract({
          id: r.id,
          title: r.title,
          agency: r.agency,
          type: r.type || undefined,
          setAside: r.setAside || undefined,
          value: r.value || undefined,
          deadline: r.deadline || undefined,
          postedDate: r.postedDate || undefined,
          location: r.location || undefined,
          naicsCode: r.naicsCode || undefined,
          description: r.description || undefined,
          solicitationNumber: r.solicitationNumber || undefined,
          link: r.link || undefined,
          matchScore: r.matchScore || undefined,
          resourceLinks: r.resourceLinks || undefined,
        });
      } catch (err) {
        console.error("Failed to fetch contract:", err);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchContract();
  }, [contractId, stateData, tracked, fetchedContract, fetchLoading]);

  useEffect(() => {
    // Skip if we already have links from state or tracked data, or if already fetching/fetched
    if (contract?.resourceLinks?.length || fetchedLinks !== null || fetchingLinks || !contractId) return;
    
    const fetchLinks = async () => {
      setFetchingLinks(true);
      try {
        const { data, error } = await supabase.functions.invoke('sam-search', {
          body: { mode: 'detail', noticeId: contractId },
        });
        if (!error && data?.resourceLinks?.length) {
          setFetchedLinks(data.resourceLinks);
        } else {
          setFetchedLinks([]);
        }
      } catch {
        setFetchedLinks([]);
      } finally {
        setFetchingLinks(false);
      }
    };
    fetchLinks();
  }, [contractId, contract?.resourceLinks, fetchedLinks, fetchingLinks]);

  // Merge: prefer existing links, fallback to fetched
  const effectiveLinks = contract?.resourceLinks?.length ? contract.resourceLinks : (fetchedLinks || []);

  // Attachment summarization state
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summarizing, setSummarizing] = useState<Record<string, boolean>>({});

  const handleSummarize = async (url: string) => {
    setSummarizing(prev => ({ ...prev, [url]: true }));
    try {
      const { data, error } = await supabase.functions.invoke('ai-document-summary', {
        body: { documentUrl: url },
      });
      if (error) throw error;
      setSummaries(prev => ({ ...prev, [url]: data.summary }));
    } catch (err: any) {
      toast.error(err.message || "Failed to summarize document");
    } finally {
      setSummarizing(prev => ({ ...prev, [url]: false }));
    }
  };

  // Local editable fields for tracked contracts
  const [notes, setNotes] = useState(tracked?.notes || "");
  const [priority, setPriority] = useState(tracked?.priority || "medium");
  const [status, setStatus] = useState(tracked?.status || "watching");

  useEffect(() => {
    if (tracked) {
      setNotes(tracked.notes || "");
      setPriority(tracked.priority || "medium");
      setStatus(tracked.status || "watching");
    }
  }, [tracked]);

  const deadline = getDaysLeft(contract?.deadline || null);
  const isTracked = !!tracked;

  // AI Summary auto-fetch
  const fetchSummary = async (force = false) => {
    if (!contract || (summaryFetchedRef.current && !force)) return;
    summaryFetchedRef.current = true;
    setSummaryLoading(true);
    setAiSummary(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-contract-summary', {
        body: {
          contractId: contract.id,
          forceRegenerate: force,
          title: contract.title,
          agency: contract.agency,
          description: contract.description,
          value: contract.value,
          setAside: contract.setAside,
          naicsCode: contract.naicsCode,
          deadline: contract.deadline,
          type: contract.type,
          location: contract.location,
        },
      });
      if (error) throw error;
      setAiSummary(data.summary);
    } catch (err: any) {
      console.error("Summary error:", err);
      setAiSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (contract && !summaryFetchedRef.current) {
      fetchSummary();
    }
  }, [contract?.id]);

  const handleTrack = () => {
    if (!contract) return;
    trackContract.mutate({
      contract_id: contract.id,
      contract_title: contract.title,
      contract_agency: contract.agency,
      response_deadline: contract.deadline || null,
      status: "watching",
      priority: "medium",
      notes: null,
      match_score: contract.matchScore || null,
      posted_date: contract.postedDate || null,
      contract_value: contract.value || null,
      set_aside: contract.setAside || null,
      naics_code: contract.naicsCode || null,
      resource_links: contract.resourceLinks || null,
    });
  };

  const handleSaveChanges = () => {
    if (!tracked) return;
    if (status !== tracked.status) {
      updateStatus.mutate({ id: tracked.id, status });
    }
    if (notes !== tracked.notes || priority !== tracked.priority) {
      updateNotes.mutate({ id: tracked.id, notes, priority });
    }
    toast.success("Changes saved");
  };

  const handleStartBid = () => {
    if (!contract) return;
    navigate(`/dashboard/proposals/generator?opportunityId=${contract.id}&title=${encodeURIComponent(contract.title)}&agency=${encodeURIComponent(contract.agency)}`);
  };

  const handleAskAI = () => {
    if (!contract) return;
    const sol = contract.solicitationNumber ? ` (Solicitation: ${contract.solicitationNumber})` : "";
    const preload = encodeURIComponent(`I need help understanding this contract: "${contract.title}"${sol} from ${contract.agency}. Can you explain what they're looking for and whether it might be a good fit for a small business?`);
    navigate(`/dashboard/ai?q=${preload}`);
  };

  if (!contract) {
    return (
      <DashboardLayout title="Contract Details">
        <Card variant="glass" className="text-center py-16">
          <CardContent>
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-lg mb-2">Contract not found</h3>
            <p className="text-muted-foreground mb-4">
              This contract couldn't be loaded. It may have been removed or the link is invalid.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
              </Button>
              <Button variant="hero" onClick={() => navigate("/dashboard/search")}>
                Search Contracts
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const matchLabel = contract.matchScore
    ? contract.matchScore >= 90
      ? { text: "Great Match", cls: "bg-success/20 text-success" }
      : contract.matchScore >= 75
        ? { text: "Good Match", cls: "bg-primary/20 text-primary" }
        : { text: "Possible Match", cls: "bg-accent/20 text-accent" }
    : null;

  return (
    <DashboardLayout title="Contract Details">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6 max-w-4xl"
      >
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        {/* Header card */}
        <Card variant="glass" className="overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 relative space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {contract.type && <Badge variant="outline">{contract.type}</Badge>}
              {contract.setAside && contract.setAside !== "None" && (
                <Badge variant="glass">{contract.setAside}</Badge>
              )}
              {matchLabel && <Badge className={matchLabel.cls}>{matchLabel.text}</Badge>}
              {isTracked && (
                <Badge variant="gold" className="gap-1">
                  <Heart className="w-3 h-3 fill-current" /> Tracked
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="font-heading font-bold text-2xl text-foreground leading-tight">
              {contract.title}
            </h1>

            {/* Agency */}
            <p className="text-muted-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 shrink-0" />
              {contract.agency}
            </p>

            {/* Key metrics row */}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-border/50 text-sm">
              {contract.value && (
                <span className="flex items-center gap-1.5 text-accent font-semibold">
                  <DollarSign className="w-4 h-4" />
                  {contract.value}
                </span>
              )}
              {deadline && (
                <span className={`flex items-center gap-1.5 font-medium ${deadline.cls}`}>
                  <Clock className="w-4 h-4" />
                  {deadline.text}
                </span>
              )}
              {contract.location && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {contract.location}
                </span>
              )}
              {contract.naicsCode && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Hash className="w-4 h-4" />
                  NAICS {contract.naicsCode}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Quick Summary */}
        <Card variant="glass" className="overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" /> Quick Summary
              </h2>
              {aiSummary && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchSummary(true)}
                  disabled={summaryLoading}
                  className="gap-1.5 text-xs text-muted-foreground"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${summaryLoading ? "animate-spin" : ""}`} />
                  Regenerate
                </Button>
              )}
            </div>

            {summaryLoading ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  Generating summary…
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : aiSummary ? (
              <div className="prose prose-sm prose-invert max-w-none text-muted-foreground [&_h2]:text-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_ul]:my-1 [&_li]:my-0.5 [&_strong]:text-foreground">
                <ReactMarkdown>{aiSummary}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Summary unavailable.{" "}
                <button onClick={() => fetchSummary(true)} className="text-accent underline hover:no-underline">
                  Try again
                </button>
              </p>
            )}

            <p className="text-[10px] text-muted-foreground/50 pt-2 border-t border-border/30">
              Powered by AI · This is an automated summary — always verify details in the official listing.
            </p>
          </CardContent>
        </Card>

        {/* Description */}
        {contract.description && (
          <Card variant="glass">
            <CardContent className="p-6 space-y-3">
              <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Description
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {contract.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Contract Details */}
        <Card variant="glass">
          <CardContent className="p-6 space-y-3">
            <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" /> Contract Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {contract.solicitationNumber && (
                <div>
                  <span className="text-muted-foreground">Solicitation #:</span>{" "}
                  <span className="text-foreground font-medium">{contract.solicitationNumber}</span>
                </div>
              )}
              {contract.postedDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Posted:</span>{" "}
                  <span className="text-foreground font-medium">
                    {new Date(contract.postedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
              {contract.deadline && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Deadline:</span>{" "}
                  <span className="text-foreground font-medium">
                    {new Date(contract.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
              {contract.setAside && contract.setAside !== "None" && (
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Set-Aside:</span>{" "}
                  <span className="text-foreground font-medium">{contract.setAside}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Source:</span>{" "}
                <span className="text-foreground font-medium">SAM.gov</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attachments */}
        {(effectiveLinks.length > 0 || fetchingLinks) && (
          <Card variant="glass">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-primary" /> Attachments {effectiveLinks.length > 0 && `(${effectiveLinks.length})`}
                {fetchingLinks && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </h2>
              <div className="space-y-3">
                {effectiveLinks.map((url, idx) => {
                  const filename = extractFilename(url, idx);
                  const isSummarizing = summarizing[url];
                  const summary = summaries[url];
                  return (
                    <div key={url} className="border border-border/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">
                          {filename}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(url, "_blank")}
                            className="gap-1.5 text-xs"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSummarize(url)}
                            disabled={isSummarizing || !!summary}
                            className="gap-1.5 text-xs border-accent/40 text-accent hover:bg-accent/10"
                          >
                            {isSummarizing ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Summarizing...</>
                            ) : summary ? (
                              <><Brain className="w-3.5 h-3.5" /> Summarized</>
                            ) : (
                              <><Brain className="w-3.5 h-3.5" /> AI Summarize</>
                            )}
                          </Button>
                        </div>
                      </div>
                      {summary && (
                        <div className="bg-muted/30 rounded-md p-3 text-sm text-muted-foreground whitespace-pre-wrap border border-border/30">
                          {summary}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" onClick={handleStartBid} className="gap-2">
                <FileText className="w-4 h-4" /> Start Bid
              </Button>
              {!isTracked && (
                <Button variant="outline" onClick={handleTrack} disabled={trackContract.isPending} className="gap-2">
                  <Heart className="w-4 h-4" /> Save & Track
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleAskAI}
                className="gap-2 border-accent/40 text-accent hover:bg-accent/10 hover:border-accent"
              >
                <MessageSquare className="w-4 h-4" /> Ask AI
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  if (!contract) return;
                  const input: ContractScoreInput = {
                    title: contract.title,
                    agency: contract.agency,
                    value: contract.value,
                    setAside: contract.setAside,
                    naicsCode: contract.naicsCode,
                    deadline: contract.deadline,
                    type: contract.type,
                    description: contract.description,
                  };
                  setScoreResult(null);
                  setScoreModalOpen(true);
                  try {
                    const result = await winScore.mutateAsync(input);
                    setScoreResult(result);
                  } catch { /* error handled by hook toast */ }
                }}
                disabled={winScore.isPending}
                className="gap-2 border-purple-400/40 text-purple-400 hover:bg-purple-400/10 hover:border-purple-400"
              >
                <Sparkles className="w-4 h-4" /> {winScore.isPending ? "Scoring..." : "Score This"}
              </Button>
              {contract.link && (
                <Button variant="ghost" onClick={() => window.open(contract.link, "_blank")} className="gap-2">
                  <ExternalLink className="w-4 h-4" /> View on SAM.gov
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes & Tracking (only for tracked contracts) */}
        {isTracked && tracked && (
          <Card variant="glass">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-primary" /> Notes & Tracking
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Priority</label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-9 bg-card border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="high">🔴 High</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="low">🟢 Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-9 bg-card border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {PIPELINE_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.emoji} {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your notes, bid strategy, key contacts..."
                  className="min-h-[120px] bg-card border-border"
                />
              </div>

              <Button
                variant="hero"
                size="sm"
                onClick={handleSaveChanges}
                disabled={updateNotes.isPending || updateStatus.isPending}
                className="gap-2"
              >
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      <WinScoreModal
        open={scoreModalOpen}
        onOpenChange={setScoreModalOpen}
        contractTitle={contract?.title || ""}
        result={scoreResult}
        isLoading={winScore.isPending}
      />
    </DashboardLayout>
  );
};

export default ContractDetail;
