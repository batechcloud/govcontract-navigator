import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  FileText,
  Building2,
  Sparkles,
  Filter,
  SlidersHorizontal,
  Clock,
  DollarSign,
  MapPin,
  Star,
  Target,
  ArrowUpRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useTrackContract, useTrackedContracts } from "@/hooks/useTrackedContracts";

// Mock search results - in production, this would come from SAM.gov API
const mockSearchResults = [
  {
    id: "SAM-2024-001",
    title: "IT Infrastructure Modernization Support",
    agency: "Department of Defense",
    type: "Federal",
    setAside: "SDVOSB",
    value: "$4,200,000",
    deadline: "2026-01-15",
    postedDate: "2024-12-10",
    location: "Washington, DC",
    naicsCode: "541512",
    matchScore: 96,
    description: "IT infrastructure modernization and support services for DOD systems.",
  },
  {
    id: "SAM-2024-002",
    title: "Cybersecurity Risk Assessment Services",
    agency: "Department of Homeland Security",
    type: "Federal",
    setAside: "8(a)",
    value: "$1,800,000",
    deadline: "2026-01-22",
    postedDate: "2024-12-08",
    location: "Arlington, VA",
    naicsCode: "541519",
    matchScore: 92,
    description: "Comprehensive cybersecurity risk assessment and monitoring services.",
  },
  {
    id: "SAM-2024-003",
    title: "Cloud Migration and Management",
    agency: "General Services Administration",
    type: "Federal",
    setAside: "Small Business",
    value: "$2,500,000",
    deadline: "2026-02-01",
    postedDate: "2024-12-05",
    location: "Remote",
    naicsCode: "541511",
    matchScore: 88,
    description: "Cloud infrastructure migration, management, and optimization services.",
  },
  {
    id: "SAM-2024-004",
    title: "Data Analytics Platform Development",
    agency: "Department of Veterans Affairs",
    type: "Federal",
    setAside: "WOSB",
    value: "$3,100,000",
    deadline: "2026-02-10",
    postedDate: "2024-12-03",
    location: "Multiple Locations",
    naicsCode: "541512",
    matchScore: 85,
    description: "Development and implementation of advanced data analytics platform.",
  },
  {
    id: "SAM-2024-005",
    title: "Network Security Operations Center",
    agency: "Department of Energy",
    type: "Federal",
    setAside: "HUBZone",
    value: "$5,700,000",
    deadline: "2026-02-28",
    postedDate: "2024-12-01",
    location: "Oak Ridge, TN",
    naicsCode: "541519",
    matchScore: 82,
    description: "24/7 network security operations center management and support.",
  },
];

const quickFilters = ["Federal", "State", "Grants", "SDVOSB", "8(a)", "HUBZone", "WOSB"];

const SearchHub = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const trackContract = useTrackContract();
  const { data: trackedContracts } = useTrackedContracts();

  const trackedIds = new Set(trackedContracts?.map(c => c.contract_id) || []);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 1000);
  };

  const handleTrack = (result: typeof mockSearchResults[0]) => {
    trackContract.mutate({
      contract_id: result.id,
      contract_title: result.title,
      contract_agency: result.agency,
      response_deadline: result.deadline,
      status: "watching",
      priority: "medium",
      notes: null,
      match_score: result.matchScore,
      posted_date: result.postedDate,
      contract_value: result.value,
      set_aside: result.setAside,
      naics_code: result.naicsCode,
    });
  };

  return (
    <DashboardLayout title="Search Hub">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* AI Search Bar */}
        <Card variant="glass" className="overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-accent/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent" />
              <span className="font-heading font-semibold text-foreground">AI-Powered Search</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Try: 'IT contracts over $1M for small businesses in cybersecurity'"
                  className="pl-12 h-12 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="h-12">
                  <SlidersHorizontal className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
                <Button variant="hero" className="h-12" onClick={handleSearch}>
                  <Search className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Ask in natural language. Our AI understands set-asides, NAICS codes, agencies, and more.
            </p>
          </CardContent>
        </Card>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Badge
              key={filter}
              variant="glass"
              className="cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => setSearchQuery(searchQuery ? `${searchQuery} ${filter}` : filter)}
            >
              {filter}
            </Badge>
          ))}
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Showing <span className="text-foreground font-semibold">{mockSearchResults.length}</span> opportunities sorted by match score
            </p>
            <Button variant="ghost" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Sort
            </Button>
          </div>

          <div className="space-y-4">
            {isSearching ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} variant="glass">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-3" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              mockSearchResults.map((result, index) => {
                const isTracked = trackedIds.has(result.id);
                return (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card variant="glass-hover" className="cursor-pointer">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          {/* Match Score */}
                          <div className="flex lg:flex-col items-center gap-3 lg:gap-1">
                            <div
                              className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-heading font-bold ${
                                result.matchScore >= 90
                                  ? "bg-success/20 text-success"
                                  : result.matchScore >= 80
                                  ? "bg-primary/20 text-primary"
                                  : "bg-accent/20 text-accent"
                              }`}
                            >
                              {result.matchScore}%
                            </div>
                            <span className="text-xs text-muted-foreground">Match</span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant="outline">{result.type}</Badge>
                              <Badge variant="gold">{result.setAside}</Badge>
                              <Badge variant="glass">{result.naicsCode}</Badge>
                            </div>
                            <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                              {result.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              {result.agency}
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm">
                              <span className="flex items-center gap-1 text-accent">
                                <DollarSign className="w-4 h-4" />
                                {result.value}
                              </span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                Due: {new Date(result.deadline).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                {result.location}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex lg:flex-col gap-2">
                            <Button variant="hero" size="sm">
                              <FileText className="w-4 h-4 mr-2" />
                              Generate Proposal
                            </Button>
                            <Button
                              variant={isTracked ? "outline" : "outline"}
                              size="sm"
                              onClick={() => handleTrack(result)}
                              disabled={isTracked || trackContract.isPending}
                            >
                              {isTracked ? (
                                <>
                                  <Target className="w-4 h-4 mr-2" />
                                  Tracked
                                </>
                              ) : (
                                <>
                                  <Star className="w-4 h-4 mr-2" />
                                  Track
                                </>
                              )}
                            </Button>
                            <Button variant="ghost" size="sm">
                              <ArrowUpRight className="w-4 h-4 mr-2" />
                              Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default SearchHub;
