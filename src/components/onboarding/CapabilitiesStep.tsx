import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Award, Zap, Plus, X, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OnboardingData } from "@/pages/Onboarding";

interface CapabilitiesStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const popularNaicsCodes = [
  { code: "541512", label: "Computer Systems Design" },
  { code: "541611", label: "Management Consulting" },
  { code: "541330", label: "Engineering Services" },
  { code: "541519", label: "IT Services" },
  { code: "541511", label: "Custom Computer Programming" },
  { code: "541990", label: "Other Professional Services" },
  { code: "561210", label: "Facilities Support" },
  { code: "561320", label: "Temporary Staffing" },
];

const certificationOptions = [
  { id: "8a", label: "8(a)", description: "Small Disadvantaged Business" },
  { id: "hubzone", label: "HUBZone", description: "Historically Underutilized" },
  { id: "sdvosb", label: "SDVOSB", description: "Service-Disabled Veteran" },
  { id: "wosb", label: "WOSB", description: "Women-Owned Small Business" },
  { id: "edwosb", label: "EDWOSB", description: "Economically Disadvantaged WOSB" },
  { id: "vosb", label: "VOSB", description: "Veteran-Owned Small Business" },
  { id: "sdb", label: "SDB", description: "Small Disadvantaged Business" },
  { id: "small", label: "Small Business", description: "SBA Small Business" },
];

const capabilitySuggestions = [
  "Cloud Migration",
  "Cybersecurity",
  "Data Analytics",
  "Software Development",
  "Project Management",
  "IT Infrastructure",
  "Training & Development",
  "Technical Writing",
  "Systems Integration",
  "DevOps",
];

const CapabilitiesStep = ({ data, updateData }: CapabilitiesStepProps) => {
  const [naicsInput, setNaicsInput] = useState("");
  const [capabilityInput, setCapabilityInput] = useState("");

  const addNaicsCode = (code: string) => {
    if (code && !data.naicsCodes.includes(code)) {
      updateData({ naicsCodes: [...data.naicsCodes, code] });
    }
    setNaicsInput("");
  };

  const removeNaicsCode = (code: string) => {
    updateData({ naicsCodes: data.naicsCodes.filter((c) => c !== code) });
  };

  const toggleCertification = (certId: string) => {
    if (data.certifications.includes(certId)) {
      updateData({
        certifications: data.certifications.filter((c) => c !== certId),
      });
    } else {
      updateData({ certifications: [...data.certifications, certId] });
    }
  };

  const addCapability = (cap: string) => {
    if (cap && !data.capabilities.includes(cap)) {
      updateData({ capabilities: [...data.capabilities, cap] });
    }
    setCapabilityInput("");
  };

  const removeCapability = (cap: string) => {
    updateData({ capabilities: data.capabilities.filter((c) => c !== cap) });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
          What are your capabilities?
        </h2>
        <p className="text-muted-foreground">
          Add your NAICS codes, certifications, and core competencies
        </p>
      </motion.div>

      <div className="space-y-6">
        {/* NAICS Codes */}
        <Card variant="glass" className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">NAICS Codes</h3>
          </div>

          {/* Selected NAICS */}
          {data.naicsCodes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {data.naicsCodes.map((code) => (
                <Badge
                  key={code}
                  variant="secondary"
                  className="pl-3 pr-1 py-1.5 flex items-center gap-1"
                >
                  {code}
                  <button
                    onClick={() => removeNaicsCode(code)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter NAICS code (e.g., 541512)"
              value={naicsInput}
              onChange={(e) => setNaicsInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNaicsCode(naicsInput);
                }
              }}
              className="bg-secondary/50"
            />
            <Button
              variant="secondary"
              size="icon"
              onClick={() => addNaicsCode(naicsInput)}
              disabled={!naicsInput}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Add */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Quick add popular codes:
            </Label>
            <div className="flex flex-wrap gap-2">
              {popularNaicsCodes
                .filter((n) => !data.naicsCodes.includes(n.code))
                .slice(0, 6)
                .map((naics) => (
                  <button
                    key={naics.code}
                    onClick={() => addNaicsCode(naics.code)}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    {naics.code} - {naics.label}
                  </button>
                ))}
            </div>
          </div>
        </Card>

        {/* Certifications */}
        <Card variant="glass" className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Certifications & Set-Asides</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {certificationOptions.map((cert) => (
              <button
                key={cert.id}
                onClick={() => toggleCertification(cert.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  data.certifications.includes(cert.id)
                    ? "bg-primary/20 border-primary/40 text-primary"
                    : "bg-secondary/50 border-border hover:border-primary/30"
                }`}
              >
                <div className="font-semibold text-sm">{cert.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {cert.description}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Core Capabilities */}
        <Card variant="glass" className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-success" />
            <h3 className="font-semibold">Core Capabilities</h3>
          </div>

          {/* Selected Capabilities */}
          {data.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {data.capabilities.map((cap) => (
                <Badge
                  key={cap}
                  variant="secondary"
                  className="pl-3 pr-1 py-1.5 flex items-center gap-1"
                >
                  {cap}
                  <button
                    onClick={() => removeCapability(cap)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add a capability (e.g., Cloud Migration)"
              value={capabilityInput}
              onChange={(e) => setCapabilityInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCapability(capabilityInput);
                }
              }}
              className="bg-secondary/50"
            />
            <Button
              variant="secondary"
              size="icon"
              onClick={() => addCapability(capabilityInput)}
              disabled={!capabilityInput}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Suggestions */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Suggestions:
            </Label>
            <div className="flex flex-wrap gap-2">
              {capabilitySuggestions
                .filter((c) => !data.capabilities.includes(c))
                .slice(0, 6)
                .map((cap) => (
                  <button
                    key={cap}
                    onClick={() => addCapability(cap)}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    + {cap}
                  </button>
                ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CapabilitiesStep;
