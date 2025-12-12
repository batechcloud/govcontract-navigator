import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { 
  Search, 
  Brain, 
  FileText, 
  BarChart3, 
  Users, 
  Bell,
  Shield,
  Zap
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Smart Contract Search",
    description: "Search federal, state, and grant opportunities using natural language. Our AI understands your business and finds matching contracts instantly.",
  },
  {
    icon: Brain,
    title: "AI Match Analysis",
    description: "Get detailed match scores showing exactly how well your company fits each opportunity. No more guessing.",
  },
  {
    icon: FileText,
    title: "Proposal Generator",
    description: "Generate complete, professional proposals with one click. Our AI uses your company profile and past wins to create winning bids.",
  },
  {
    icon: BarChart3,
    title: "Pipeline Tracking",
    description: "Track all your opportunities in a visual Kanban board. From discovery to award, never miss a deadline.",
  },
  {
    icon: Users,
    title: "Competitor Intelligence",
    description: "Analyze competitor wins using USAspending data. Understand the market and position yourself to win.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Get notified about new opportunities, upcoming deadlines, and contract amendments. Stay ahead of the competition.",
  },
  {
    icon: Shield,
    title: "Compliance Tracking",
    description: "Automated submission checklists ensure you never miss required documents or compliance requirements.",
  },
  {
    icon: Zap,
    title: "Beginner Friendly",
    description: "Step-by-step guidance through the entire process. Perfect for businesses new to government contracting.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  },
};

export function FeaturesSection() {
  return (
    <section id="features" className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4 text-balance">
            Everything You Need to{" "}
            <span className="gradient-text-primary">Win Contracts</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From discovery to award, GovAI Search streamlines every step of the government contracting process.
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
            >
              <Card variant="glass-hover" className="h-full group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link 
            to="/solutions" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group"
          >
            Explore all features
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
