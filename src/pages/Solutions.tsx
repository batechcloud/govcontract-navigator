import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Search, FileText, Brain, TrendingUp, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const solutions = [
  {
    icon: Search,
    title: "AI-Powered Search",
    description: "Find government contracts using natural language. Our AI understands your business and matches you with the right opportunities.",
    features: ["Natural language queries", "Smart filter extraction", "NAICS code matching", "Set-aside identification"]
  },
  {
    icon: Brain,
    title: "Contract Intelligence",
    description: "Let AI analyze complex RFPs and SOWs. Get plain-language summaries and understand requirements in minutes, not hours.",
    features: ["Document summarization", "Requirement extraction", "Compliance checking", "Risk assessment"]
  },
  {
    icon: FileText,
    title: "Proposal Generation",
    description: "Generate complete, compliant proposals with one click. AI drafts your technical approach, past performance, and management plan.",
    features: ["One-click drafts", "Section-by-section editing", "Compliance verification", "Export to Word/PDF"]
  },
  {
    icon: TrendingUp,
    title: "Competitive Intelligence",
    description: "Track competitors, analyze win/loss patterns, and identify teaming opportunities to improve your win rate.",
    features: ["Competitor tracking", "Award history analysis", "Win/loss patterns", "Teaming partner discovery"]
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together on proposals with your team. Share documents, assign tasks, and track progress in real-time.",
    features: ["Real-time collaboration", "Document sharing", "Task assignment", "Progress tracking"]
  },
  {
    icon: Shield,
    title: "Submission Management",
    description: "Never miss a deadline. Track all your submissions, manage documents, and ensure compliance every time.",
    features: ["Deadline tracking", "Document management", "Submission checklists", "Compliance verification"]
  }
];

export default function Solutions() {
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
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Solutions for Every Stage of Your
              <span className="text-primary"> Government Contracting Journey</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From discovery to award, GC Navigator provides the tools and intelligence you need to win more contracts.
            </p>
          </motion.div>

          {/* Solutions Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {solutions.map((solution, index) => (
              <motion.div
                key={solution.title}
                className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 hover:border-primary/50 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <solution.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{solution.title}</h3>
                <p className="text-muted-foreground mb-4">{solution.description}</p>
                <ul className="space-y-2">
                  {solution.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link to="/auth">Get Started Free</Link>
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
