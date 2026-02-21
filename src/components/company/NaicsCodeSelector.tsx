import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const COMMON_NAICS = [
  // Construction
  { code: "236210", desc: "Industrial Building Construction" },
  { code: "236220", desc: "Commercial and Institutional Building Construction" },
  { code: "237110", desc: "Water & Sewer Line Construction" },
  { code: "237310", desc: "Highway, Street & Bridge Construction" },
  { code: "238110", desc: "Poured Concrete Foundation & Structure" },
  { code: "238210", desc: "Electrical Contractors" },
  { code: "238220", desc: "Plumbing, Heating & Air-Conditioning" },
  // Manufacturing & Defense
  { code: "332993", desc: "Ammunition Manufacturing" },
  { code: "334111", desc: "Electronic Computer Manufacturing" },
  { code: "334511", desc: "Search, Detection, Navigation Instruments" },
  { code: "336411", desc: "Aircraft Manufacturing" },
  { code: "336413", desc: "Other Aircraft Parts & Equipment" },
  { code: "336414", desc: "Guided Missile & Space Vehicle Manufacturing" },
  { code: "336992", desc: "Military Armored Vehicle Manufacturing" },
  // Wholesale & Logistics
  { code: "423430", desc: "Computer Equipment Merchant Wholesalers" },
  { code: "484110", desc: "General Freight Trucking, Local" },
  { code: "484121", desc: "General Freight Trucking, Long-Distance" },
  { code: "493110", desc: "General Warehousing & Storage" },
  // IT & Software
  { code: "513210", desc: "Software Publishers" },
  { code: "517111", desc: "Wired Telecommunications Carriers" },
  { code: "517312", desc: "Wireless Telecommunications Carriers" },
  { code: "518210", desc: "Data Processing & Hosting Services" },
  { code: "519290", desc: "Web Search Portals & Other Information Services" },
  // Professional & Technical Services
  { code: "541310", desc: "Architectural Services" },
  { code: "541320", desc: "Landscape Architectural Services" },
  { code: "541330", desc: "Engineering Services" },
  { code: "541380", desc: "Testing Laboratories" },
  { code: "541511", desc: "Custom Computer Programming Services" },
  { code: "541512", desc: "Computer Systems Design Services" },
  { code: "541513", desc: "Computer Facilities Management Services" },
  { code: "541519", desc: "Other Computer Related Services" },
  { code: "541611", desc: "Administrative Management Consulting" },
  { code: "541612", desc: "Human Resources Consulting Services" },
  { code: "541613", desc: "Marketing Consulting Services" },
  { code: "541614", desc: "Process & Logistics Consulting Services" },
  { code: "541618", desc: "Other Management Consulting Services" },
  { code: "541620", desc: "Environmental Consulting Services" },
  { code: "541690", desc: "Other Scientific & Technical Consulting" },
  { code: "541715", desc: "R&D in Physical, Engineering & Life Sciences" },
  { code: "541990", desc: "All Other Professional & Technical Services" },
  // Admin & Support
  { code: "561210", desc: "Facilities Support Services" },
  { code: "561320", desc: "Temporary Help Services" },
  { code: "561612", desc: "Security Guards & Patrol Services" },
  { code: "561621", desc: "Security Systems Services" },
  { code: "561720", desc: "Janitorial Services" },
  // Environmental
  { code: "562111", desc: "Solid Waste Collection" },
  { code: "562211", desc: "Hazardous Waste Treatment & Disposal" },
  { code: "562910", desc: "Remediation Services" },
  // Healthcare
  { code: "611430", desc: "Professional & Management Development Training" },
  { code: "621111", desc: "Offices of Physicians" },
  { code: "621511", desc: "Medical Laboratories" },
  { code: "621610", desc: "Home Health Care Services" },
  { code: "621999", desc: "All Other Miscellaneous Health Services" },
  { code: "622110", desc: "General Medical & Surgical Hospitals" },
  // Energy
  { code: "221111", desc: "Hydroelectric Power Generation" },
  { code: "221114", desc: "Solar Electric Power Generation" },
  { code: "221118", desc: "Other Electric Power Generation" },
  // Agriculture & Food
  { code: "111140", desc: "Wheat Farming" },
  { code: "311812", desc: "Commercial Bakeries" },
  // Finance
  { code: "522110", desc: "Commercial Banking" },
  { code: "524210", desc: "Insurance Agencies & Brokerages" },
  // Maintenance & Repair
  { code: "811212", desc: "Computer & Office Machine Repair" },
  // National Security
  { code: "928110", desc: "National Security" },
];

interface NaicsCodeSelectorProps {
  selected: string[];
  onChange: (codes: string[]) => void;
}

export function NaicsCodeSelector({ selected, onChange }: NaicsCodeSelectorProps) {
  const [open, setOpen] = useState(false);

  const addCode = (code: string) => {
    if (!selected.includes(code)) {
      onChange([...selected, code]);
    }
    setOpen(false);
  };

  const removeCode = (code: string) => {
    onChange(selected.filter(c => c !== code));
  };

  const getLabel = (code: string) => {
    const match = COMMON_NAICS.find(n => n.code === code);
    return match ? `${match.code} — ${match.desc}` : code;
  };

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-muted-foreground font-normal">
            + Add NAICS Code
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[360px]" align="start">
          <Command>
            <CommandInput placeholder="Search by code or industry..." />
            <CommandList>
              <CommandEmpty>No matching NAICS code found.</CommandEmpty>
              <CommandGroup>
                {COMMON_NAICS.filter(n => !selected.includes(n.code)).map(n => (
                  <CommandItem key={n.code} value={`${n.code} ${n.desc}`} onSelect={() => addCode(n.code)}>
                    <span className="font-mono text-xs text-primary mr-2">{n.code}</span>
                    <span className="text-sm truncate">{n.desc}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(code => (
            <Badge key={code} variant="secondary" className="gap-1 pr-1 text-xs">
              {getLabel(code)}
              <button onClick={() => removeCode(code)} className="ml-1 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
