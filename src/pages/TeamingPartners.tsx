import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Users, Search, Plus, Building2, MapPin, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const partners = [
  {
    id: 1,
    name: "TechSolutions Inc.",
    uei: "ABC123456789",
    capabilities: ["Cybersecurity", "Cloud Services", "IT Support"],
    location: "Arlington, VA",
    certifications: ["8(a)", "HUBZone"],
    awards: 45,
    totalValue: "$12.5M"
  },
  {
    id: 2,
    name: "SecureNet Federal",
    uei: "DEF987654321",
    capabilities: ["Network Security", "Compliance", "Training"],
    location: "Bethesda, MD",
    certifications: ["SDVOSB"],
    awards: 32,
    totalValue: "$8.2M"
  },
  {
    id: 3,
    name: "DataDriven Analytics",
    uei: "GHI456789012",
    capabilities: ["Data Analytics", "AI/ML", "Business Intelligence"],
    location: "Reston, VA",
    certifications: ["WOSB"],
    awards: 28,
    totalValue: "$6.7M"
  },
];

export default function TeamingPartners() {
  return (
    <DashboardLayout title="Teaming Partners">
      <div className="space-y-6">
        {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h2 className="text-2xl font-bold text-foreground">Teaming Partners</h2>
            <p className="text-muted-foreground">Find and connect with potential subcontractors and partners</p>
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Search Partners
          </Button>
        </motion.div>

        {/* Search */}
        <motion.div 
          className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by company name, UEI, or capability..." className="pl-10" />
            </div>
            <Button variant="outline">Filter by Certification</Button>
            <Button variant="outline">Filter by NAICS</Button>
          </div>
        </motion.div>

        {/* Partners List */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {partners.map((partner) => (
            <div 
              key={partner.id}
              className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 hover:border-primary/50 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{partner.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">UEI: {partner.uei}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-3 h-3" />
                      {partner.location}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {partner.capabilities.map((cap) => (
                        <Badge key={cap} variant="outline" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {partner.certifications.map((cert) => (
                        <Badge key={cert} className="bg-emerald-500/20 text-emerald-400 text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Award className="w-4 h-4" />
                      {partner.awards} awards
                    </div>
                    <p className="text-lg font-semibold text-foreground">{partner.totalValue}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Users className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
