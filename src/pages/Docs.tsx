import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Book, Rocket, Settings, Search, FileText, Users, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const docCategories = [
  {
    icon: Rocket,
    title: "Getting Started",
    description: "New to GovAI? Start here to learn the basics.",
    links: [
      { title: "Quick Start Guide", href: "#" },
      { title: "Account Setup", href: "#" },
      { title: "Your First Search", href: "#" },
      { title: "Understanding Results", href: "#" }
    ]
  },
  {
    icon: Search,
    title: "Search & Discovery",
    description: "Master the art of finding the perfect opportunities.",
    links: [
      { title: "Natural Language Search", href: "#" },
      { title: "Advanced Filters", href: "#" },
      { title: "Saved Searches", href: "#" },
      { title: "Search Best Practices", href: "#" }
    ]
  },
  {
    icon: FileText,
    title: "Proposals",
    description: "Learn how to create winning proposals with AI assistance.",
    links: [
      { title: "AI Proposal Generator", href: "#" },
      { title: "Editing Proposals", href: "#" },
      { title: "Compliance Checking", href: "#" },
      { title: "Export Options", href: "#" }
    ]
  },
  {
    icon: Zap,
    title: "AI Features",
    description: "Unlock the full power of our AI capabilities.",
    links: [
      { title: "Contract Interpreter", href: "#" },
      { title: "Document Summary", href: "#" },
      { title: "Match Analysis", href: "#" },
      { title: "AI Chat", href: "#" }
    ]
  },
  {
    icon: Users,
    title: "Team & Collaboration",
    description: "Work together effectively with your team.",
    links: [
      { title: "Inviting Team Members", href: "#" },
      { title: "Roles & Permissions", href: "#" },
      { title: "Shared Documents", href: "#" },
      { title: "Activity Tracking", href: "#" }
    ]
  },
  {
    icon: Settings,
    title: "Account & Billing",
    description: "Manage your account settings and subscription.",
    links: [
      { title: "Profile Settings", href: "#" },
      { title: "Subscription Plans", href: "#" },
      { title: "Usage & Limits", href: "#" },
      { title: "Billing History", href: "#" }
    ]
  }
];

export default function Docs() {
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
              <Book className="w-4 h-4" />
              <span className="text-sm font-medium">Documentation</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Learn How to Use <span className="text-primary">GovAI</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive guides and documentation to help you get the most out of GovAI.
            </p>
          </motion.div>

          {/* Doc Categories Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {docCategories.map((category, index) => (
              <motion.div
                key={category.title}
                className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 hover:border-primary/50 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <category.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{category.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{category.description}</p>
                <ul className="space-y-2">
                  {category.links.map((link) => (
                    <li key={link.title}>
                      <Link 
                        to={link.href} 
                        className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                      >
                        {link.title} →
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
