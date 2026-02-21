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
import { NAICS_GROUPS, ALL_NAICS } from "@/data/naicsCodes";

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
    const match = ALL_NAICS.find(n => n.code === code);
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
        <PopoverContent className="p-0 w-[480px] z-50 bg-popover" align="start">
          <Command>
            <CommandInput placeholder="Search by code or industry..." />
            <div className="relative">
              <CommandList className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
              <CommandEmpty>No matching NAICS code found.</CommandEmpty>
              {NAICS_GROUPS.map((group) => {
                const available = group.codes.filter((n) => !selected.includes(n.code));
                if (available.length === 0) return null;
                return (
                  <CommandGroup key={group.label} heading={group.label}>
                    {available.map((n) => (
                      <CommandItem key={n.code} value={`${n.code} ${n.desc}`} onSelect={() => addCode(n.code)}>
                        <span className="font-mono text-xs text-primary mr-2">{n.code}</span>
                        <span className="text-sm truncate">{n.desc}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </CommandList>
              <div className="sticky bottom-0 h-6 bg-gradient-to-t from-popover to-transparent pointer-events-none" />
            </div>
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
