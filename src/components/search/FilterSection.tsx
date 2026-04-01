import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2, Clock, DollarSign, Shield, Users, ChevronDown,
  RotateCcw, Settings2, Zap, Search, MapPin, Building2,
  FileText, CreditCard,
} from "lucide-react";
import { NaicsCodeSelector } from "@/components/company/NaicsCodeSelector";
import { PscCodeSelector } from "@/components/company/PscCodeSelector";
import { Checkbox } from "@/components/ui/checkbox";

// ── Types ──────────────────────────────────────────────

export interface FilterSectionProps {
  activeOnly: boolean;
  setActiveOnly: (v: boolean) => void;
  expiringSoon: boolean;
  setExpiringSoon: (v: boolean) => void;
  newThisWeek: boolean;
  setNewThisWeek: (v: boolean) => void;
  deadlineDays: string;
  setDeadlineDays: (v: string) => void;
  activeQuickFilters: string[];
  onToggleQuickFilter: (label: string) => void;
  budgetKey: string;
  setBudgetKey: (v: string) => void;
  advAgency: string;
  setAdvAgency: (v: string) => void;
  advState: string;
  setAdvState: (v: string) => void;
  advType: string;
  setAdvType: (v: string) => void;
  advContractType: string;
  setAdvContractType: (v: string) => void;
  advSetAside: string[];
  setAdvSetAside: (v: string[]) => void;
  advNaics: string[];
  setAdvNaics: (v: string[]) => void;
  advPsc: string[];
  setAdvPsc: (v: string[]) => void;
  activeTab: "prime" | "subcontracts";
  subPrimeContractor: string;
  setSubPrimeContractor: (v: string) => void;
  subMinAmount: string;
  setSubMinAmount: (v: string) => void;
  subMaxAmount: string;
  setSubMaxAmount: (v: string) => void;
  subAgency: string;
  setSubAgency: (v: string) => void;
  onApplyAdvanced: () => void;
  onClearAll: () => void;
  totalActiveCount: number;
  isSearching: boolean;
}

// ── Static data ─────────────────────────────────────────

const dueDatePills = [
  { value: "7", label: "7d" },
  { value: "14", label: "14d" },
  { value: "30", label: "30d" },
  { value: "60", label: "60d" },
  { value: "90", label: "90d" },
];

const budgetPills = [
  { key: "|25000", label: "<$25K" },
  { key: "25000|100000", label: "$25K–100K" },
  { key: "100000|500000", label: "$100K–500K" },
  { key: "500000|1000000", label: "$500K–1M" },
  { key: "1000000|5000000", label: "$1M–5M" },
  { key: "5000000|25000000", label: "$5M–25M" },
  { key: "25000000|", label: "$25M+" },
];

const whoCanBidPills = [
  { label: "Small Business", icon: "🏪", tooltip: "Contracts only small companies can bid on" },
  { label: "Veteran-Owned", icon: "🎖️", tooltip: "Reserved for veteran-owned businesses" },
  { label: "Woman-Owned", icon: "👩‍💼", tooltip: "Reserved for woman-owned businesses" },
  { label: "Minority-Owned", icon: "🤝", tooltip: "Reserved for minority-owned businesses" },
  { label: "HUBZone", icon: "📍", tooltip: "Businesses in underutilized areas" },
  { label: "Federal", icon: "🏛️", tooltip: "U.S. federal government agencies" },
];

const agencyOptions = [
  "Department of Defense", "Department of Homeland Security",
  "Department of Veterans Affairs", "General Services Administration",
  "Department of Health and Human Services", "Department of Transportation",
  "Department of Energy", "Department of Justice", "NASA", "Department of State",
];

const stateOptions = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","District of Columbia",
];

const opportunityTypeOptions = [
  { value: "Solicitation", label: "Solicitation" },
  { value: "Presolicitation", label: "Presolicitation" },
  { value: "Sources Sought", label: "Sources Sought" },
  { value: "Combined Synopsis/Solicitation", label: "Combined Synopsis" },
  { value: "Award Notice", label: "Award Notice" },
  { value: "Special Notice", label: "Special Notice" },
];

const contractTypeOptions = [
  { value: "FFP", label: "Fixed Price" },
  { value: "IDIQ", label: "Flexible Qty" },
  { value: "BPA", label: "Blanket Agmt" },
  { value: "T&M", label: "Hourly + Mat" },
  { value: "Cost-Plus", label: "Cost + Fee" },
];

const setAsideOptions = [
  { value: "Small Business", label: "Small Business" },
  { value: "8(a)", label: "8(a) Minority" },
  { value: "WOSB", label: "Woman-Owned" },
  { value: "EDWOSB", label: "EDWOSB" },
  { value: "HUBZone", label: "HUBZone" },
  { value: "SDVOSB", label: "SDVOSB" },
  { value: "VOSB", label: "VOSB" },
  { value: "SDB", label: "Small Disadv." },
];

// ── Pill component ─────────────────────────────────────

function Pill({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all border ${
        active
          ? "bg-primary/15 border-primary/40 text-primary"
          : "bg-muted/30 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      {active && <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />}
      {children}
    </button>
  );
}

// ── Row label ──────────────────────────────────────────

function RowLabel({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold flex items-center gap-1 shrink-0 min-w-[60px]">
      <Icon className="w-3 h-3" />
      {children}
    </span>
  );
}

// ── Main component ─────────────────────────────────────

export function FilterSection(props: FilterSectionProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  const {
    activeOnly, setActiveOnly,
    expiringSoon, setExpiringSoon,
    newThisWeek, setNewThisWeek,
    deadlineDays, setDeadlineDays,
    activeQuickFilters, onToggleQuickFilter,
    budgetKey, setBudgetKey,
    advAgency, setAdvAgency,
    advState, setAdvState,
    advType, setAdvType,
    advContractType, setAdvContractType,
    advSetAside, setAdvSetAside,
    advNaics, setAdvNaics,
    advPsc, setAdvPsc,
    activeTab,
    subPrimeContractor, setSubPrimeContractor,
    subMinAmount, setSubMinAmount,
    subMaxAmount, setSubMaxAmount,
    subAgency, setSubAgency,
    onApplyAdvanced, onClearAll,
    totalActiveCount, isSearching,
  } = props;

  return (
    <Card variant="glass" data-tour="quick-filters" className="overflow-hidden">
      <CardContent className="px-4 py-3 space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5 text-primary" />
            Filters
          </span>
          {totalActiveCount > 0 && (
            <button onClick={onClearAll} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <RotateCcw className="w-2.5 h-2.5" />
              Clear
              <Badge className="bg-destructive/20 text-destructive text-[9px] px-1 py-0 h-3.5 leading-none">{totalActiveCount}</Badge>
            </button>
          )}
        </div>

        {/* Row 1: Status + Due Date combined */}
        <div className="flex items-start gap-4 flex-wrap">
          {/* Status pills */}
          <div className="flex items-center gap-1.5">
            <RowLabel icon={Zap}>Status</RowLabel>
            <div className="flex flex-wrap gap-1">
              <Pill active={activeOnly} onClick={() => setActiveOnly(!activeOnly)}>🟢 Active</Pill>
              <Pill active={expiringSoon} onClick={() => setExpiringSoon(!expiringSoon)}>⏰ Expiring</Pill>
              <Pill active={newThisWeek} onClick={() => setNewThisWeek(!newThisWeek)}>✨ New</Pill>
            </div>
          </div>
          {/* Due date pills */}
          <div className="flex items-center gap-1.5">
            <RowLabel icon={Clock}>Due</RowLabel>
            <div className="flex flex-wrap gap-1">
              {dueDatePills.map((p) => (
                <Pill key={p.value} active={deadlineDays === p.value} onClick={() => setDeadlineDays(deadlineDays === p.value ? "" : p.value)}>
                  {p.label}
                </Pill>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Who Can Bid */}
        <div className="flex items-center gap-1.5">
          <RowLabel icon={Users}>Eligibility</RowLabel>
          <TooltipProvider delayDuration={200}>
            <div className="flex flex-wrap gap-1">
              {whoCanBidPills.map((p) => (
                <Tooltip key={p.label}>
                  <TooltipTrigger asChild>
                    <span>
                      <Pill active={activeQuickFilters.includes(p.label)} onClick={() => onToggleQuickFilter(p.label)}>
                        <span className="text-[11px] leading-none">{p.icon}</span> {p.label}
                      </Pill>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[10px]">{p.tooltip}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>

        {/* Row 3: Budget */}
        <div className="flex items-center gap-1.5">
          <RowLabel icon={DollarSign}>Budget</RowLabel>
          <div className="flex flex-wrap gap-1">
            {budgetPills.map((p) => (
              <Pill key={p.key} active={budgetKey === p.key} onClick={() => setBudgetKey(budgetKey === p.key ? "" : p.key)}>
                {p.label}
              </Pill>
            ))}
          </div>
        </div>

        {/* More Options */}
        <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors pt-1 border-t border-border/20">
              <Settings2 className="w-2.5 h-2.5" />
              {moreOpen ? "Less" : "More"} options
              <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-3 space-y-3">
              {/* 2-column grid for selects */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium flex items-center gap-1"><Building2 className="w-2.5 h-2.5" /> Agency</Label>
                  <Select value={advAgency || "any"} onValueChange={(val) => setAdvAgency(val === "any" ? "" : val)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any agency</SelectItem>
                      {agencyOptions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> Location</Label>
                  <Select value={advState || "any"} onValueChange={(val) => setAdvState(val === "any" ? "" : val)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="any">Any state</SelectItem>
                      {stateOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium flex items-center gap-1"><FileText className="w-2.5 h-2.5" /> Type</Label>
                  <Select value={advType || "any"} onValueChange={(val) => setAdvType(val === "any" ? "" : val)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any type</SelectItem>
                      {opportunityTypeOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium flex items-center gap-1"><CreditCard className="w-2.5 h-2.5" /> Payment</Label>
                  <Select value={advContractType || "any"} onValueChange={(val) => setAdvContractType(val === "any" ? "" : val)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any type</SelectItem>
                      {contractTypeOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Set-aside checkboxes compact */}
              <div className="space-y-1">
                <Label className="text-[10px] font-medium flex items-center gap-1"><Shield className="w-2.5 h-2.5" /> Set-Aside</Label>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {setAsideOptions.map(opt => (
                    <label key={opt.value} className="flex items-center gap-1 cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
                      <Checkbox
                        className="h-3 w-3"
                        checked={advSetAside.includes(opt.value)}
                        onCheckedChange={(checked) => {
                          setAdvSetAside(checked ? [...advSetAside, opt.value] : advSetAside.filter(v => v !== opt.value));
                        }}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* NAICS / PSC */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium">NAICS</Label>
                  <NaicsCodeSelector selected={advNaics} onChange={setAdvNaics} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium">PSC</Label>
                  <PscCodeSelector selected={advPsc} onChange={setAdvPsc} />
                </div>
              </div>

              {/* Subcontract filters */}
              {activeTab === "subcontracts" && (
                <div className="space-y-2 pt-2 border-t border-border/20">
                  <Label className="text-[10px] font-medium">Team-Up</Label>
                  <Input placeholder="Prime Contractor" value={subPrimeContractor} onChange={(e) => setSubPrimeContractor(e.target.value)} className="h-8 text-xs" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground" />
                      <Input type="number" placeholder="Min $" value={subMinAmount} onChange={(e) => setSubMinAmount(e.target.value)} className="h-8 text-xs pl-6" />
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground" />
                      <Input type="number" placeholder="Max $" value={subMaxAmount} onChange={(e) => setSubMaxAmount(e.target.value)} className="h-8 text-xs pl-6" />
                    </div>
                  </div>
                  <Select value={subAgency || "any"} onValueChange={(val) => setSubAgency(val === "any" ? "" : val)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Any agency" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any agency</SelectItem>
                      {agencyOptions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button variant="hero" size="sm" className="w-full h-8 text-xs" onClick={onApplyAdvanced} disabled={isSearching}>
                <Search className="w-3 h-3 mr-1.5" />
                Apply Filters
              </Button>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
