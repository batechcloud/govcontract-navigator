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
import { PSC_GROUPS, ALL_PSC } from "@/data/pscCodes";

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
    const match = ALL_PSC.find((p) => p.code === code);
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
        <PopoverContent className="p-0 w-[480px] z-50 bg-popover" align="start">
          <Command>
            <CommandInput placeholder="Search by code or description..." />
            <div className="relative">
              <CommandList className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
                <CommandEmpty>No matching PSC code found.</CommandEmpty>
                {PSC_GROUPS.map((group) => {
                  const available = group.codes.filter((p) => !selected.includes(p.code));
                  if (available.length === 0) return null;
                  return (
                    <CommandGroup key={group.label} heading={group.label}>
                      {available.map((p) => (
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
