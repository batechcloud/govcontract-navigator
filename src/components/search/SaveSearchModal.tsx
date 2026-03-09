import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SaveSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
  isLoading?: boolean;
}

export function SaveSearchModal({ open, onOpenChange, onSave, isLoading }: SaveSearchModalProps) {
  const [searchName, setSearchName] = useState("");

  const handleSave = () => {
    if (searchName.trim()) {
      onSave(searchName.trim());
      setSearchName("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Search</DialogTitle>
          <DialogDescription>
            Give this search a name so you can quickly run it again later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="search-name">Search Name</Label>
            <Input
              id="search-name"
              placeholder="e.g., IT Contracts Under $1M"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchName.trim()) {
                  handleSave();
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!searchName.trim() || isLoading}>
            {isLoading ? "Saving..." : "Save Search"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
