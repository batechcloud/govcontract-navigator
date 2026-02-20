import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const SECTOR_NAICS = {
  technology:    ["5415", "5182", "5191", "5112", "5179"],
  healthcare:    ["6211", "6212", "6216", "6219", "6221", "6231"],
  construction:  ["2361", "2362", "2371", "2372", "2381", "2382"],
  consulting:    ["5411", "5412", "5413", "5414", "5416", "5417"],
  engineering:   ["5413", "5417", "5419"],
  education:     ["6111", "6112", "6113", "6114", "6115", "6116"],
  logistics:     ["4811", "4841", "4851", "4911", "4921", "4931"],
  energy:        ["2211", "2212", "2213", "3241", "3353"],
  defense:       ["3364", "3369", "5413", "9281"],
  manufacturing: ["3111", "3251", "3321", "3329", "3364"],
  environment:   ["5629", "9241", "9281"],
  finance:       ["5221", "5231", "5241", "5251"],
  legal:         ["5411"],
  marketing:     ["5418", "5191", "7111", "7113"],
  agriculture:   ["1111", "1112", "1113", "1114", "1119"],
  security:      ["5616", "9221", "9281"],
  telecom:       ["5171", "5172", "5174", "5179"],
  admin:         ["5611", "5612", "5613", "5614", "5615"],
  hr_staffing:   ["5613", "6213"],
  research:      ["5417", "6117"],
  facilities:    ["5311", "5617", "8111"],
  social:        ["6241", "6242", "6243", "6244"],
  data_analytics:["5415", "5182", "5191"],
  scientific:    ["5417", "7132", "8099"],
};

const SECTOR_CONFIG = {
  all:           { label: "All Sectors",          color: "#94a3b8", icon: "🌐" },
  technology:    { label: "IT & Cybersecurity",   color: "#3b82f6", icon: "💻" },
  healthcare:    { label: "Healthcare & Medical", color: "#10b981", icon: "🏥" },
  construction:  { label: "Construction",         color: "#f59e0b", icon: "🏗️" },
  consulting:    { label: "Consulting",           color: "#8b5cf6", icon: "📊" },
  engineering:   { label: "Engineering",          color: "#06b6d4", icon: "⚙️" },
  education:     { label: "Education & Training", color: "#f97316", icon: "🎓" },
  logistics:     { label: "Logistics & Supply",   color: "#84cc16", icon: "🚛" },
  energy:        { label: "Energy & Utilities",   color: "#eab308", icon: "⚡" },
  defense:       { label: "Defense & Aerospace",  color: "#ef4444", icon: "🛡️" },
  manufacturing: { label: "Manufacturing",        color: "#64748b", icon: "🏭" },
  environment:   { label: "Environmental",        color: "#22c55e", icon: "🌿" },
  finance:       { label: "Finance & Accounting", color: "#a855f7", icon: "💰" },
  legal:         { label: "Legal Services",       color: "#6366f1", icon: "⚖️" },
  marketing:     { label: "Marketing & Media",    color: "#ec4899", icon: "📣" },
  agriculture:   { label: "Agriculture & Food",   color: "#78716c", icon: "🌾" },
  security:      { label: "Security & Law Enf.",  color: "#dc2626", icon: "🔒" },
  telecom:       { label: "Telecommunications",   color: "#0891b2", icon: "📡" },
  admin:         { label: "Admin & Support",      color: "#9ca3af", icon: "📋" },
  hr_staffing:   { label: "HR & Staffing",        color: "#d97706", icon: "👥" },
  research:      { label: "Research & Dev",       color: "#7c3aed", icon: "🔬" },
  facilities:    { label: "Facilities Mgmt",      color: "#059669", icon: "🏢" },
  social:        { label: "Social Services",      color: "#db2777", icon: "🤝" },
  data_analytics:{ label: "Data & Analytics",     color: "#2563eb", icon: "📈" },
  scientific:    { label: "Scientific & Lab",     color: "#0d9488", icon: "🧪" },
};

const MOCK_CONTRACTS_LOCAL = [
  { sector: "technology" },    { sector: "technology" },    { sector: "technology" },
  { sector: "healthcare" },    { sector: "healthcare" },
  { sector: "construction" },  { sector: "construction" },
  { sector: "consulting" },    { sector: "engineering" },
  { sector: "education" },     { sector: "logistics" },
  { sector: "energy" },        { sector: "defense" },       { sector: "defense" },
  { sector: "manufacturing" }, { sector: "environment" },
  { sector: "finance" },       { sector: "legal" },         { sector: "marketing" },
  { sector: "agriculture" },   { sector: "security" },      { sector: "telecom" },
  { sector: "admin" },         { sector: "hr_staffing" },   { sector: "research" },
  { sector: "research" },      { sector: "facilities" },    { sector: "social" },
  { sector: "data_analytics" },{ sector: "data_analytics" },{ sector: "scientific" },
];

function getSectorCounts(contracts) {
  const counts = {};
  Object.keys(SECTOR_CONFIG).forEach(s => (counts[s] = 0));
  contracts.forEach(c => {
    if (c.sector && counts[c.sector] !== undefined) counts[c.sector]++;
  });
  counts["all"] = contracts.length;
  return counts;
}

const EMPTY_CONTRACTS = [];

export default function SectorBrowse({ contracts = EMPTY_CONTRACTS }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [search, setSearch]   = useState("");

  const counts = useMemo(
    () => getSectorCounts(contracts.length ? contracts : MOCK_CONTRACTS_LOCAL),
    [contracts]
  );

  const sectors  = Object.entries(SECTOR_CONFIG).filter(([key]) => key !== "all");
  const filtered = sectors.filter(([, cfg]) =>
    cfg.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSectorClick = (sectorKey) => {
    navigate(`/dashboard?sector=${sectorKey}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white px-6 py-10">
      <div className="max-w-7xl mx-auto mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Browse by Industry Sector</h1>
        <p className="text-slate-400 text-sm mb-6">
          Explore government contracts across all {sectors.length} industry categories.
          Click any sector to filter the dashboard instantly.
        </p>

        <input
          type="text"
          placeholder="Search sectors..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md bg-[#131929] border border-slate-700 rounded-lg
                     px-4 py-2 text-white placeholder-slate-500 text-sm
                     focus:outline-none focus:border-blue-500 transition"
        />

        <button
          onClick={() => handleSectorClick("all")}
          className="mt-6 w-full flex items-center justify-between
                     bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl
                     px-6 py-4 hover:from-blue-500 hover:to-blue-700
                     transition-all duration-200 group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <div className="text-left">
              <p className="font-semibold text-white text-lg">All Sectors</p>
              <p className="text-blue-200 text-sm">Browse every contract regardless of industry</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{counts["all"] || 0}</p>
            <p className="text-blue-200 text-xs">total contracts</p>
          </div>
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(([key, cfg]) => {
          const count   = counts[key] || 0;
          const isHover = hovered === key;
          const naics   = SECTOR_NAICS[key] || [];

          return (
            <button
              key={key}
              onClick={() => handleSectorClick(key)}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              className="relative text-left rounded-xl border transition-all duration-200 p-5 group overflow-hidden"
              style={{
                backgroundColor: isHover ? `${cfg.color}18` : "#131929",
                borderColor:     isHover ? cfg.color : "#1e293b",
                boxShadow:       isHover ? `0 0 20px ${cfg.color}30` : "none",
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(circle at top left, ${cfg.color}15, transparent 70%)` }}
              />

              <div className="flex items-start justify-between mb-3 relative z-10">
                <span className="text-3xl">{cfg.icon}</span>
                <div className="text-right">
                  <span className="text-2xl font-bold" style={{ color: cfg.color }}>{count}</span>
                  <p className="text-slate-500 text-xs">contracts</p>
                </div>
              </div>

              <p
                className="font-semibold text-sm mb-1 relative z-10 transition-colors"
                style={{ color: isHover ? cfg.color : "#e2e8f0" }}
              >
                {cfg.label}
              </p>

              <p className="text-slate-600 text-xs relative z-10">
                NAICS: {naics.slice(0, 3).join(", ")}{naics.length > 3 ? "..." : ""}
              </p>

              <div className="mt-3 relative z-10">
                <div className="w-full bg-slate-800 rounded-full h-1">
                  <div
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((count / Math.max(...Object.values(counts), 1)) * 100, 100)}%`,
                      backgroundColor: cfg.color,
                    }}
                  />
                </div>
              </div>

              <div
                className="absolute bottom-4 right-4 text-xs font-medium opacity-0 group-hover:opacity-100
                           transition-all duration-200 translate-x-1 group-hover:translate-x-0"
                style={{ color: cfg.color }}
              >
                View contracts →
              </div>
            </button>
          );
        })}
      </div>

      <div className="max-w-7xl mx-auto mt-12 grid grid-cols-3 gap-4 text-center">
        {[
          { label: "Total Sectors",    value: sectors.length },
          { label: "Active Contracts", value: counts["all"] || 0 },
          { label: "Data Sources",     value: 3 },
        ].map(stat => (
          <div key={stat.label} className="bg-[#131929] border border-slate-800 rounded-xl py-5">
            <p className="text-3xl font-bold text-blue-400">{stat.value}</p>
            <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
