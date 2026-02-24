import { useState, useEffect } from "react";
import { Search, ExternalLink, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDollars } from "@/lib/usaspending-utils";
import { useAwardSearch, AwardSearchFilters } from "@/hooks/useUSASpending";
import { useContractStore } from "@/store/contractStore";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  fy: string;
  refreshKey: number;
  prefilledAgency?: string;
}

export const AwardExplorer = ({ fy, refreshKey, prefilledAgency }: Props) => {
  const [keyword, setKeyword] = useState("");
  const [awardType, setAwardType] = useState("contracts");
  const [minValue, setMinValue] = useState("");
  const [naicsCode, setNaicsCode] = useState("");
  const [page, setPage] = useState(1);
  const { saveContract } = useContractStore();

  const filters: AwardSearchFilters = {
    keyword,
    awardType,
    minValue: minValue ? parseFloat(minValue) : undefined,
    naicsCode: naicsCode || undefined,
    fy,
    page,
    agency: prefilledAgency,
  };

  const { data, isLoading, isError, refetch, isFetched } = useAwardSearch(filters, refreshKey);

  useEffect(() => {
    if (prefilledAgency) {
      refetch();
    }
  }, [prefilledAgency]);

  const handleSearch = () => {
    setPage(1);
    setTimeout(() => refetch(), 0);
  };

  const handleSave = (award: any) => {
    saveContract({
      id: award["Award ID"] || crypto.randomUUID(),
      title: award["Description"]?.slice(0, 100) || "USASpending Award",
      agency: award["awarding_agency_name"] || "",
      sector: "technology",
      value: typeof award["Award Amount"] === "number" ? award["Award Amount"] : 0,
      deadline: null,
      naicsCode: "",
      setAside: "Any",
      roiScore: 65,
      source: "USASpending",
      url: `https://www.usaspending.gov/award/${award["Award ID"]}`,
    });
    toast({ title: "Award saved!", description: "Added to your tracked contracts." });
  };

  const results = data?.results || [];
  const totalCount = data?.page_metadata?.total || 0;

  return (
    <div>
      <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Award Explorer</h3>
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        {/* Search Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input placeholder="Keyword search..." value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
          <Select value={awardType} onValueChange={setAwardType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="contracts">Contracts</SelectItem>
              <SelectItem value="grants">Grants</SelectItem>
              <SelectItem value="loans">Loans</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Min Value ($)" type="number" value={minValue} onChange={(e) => setMinValue(e.target.value)} />
          <Input placeholder="NAICS Code" value={naicsCode} onChange={(e) => setNaicsCode(e.target.value)} />
          <Button onClick={handleSearch} className="gap-2">
            <Search className="w-4 h-4" />
            Search Awards
          </Button>
        </div>

        {prefilledAgency && (
          <p className="text-sm text-primary">Filtered by agency: {prefilledAgency}</p>
        )}

        {/* Results */}
        {isError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Search failed</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        )}

        {isFetched && !isError && (
          <>
            <p className="text-sm text-muted-foreground">
              Showing {results.length} of {totalCount.toLocaleString()} awards
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-2">Recipient</th>
                    <th className="text-left p-2">Agency</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-left p-2 hidden md:table-cell">Type</th>
                    <th className="text-left p-2 hidden lg:table-cell">NAICS</th>
                    <th className="text-left p-2 hidden lg:table-cell">Location</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-border/50">
                          {Array.from({ length: 7 }).map((_, j) => (
                            <td key={j} className="p-2"><Skeleton className="h-5 w-full" /></td>
                          ))}
                        </tr>
                      ))
                    : results.map((award: any, i: number) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                          <td className="p-2 text-foreground max-w-[150px] truncate">{award["Recipient Name"]}</td>
                          <td className="p-2 text-muted-foreground max-w-[120px] truncate">{award["awarding_agency_name"]}</td>
                          <td className="p-2 text-right text-foreground font-medium">{formatDollars(award["Award Amount"] || 0)}</td>
                          <td className="p-2 text-muted-foreground hidden md:table-cell">{award["type_description"]}</td>
                          <td className="p-2 text-muted-foreground hidden lg:table-cell">{award["naics_code"] || "—"}</td>
                          <td className="p-2 text-muted-foreground hidden lg:table-cell">
                            {[award["place_of_performance_city_name"], award["place_of_performance_state_code"]].filter(Boolean).join(", ") || "—"}
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                <a href={`https://www.usaspending.gov/award/${award["Award ID"]}`} target="_blank" rel="noreferrer">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSave(award)}>
                                <Bookmark className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalCount > 25 && (
              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(p => p - 1); setTimeout(() => refetch(), 0); }}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {page}</span>
                <Button variant="outline" size="sm" disabled={results.length < 25} onClick={() => { setPage(p => p + 1); setTimeout(() => refetch(), 0); }}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {!isFetched && !isLoading && (
          <p className="text-center text-muted-foreground py-8">Enter search criteria and click "Search Awards" to explore federal awards.</p>
        )}
      </div>
    </div>
  );
};
