import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Shield,
  Users,
  ChevronDown,
  RotateCcw,
  Settings2,
  Zap,
  Search,
  MapPin,
  Building2,
  FileText,
  CreditCard,
} from "lucide-react";
import { NaicsCodeSelector } from "@/components/company/NaicsCodeSelector";
import { PscCodeSelector } from "@/components/company/PscCodeSelector";
import { Checkbox } from "@/components/ui/checkbox";

// ── Types ──────────────────────────────────────────────

export interface FilterSectionProps {
  // Status
  activeOnly: boolean;
  setActiveOnly: (v: boolean) => void;
  expiringSoon: boolean;
  setExpiringSoon: (v: boolean) => void;
  newThisWeek: boolean;
  setNewThisWeek: (v: boolean) => void;

  // Due Date (single-select days string or "")
  deadlineDays: string;
  setDeadlineDays: (v: string) => void;

  // Who Can Bid (multi-select quick pills)
  activeQuickFilters: string[];
  onToggleQuickFilter: (label: string) => void;

  // Budget (single-select value range key or "")
  budgetKey: string;
  setBudgetKey: (v: string) => void;

  // Advanced / More Options
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

  // Subcontract filters (visible only when activeTab === "subcontracts")
  activeTab: "prime" | "subcontracts";
  subPrimeContractor: string;
  setSubPrimeContractor: (v: string) => void;
  subMinAmount: string;
  setSubMinAmount: (v: string) => void;
  subMaxAmount: string;
  setSubMaxAmount: (v: string) => void;
  subAgency: string;
  setSubAgency: (v: string) => void;

  // Actions
  onApplyAdvanced: () => void;
  onClearAll: () => void;
  totalActiveCount: number;
  isSearching: boolean;
}

// ── Static data ─────────────────────────────────────────

const dueDatePills = [
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
];

const budgetPills = [
  { key: "|25000", label: "Under $25K" },
  { key: "25000|100000", label: "$25K–$100K" },
  { key: "100000|500000", label: "$100K–$500K" },
  { key: "500000|1000000", label: "$500K–$1M" },
  { key: "1000000|5000000", label: "$1M–$5M" },
  { key: "5000000|25000000", label: "$5M–$25M" },
  { key: "25000000|", label: "Over $25M" },
];

const whoCanBidPills = [
  { label: "Small Business", icon: "🏪", tooltip: "Contracts only small companies can bid on" },
  { label: "Veteran-Owned", icon: "🎖️", tooltip: "Reserved for businesses owned by military veterans" },
  { label: "Woman-Owned", icon: "👩‍💼", tooltip: "Reserved for businesses owned by women" },
  { label: "Minority-Owned", icon: "🤝", tooltip: "Reserved for minority-owned or disadvantaged businesses" },
  { label: "HUBZone", icon: "📍", tooltip: "For businesses in historically underutilized areas" },
  { label: "Federal", icon: "🏛️", tooltip: "Contracts from U.S. federal government agencies" },
];

const agencyOptions = [
  "Department of Defense",
  "Department of Homeland Security",
  "Department of Veterans Affairs",
  "General Services Administration",
  "Department of Health and Human Services",
  "Department of Transportation",
  "Department of Energy",
  "Department of Justice",
  "NASA",
  "Department of State",
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
  { value: "IDIQ", label: "Flexible Quantity" },
  { value: "BPA", label: "Blanket Agreement" },
  { value: "T&M", label: "Hourly + Materials" },
  { value: "Cost-Plus", label: "Cost + Fee" },
];

const setAsideOptions = [
  { value: "Small Business", label: "Small Businesses Only" },
  { value: "8(a)", label: "Minority-Owned (8a)" },
  { value: "WOSB", label: "Woman-Owned" },
  { value: "EDWOSB", label: "Econ. Disadvantaged Woman-Owned" },
  { value: "HUBZone", label: "HUBZone Area" },
  { value: "SDVOSB", label: "Veteran-Owned (Service-Disabled)" },
  { value: "VOSB", label: "Veteran-Owned" },
  { value: "SDB", label: "Small Disadvantaged" },
];

// ── Pill component ─────────────────────────────────────

function Pill({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 border ${
        active
          ? "bg-primary/20 border-primary/50 text-primary shadow-sm shadow-primary/10"
          : "bg-secondary/50 border-border/50 text-muted-foreground hover:text-foreground hover:border-border hover:bg-secondary/80"
      }`}
    >
      {active && <CheckCircle2 className="w-3 h-3" />}
      {!active && icon}
      {children}
    </button>
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
    <Card variant="glass" data-tour="quick-filters">
      <CardContent className="p-4 space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-heading font-semibold text-foreground flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            Filter By
          </h3>
          {totalActiveCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearAll} className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground">
              <RotateCcw className="w-3 h-3" />
              Clear All
              <Badge className="bg-accent/20 text-accent text-[10px] px-1.5 py-0 h-4 ml-0.5">{totalActiveCount}</Badge>
            </Button>
          )}
        </div>

        {/* Status Row */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Status
          </label>
          <div className="flex flex-wrap gap-2">
            <Pill active={activeOnly} onClick={() => setActiveOnly(!activeOnly)} icon={<CheckCircle2 className="w-3 h-3 text-success" />}>
              🟢 Active Only
            </Pill>
            <Pill active={expiringSoon} onClick={() => setExpiringSoon(!expiringSoon)} icon={<Clock className="w-3 h-3" />}>
              ⏰ Expiring Soon
            </Pill>
          </div>
        </div>

        {/* Due Date Row */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Due Date
          </label>
          <div className="flex flex-wrap gap-2">
            {dueDatePills.map((p) => (
              <Pill
                key={p.value}
                active={deadlineDays === p.value}
                onClick={() => setDeadlineDays(deadlineDays === p.value ? "" : p.value)}
              >
                {p.label}
              </Pill>
            ))}
          </div>
        </div>

        {/* Who Can Bid Row */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Who Can Bid
          </label>
          <TooltipProvider delayDuration={300}>
            <div className="flex flex-wrap gap-2">
              {whoCanBidPills.map((p) => (
                <Tooltip key={p.label}>
                  <TooltipTrigger asChild>
                    <span>
                      <Pill
                        active={activeQuickFilters.includes(p.label)}
                        onClick={() => onToggleQuickFilter(p.label)}
                      >
                        <span className="text-sm leading-none">{p.icon}</span> {p.label}
                      </Pill>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                    {p.tooltip}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>

        {/* Budget Row */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <DollarSign className="w-3 h-3" /> Budget
          </label>
          <div className="flex flex-wrap gap-2">
            {budgetPills.map((p) => (
              <Pill
                key={p.key}
                active={budgetKey === p.key}
                onClick={() => setBudgetKey(budgetKey === p.key ? "" : p.key)}
              >
                {p.label}
              </Pill>
            ))}
          </div>
        </div>

        {/* More Options Collapsible */}
        <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-2 border-t border-border/30">
              <Settings2 className="w-3 h-3" />
              {moreOpen ? "Hide" : "More"} Options
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 pt-4"
            >
              {/* Agency */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> Agency
                </Label>
                <Select value={advAgency || "any"} onValueChange={(val) => setAdvAgency(val === "any" ? "" : val)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Any agency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any agency</SelectItem>
                    {agencyOptions.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> Location
                </Label>
                <Select value={advState || "any"} onValueChange={(val) => setAdvState(val === "any" ? "" : val)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Any state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="any">Any state</SelectItem>
                    {stateOptions.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Opportunity Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Opportunity Type
                </Label>
                <Select value={advType || "any"} onValueChange={(val) => setAdvType(val === "any" ? "" : val)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any type</SelectItem>
                    {opportunityTypeOptions.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3" /> Payment Type
                </Label>
                <Select value={advContractType || "any"} onValueChange={(val) => setAdvContractType(val === "any" ? "" : val)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any type</SelectItem>
                    {contractTypeOptions.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced set-aside checkboxes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> Specific Set-Aside Types
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {setAsideOptions.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-xs">
                      <Checkbox
                        checked={advSetAside.includes(opt.value)}
                        onCheckedChange={(checked) => {
                          setAdvSetAside(
                            checked
                              ? [...advSetAside, opt.value]
                              : advSetAside.filter(v => v !== opt.value)
                          );
                        }}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* NAICS / PSC */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Industry Codes <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <p className="text-[10px] text-muted-foreground">Government classification codes — skip if you're not sure.</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">NAICS Code</p>
                    <NaicsCodeSelector selected={advNaics} onChange={setAdvNaics} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">PSC Code</p>
                    <PscCodeSelector selected={advPsc} onChange={setAdvPsc} />
                  </div>
                </div>
              </div>

              {/* Subcontract filters */}
              {activeTab === "subcontracts" && (
                <div className="space-y-3 pt-3 border-t border-border/30">
                  <Label className="text-xs font-medium">Team-Up Options</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Prime Contractor (e.g., Lockheed Martin)"
                      value={subPrimeContractor}
                      onChange={(e) => setSubPrimeContractor(e.target.value)}
                      className="h-9 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <Input type="number" placeholder="Min $" value={subMinAmount} onChange={(e) => setSubMinAmount(e.target.value)} className="h-9 text-sm pl-7" />
                      </div>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <Input type="number" placeholder="Max $" value={subMaxAmount} onChange={(e) => setSubMaxAmount(e.target.value)} className="h-9 text-sm pl-7" />
                      </div>
                    </div>
                    <Select value={subAgency || "any"} onValueChange={(val) => setSubAgency(val === "any" ? "" : val)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Any agency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any agency</SelectItem>
                        {agencyOptions.map(a => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Apply button for advanced */}
              <Button
                variant="hero"
                className="w-full"
                onClick={onApplyAdvanced}
                disabled={isSearching}
              >
                <Search className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
