import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { SECTOR_NAICS, SECTOR_CONFIG, SECTOR_COLORS } from "@/config/sectors";

/**
 * Classify a contract's NAICS code into one or more sector keys.
 * Matches on 4-digit prefix.
 */
function classifyBySector(naicsCode) {
  if (!naicsCode) return [];
  const prefix = naicsCode.toString().substring(0, 4);
  const matches = [];
  for (const [sector, codes] of Object.entries(SECTOR_NAICS)) {
    if (codes.includes(prefix)) matches.push(sector);
  }
  return matches;
}

function getSectorCounts(contracts) {
  const counts = {};
  Object.keys(SECTOR_CONFIG).forEach(s => (counts[s] = 0));
  let classified = 0;
  contracts.forEach(c => {
    const sectors = classifyBySector(c.naicsCode);
    if (sectors.length > 0) {
      sectors.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
      classified++;
    }
  });
  counts["all"] = contracts.length;
  return { counts, classified };
}

async function fetchSamContracts() {
  // Read directly from the local contracts cache — no live SAM.gov call.
  const { data, error, count } = await supabase
    .from("sam_opportunities_compat" as any)
    .select("naics_code", { count: "exact" })
    .limit(1000);
  if (error) throw error;
  const results = (data || []).map((r: any) => ({ naicsCode: r.naics_code }));
  return { results, total: count || results.length };
}

export default function SectorBrowse() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [search, setSearch] = useState("");

  const { data: samData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["sector-browse-sam"],
    queryFn: fetchSamContracts,
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 1,
  });

  const contracts = samData?.results || [];
  const totalFromApi = samData?.total || 0;
  const { counts, classified } = useMemo(() => getSectorCounts(contracts), [contracts]);

  const sectors = Object.entries(SECTOR_CONFIG).filter(([key]) => key !== "all");
  const filtered = sectors.filter(([, cfg]) =>
    cfg.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSectorClick = (sectorKey) => {
    navigate(`/dashboard/search?sector=${sectorKey}`);
  };

  return (
    <DashboardLayout title="Browse Sectors">
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Browse by Industry Sector</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Explore active government opportunities across {sectors.length} industry categories.
            </p>
          </div>
          {!isLoading && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                {contracts.length.toLocaleString()} loaded{totalFromApi > contracts.length ? ` of ${totalFromApi.toLocaleString()}` : ""}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-8 w-8">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Data source indicator */}
        {!isLoading && !isError && contracts.length > 0 && (
          <p className="text-xs text-muted-foreground/70 mb-4">
            Sector counts reflect the {contracts.length.toLocaleString()} most recent opportunities cached from <span className="text-primary font-medium">SAM.gov</span> · {classified} classified by NAICS
          </p>
        )}

        {isLoading && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-card border border-border rounded-xl">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Fetching live data from SAM.gov…</p>
              <p className="text-xs text-muted-foreground">This may take a few seconds</p>
            </div>
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Couldn't load live data</p>
              <p className="text-xs text-muted-foreground">{error?.message || "SAM.gov may be temporarily unavailable"}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-3 h-3 mr-1" /> Retry
            </Button>
          </div>
        )}

        <input
          type="text"
          placeholder="Search sectors..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md bg-card border border-border rounded-lg
                     px-4 py-2 text-foreground placeholder-muted-foreground text-sm
                     focus:outline-none focus:border-primary transition"
        />

        <button
          onClick={() => handleSectorClick("all")}
          className="mt-6 w-full flex items-center justify-between
                     bg-gradient-primary rounded-xl
                     px-6 py-4 hover:opacity-90
                     transition-all duration-200 group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <div className="text-left">
              <p className="font-semibold text-primary-foreground text-lg">All Sectors</p>
              <p className="text-primary-foreground/70 text-sm">Browse every opportunity regardless of industry</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary-foreground">
              {isLoading ? "…" : counts["all"] || 0}
            </p>
            <p className="text-primary-foreground/70 text-xs">opportunities loaded</p>
          </div>
        </button>
      </div>

      {/* Sector Distribution Charts */}
      {!isLoading && contracts.length > 0 && (() => {
        const chartData = sectors
          .map(([key, cfg]) => ({
            sectorKey: key,
            name: cfg.label,
            value: counts[key] || 0,
            color: SECTOR_COLORS[key] || "hsl(var(--muted-foreground))",
            icon: cfg.icon,
          }))
          .filter(d => d.value > 0)
          .sort((a, b) => b.value - a.value);

        const handleChartClick = (data) => {
          if (data?.sectorKey) handleSectorClick(data.sectorKey);
        };

        return (
          <div className="max-w-7xl mx-auto mb-10">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Sector Distribution</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-sm font-medium text-muted-foreground mb-3">Contract Share by Industry</p>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={50}
                      paddingAngle={2}
                      stroke="hsl(var(--card))"
                      strokeWidth={2}
                    >
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} className="cursor-pointer" onClick={() => handleChartClick(entry)} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        color: "hsl(var(--foreground))",
                        fontSize: "0.8rem",
                      }}
                      formatter={(value, name) => [`${value} contracts — Click to view`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {chartData.slice(0, 8).map((d, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                  ))}
                  {chartData.length > 8 && (
                    <span className="text-xs text-muted-foreground/60">+{chartData.length - 8} more</span>
                  )}
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-sm font-medium text-muted-foreground mb-3">Top Industries by Opportunity Count</p>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData.slice(0, 10)} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        color: "hsl(var(--foreground))",
                        fontSize: "0.8rem",
                      }}
                      formatter={(value) => [`${value} contracts — Click to view`]}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} className="cursor-pointer" onClick={(data) => handleChartClick(data)}>
                      {chartData.slice(0, 10).map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(([key, cfg]) => {
          const count = counts[key] || 0;
          const isHover = hovered === key;
          const naics = SECTOR_NAICS[key] || [];
          const color = SECTOR_COLORS[key] || "hsl(var(--muted-foreground))";

          return (
            <button
              key={key}
              onClick={() => handleSectorClick(key)}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              className="relative text-left rounded-xl border border-border transition-all duration-200 p-5 group overflow-hidden bg-card"
              style={{
                borderColor: isHover ? color : undefined,
                boxShadow: isHover ? `0 0 20px ${color}30` : "none",
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(circle at top left, ${color}15, transparent 70%)` }}
              />

              <div className="flex items-start justify-between mb-3 relative z-10">
                <span className="text-3xl">{cfg.icon}</span>
                <div className="text-right">
                  <span className="text-2xl font-bold" style={{ color }}>
                    {isLoading ? "…" : count}
                  </span>
                  <p className="text-muted-foreground text-xs">opportunities</p>
                </div>
              </div>

              <p
                className="font-semibold text-sm mb-1 relative z-10 transition-colors"
                style={{ color: isHover ? color : undefined }}
              >
                <span className={isHover ? "" : "text-foreground"}>{cfg.label}</span>
              </p>

              <p className="text-muted-foreground/60 text-xs relative z-10">
                NAICS: {naics.slice(0, 3).join(", ")}{naics.length > 3 ? "…" : ""}
              </p>

              <div className="mt-3 relative z-10">
                <div className="w-full bg-muted rounded-full h-1">
                  <div
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((count / Math.max(...Object.values(counts).filter(v => typeof v === "number"), 1)) * 100, 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>

              <div
                className="absolute bottom-4 right-4 text-xs font-medium opacity-0 group-hover:opacity-100
                           transition-all duration-200 translate-x-1 group-hover:translate-x-0"
                style={{ color }}
              >
                View contracts →
              </div>
            </button>
          );
        })}
      </div>

      <div className="max-w-7xl mx-auto mt-12 grid grid-cols-3 gap-4 text-center">
        {[
          { label: "Total Sectors", value: sectors.length },
          { label: "Active Opportunities", value: isLoading ? "…" : counts["all"] || 0 },
          { label: "Data Source", value: "SAM.gov" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl py-5">
            <p className="text-3xl font-bold text-primary">{stat.value}</p>
            <p className="text-muted-foreground text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
