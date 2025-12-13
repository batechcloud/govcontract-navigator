import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { FileText, Upload, Search, Folder, File, MoreVertical, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const documents = [
  { id: 1, name: "Capability Statement 2024.pdf", type: "PDF", size: "2.4 MB", updated: "Dec 10, 2024", folder: "Company Documents" },
  { id: 2, name: "Past Performance - DOD Contract.docx", type: "Word", size: "1.2 MB", updated: "Dec 8, 2024", folder: "Past Performance" },
  { id: 3, name: "Technical Approach Template.docx", type: "Word", size: "856 KB", updated: "Dec 5, 2024", folder: "Templates" },
  { id: 4, name: "Team Resumes - Key Personnel.pdf", type: "PDF", size: "5.1 MB", updated: "Dec 3, 2024", folder: "Team" },
  { id: 5, name: "Pricing Spreadsheet.xlsx", type: "Excel", size: "324 KB", updated: "Dec 1, 2024", folder: "Pricing" },
];

const folders = [
  { name: "Company Documents", count: 12 },
  { name: "Past Performance", count: 8 },
  { name: "Templates", count: 15 },
  { name: "Team", count: 6 },
  { name: "Pricing", count: 4 },
];

export default function Documents() {
  return (
    <DashboardLayout title="Documents">
      <div className="space-y-6">
        {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h2 className="text-2xl font-bold text-foreground">Document Library</h2>
            <p className="text-muted-foreground">Store and manage your proposal documents</p>
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
        </motion.div>

        {/* Search */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-10" />
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Folders Sidebar */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-4">Folders</h3>
              <div className="space-y-2">
                {folders.map((folder) => (
                  <button
                    key={folder.name}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-primary/10 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground">{folder.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{folder.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Documents List */}
          <motion.div 
            className="lg:col-span-3 space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {documents.map((doc) => (
              <div 
                key={doc.id}
                className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-4 hover:border-primary/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <File className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{doc.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{doc.type}</span>
                        <span>•</span>
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{doc.updated}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
