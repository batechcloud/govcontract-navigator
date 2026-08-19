import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavedSearches, SavedSearch } from "@/hooks/useSavedSearches";
import { Clock, Trash2, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SavedSearchesListProps {
  onLoadSearch: (search: SavedSearch) => void;
}

export function SavedSearchesList({ onLoadSearch }: SavedSearchesListProps) {
  const { searches, isLoading, deleteSearch } = useSavedSearches();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (searches.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Search className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-sm">
          No saved searches yet. Save your current search to quickly access it later.
        </p>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {searches.map((search) => (
          <Card
            key={search.id}
            className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className="flex-1 min-w-0"
                onClick={() => onLoadSearch(search)}
              >
                <h4 className="font-medium text-sm mb-1 truncate">{search.name}</h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {search.query && (
                    <span className="truncate">"{search.query}"</span>
                  )}
                  {search.last_run_at && (
                    <span className="flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(search.last_run_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete saved search"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSearch.mutate(search.id);
                }}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
