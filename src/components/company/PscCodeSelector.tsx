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

const PSC_CODES = [
  // IT & Telecom Services (D series)
  { code: "D301", desc: "IT Facility Operation and Maintenance" },
  { code: "D302", desc: "IT Systems Development Services" },
  { code: "D304", desc: "IT Telecommunications and Transmission" },
  { code: "D306", desc: "IT Systems Analysis Services" },
  { code: "D307", desc: "IT Network Support Services" },
  { code: "D308", desc: "IT Programming Services" },
  { code: "D310", desc: "IT Cyber Security and Data Backup" },
  { code: "D311", desc: "IT Data Conversion Services" },
  { code: "D314", desc: "IT Deployment and Distribution" },
  { code: "D316", desc: "IT Network Management" },
  { code: "D317", desc: "IT Web-Based Subscription Services" },
  { code: "D318", desc: "IT Integrated Hardware/Software/Services Solutions" },
  { code: "D399", desc: "Other IT and Telecom Services" },

  // Professional & Management Services (R series)
  { code: "R408", desc: "Program Management/Support Services" },
  { code: "R425", desc: "Engineering and Technical Services" },
  { code: "R497", desc: "Medical and Health Services" },
  { code: "R499", desc: "Other Professional Services" },
  { code: "R602", desc: "Logistics Support Services" },
  { code: "R699", desc: "Other Administrative Support Services" },
  { code: "R706", desc: "Management Analysis Studies" },
  { code: "R707", desc: "Consulting and Program Management" },
  { code: "R710", desc: "Financial Management and Audit Services" },
  { code: "R799", desc: "Other Management Support Services" },

  // Maintenance & Repair Services (J series)
  { code: "J058", desc: "Maintenance of Communication Equipment" },
  { code: "J070", desc: "Maintenance of ADP Equipment" },

  // Housekeeping & Facility Services (S series)
  { code: "S201", desc: "Housekeeping and Janitorial Services" },
  { code: "S206", desc: "Guard Services" },
  { code: "S208", desc: "Landscaping and Groundskeeping" },

  // Education & Training (U series)
  { code: "U001", desc: "Education and Training Services" },
  { code: "U008", desc: "Training Aids and Devices" },

  // Transportation (V series)
  { code: "V119", desc: "Transportation of Supplies/Equipment" },

  // Real Property Services (W series)
  { code: "W062", desc: "Restoration of Real Property" },
  { code: "W072", desc: "Maintenance of Warehouses" },

  // Construction (Y series)
  { code: "Y1DA", desc: "Construction of Office Buildings" },
  { code: "Y1JZ", desc: "Construction of Miscellaneous Buildings" },

  // Building Maintenance & Repair (Z series)
  { code: "Z1DA", desc: "Maintenance of Office Buildings" },
  { code: "Z2DA", desc: "Repair of Office Buildings" },

  // IT Products (70xx series)
  { code: "7010", desc: "IT System Configuration and Data Entry" },
  { code: "7025", desc: "IT Input/Output and Storage Devices" },
  { code: "7030", desc: "IT ADP Software" },
  { code: "7035", desc: "IT ADP Support Equipment" },
  { code: "7042", desc: "IT Mini and Micro Computer Control Devices" },

  // Communication Equipment (58xx series)
  { code: "5820", desc: "Radio and TV Communication Equipment" },
  { code: "5895", desc: "Miscellaneous Communication Equipment" },

  // Office Supplies (75xx series)
  { code: "7520", desc: "Office Devices and Accessories" },
  { code: "7530", desc: "Stationery and Record Forms" },
  { code: "7540", desc: "Standard and Specification Forms" },

  // Medical Equipment & Supplies (65xx series)
  { code: "6515", desc: "Medical Instruments and Supplies" },
  { code: "6530", desc: "Hospital Furniture and Equipment" },
  { code: "6532", desc: "Hospital and Surgical Clothing" },

  // Food Products (89xx series)
  { code: "8940", desc: "Special Dietary Foods" },
  { code: "8945", desc: "Food Oils and Fats" },

  // Aerospace & Defense Products
  { code: "1560", desc: "Airframe Structural Components" },
  { code: "2840", desc: "Gas Turbines and Jet Engines" },
];

interface PscCodeSelectorProps {
  selected: string[];
  onChange: (codes: string[]) => void;
}

export function PscCodeSelector({ selected, onChange }: PscCodeSelectorProps) {
  const [open, setOpen] = useState(false);

  const addCode = (code: string) => {
    if (!selected.includes(code)) {
      onChange([...selected, code]);
    }
    setOpen(false);
  };

  const removeCode = (code: string) => {
    onChange(selected.filter((c) => c !== code));
  };

  const getLabel = (code: string) => {
    const match = PSC_CODES.find((p) => p.code === code);
    return match ? `${match.code} — ${match.desc}` : code;
  };

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground font-normal"
          >
            + Add PSC Code
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[360px]" align="start">
          <Command>
            <CommandInput placeholder="Search by code or description..." />
            <CommandList>
              <CommandEmpty>No matching PSC code found.</CommandEmpty>
              <CommandGroup>
                {PSC_CODES.filter((p) => !selected.includes(p.code)).map(
                  (p) => (
                    <CommandItem
                      key={p.code}
                      value={`${p.code} ${p.desc}`}
                      onSelect={() => addCode(p.code)}
                    >
                      <span className="font-mono text-xs text-primary mr-2">
                        {p.code}
                      </span>
                      <span className="text-sm truncate">{p.desc}</span>
                    </CommandItem>
                  )
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((code) => (
            <Badge key={code} variant="secondary" className="gap-1 pr-1 text-xs">
              {getLabel(code)}
              <button
                onClick={() => removeCode(code)}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
