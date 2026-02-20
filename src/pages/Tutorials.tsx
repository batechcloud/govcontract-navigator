import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Play, Clock, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const tutorials = [
  {
    title: "Getting Started with GC Navigator",
    description: "Learn the basics of setting up your account and making your first search.",
    duration: "5 min",
    level: "Beginner",
    thumbnail: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=225&fit=crop"
  },
  {
    title: "Mastering Natural Language Search",
    description: "Discover how to use natural language to find the perfect government contracts.",
    duration: "8 min",
    level: "Beginner",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop"
  },
  {
    title: "Setting Up Your Company Profile",
    description: "Configure your NAICS codes, certifications, and capabilities for better matches.",
    duration: "6 min",
    level: "Beginner",
    thumbnail: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=225&fit=crop"
  },
  {
    title: "Using AI to Generate Proposals",
    description: "Learn how to create complete proposal drafts with our AI proposal generator.",
    duration: "12 min",
    level: "Intermediate",
    thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=225&fit=crop"
  },
  {
    title: "Understanding Contract Documents",
    description: "Use AI to interpret complex RFPs and SOWs in plain language.",
    duration: "10 min",
    level: "Intermediate",
    thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=225&fit=crop"
  },
  {
    title: "Competitive Intelligence Deep Dive",
    description: "Track competitors, analyze win/loss patterns, and find teaming partners.",
    duration: "15 min",
    level: "Advanced",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop"
  },
  {
    title: "Managing Your Bid Pipeline",
    description: "Use the Journey Hub Kanban board to track opportunities through the bid process.",
    duration: "7 min",
    level: "Intermediate",
    thumbnail: "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400&h=225&fit=crop"
  },
  {
    title: "Team Collaboration Best Practices",
    description: "Learn how to work effectively with your team on proposals and submissions.",
    duration: "9 min",
    level: "Advanced",
    thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=225&fit=crop"
  }
];

const getLevelColor = (level: string) => {
  switch (level) {
    case "Beginner": return "bg-emerald-500/20 text-emerald-400";
    case "Intermediate": return "bg-amber-500/20 text-amber-400";
    case "Advanced": return "bg-rose-500/20 text-rose-400";
    default: return "bg-primary/20 text-primary";
  }
};

export default function Tutorials() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full mb-6">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">Video Tutorials</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Learn at Your Own <span className="text-primary">Pace</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Step-by-step video guides to help you master every feature of GC Navigator.
            </p>
          </motion.div>

          {/* Tutorials Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tutorials.map((tutorial, index) => (
              <motion.div
                key={tutorial.title}
                className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="relative">
                  <img 
                    src={tutorial.thumbnail} 
                    alt={tutorial.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <Play className="w-5 h-5 text-primary-foreground ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getLevelColor(tutorial.level)}>{tutorial.level}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {tutorial.duration}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{tutorial.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{tutorial.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
