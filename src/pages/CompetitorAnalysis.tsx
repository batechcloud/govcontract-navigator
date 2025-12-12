import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Building2,
  DollarSign,
  TrendingUp,
  Plus,
  ExternalLink,
  Loader2,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useUSAspendingSearch, useTrackCompetitor, useTrackedCompetitors } from "@/hooks/useCompetitorIntelligence";

interface AwardResult {
  "Award ID": string;
  "Recipient Name": string;
  "Award Amount": number;
  "Awarding Agency": string;
  "Start Date": string;
  "Description": string;
  "NAICS Code": string;
  "PSC Code": string;
  "Place of Performance City": string;
  "Place of Performance State Code": string;
  recipient_uei?: string;
}

const CompetitorAnalysis = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AwardResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const usaSpendingSearch = useUSAspendingSearch();
  const trackCompetitor = useTrackCompetitor();
  const { data: trackedCompetitors } = useTrackedCompetitors();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setHasSearched(true);
    const result = await usaSpendingSearch.mutateAsync({
      action: "search_awards",
      params: { recipient_name: searchQuery, page: 1, limit: 50 },
    });
    
    setSearchResults(result.results || []);
  };

  // Group results by recipient
  const groupedResults = searchResults.reduce((acc, award) => {
    const name = award["Recipient Name"];
    if (!acc[name]) {
      acc[name] = {
        name,
        uei: award.recipient_uei,
        awards: [],
        totalValue: 0,
      };
    }
    acc[name].awards.push(award);
    acc[name].totalValue += award["Award Amount"] || 0;
    return acc;
  }, {} as Record<string, { name: string; uei?: string; awards: AwardResult[]; totalValue: number }>);

  const sortedGroups = Object.values(groupedResults).sort((a, b) => b.totalValue - a.totalValue);

  const isTracked = (name: string) => 
    trackedCompetitors?.some(c => c.competitor_name.toLowerCase() === name.toLowerCase());

  const handleTrack = (group: { name: string; uei?: string; awards: AwardResult[]; totalValue: number }) => {
    const naicsCodes = [...new Set(group.awards.map(a => a["NAICS Code"]).filter(Boolean))];
    
    trackCompetitor.mutate({
      competitor_name: group.name,
      competitor_uei: group.uei || null,
      naics_codes: naicsCodes,
      total_awards: group.awards.length,
      total_value: group.totalValue,
    });
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  return (
    <DashboardLayout title="Competitor Analysis">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Search Card */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Search Competitors
            </CardTitle>
            <CardDescription>
              Search USAspending.gov for contractor award history and track your competition.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter company name (e.g., Lockheed Martin, Booz Allen...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button 
                variant="hero" 
                onClick={handleSearch}
                disabled={usaSpendingSearch.isPending || !searchQuery.trim()}
              >
                {usaSpendingSearch.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {usaSpendingSearch.isPending ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : hasSearched && sortedGroups.length === 0 ? (
          <Card variant="glass">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
              <p className="text-muted-foreground text-sm">
                Try a different company name or check the spelling.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedGroups.map((group) => (
              <Card key={group.name} variant="glass-hover">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-heading font-semibold text-lg text-foreground flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        {group.name}
                      </h3>
                      {group.uei && (
                        <p className="text-xs text-muted-foreground mt-1">UEI: {group.uei}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-heading font-bold text-accent">
                          {formatCurrency(group.totalValue)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {group.awards.length} awards (3yr)
                        </p>
                      </div>
                      {isTracked(group.name) ? (
                        <Badge variant="success">Tracking</Badge>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTrack(group)}
                          disabled={trackCompetitor.isPending}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Track
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Top Awards */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Recent Awards
                    </p>
                    <div className="grid gap-2">
                      {group.awards.slice(0, 3).map((award, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {award["Description"] || "Contract Award"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {award["Awarding Agency"]} • {award["Start Date"]}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {award["NAICS Code"] && (
                              <Badge variant="secondary" className="text-xs">
                                {award["NAICS Code"]}
                              </Badge>
                            )}
                            <span className="text-sm font-semibold text-accent">
                              {formatCurrency(award["Award Amount"] || 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {group.awards.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        +{group.awards.length - 3} more awards
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Text */}
        {!hasSearched && (
          <Card variant="glass" className="border-dashed">
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-primary opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Discover Your Competition</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Search for companies by name to see their federal contract awards, 
                NAICS codes, and agency relationships from USAspending.gov data.
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default CompetitorAnalysis;
