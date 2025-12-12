import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Bookmark,
  Play,
  Trash2,
  Clock,
  Filter,
  Hash,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useSavedSearches, useDeleteSavedSearch, useSmartSearch, useUpdateSavedSearch } from "@/hooks/useSearch";
import { formatDistanceToNow } from "date-fns";

const SavedSearches = () => {
  const navigate = useNavigate();
  const { data: savedSearches, isLoading } = useSavedSearches();
  const deleteSearch = useDeleteSavedSearch();
  const updateSearch = useUpdateSavedSearch();
  const { searchWithFilters } = useSmartSearch();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const handleRunSearch = async (search: typeof savedSearches extends (infer T)[] ? T : never) => {
    setRunningId(search.id);
    try {
      const results = await searchWithFilters(search.filters as any);
      
      // Update the saved search with new result count
      updateSearch.mutate({
        id: search.id,
        resultCount: results.total
      });
      
      // Navigate to search hub with results
      navigate(`/dashboard/search?savedSearch=${search.id}`);
    } catch (error) {
      console.error("Error running search:", error);
    } finally {
      setRunningId(null);
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteSearch.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout title="Saved Searches">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Bookmark className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-heading font-semibold text-lg">Your Saved Searches</h2>
                <p className="text-sm text-muted-foreground">
                  Quickly run your saved search queries to find matching opportunities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saved Searches List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} variant="glass">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : savedSearches && savedSearches.length > 0 ? (
          <div className="space-y-4">
            {savedSearches.map((search, index) => {
              const filters = search.filters as any;
              return (
                <motion.div
                  key={search.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card variant="glass-hover">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                          <Search className="w-5 h-5 text-accent" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-semibold text-foreground mb-1">
                            {search.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3 truncate">
                            "{search.query}"
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {filters?.keywords?.length > 0 && (
                              <Badge variant="glass" className="text-xs">
                                <Filter className="w-3 h-3 mr-1" />
                                {filters.keywords.length} keywords
                              </Badge>
                            )}
                            {filters?.set_aside?.length > 0 && (
                              <Badge variant="gold" className="text-xs">
                                {filters.set_aside.join(", ")}
                              </Badge>
                            )}
                            {filters?.naics_codes?.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Hash className="w-3 h-3 mr-1" />
                                NAICS: {filters.naics_codes.join(", ")}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {search.search_type || "Federal"}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Last run: {search.last_run_at 
                                ? formatDistanceToNow(new Date(search.last_run_at), { addSuffix: true })
                                : "Never"}
                            </span>
                            {search.result_count !== null && (
                              <span>
                                {search.result_count} results
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="hero"
                            size="sm"
                            onClick={() => handleRunSearch(search)}
                            disabled={runningId === search.id}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {runningId === search.id ? "Running..." : "Run Search"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(search.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card variant="glass" className="text-center py-12">
            <CardContent>
              <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading font-semibold text-lg mb-2">No saved searches</h3>
              <p className="text-muted-foreground mb-4">
                Save your searches from the Search Hub to quickly access them later.
              </p>
              <Button variant="hero" onClick={() => navigate("/dashboard/search")}>
                <Search className="w-4 h-4 mr-2" />
                Go to Search Hub
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Saved Search</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this saved search? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default SavedSearches;
