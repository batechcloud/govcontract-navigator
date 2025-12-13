import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, FileText, Building2, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const marketStats = [
  { label: "Active Opportunities", value: "12,847", change: "+5.2%", trend: "up" },
  { label: "Total Contract Value", value: "$847B", change: "+12.8%", trend: "up" },
  { label: "Avg. Contract Size", value: "$2.4M", change: "-3.1%", trend: "down" },
  { label: "Small Business Set-Asides", value: "4,231", change: "+8.7%", trend: "up" },
];

const topAgencies = [
  { name: "Department of Defense", opportunities: 3421, value: "$312B" },
  { name: "Department of Health & Human Services", opportunities: 1876, value: "$98B" },
  { name: "General Services Administration", opportunities: 1654, value: "$67B" },
  { name: "Department of Homeland Security", opportunities: 1234, value: "$54B" },
  { name: "Department of Veterans Affairs", opportunities: 987, value: "$43B" },
];

const trendingNAICS = [
  { code: "541512", name: "Computer Systems Design Services", growth: "+15.3%" },
  { code: "541511", name: "Custom Computer Programming Services", growth: "+12.7%" },
  { code: "541519", name: "Other Computer Related Services", growth: "+11.2%" },
  { code: "541330", name: "Engineering Services", growth: "+9.8%" },
  { code: "541990", name: "All Other Professional Services", growth: "+8.4%" },
];

export default function MarketWatch() {
  return (
    <DashboardLayout title="Market Watch">
      <div className="space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-foreground">Market Intelligence</h2>
          <p className="text-muted-foreground">Real-time insights into the federal contracting marketplace</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {marketStats.map((stat) => (
            <Card key={stat.label} className="bg-card/50 backdrop-blur-xl border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span className={`text-xs flex items-center gap-1 ${
                    stat.trend === 'up' ? 'text-emerald-400' : 'text-destructive'
                  }`}>
                    {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Agencies */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card/50 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Top Contracting Agencies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topAgencies.map((agency, index) => (
                    <div key={agency.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">{index + 1}</span>
                        <div>
                          <p className="font-medium text-foreground text-sm">{agency.name}</p>
                          <p className="text-xs text-muted-foreground">{agency.opportunities} opportunities</p>
                        </div>
                      </div>
                      <Badge variant="outline">{agency.value}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Trending NAICS */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-card/50 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Trending NAICS Codes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trendingNAICS.map((naics) => (
                    <div key={naics.code} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground text-sm">{naics.code}</p>
                        <p className="text-xs text-muted-foreground">{naics.name}</p>
                      </div>
                      <span className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {naics.growth}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Chart Placeholder */}
        <motion.div 
          className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-semibold text-foreground mb-4">Contract Awards Trend (Last 12 Months)</h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <BarChart3 className="w-12 h-12 opacity-50" />
            <span className="ml-4">Chart visualization coming soon</span>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
